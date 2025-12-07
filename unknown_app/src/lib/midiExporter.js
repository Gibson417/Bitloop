import { scales } from './scales.js';

const getMidiForCell = (track, rowIndex, totalRows) => {
  const scalePattern = scales[track.scale] ?? scales.major;
  const degrees = scalePattern.length;
  const indexFromBottom = totalRows - 1 - rowIndex;
  const octaveOffset = Math.floor(indexFromBottom / degrees);
  const degree = scalePattern[indexFromBottom % degrees];
  const rootNote = track.rootNote ?? 0;
  const octave = Math.min(Math.max((track.octave ?? 4) + octaveOffset, 1), 7);
  const midi = 12 * (octave + 1) + degree + rootNote;
  return Math.min(Math.max(midi, 21), 108);
};

const writeVarLen = (value) => {
  const bytes = [];
  let buffer = value & 0x7f;
  while (value >>= 7) {
    buffer <<= 8;
    buffer |= 0x80;
    buffer += value & 0x7f;
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  return bytes;
};

const createMidiHeader = (numTracks, ticksPerQuarter) => {
  return [
    // MThd chunk
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // Chunk length: 6
    0x00, 0x01, // Format: 1 (multiple tracks, synchronous)
    (numTracks >> 8) & 0xff, numTracks & 0xff, // Number of tracks
    (ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff // Ticks per quarter note
  ];
};

const createTempoEvent = (bpm) => {
  const microsecondsPerQuarter = Math.floor(60000000 / bpm);
  return [
    0x00, // Delta time: 0
    0xff, 0x51, 0x03, // Meta event: Set Tempo
    (microsecondsPerQuarter >> 16) & 0xff,
    (microsecondsPerQuarter >> 8) & 0xff,
    microsecondsPerQuarter & 0xff
  ];
};

const createTrackNameEvent = (name) => {
  const bytes = new TextEncoder().encode(name);
  return [
    0x00, // Delta time: 0
    0xff, 0x03, // Meta event: Track Name
    ...writeVarLen(bytes.length),
    ...bytes
  ];
};

const createNoteEvents = (notes, rows, track, ticksPerStorageCell, totalStorageSteps) => {
  const events = [];
  const activeNotes = new Map(); // Track which notes are currently on
  
  for (let storageIndex = 0; storageIndex < totalStorageSteps; storageIndex++) {
    for (let row = 0; row < rows; row++) {
      const noteKey = `${row}`;
      const isActive = notes?.[row]?.[storageIndex];
      const wasActive = activeNotes.has(noteKey);
      
      if (isActive && !wasActive) {
        // Note On
        const midiNote = getMidiForCell(track, row, rows);
        const velocity = Math.floor((track.volume ?? 0.7) * 127);
        events.push({
          time: storageIndex * ticksPerStorageCell,
          data: [0x90, midiNote, velocity] // Note On, channel 0
        });
        activeNotes.set(noteKey, { midiNote, storageIndex });
      } else if (!isActive && wasActive) {
        // Note Off
        const { midiNote } = activeNotes.get(noteKey);
        events.push({
          time: storageIndex * ticksPerStorageCell,
          data: [0x80, midiNote, 0] // Note Off
        });
        activeNotes.delete(noteKey);
      }
    }
  }
  
  // Turn off any remaining notes at the end
  for (const [noteKey, { midiNote }] of activeNotes) {
    events.push({
      time: totalStorageSteps * ticksPerStorageCell,
      data: [0x80, midiNote, 0]
    });
  }
  
  // Sort events by time
  events.sort((a, b) => a.time - b.time);
  
  // Convert to MIDI format with delta times
  const midiEvents = [];
  let lastTime = 0;
  
  for (const event of events) {
    const deltaTime = event.time - lastTime;
    midiEvents.push(...writeVarLen(deltaTime));
    midiEvents.push(...event.data);
    lastTime = event.time;
  }
  
  return midiEvents;
};

const createTrackChunk = (trackData) => {
  const trackBytes = [
    0x4d, 0x54, 0x72, 0x6b // 'MTrk'
  ];
  
  const length = trackData.length;
  trackBytes.push(
    (length >> 24) & 0xff,
    (length >> 16) & 0xff,
    (length >> 8) & 0xff,
    length & 0xff
  );
  
  trackBytes.push(...trackData);
  return trackBytes;
};

export const renderProjectToMidi = (snapshot) => {
  if (!snapshot) throw new Error('No project snapshot provided');
  
  const bars = snapshot.bars ?? 1;
  const stepsPerBar = snapshot.stepsPerBar ?? 16;
  const bpm = snapshot.bpm ?? 120;
  const rows = snapshot.rows ?? 8;
  const BASE_RESOLUTION = 128; // Must match projectStore.js
  const totalStorageSteps = bars * BASE_RESOLUTION;
  
  // MIDI timing
  const ticksPerQuarter = 480;
  // Each storage cell is (1/BASE_RESOLUTION) of a bar = (1/BASE_RESOLUTION) * 4 beats
  const ticksPerStorageCell = (ticksPerQuarter * 4) / BASE_RESOLUTION;
  
  const audibleTracks = snapshot.tracks?.some((track) => track.solo)
    ? snapshot.tracks.filter((track) => track.solo)
    : snapshot.tracks?.filter((track) => !track.mute) ?? [];
  
  const midiBytes = [];
  
  // Header
  midiBytes.push(...createMidiHeader(audibleTracks.length + 1, ticksPerQuarter));
  
  // Tempo track
  const tempoTrack = [
    ...createTrackNameEvent('Tempo Track'),
    ...createTempoEvent(bpm),
    0x00, 0xff, 0x2f, 0x00 // End of Track
  ];
  midiBytes.push(...createTrackChunk(tempoTrack));
  
  // Note tracks
  audibleTracks.forEach((track, index) => {
    const trackData = [
      ...createTrackNameEvent(track.name ?? `Track ${index + 1}`),
      ...createNoteEvents(track.notes, rows, track, ticksPerStorageCell, totalStorageSteps),
      ...writeVarLen(0), // Delta time: 0
      0xff, 0x2f, 0x00 // End of Track
    ];
    midiBytes.push(...createTrackChunk(trackData));
  });
  
  return new Blob([new Uint8Array(midiBytes)], { type: 'audio/midi' });
};

export const renderArrangerToMidi = (arrangerData, projectPatterns, projectRows, projectBpm) => {
  if (!arrangerData || !arrangerData.blocks || arrangerData.blocks.length === 0) {
    throw new Error('No arranger blocks to render');
  }

  const blocks = arrangerData.blocks;
  const bpm = projectBpm ?? 120;
  const rows = projectRows ?? 8;
  const beatsPerBar = arrangerData.beatsPerBar ?? 4;
  const loopLengthBeats = arrangerData.loopLengthBeats ?? 64;
  const BASE_RESOLUTION = 128; // Must match projectStore.js

  // MIDI timing
  const ticksPerQuarter = 480;
  const ticksPerBeat = ticksPerQuarter;
  const ticksPerStorageCell = (ticksPerQuarter * 4) / BASE_RESOLUTION;

  // Collect all unique tracks from all patterns
  const trackMap = new Map();
  
  blocks.forEach((block) => {
    const pattern = projectPatterns.find(p => p.id === block.patternId);
    if (!pattern || !pattern.tracks) return;

    const blockStartBeat = block.startBeat;
    const patternBars = pattern.bars || 2;
    const patternBeats = patternBars * beatsPerBar;
    const blockEndBeat = Math.min(blockStartBeat + patternBeats, loopLengthBeats);

    // Get audible tracks
    const audibleTracks = pattern.tracks.some((track) => track.solo)
      ? pattern.tracks.filter((track) => track.solo)
      : pattern.tracks.filter((track) => !track.mute);

    audibleTracks.forEach((track, trackIndex) => {
      const trackKey = `${pattern.id}-${trackIndex}`;
      if (!trackMap.has(trackKey)) {
        trackMap.set(trackKey, {
          name: track.name || `Track ${trackIndex + 1}`,
          track,
          events: []
        });
      }

      const trackInfo = trackMap.get(trackKey);
      const stepsPerBeat = BASE_RESOLUTION / beatsPerBar;

      // Schedule notes for this block
      for (let beat = blockStartBeat; beat < blockEndBeat; beat++) {
        const beatInPattern = beat - blockStartBeat;
        const loopedBeat = beatInPattern % patternBeats;
        const stepInPattern = Math.floor(loopedBeat * stepsPerBeat);
        const maxPatternSteps = patternBars * BASE_RESOLUTION;
        const storageEnd = Math.min(Math.ceil(stepInPattern + stepsPerBeat), maxPatternSteps);

        for (let row = 0; row < rows; row++) {
          const rowNotes = track.notes?.[row] ?? [];

          for (let storageIndex = stepInPattern; storageIndex < storageEnd; storageIndex++) {
            if (rowNotes[storageIndex]) {
              const prevStorageIndex = storageIndex > 0 ? storageIndex - 1 : -1;
              const isNoteStart = prevStorageIndex < 0 || !rowNotes[prevStorageIndex];

              if (isNoteStart) {
                let noteLength = 1;
                let nextIndex = storageIndex + 1;
                while (nextIndex < rowNotes.length && rowNotes[nextIndex]) {
                  noteLength++;
                  nextIndex++;
                }

                const globalStorageIndex = beat * stepsPerBeat + (storageIndex - stepInPattern);
                const midiNote = getMidiForCell(track, row, rows);
                const velocity = Math.floor((track.volume ?? 0.7) * 127);
                const tickPosition = Math.floor(globalStorageIndex * ticksPerStorageCell);
                const tickDuration = noteLength * ticksPerStorageCell;

                trackInfo.events.push({
                  tick: tickPosition,
                  type: 'noteOn',
                  note: midiNote,
                  velocity
                });

                trackInfo.events.push({
                  tick: tickPosition + tickDuration,
                  type: 'noteOff',
                  note: midiNote
                });
              }
            }
          }
        }
      }
    });
  });

  // Convert to MIDI format
  const midiBytes = [];
  const numTracks = trackMap.size + 1; // +1 for tempo track
  
  // Header
  midiBytes.push(...createMidiHeader(numTracks, ticksPerQuarter));
  
  // Tempo track
  const tempoTrack = [
    ...createTrackNameEvent('Tempo Track'),
    ...createTempoEvent(bpm),
    0x00, 0xff, 0x2f, 0x00 // End of Track
  ];
  midiBytes.push(...createTrackChunk(tempoTrack));
  
  // Note tracks
  trackMap.forEach((trackInfo) => {
    const trackData = [
      ...createTrackNameEvent(trackInfo.name)
    ];

    // Sort events by tick
    const sortedEvents = trackInfo.events.sort((a, b) => a.tick - b.tick);
    
    let currentTick = 0;
    sortedEvents.forEach((event) => {
      const delta = event.tick - currentTick;
      trackData.push(...writeVarLen(delta));

      if (event.type === 'noteOn') {
        trackData.push(0x90, event.note, event.velocity);
      } else if (event.type === 'noteOff') {
        trackData.push(0x80, event.note, 0x40);
      }

      currentTick = event.tick;
    });

    trackData.push(...writeVarLen(0), 0xff, 0x2f, 0x00); // End of Track
    midiBytes.push(...createTrackChunk(trackData));
  });
  
  return new Blob([new Uint8Array(midiBytes)], { type: 'audio/midi' });
};
