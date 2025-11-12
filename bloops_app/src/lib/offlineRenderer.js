import { scales } from './scales.js';
import { getCustomWave, connectTrackEffects } from './sound.js';

const midiToFrequency = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

const getMidiForCell = (track, rowIndex, totalRows) => {
  // Use custom scale if available, otherwise use named scale
  const scalePattern = track.scale === 'custom' && track.customScale
    ? track.customScale
    : (scales[track.scale] ?? scales.major);
  const degrees = scalePattern.length;
  const indexFromBottom = totalRows - 1 - rowIndex;
  const octaveOffset = Math.floor(indexFromBottom / degrees);
  const degree = scalePattern[indexFromBottom % degrees];
  const octave = Math.min(Math.max((track.octave ?? 4) + octaveOffset, 1), 7);
  const midi = 12 * (octave + 1) + degree;
  return Math.min(Math.max(midi, 21), 108);
};

const createNoiseBuffer = (context, duration) => {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * (duration + 0.05)), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

const addTone = (context, destination, track, frequency, startTime, duration) => {
  if (track.waveform !== 'noise' && !Number.isFinite(frequency)) return;
  const voiceGain = context.createGain();
  const attack = 0.01;
  const release = Math.min(0.3, duration * 0.8);
  const releaseStart = startTime + duration - release;
  const targetVolume = track.volume ?? 0.7;
  voiceGain.gain.setValueAtTime(0, startTime);
  voiceGain.gain.linearRampToValueAtTime(targetVolume, startTime + attack);
  voiceGain.gain.setValueAtTime(targetVolume, releaseStart);
  voiceGain.gain.linearRampToValueAtTime(0.0001, releaseStart + release);

  connectTrackEffects(context, track, voiceGain, destination, startTime);

  if (track.waveform === 'noise') {
    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context, duration);
    source.connect(voiceGain);
    source.start(startTime);
    source.stop(releaseStart + release);
    return;
  }

  const oscillator = context.createOscillator();
  if (track.waveform === 'custom') {
    const wave = getCustomWave(context, track.customShape);
    if (wave) {
      oscillator.setPeriodicWave(wave);
    } else {
      oscillator.type = 'sine';
    }
  } else {
    oscillator.type = track.waveform ?? 'square';
  }
  if (Number.isFinite(frequency)) {
    oscillator.frequency.setValueAtTime(frequency, startTime);
  }
  oscillator.connect(voiceGain);
  oscillator.start(startTime);
  oscillator.stop(releaseStart + release);
};

const encodeWav = (audioBuffer) => {
  const { numberOfChannels, length, sampleRate } = audioBuffer;
  const dataLength = length * numberOfChannels * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i += 1) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const writeUint32 = (offset, value) => {
    view.setUint32(offset, value, true);
  };

  const writeUint16 = (offset, value) => {
    view.setUint16(offset, value, true);
  };

  writeString(0, 'RIFF');
  writeUint32(4, 36 + dataLength);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  writeUint32(16, 16);
  writeUint16(20, 1);
  writeUint16(22, numberOfChannels);
  writeUint32(24, sampleRate);
  writeUint32(28, sampleRate * numberOfChannels * 2);
  writeUint16(32, numberOfChannels * 2);
  writeUint16(34, 16);
  writeString(36, 'data');
  writeUint32(40, dataLength);

  let offset = 44;
  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

export const renderProjectToWav = async (snapshot) => {
  if (!snapshot) throw new Error('No project snapshot provided');
  if (typeof OfflineAudioContext === 'undefined') {
    throw new Error('Offline audio rendering is not supported in this environment');
  }
  const bars = snapshot.bars ?? 1;
  const stepsPerBar = snapshot.stepsPerBar ?? 16;
  const bpm = snapshot.bpm ?? 120;
  const rows = snapshot.rows ?? 8;
  const BASE_RESOLUTION = 64; // Must match projectStore.js
  const totalStorageSteps = bars * BASE_RESOLUTION;
  const secondsPerBar = (240 / bpm) || 2;
  const durationPerStorageCell = secondsPerBar / BASE_RESOLUTION;
  const loopSeconds = secondsPerBar * bars;
  const sampleRate = 44100;
  const frameCount = Math.ceil(loopSeconds * sampleRate);
  const context = new OfflineAudioContext(2, frameCount, sampleRate);

  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0.8, 0);
  masterGain.connect(context.destination);

  const audibleTracks = snapshot.tracks?.some((track) => track.solo)
    ? snapshot.tracks.filter((track) => track.solo)
    : snapshot.tracks?.filter((track) => !track.mute) ?? [];

  audibleTracks.forEach((track) => {
    const trackGain = context.createGain();
    trackGain.gain.setValueAtTime(track.volume ?? 0.7, 0);
    trackGain.connect(masterGain);

    for (let row = 0; row < rows; row += 1) {
      const rowNotes = track.notes?.[row];
      if (!rowNotes) continue;
      
      // Iterate through storage array at BASE_RESOLUTION
      for (let storageIndex = 0; storageIndex < totalStorageSteps; storageIndex += 1) {
        if (!rowNotes[storageIndex]) continue;
        
        // Only trigger note if this is the start of the note (previous cell is inactive or doesn't exist)
        const isNoteStart = storageIndex === 0 || !rowNotes[storageIndex - 1];
        if (!isNoteStart) continue;
        
        // Calculate actual note duration from storage array
        // Count consecutive active cells starting from storageIndex
        let noteLength = 1;
        for (let i = storageIndex + 1; i < rowNotes.length; i++) {
          if (rowNotes[i]) {
            noteLength++;
          } else {
            break;
          }
        }
        
        const frequency = midiToFrequency(getMidiForCell(track, row, rows));
        const startTime = storageIndex * durationPerStorageCell;
        const noteDuration = noteLength * durationPerStorageCell;
        addTone(context, trackGain, track, frequency, startTime, noteDuration * 0.95);
      }
    }
  });

  const buffer = await context.startRendering();
  return encodeWav(buffer);
};

