<script>
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Grid from './components/Grid.svelte';
  import WindowSwitcher from './components/WindowSwitcher.svelte';
  import GridToolbar from './components/GridToolbar.svelte';
  import ZoomControls from './components/ZoomControls.svelte';
  import TrackSelector from './components/TrackSelector.svelte';
  import TrackConfigPanel from './components/TrackConfigPanel.svelte';
  import Transport from './components/Transport.svelte';
  import Footer from './components/Footer.svelte';
  import SettingsMenu from './components/SettingsMenu.svelte';
  import VolumeSlider from './components/VolumeSlider.svelte';
  import ShareMenu from './components/ShareMenu.svelte';
  import FollowToggle from './components/FollowToggle.svelte';
  import PatternArranger from './components/PatternArranger.svelte';
  import ArrowSelector from './components/ArrowSelector.svelte';
  import UpdateNotification from './components/UpdateNotification.svelte';
  import { Scheduler } from './lib/scheduler.js';
  import { project, totalSteps, loopDuration, maxBars, TRACK_LIMIT, historyStatus, gridHistoryStatus, BASE_RESOLUTION, DEFAULT_STEPS_PER_BAR_VALUE } from './store/projectStore.js';
  import { playback as arrangerPlayback, blocksWithPattern, stopPlayback as stopArrangerPlayback } from './store/arrangerStore.js';
  import { scales } from './lib/scales.js';
  import { colors } from './lib/colorTokens.js';
  import { library } from './store/libraryStore.js';
  import { renderProjectToWav } from './lib/offlineRenderer.js';
  import { renderProjectToMidi } from './lib/midiExporter.js';
  import { getCustomWave, connectTrackEffects, buildShareUrl, decodeShareSnapshot, SHARE_TEXT } from './lib/sound.js';
  import { getRowNoteNames } from './lib/notes.js';
  import { devMode } from './store/devModeStore.js';

  // Note: stepsPerBar is now automatically synced with zoom level (8, 16, 32, or 64)
  // to ensure proper 4/4 time alignment
  const BEATS_PER_BAR = 4; // 4/4 time signature

  let projectState;
  let historyState;
  let gridHistoryState;
  let libraryState;
  let totalStepsValue = 0;
  let loopDurationValue = 0;
  let maxBarsValue = 0;
  let devModeEnabled = false;
  let hoveredComponent = '';
  let arrangerPlaybackState;
  let arrangerBlocks = [];

  const unsubscribers = [
    project.subscribe((value) => (projectState = value)),
    totalSteps.subscribe((value) => (totalStepsValue = value)),
    loopDuration.subscribe((value) => (loopDurationValue = value)),
    maxBars.subscribe((value) => (maxBarsValue = value)),
    historyStatus.subscribe((value) => (historyState = value)),
    gridHistoryStatus.subscribe((value) => (gridHistoryState = value)),
    library.subscribe((value) => (libraryState = value)),
    devMode.subscribe((value) => (devModeEnabled = value)),
    arrangerPlayback.subscribe((value) => (arrangerPlaybackState = value)),
    blocksWithPattern.subscribe((value) => (arrangerBlocks = value))
  ];

  let audioContext;
  let scheduler;
  let arrangerScheduler;
  let masterGain;
  let animationId;
  let arrangerAnimationId;
  let shareStatus = 'idle';
  let shareMessage = '';
  let shareLink = '';
  let shareFeedbackTimer;
  // When initialization fails, set mountError to show a visible overlay instead of a white screen.
  let mountError = null;
  // Window switching state
  let manualWindow = null; // null = auto-follow playhead
  let currentWindow = 0;
  let totalWindows = 1;
  // Zoom state
  let zoomLevel = 16; // Grid resolution denominator: 8, 16, 32, 64 (default 1/16)
  // Pattern Arranger visibility state
  let arrangerVisible = false;

  const ensureAudio = async () => {
    if (!projectState) return false;
    if (typeof window === 'undefined') return false;
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = AudioCtx ? new AudioCtx() : null;
      if (!audioContext) return false;
      masterGain = audioContext.createGain();
      masterGain.gain.setValueAtTime(0.8, audioContext.currentTime);
      masterGain.connect(audioContext.destination);
    }
    await audioContext.resume();
    if (!scheduler) {
      scheduler = new Scheduler(audioContext, projectState.bpm, projectState.stepsPerBar / BEATS_PER_BAR);
      scheduler.onStep = handleStep;
    } else {
      scheduler.setTempo(projectState.bpm);
      scheduler.setStepsPerBeat(projectState.stepsPerBar / BEATS_PER_BAR);
      scheduler.onStep = handleStep;
    }
    return true;
  };

  const midiToFrequency = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  const getMidiForCell = (track, row) => {
    const stateRows = projectState?.rows ?? 0;
    if (!stateRows) return 60;
    // Use custom scale if available, otherwise use named scale
    const scalePattern = track.scale === 'custom' && track.customScale 
      ? track.customScale 
      : (scales[track.scale] ?? scales.major);
    const degrees = scalePattern.length;
    const rows = stateRows;
    const indexFromBottom = rows - 1 - row;
    const octaveOffset = Math.floor(indexFromBottom / degrees);
    const degree = scalePattern[indexFromBottom % degrees];
    const rootNote = track.rootNote ?? 0; // Default to C (0)
    const octave = track.octave + octaveOffset;
    const midi = 12 * (octave + 1) + degree + rootNote; // C0 = MIDI 12, add rootNote offset
    return Math.min(Math.max(midi, 21), 108);
  };

  const playTone = (track, frequency, time, duration) => {
    if (!audioContext || !masterGain) return;
    if (track.waveform !== 'noise' && !Number.isFinite(frequency)) return;

    const voiceGain = audioContext.createGain();
    
    // Apply ADSR envelope
    const adsr = track.adsr ?? { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 };
    const attack = Math.min(adsr.attack, duration * 0.3);
    const decay = Math.min(adsr.decay, duration * 0.3);
    const release = Math.min(adsr.release, duration * 0.5);
    const sustainLevel = track.volume * adsr.sustain;
    
    voiceGain.gain.setValueAtTime(0, time);
    voiceGain.gain.linearRampToValueAtTime(track.volume, time + attack);
    voiceGain.gain.linearRampToValueAtTime(sustainLevel, time + attack + decay);
    
    const releaseStart = time + duration - release;
    voiceGain.gain.setValueAtTime(sustainLevel, releaseStart);
    voiceGain.gain.linearRampToValueAtTime(0.0001, releaseStart + release);

    connectTrackEffects(audioContext, track, voiceGain, masterGain, time);

    if (track.waveform === 'noise') {
      const buffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * (duration + 0.1)), audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(voiceGain);
      source.start(time);
      source.stop(releaseStart + release + 0.05);
      return;
    }

    const osc = audioContext.createOscillator();
    if (track.waveform === 'custom') {
      const wave = getCustomWave(audioContext, track.customShape);
      if (wave) {
        osc.setPeriodicWave(wave);
      } else {
        osc.type = 'sine';
      }
    } else {
      osc.type = track.waveform;
    }
    if (Number.isFinite(frequency)) {
      osc.frequency.setValueAtTime(frequency, time);
    }
    osc.connect(voiceGain);
    osc.start(time);
    osc.stop(releaseStart + release + 0.05);
  };

  const scheduleAudio = (stepIndex, time, stepDuration, state) => {
    const rows = state.rows;
    const totalSteps = state.bars * state.stepsPerBar;
    if (!totalSteps) return;
    const audibleTracks = state.tracks.some((track) => track.solo)
      ? state.tracks.filter((track) => track.solo)
      : state.tracks.filter((track) => !track.mute);

    audibleTracks.forEach((track) => {
      // Calculate the range of storage indices that correspond to this logical step
      const storageStart = Math.floor(stepIndex * (BASE_RESOLUTION / state.stepsPerBar));
      const storageEnd = Math.floor((stepIndex + 1) * (BASE_RESOLUTION / state.stepsPerBar));
      const storageStepDuration = stepDuration / (storageEnd - storageStart);
      
      for (let row = 0; row < rows; row += 1) {
        const rowNotes = track.notes?.[row] ?? [];
        
        // Check each storage index within this logical step for note starts
        for (let storageIndex = storageStart; storageIndex < storageEnd; storageIndex++) {
          if (rowNotes[storageIndex]) {
            // Only trigger if this is the start of a note (previous storage step was not active)
            const prevStorageIndex = storageIndex > 0 ? storageIndex - 1 : -1;
            const isNoteStart = prevStorageIndex < 0 || !rowNotes[prevStorageIndex];
            
            if (isNoteStart) {
              // Find note length by scanning forward
              let noteLength = 1;
              let nextIndex = storageIndex + 1;
              while (nextIndex < rowNotes.length && rowNotes[nextIndex]) {
                noteLength++;
                nextIndex++;
              }
              
              // Calculate note duration from storage steps
              // Notes placed in normal mode have a 1-step gap for visual separation,
              // so we check if there's a gap immediately after this note and compensate
              const hasGapAfter = nextIndex < rowNotes.length && !rowNotes[nextIndex];
              const isLikelyShortened = hasGapAfter && noteLength > 1;
              const playbackLength = isLikelyShortened ? noteLength + 1 : noteLength;
              const noteDuration = playbackLength * storageStepDuration;
              
              const midi = getMidiForCell(track, row);
              const frequency = midiToFrequency(midi);
              
              // Calculate when to start this note (offset from the logical step time)
              const noteStartOffset = (storageIndex - storageStart) * storageStepDuration;
              const noteTime = time + noteStartOffset;
              
              // Apply minimum duration of 50ms to prevent clicks on very short notes
              const minDuration = 0.05; // 50ms minimum gate time
              const safeDuration = Math.max(noteDuration, minDuration);
              
              playTone(track, frequency, noteTime, safeDuration);
            }
          }
        }
      }
    });
  };

  const handleStep = (step, time, duration) => {
    const state = get(project);
    const totalSteps = state.bars * state.stepsPerBar;
    if (!totalSteps) return;
    const stepIndex = ((step % totalSteps) + totalSteps) % totalSteps;
    project.registerStep(stepIndex, time, duration);
    scheduleAudio(stepIndex, time, duration, state);
  };

  // Arranger-specific audio scheduling
  const getActiveArrangerBlock = (playheadBeat, blocks) => {
    if (!blocks || blocks.length === 0) return null;
    for (const block of blocks) {
      if (!block.pattern) continue;
      const blockStart = block.startBeat;
      const blockEnd = block.startBeat + block.pattern.lengthInBeats;
      if (playheadBeat >= blockStart && playheadBeat < blockEnd) {
        return block;
      }
    }
    return null;
  };

  const scheduleArrangerAudio = (beat, time, beatDuration) => {
    const state = get(project);
    const activeBlock = getActiveArrangerBlock(beat, arrangerBlocks);
    
    if (!activeBlock || !activeBlock.pattern) return;
    
    // Find the pattern in projectState.patterns
    const pattern = state.patterns?.find(p => p.id === activeBlock.patternId);
    if (!pattern || !pattern.tracks) return;
    
    // Calculate position within the pattern
    const beatInPattern = beat - activeBlock.startBeat;
    const beatsPerBar = arrangerPlaybackState.beatsPerBar || 4;
    const patternBars = pattern.bars || 2;
    const patternBeats = patternBars * beatsPerBar;
    
    // Handle pattern looping if the block is longer than the pattern
    const loopedBeat = beatInPattern % patternBeats;
    
    // Convert beat to step within the pattern
    // Pattern uses BASE_RESOLUTION steps per bar
    const stepsPerBeat = BASE_RESOLUTION / beatsPerBar;
    const stepInPattern = Math.floor(loopedBeat * stepsPerBeat);
    
    // Schedule audio from the pattern's tracks
    const rows = state.rows;
    const audibleTracks = pattern.tracks.some((track) => track.solo)
      ? pattern.tracks.filter((track) => track.solo)
      : pattern.tracks.filter((track) => !track.mute);

    audibleTracks.forEach((track) => {
      // Calculate the range of storage indices for this beat
      const storageStart = stepInPattern;
      const storageEnd = Math.ceil(stepInPattern + stepsPerBeat);
      const storageStepDuration = beatDuration / (storageEnd - storageStart);
      
      for (let row = 0; row < rows; row += 1) {
        const rowNotes = track.notes?.[row] ?? [];
        
        // Check each storage index within this beat for note starts
        for (let storageIndex = storageStart; storageIndex < storageEnd; storageIndex++) {
          if (rowNotes[storageIndex]) {
            // Only trigger if this is the start of a note
            const prevStorageIndex = storageIndex > 0 ? storageIndex - 1 : -1;
            const isNoteStart = prevStorageIndex < 0 || !rowNotes[prevStorageIndex];
            
            if (isNoteStart) {
              // Find note length
              let noteLength = 1;
              let nextIndex = storageIndex + 1;
              while (nextIndex < rowNotes.length && rowNotes[nextIndex]) {
                noteLength++;
                nextIndex++;
              }
              
              // Calculate note duration
              const hasGapAfter = nextIndex < rowNotes.length && !rowNotes[nextIndex];
              const isLikelyShortened = hasGapAfter && noteLength > 1;
              const playbackLength = isLikelyShortened ? noteLength + 1 : noteLength;
              const noteDuration = playbackLength * storageStepDuration;
              
              const midi = getMidiForCell(track, row);
              const frequency = midiToFrequency(midi);
              
              // Calculate when to start this note
              const noteStartOffset = (storageIndex - storageStart) * storageStepDuration;
              const noteTime = time + noteStartOffset;
              
              const minDuration = 0.05;
              const safeDuration = Math.max(noteDuration, minDuration);
              
              playTone(track, frequency, noteTime, safeDuration);
            }
          }
        }
      }
    });
  };

  const handleArrangerStep = (step, time, duration) => {
    // Each step represents one beat in the arranger
    const beat = step % (arrangerPlaybackState.loopLengthBeats || 64);
    scheduleArrangerAudio(beat, time, duration);
  };

  const animatePlayhead = () => {
    if (!projectState?.playing || !audioContext) return;
    const state = get(project);
    const delta = state.nextStepTime - state.lastStepTime;
    if (delta > 0) {
      const now = audioContext.currentTime;
      const progress = (now - state.lastStepTime) / delta;
      if (Number.isFinite(progress)) {
        project.setPlayheadProgress(Math.min(Math.max(progress, 0), 1));
      }
    }
    animationId = requestAnimationFrame(animatePlayhead);
  };

  const startPlayback = async () => {
    // Stop arranger playback if it's running
    if (arrangerPlaybackState?.isPlaying) {
      stopArrangerPlayback();
    }
    
    if (!(await ensureAudio())) return;
    project.resetPlayhead();
    project.setPlaying(true);
    scheduler.setTempo(projectState.bpm);
    scheduler.setStepsPerBeat(projectState.stepsPerBar / BEATS_PER_BAR);
    scheduler.start();
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(animatePlayhead);
  };

  const stopPlayback = () => {
    if (scheduler) {
      scheduler.stop();
    }
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    project.setPlaying(false);
  };

  const handleTogglePlay = async () => {
    if (projectState?.playing) {
      stopPlayback();
    } else {
      await startPlayback();
    }
  };

  const handleSkip = () => {
    if (projectState) {
      const stepsPerBar = projectState.stepsPerBar || 16;
      const totalSteps = projectState.bars * stepsPerBar;
      const currentStep = projectState.playheadStep || 0;
      const nextBarStep = Math.floor(currentStep / stepsPerBar) * stepsPerBar + stepsPerBar;
      const targetStep = nextBarStep >= totalSteps ? 0 : nextBarStep;

      project.registerStep(targetStep, audioContext?.currentTime || 0, 0);

      if (projectState.playing && scheduler) {
        scheduler.stop();
        scheduler.start();
      }
    }
  };

  const handleSkipBack = () => {
    if (projectState) {
      const stepsPerBar = projectState.stepsPerBar || 16;
      const totalSteps = projectState.bars * stepsPerBar;
      const currentStep = projectState.playheadStep || 0;
      const currentBarStart = Math.floor(currentStep / stepsPerBar) * stepsPerBar;

      let targetStep = currentBarStart;

      if (currentStep % stepsPerBar === 0) {
        targetStep = currentBarStart === 0 ? Math.max(totalSteps - stepsPerBar, 0) : currentBarStart - stepsPerBar;
      }

      project.registerStep(targetStep, audioContext?.currentTime || 0, 0);

      if (projectState.playing && scheduler) {
        scheduler.stop();
        scheduler.start();
      }
    }
  };

  const handleFollowToggle = (event) => {
    const nextValue = event.detail?.value ?? !projectState?.follow;
    project.setFollow(nextValue);
    // When follow is enabled, clear manual window to go back to auto-follow
    if (nextValue) {
      manualWindow = null;
    }
  };

  const handleWindowSwitch = (event) => {
    const { window } = event.detail;
    manualWindow = window;
    // When manually switching, disable follow mode
    if (projectState?.follow) {
      project.setFollow(false);
    }
  };

  const handleWindowInfo = (event) => {
    currentWindow = event.detail.currentWindow;
    totalWindows = event.detail.totalWindows;
    
    // Clamp manualWindow if it's out of bounds after zoom change
    if (manualWindow !== null && manualWindow >= totalWindows) {
      manualWindow = Math.max(0, totalWindows - 1);
    }
  };

  const handleZoomChange = (event) => {
    const oldZoom = zoomLevel;
    zoomLevel = event.detail.level;

    // Keep the note length selector aligned with the zoom level for predictable editing.
    // This preserves the existing default (1/8) until the first zoom change, then
    // updates the selected note length to match the current zoom resolution.
    const zoomAlignedLength = `${zoomLevel}`;
    const hasMatchingNoteLength = NOTE_LENGTH_OPTIONS.some((option) => `${option.value}` === zoomAlignedLength);
    if (hasMatchingNoteLength) {
      selectedNoteLength = zoomAlignedLength;
    }
    
    // Automatically sync stepsPerBar with zoom level for proper 4/4 time alignment
    // This ensures stepsPerBar is always 8, 16, 32, or 64
    project.setStepsPerBar(zoomLevel);
    if (scheduler) {
      scheduler.setStepsPerBeat(zoomLevel / BEATS_PER_BAR);
    }
    
    // When zoom changes, reset manual window to ensure it's valid
    // If we're in manual mode, try to keep approximately the same position
    if (manualWindow !== null && oldZoom !== zoomLevel) {
      // Calculate current logical position from old window
      const oldVisibleCols = Math.min(oldZoom, columns);
      const currentLogicalPos = manualWindow * oldVisibleCols;
      
      // Calculate new window from that position
      const newVisibleCols = Math.min(zoomLevel, columns);
      const newWindow = Math.floor(currentLogicalPos / newVisibleCols);
      const maxWindow = Math.max(0, Math.ceil(columns / newVisibleCols) - 1);
      
      manualWindow = Math.min(newWindow, maxWindow);
    }
  };

  const handleBpmChange = (event) => {
    const value = Number(event.detail?.value ?? event.target?.value);
    if (!Number.isNaN(value)) {
      project.setBpm(value);
      if (scheduler) {
        scheduler.setTempo(get(project).bpm);
      }
    }
  };

  const NOTE_LENGTH_OPTIONS = [
    { label: '1/64', value: 64 },
    { label: '1/32', value: 32 },
    { label: '1/16', value: 16 },
    { label: '1/8', value: 8 },
    { label: '1/4', value: 4 },
    { label: '1/2', value: 2 },
    { label: '1', value: 1 }
  ];

  const DEFAULT_NOTE_LENGTH = `${NOTE_LENGTH_OPTIONS.find((option) => option.label === '1/8')?.value ?? NOTE_LENGTH_OPTIONS[0].value}`;
  let selectedNoteLength = DEFAULT_NOTE_LENGTH;

  const handleNoteChange = (event) => {
    const { row, start, length, value } = event.detail;
    // Grid now dispatches storage (high-resolution) indices for start/length.
    // Use a storage-aware setter in the project store.
    project.setNoteRangeStorage(projectState?.selectedTrack ?? 0, row, start, length, value);
  };

  const handleTrackSelect = (event) => {
    project.selectTrack(event.detail.index);
  };

  const handleTrackUpdate = (event) => {
    const { index, key, value } = event.detail;
    if (key === 'scale') {
      project.setAllTracksScale(value);
    } else if (key === 'rootNote') {
      project.setAllTracksRootNote(value);
    } else {
      project.setTrackSetting(index, key, value);
    }
  };

  const normalizeHex = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) return trimmed.toLowerCase();
    if (/^#([0-9a-fA-F]{3})$/.test(trimmed)) {
      const [, short] = trimmed.toLowerCase().match(/^#([0-9a-f]{3})$/) ?? [];
      if (!short) return null;
      return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
    }
    return null;
  };

  const hexToRgba = (hex, alpha = 1) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return null;
    const value = normalized.slice(1);
    const bigint = Number.parseInt(value, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    const clampedAlpha = Math.min(Math.max(alpha, 0), 1);
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  };

  const DEFAULT_NOTE_GLOW = 'rgba(var(--color-note-active-rgb), 0.28)';

  const handleTrackAdd = () => {
    project.addTrack();
  };

  const handleTrackDuplicate = (event) => {
    const { index } = event.detail;
    project.duplicateTrack(index);
  };

  const handleTrackRemove = (event) => {
    const { index } = event.detail;
    project.removeTrack(index);
  };

  const handleTrackToggleMute = (event) => {
    const { index } = event.detail;
    const currentValue = projectState?.tracks?.[index]?.mute ?? false;
    project.setTrackSetting(index, 'mute', !currentValue);
  };

  const handleTrackToggleSolo = (event) => {
    const { index } = event.detail;
    const currentValue = projectState?.tracks?.[index]?.solo ?? false;
    project.setTrackSetting(index, 'solo', !currentValue);
  };

  const handleVolumeChange = (event) => {
    const value = Number(event.detail?.value ?? event.target?.value);
    if (Number.isNaN(value)) return;
    const trackIndex = projectState?.selectedTrack ?? 0;
    project.setTrackSetting(trackIndex, 'volume', value);
  };

  const handleBarsChange = (event) => {
    const value = Number(event.detail?.value ?? event.target?.value);
    project.setBars(value);
  };

  const handleNoteLengthSelect = (value) => {
    selectedNoteLength = `${value}`;
    // Note length now only affects the duration of placed notes, not grid density
  };

  const handleNoteLengthChange = (event) => {
    handleNoteLengthSelect(event.detail.value);
  };

  const handleExport = () => {
    if (typeof window === 'undefined') return;
    const data = project.serialize();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bloops-project.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const importProjectFromJson = (json) => {
    if (!json) return false;
    try {
      const payload = JSON.parse(json);
      const success = project.load(payload);
      if (success) {
        stopPlayback();
        if (scheduler) {
          scheduler.setTempo(get(project).bpm);
          scheduler.setStepsPerBeat(get(project).stepsPerBar / BEATS_PER_BAR);
        }
        library.renameCurrent(project.getName());
      }
      return success;
    } catch (error) {
      console.error('Failed to import project', error);
      // eslint-disable-next-line no-alert
      alert('Unable to import project file. Please ensure it is a valid UNKNOWN JSON export.');
      return false;
    }
  };

  const handleImport = (event) => {
    const json = event.detail?.json;
    importProjectFromJson(json);
  };

  const handleUndo = () => {
    project.gridUndo();
  };

  const handleRedo = () => {
    project.gridRedo();
  };

  const handleProjectRename = (event) => {
    const value = event.detail?.value ?? event.target?.value;
    library.renameCurrent(value);
  };

  const handleProjectSelect = (event) => {
    const id = event.detail?.id ?? event.target?.value;
    if (id) {
      library.selectProject(id);
    }
  };

  const handleNewProject = () => {
    library.createNew();
  };

  const handleDuplicateProject = () => {
    library.duplicateCurrent();
  };

  const handleDeleteProject = () => {
    library.deleteCurrent();
  };

  // Pattern management handlers
  const handlePatternSelect = (event) => {
    const { index } = event.detail;
    project.selectPattern(index);
  };

  const handlePatternAdd = () => {
    project.addPattern();
  };

  const handlePatternDuplicate = (event) => {
    const { index } = event.detail;
    project.duplicatePattern(index);
  };

  const handlePatternRemove = (event) => {
    const { index } = event.detail;
    project.removePattern(index);
  };

  const handlePatternRename = (event) => {
    const { index, name } = event.detail;
    project.renamePattern(index, name);
  };

  const handlePatternReorder = (event) => {
    const { fromIndex, toIndex } = event.detail;
    project.reorderPattern(fromIndex, toIndex);
  };

  const handleRenderWav = async () => {
    try {
      const snapshot = project.toSnapshot();
      const blob = await renderProjectToWav(snapshot);
      const filename = `${snapshot.name.replace(/\s+/g, '-').toLowerCase()}-loop.wav`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to render WAV', error);
      // eslint-disable-next-line no-alert
      alert('Unable to render audio at this time.');
    }
  };

  const handleRenderMidi = async () => {
    try {
      const snapshot = project.toSnapshot();
      const blob = renderProjectToMidi(snapshot);
      const filename = `${snapshot.name.replace(/\s+/g, '-').toLowerCase()}-loop.mid`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to render MIDI', error);
      // eslint-disable-next-line no-alert
      alert('Unable to render MIDI at this time.');
    }
  };

  const clearShareFeedback = () => {
    if (shareFeedbackTimer) {
      clearTimeout(shareFeedbackTimer);
      shareFeedbackTimer = null;
    }
  };

  const setShareFeedback = (status, message, link = '') => {
    clearShareFeedback();
    shareStatus = status;
    shareMessage = message;
    shareLink = link;
    if (!['idle', 'ready'].includes(status)) {
      shareFeedbackTimer = setTimeout(() => {
        shareStatus = 'idle';
        shareMessage = '';
        shareLink = '';
        shareFeedbackTimer = null;
      }, 6000);
    }
  };

  const copyToClipboard = async (text) => {
    if (!text || typeof window === 'undefined') return false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      // fall through to manual copy fallback
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textarea);
      return result;
    } catch (error) {
      console.error('Clipboard copy failed', error);
      return false;
    }
  };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      setShareFeedback('working', 'Preparing share link...');
      const snapshot = project.toSnapshot();
      const url = buildShareUrl(snapshot);
      if (!url) throw new Error('Share URL unavailable');
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: snapshot.name, text: SHARE_TEXT, url });
        setShareFeedback('shared', 'Shared via system share sheet', url);
      } else {
        const copied = await copyToClipboard(url);
        if (copied) {
          setShareFeedback('copied', 'Share link copied to clipboard', url);
        } else {
          setShareFeedback('ready', 'Share link ready below', url);
        }
      }
    } catch (error) {
      console.error('Failed to share project', error);
      setShareFeedback('error', 'Unable to share right now. Please try again.');
    }
  };

  const handleShareMenuShare = async () => {
    await handleShare();
  };

  const handleShareMenuRender = () => {
    handleRenderWav();
  };

  const handleShareMenuRenderMidi = () => {
    handleRenderMidi();
  };

  const handleShareMenuExport = () => {
    handleExport();
  };

  const handleShareMenuImport = async (event) => {
    const { file, json } = event.detail ?? {};
    try {
      let payload = json ?? null;
      if (!payload && file) {
        payload = await file.text();
      }
      if (!payload) return;
      importProjectFromJson(payload);
    } catch (error) {
      console.error('Failed to import project', error);
      setShareFeedback('error', 'Unable to import project. Please try again.');
    }
  };

  const attemptLoadSharedSnapshot = async () => {
    if (typeof window === 'undefined') return;
    const currentUrl = new URL(window.location.href);
    const token = currentUrl.searchParams.get('share');
    if (!token) return;
    currentUrl.searchParams.delete('share');
    window.history.replaceState({}, document.title, currentUrl.toString());
    const snapshot = decodeShareSnapshot(token);
    if (!snapshot) {
      setShareFeedback('error', 'Unable to load shared loop.');
      return;
    }
    const loaded = project.load(snapshot);
    if (loaded) {
      await library.renameCurrent(snapshot.name);
      setShareFeedback('loaded', `Loaded shared loop “${snapshot.name}”`);
    } else {
      setShareFeedback('error', 'Unable to load shared loop.');
    }
  };

  onMount(() => {
    let disposed = false;
    let mountErrorLocal = null;
    const boot = async () => {
      await library.initialize();
      if (!disposed) {
        await attemptLoadSharedSnapshot();
      }
      
      // Initialize stepsPerBar to match zoom level for proper 4/4 time alignment
      // This ensures backward compatibility when loading projects with different stepsPerBar values
      if (!disposed) {
        project.setStepsPerBar(zoomLevel);
        if (scheduler) {
          scheduler.setStepsPerBeat(zoomLevel / BEATS_PER_BAR);
        }
      }
      
      // Log project settings for debugging deployment issues (dev mode only)
      if (!disposed && projectState && devModeEnabled) {
        console.log('UNKNOWN App - Project Settings:', {
          bars: projectState.bars,
          stepsPerBar: projectState.stepsPerBar,
          totalSteps: projectState.bars * projectState.stepsPerBar,
          bpm: projectState.bpm,
          defaultStepsPerBar: DEFAULT_STEPS_PER_BAR_VALUE
        });
      }
    };
    // Run boot and surface any errors to the UI so we don't leave the user on a white screen.
    boot().catch((err) => {
      console.error('Initialization failed', err);
      mountErrorLocal = err?.message || String(err);
      // expose to reactive scope
      mountError = mountErrorLocal;
    });
    
    // Global keyboard handler for spacebar to control play/stop (DAW-style)
    // and Ctrl+Shift+D for dev mode toggle
    const handleGlobalKeydown = (event) => {
      // Only handle spacebar if not in a text input or textarea
      const target = event.target;
      const isTextInput = target instanceof HTMLInputElement || 
                         target instanceof HTMLTextAreaElement ||
                         (target instanceof HTMLElement && target.isContentEditable);
      
      if (event.key === ' ' && !isTextInput) {
        event.preventDefault();
        handleTogglePlay();
      }
      
      // Ctrl+Shift+D to toggle dev mode
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        const newState = devMode.toggle();
        console.log(`Dev mode ${newState ? 'enabled' : 'disabled'}`);
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeydown);
    
    // Track last wheel event time to debounce rapid events
    let lastWheelTime = 0;
    const WHEEL_DEBOUNCE = 300; // ms between window switches
    
    // Global wheel handler for horizontal trackpad swipes to switch windows
    const handleGlobalWheel = (event) => {
      // Only handle horizontal scrolling (trackpad swipes)
      // deltaX > 0 means swipe left (next window), deltaX < 0 means swipe right (previous window)
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);
      
      // Only handle if horizontal movement is dominant and significant
      if (absX > absY && absX > 20) {
        const now = Date.now();
        if (now - lastWheelTime < WHEEL_DEBOUNCE) {
          return; // Too soon, ignore
        }
        lastWheelTime = now;
        
        // Determine direction and switch windows
        if (event.deltaX > 0) {
          // Swipe left -> next window
          if (currentWindow < totalWindows - 1) {
            handleWindowSwitch({ detail: { window: currentWindow + 1 } });
          }
        } else {
          // Swipe right -> previous window
          if (currentWindow > 0) {
            handleWindowSwitch({ detail: { window: currentWindow - 1 } });
          }
        }
      }
    };
    
    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    
    // Dev mode hover tracking
    const handleGlobalMouseOver = (event) => {
      if (!devModeEnabled) return;
      
      // Find the closest element with data-component attribute
      let target = event.target;
      while (target && target !== document.body) {
        if (target.dataset && target.dataset.component) {
          hoveredComponent = target.dataset.component;
          return;
        }
        target = target.parentElement;
      }
      // If no data-component found, clear the tooltip
      hoveredComponent = '';
    };
    
    window.addEventListener('mouseover', handleGlobalMouseOver);
    
    return () => {
      disposed = true;
      stopPlayback();
      if (audioContext) {
        audioContext.close?.();
      }
      window.removeEventListener('keydown', handleGlobalKeydown);
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('mouseover', handleGlobalMouseOver);
    };
  });

  onDestroy(() => {
    library.dispose();
    unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    clearShareFeedback();
    // Clean up arranger scheduler
    if (arrangerScheduler) {
      arrangerScheduler.stop();
    }
    if (arrangerAnimationId) {
      cancelAnimationFrame(arrangerAnimationId);
    }
  });

  // Handle arranger playback state changes
  $: if (arrangerPlaybackState?.isPlaying && audioContext) {
    startArrangerPlayback();
  } else if (!arrangerPlaybackState?.isPlaying && arrangerScheduler) {
    stopLocalArrangerPlayback();
  }

  const startArrangerPlayback = async () => {
    // Stop grid playback if it's running
    if (projectState?.playing) {
      stopPlayback();
    }
    
    if (!(await ensureAudio())) return;
    
    if (!arrangerScheduler) {
      const bpm = arrangerPlaybackState.bpm || 110;
      // 1 step per beat for arranger
      arrangerScheduler = new Scheduler(audioContext, bpm, 1);
      arrangerScheduler.onStep = handleArrangerStep;
    } else {
      arrangerScheduler.setTempo(arrangerPlaybackState.bpm || 110);
      arrangerScheduler.setStepsPerBeat(1);
      arrangerScheduler.onStep = handleArrangerStep;
    }
    
    arrangerScheduler.start();
  };

  const stopLocalArrangerPlayback = () => {
    if (arrangerScheduler) {
      arrangerScheduler.stop();
    }
    if (arrangerAnimationId) {
      cancelAnimationFrame(arrangerAnimationId);
      arrangerAnimationId = null;
    }
  };

  $: activeTrack = projectState?.tracks?.[projectState?.selectedTrack ?? 0];
  $: columns = Math.max(totalStepsValue || 64, 1);
  $: rows = Math.max(projectState?.rows || 8, 1);
  $: gridNotes = activeTrack?.notes ?? [];
  $: trackColor = activeTrack?.color ?? colors.accent;
  $: normalizedTrackColor = normalizeHex(trackColor);
  $: noteChipGlow = normalizedTrackColor ? hexToRgba(normalizedTrackColor, 0.32) ?? DEFAULT_NOTE_GLOW : DEFAULT_NOTE_GLOW;
  $: patterns = projectState?.patterns ?? [];
  $: selectedPattern = projectState?.selectedPattern ?? 0;
  $: isPlaying = projectState?.playing ?? false;
  $: isFollowing = projectState?.follow ?? false;
  $: projectName = projectState?.name ?? 'Untitled loop';
  $: totalBars = projectState?.bars ?? 0;
  $: stepsPerBar = projectState?.stepsPerBar ?? 0;
  $: loopSecondsDisplay = (loopDurationValue ?? 0).toFixed(1);
  $: canUndo = gridHistoryState?.canUndo ?? false;
  $: canRedo = gridHistoryState?.canRedo ?? false;
  $: autosaveStatus = libraryState?.status ?? 'idle';
  $: isSaving = autosaveStatus === 'saving';
  $: projects = libraryState?.projects ?? [];
  $: currentProjectId = libraryState?.currentId ?? null;
  $: libraryLoading = libraryState?.loading ?? false;
  $: noteLabels = activeTrack ? getRowNoteNames(activeTrack, rows, scales) : [];
  $: selectedNoteLengthValue = Number(selectedNoteLength) || 1;
  $: selectedNoteOption = NOTE_LENGTH_OPTIONS.find((option) => `${option.value}` === `${selectedNoteLength}`);
  $: currentNoteLabel = selectedNoteOption?.label ?? NOTE_LENGTH_OPTIONS[0].label;
  $: noteLengthSteps = Math.max(1, Math.round((stepsPerBar || 1) / selectedNoteLengthValue));
  $: displayNoteLabel = currentNoteLabel ?? NOTE_LENGTH_OPTIONS[0].label;
</script>

<main class="app" class:dev-mode={devModeEnabled}>
  {#if devModeEnabled}
    <div class="dev-mode-indicator">
      <span>DEV MODE</span>
      <kbd>Ctrl+Shift+D</kbd>
    </div>
    <div class="dev-mode-tooltip">
      {#if hoveredComponent}
        <div class="tooltip-content">{hoveredComponent}</div>
      {:else}
        <div class="tooltip-content tooltip-empty">Hover over components</div>
      {/if}
    </div>
  {/if}
  {#if mountError}
    <div class="mount-error" style="position:fixed;inset:16px;background:rgba(0,0,0,0.9);color:#fff;padding:20px;border-radius:8px;z-index:9999;overflow:auto;">
      <h2 style="margin:0 0 8px 0;font-size:18px;">Initialization error</h2>
      <div style="font-family:monospace;white-space:pre-wrap;">{mountError}</div>
    </div>
  {/if}
  <!-- Screen reader announcements -->
  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
    {#if isPlaying}
      Playback started
    {:else}
      Playback stopped
    {/if}
  </div>
  <aside class="app-rail" data-component="AppRail">
    <div class="rail-inner">
      <div class="brand-wrapper">
        <div class="brand" data-component="Brand">
          <div class="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
              <!-- Stylized "U" made of dots -->
              <circle cx="8" cy="8" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="8" cy="20" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="8" cy="32" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="8" cy="44" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="20" cy="44" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="32" cy="8" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="32" cy="20" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.9" />
              <circle cx="32" cy="44" r="4" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          <div class="brand-text">
            <h1 class="brand-mark">UNKNOWN</h1>
            <p class="brand-tag">Dot grid sequencer</p>
          </div>
        </div>
        <div class="brand-utility-buttons">
          <ShareMenu
            shareStatus={shareStatus}
            shareMessage={shareMessage}
            shareLink={shareLink}
            on:share={handleShareMenuShare}
            on:render={handleShareMenuRender}
            on:rendermidi={handleShareMenuRenderMidi}
            on:export={handleShareMenuExport}
            on:import={handleShareMenuImport}
          />
          <SettingsMenu />
        </div>
      </div>
      <div class="playback-control-card" data-component="PlaybackControlCard">
        <div class="mobile-project-name playback-card-section">
          <label class="project-label" for="project-name-mobile">
            <svg class="project-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            <span class="project-eyebrow">Project Name</span>
          </label>
          <input
            id="project-name-mobile"
            class="project-name-input"
            type="text"
            value={projectName}
            on:change={handleProjectRename}
            on:blur={handleProjectRename}
            placeholder="Untitled loop"
            title="Click to edit project name"
            aria-label="Project name"
          />
        </div>
        <div class="transport-wrapper playback-card-section">
          <Transport
            playing={isPlaying}
            on:toggleplay={handleTogglePlay}
            on:skipback={handleSkipBack}
            on:skip={handleSkip}
          />
        </div>
        {#if activeTrack}
          <div class="volume-control playback-card-section">
            <div class="volume-heading">
              <span class="track-name" style={`color: ${trackColor}`}>{activeTrack.name ?? `Track ${(projectState?.selectedTrack ?? 0) + 1}`}</span>
            </div>
            <VolumeSlider
              id={`rail-volume-${projectState?.selectedTrack ?? 0}`}
              label="Volume"
              min={0}
              max={1}
              step={0.01}
              value={activeTrack.volume ?? 0}
              defaultValue={0.7}
              accent={trackColor}
              valueFormatter={(val) => `${Math.round((val ?? 0) * 100)}%`}
              className="volume-slider-control"
              on:change={handleVolumeChange}
            />
          </div>
        {/if}
      </div>
      <TrackSelector
        tracks={projectState?.tracks ?? []}
        selected={projectState?.selectedTrack ?? 0}
        maxTracks={TRACK_LIMIT}
        on:select={handleTrackSelect}
        on:add={handleTrackAdd}
        on:duplicate={handleTrackDuplicate}
        on:remove={handleTrackRemove}
        on:togglemute={handleTrackToggleMute}
        on:togglesolo={handleTrackToggleSolo}
      />
    </div>
  </aside>
  <section class="workspace" data-component="Workspace">
    <div class="workspace-header" data-component="WorkspaceHeader">
      <div class="project-info">
        <label class="project-label" for="project-name-input">
          <svg class="project-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span class="project-eyebrow">Project Name</span>
        </label>
        <input
          id="project-name-input"
          class="project-name-input"
          type="text"
          value={projectName}
          on:change={handleProjectRename}
          on:blur={handleProjectRename}
          placeholder="Untitled loop"
          title="Click to edit project name"
          aria-label="Project name"
        />
      </div>
      <div class="header-actions">
        <div class="utility-buttons">
          <ShareMenu
            shareStatus={shareStatus}
            shareMessage={shareMessage}
            shareLink={shareLink}
            on:share={handleShareMenuShare}
            on:render={handleShareMenuRender}
            on:rendermidi={handleShareMenuRenderMidi}
            on:export={handleShareMenuExport}
            on:import={handleShareMenuImport}
          />
          <SettingsMenu />
        </div>
      </div>
    </div>
    <div class="track-config-wrapper" data-component="TrackConfigWrapper">
      <TrackConfigPanel
        track={activeTrack}
        trackIndex={projectState?.selectedTrack ?? 0}
        on:update={handleTrackUpdate}
      />
    </div>
    <div class="grid-shell" data-component="GridShell">
      <div class="grid-toolbar" data-component="GridToolbar">
        <!-- Primary tools: Drawing tools, note length, and zoom (left side) -->
        <div class="toolbar-primary">
          <GridToolbar
            {trackColor}
            {canUndo}
            {canRedo}
            on:undo={handleUndo}
            on:redo={handleRedo}
            on:capturepattern={handlePatternAdd}
          />
          <div class="toolbar-divider" aria-hidden="true"></div>
          <div class="note-length-group">
            <span class="note-icon" aria-hidden="true">♪</span>
            <ArrowSelector
              options={NOTE_LENGTH_OPTIONS}
              value={selectedNoteLengthValue}
              trackColor={trackColor}
              compact={true}
              on:change={handleNoteLengthChange}
            />
          </div>
          <div class="toolbar-divider" aria-hidden="true"></div>
          <ZoomControls
            {zoomLevel}
            {trackColor}
            on:zoom={handleZoomChange}
          />
        </div>
      </div>
        <div class="grid-backdrop" data-component="GridBackdrop">
          <Grid
          {rows}
          {columns}
          notes={gridNotes}
          noteLabels={noteLabels}
          playheadStep={projectState?.playheadStep ?? 0}
          playheadProgress={projectState?.playheadProgress ?? 0}
          trackColor={trackColor}
          follow={isFollowing}
          isPlaying={isPlaying}
          stepsPerBar={stepsPerBar}
          noteLengthDenominator={selectedNoteLengthValue}
          manualWindow={manualWindow}
          {zoomLevel}
          on:notechange={handleNoteChange}
          on:windowinfo={handleWindowInfo}
        />
      </div>
      <div class="grid-controls-bar" data-component="GridControlsBar">
        <div class="tempo-bar-section" data-component="TempoBar">
          <div class="tempo-bar-field">
            <label for="tempo-bar-bpm" class="tempo-bar-label">BPM</label>
            <input
              id="tempo-bar-bpm"
              type="number"
              min="30"
              max="260"
              value={projectState?.bpm ?? 120}
              on:input={handleBpmChange}
              class="tempo-bar-input"
            />
          </div>
          <div class="tempo-bar-field">
            <label for="tempo-bar-bars" class="tempo-bar-label">Bars</label>
            <input
              id="tempo-bar-bars"
              type="number"
              min="2"
              step="2"
              max={maxBarsValue}
              value={totalBars}
              on:change={handleBarsChange}
              class="tempo-bar-input"
            />
          </div>
          <div class="tempo-bar-field">
            <span class="tempo-bar-label">Loop length</span>
            <span class="tempo-bar-value">{loopSecondsDisplay}s</span>
          </div>
        </div>
        <div class="grid-nav-section">
          <FollowToggle active={isFollowing} on:toggle={handleFollowToggle} />
          <WindowSwitcher
            {currentWindow}
            {totalWindows}
            trackColor={trackColor}
            on:switch={handleWindowSwitch}
          />
        </div>
      </div>
    </div>
    <div class="arranger-panel" data-component="PatternArrangerPanel">
      <button 
        class="arranger-toggle" 
        on:click={() => arrangerVisible = !arrangerVisible}
        aria-expanded={arrangerVisible}
        aria-label={arrangerVisible ? 'Hide Pattern Arranger' : 'Show Pattern Arranger'}
      >
        <span class="arranger-toggle-icon">{arrangerVisible ? '▼' : '▶'}</span>
        <span class="arranger-toggle-text">Pattern Arranger</span>
      </button>
      {#if arrangerVisible}
        <PatternArranger
          {patterns}
          {selectedPattern}
          on:patternselect={handlePatternSelect}
          on:patternadd={handlePatternAdd}
          on:patternduplicate={handlePatternDuplicate}
          on:patternremove={handlePatternRemove}
          on:patternrename={handlePatternRename}
          on:patternreorder={handlePatternReorder}
        />
      {/if}
    </div>
    <Footer />
  </section>
  <UpdateNotification />
</main>

<style>
  :global(:root) {
    --color-accent: #78d2b9;
    --color-accent-rgb: 120, 210, 185;
    --color-accent-bright: #9BFFE0;
    --color-accent-bright-rgb: 155, 255, 224;
    --color-note-active: #78d2ff;
    --color-note-active-rgb: 120, 210, 255;
    --color-note-inactive: #4a5060;
    --color-background: #1a1d28;
    --color-panel: #222632;
    --color-playhead: rgba(var(--color-accent-rgb), 0.85);
    --color-grid-line: rgba(255, 255, 255, 0.12);
  }

  :global(.text-accent) {
    color: var(--color-accent);
  }

  :global(.bg-accent) {
    background-color: var(--color-accent);
  }

  :global(.text-panel) {
    color: var(--color-panel);
  }

  :global(.bg-panel) {
    background-color: var(--color-panel);
  }

  :global(.text-note-active) {
    color: var(--color-note-active);
  }

  :global(.text-note-inactive) {
    color: var(--color-note-inactive);
  }

  :global(.bg-background) {
    background-color: var(--color-background);
  }

  :global(.border-accent) {
    border-color: var(--color-accent);
  }

  /* Screen reader only utility */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* Focus styles for accessibility - visible indicators */
  :global(*:focus) {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.6);
    outline-offset: 2px;
  }

  :global(*:focus:not(:focus-visible)) {
    outline: none;
  }

  :global(*:focus-visible) {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  :global(*),
  :global(*::before),
  :global(*::after) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-image: radial-gradient(circle at top left, rgba(var(--color-accent-rgb), 0.15), transparent 50%),
      radial-gradient(circle at bottom right, rgba(var(--color-note-active-rgb), 0.12), transparent 50%);
    background-color: var(--color-background);
    background-attachment: fixed, fixed;
    background-repeat: no-repeat, no-repeat;
    background-size: 140% 140%, 120% 120%;
    background-position: top left, bottom right;
    color: var(--color-text, #fff);
    min-height: 100vh;
    overflow-x: hidden;
  }

  .app {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 260px 1fr;
    backdrop-filter: blur(0px);
    color: #fff;
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .app-rail {
    background: linear-gradient(180deg, var(--color-rail, rgba(34, 38, 50, 0.95)) 0%, var(--color-rail-end, rgba(26, 29, 40, 0.98)) 100%);
    border-right: 1px solid rgba(var(--color-text, 255, 255, 255), 0.08);
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  .rail-inner {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .brand-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
  }

  .brand-utility-buttons {
    display: none; /* Hidden on desktop, shown on mobile */
  }

  .brand-logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .logo-icon {
    width: 56px;
    height: auto;
    color: var(--color-accent);
  }

  .brand-text {
    display: flex;
    flex-direction: column;
    gap: 0px;
    align-items: flex-start;
  }

  .brand-mark {
    margin: 0;
    padding: 0;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 1.5rem;
    line-height: 1.1;
  }

  .brand-tag {
    margin: 0;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.1;
    white-space: nowrap;
  }

  .workspace {
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(20px);
    background: rgba(var(--color-background, 26, 29, 40), 0.65);
    min-width: 0;
    overflow-x: auto;
    min-height: 100vh;
  }

  .workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px 6px;
    gap: 18px;
    width: 100%;
    box-sizing: border-box;
  }

  .project-info {
    display: flex;
    flex-direction: column;
  }

  .project-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;
    cursor: pointer;
  }

  .project-icon {
    width: 18px;
    height: 18px;
    color: rgba(var(--color-accent-rgb), 0.75);
    transition: color 0.2s ease;
  }

  .project-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(var(--color-accent-rgb), 0.7);
    transition: color 0.2s ease;
  }

  .project-label:hover .project-icon,
  .project-label:hover .project-eyebrow {
    color: rgba(var(--color-accent-rgb), 0.95);
  }

  .project-name-input {
    margin: 0;
    padding: 7px;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    color: var(--color-text, #fff);
    font-family: inherit;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
    max-width: 420px;
    cursor: text;
  }

  .project-name-input::placeholder {
    color: var(--color-text-muted, rgba(255, 255, 255, 0.35));
  }

  .project-name-input:hover {
    background: rgba(var(--color-accent-rgb), 0.08);
    border-color: rgba(var(--color-accent-rgb), 0.25);
    cursor: text;
  }

  .project-name-input:focus {
    outline: none;
    background: rgba(var(--color-accent-rgb), 0.12);
    border-color: rgba(var(--color-accent-rgb), 0.4);
    box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.15);
  }

  .header-actions {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    flex-shrink: 0;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .utility-buttons {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .grid-shell {
    flex: 1;
    padding: 0 20px 16px;
    box-sizing: border-box;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .track-config-wrapper {
    padding: 0 20px;
    margin-bottom: 20px;
  }

  .arranger-panel {
    padding: 0 20px 20px;
  }

  .arranger-toggle {
    width: 100%;
    padding: 16px 20px;
    margin-bottom: 12px;
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.08), rgba(34, 38, 50, 0.6));
    border: 1px solid rgba(var(--color-accent-rgb), 0.2);
    border-radius: 12px;
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .arranger-toggle:hover {
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.12), rgba(34, 38, 50, 0.8));
    border-color: rgba(var(--color-accent-rgb), 0.3);
    transform: translateY(-1px);
  }

  .arranger-toggle:active {
    transform: translateY(0);
  }

  .arranger-toggle-icon {
    font-size: 0.85rem;
    color: var(--color-accent);
    transition: transform 0.2s ease;
  }

  .arranger-toggle-text {
    flex: 1;
    text-align: left;
    letter-spacing: 0.02em;
  }

  .playback-control-card {
    padding: 14px 12px 16px;
    border-radius: 14px;
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.12), rgba(var(--color-panel, 22, 26, 36), 0.6));
    border: 1px solid rgba(var(--color-accent-rgb), 0.24);
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
  }

  .mobile-project-name {
    display: none;
    width: 100%;
    gap: 6px;
    text-align: left;
  }

  .transport-wrapper {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .playback-card-section {
    width: 100%;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(var(--color-accent-rgb), 0.18);
    position: relative;
  }

  .playback-card-section:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .playback-card-section + .playback-card-section {
    padding-top: 6px;
  }

  .volume-control {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    width: 100%;
    padding: 0 8px;
  }

  .volume-heading {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    text-transform: none;
    color: var(--color-text-muted, rgba(255, 255, 255, 0.7));
    font-weight: 700;
  }

  .volume-heading .track-name {
    color: inherit;
  }

  .playback-control-card :global(.volume-slider-control) {
    width: 100%;
    max-width: 100%;
  }

  .grid-toolbar {
    display: flex;
    align-items: center; /* Center all toolbar items vertically */
    justify-content: flex-start; /* Align to left since we removed secondary tools */
    gap: 16px; /* Design system: 2 × 8px base */
    margin: 0 0 0; /* Remove bottom margin to anchor to grid */
    padding: 12px 14px; /* Add padding to create internal spacing */
    border-radius: 12px 12px 0 0; /* Round only top corners to connect with grid */
    background: linear-gradient(135deg, var(--color-grid-bg), var(--color-grid-bg-end)); /* Use theme variables */
    border: 2px solid rgba(var(--color-accent-rgb), 0.3); /* Match grid border */
    border-bottom: none; /* Remove bottom border to merge with grid */
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.95rem;
  }

  /* Primary tools group: Drawing tools and note length (left side) */
  .toolbar-primary {
    display: flex;
    align-items: center; /* Center items vertically for alignment */
    gap: 16px; /* Design system: 2 × 8px base */
    flex: 1;
    min-width: 0; /* Allow shrinking */
  }

  .note-length-group {
    display: flex;
    align-items: center; /* Center icon with selector */
    gap: 8px; /* Space between icon and selector */
  }

  .note-icon {
    font-size: 1.3rem;
    line-height: 1;
    color: rgba(var(--color-accent-rgb), 0.8);
    flex-shrink: 0;
  }

  /* Subtle dividers between toolbar sections */
  .toolbar-divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.08); /* Subtle vertical line */
    flex-shrink: 0;
  }

  .grid-backdrop {
    position: relative;
    border-radius: 0; /* Part of 3-tier unit: grid-toolbar → grid-backdrop → grid-controls-bar */
    padding: 14px;
    box-sizing: border-box;
    background: linear-gradient(135deg, var(--color-grid-bg, rgba(22, 26, 36, 0.92)), var(--color-grid-bg-end, rgba(12, 14, 20, 0.88)));
    border: 2px solid rgba(var(--color-accent-rgb), 0.3);
    border-top: none; /* Merge with grid-toolbar above */
    border-bottom: none; /* Merge with grid-controls-bar below */
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    margin-bottom: 0; /* Connect seamlessly to grid-controls-bar */
    min-height: 300px;
    flex: 1;
    display: flex;
  }

  .grid-backdrop :global(.grid-wrapper) {
    height: auto;
  }

  .grid-controls-bar {
    /* Bottom tier: single row with tempo controls + follow/window navigation */
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 12px 16px;
    margin-top: 0; /* Connects to grid-backdrop above */
    margin-bottom: 16px; /* Spacing from content below */
    border-radius: 0 0 12px 12px; /* Bottom tier - round bottom corners only */
    background: linear-gradient(135deg, var(--color-grid-bg, rgba(22, 26, 36, 0.92)), var(--color-grid-bg-end, rgba(12, 14, 20, 0.88)));
    border: 2px solid rgba(var(--color-accent-rgb), 0.3);
    border-top: none; /* Merge with grid-backdrop above */
    flex-wrap: nowrap; /* Keep everything in a single row on desktop */
  }

  .tempo-bar-section {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-shrink: 0;
  }

  .grid-nav-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }

  .tempo-bar-field {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tempo-bar-label {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted, rgba(255, 255, 255, 0.7));
    font-weight: 600;
    white-space: nowrap;
  }

  .tempo-bar-input {
    background: rgba(0, 0, 0, 0.35);
    color: var(--color-text, #fff);
    border-radius: 8px;
    border: 1px solid rgba(var(--color-text, 255, 255, 255), 0.15);
    padding: 6px 10px;
    font-size: 0.95rem;
    font-weight: 600;
    appearance: textfield;
    width: 70px;
    text-align: center;
  }

  .tempo-bar-input::-webkit-outer-spin-button,
  .tempo-bar-input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .tempo-bar-input:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }

  .tempo-bar-value {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text, #fff);
  }

  @media (max-width: 960px) {
    .app {
      grid-template-columns: 1fr;
    }

    .app-rail {
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .rail-inner {
      max-width: 100%;
    }

    /* Show utility buttons in brand wrapper on mobile */
    .brand-utility-buttons {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    /* Hide utility buttons from workspace header on mobile */
    .workspace-header .utility-buttons {
      display: none;
    }

    /* Tablet: slightly tighter toolbar spacing */
    .toolbar-primary {
      gap: 12px;
    }
  }

  @media (max-width: 720px) {
    .workspace-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px 20px 12px;
      gap: 16px;
    }

    .mobile-project-name {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      padding: 0 8px;
    }

    /* Hide duplicate project title in workspace header on mobile */
    .workspace-header .project-info {
      display: none;
    }

    .grid-shell {
      padding: 0 16px 16px;
    }

    /* Mobile: Horizontal scrolling toolbar for better space efficiency */
    .grid-toolbar {
      padding: 10px 12px;
      border-radius: 12px 12px 0 0;
      overflow-x: auto;
      overflow-y: hidden;
      /* Smooth scrolling on touch devices */
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: rgba(var(--color-accent-rgb), 0.3) transparent;
    }

    /* Webkit scrollbar styling for better mobile UX */
    .grid-toolbar::-webkit-scrollbar {
      height: 6px;
    }

    .grid-toolbar::-webkit-scrollbar-track {
      background: transparent;
    }

    .grid-toolbar::-webkit-scrollbar-thumb {
      background: rgba(var(--color-accent-rgb), 0.3);
      border-radius: 3px;
    }

    .grid-toolbar::-webkit-scrollbar-thumb:hover {
      background: rgba(var(--color-accent-rgb), 0.5);
    }

    /* Keep toolbar horizontal with compact spacing */
    .toolbar-primary {
      flex-direction: row;
      gap: 8px; /* Reduced from 16px - using design token xs */
      min-width: min-content;
      flex-wrap: nowrap;
    }

    /* Ensure toolbar items don't shrink below touch target size */
    .toolbar-primary > * {
      flex-shrink: 0;
    }

    .note-length-group {
      flex-shrink: 0;
    }

    .toolbar-divider {
      height: 28px; /* Slightly shorter on mobile */
    }

    .grid-backdrop {
      padding: 12px;
      border-radius: 0;
      border-top: none;
      border-bottom: none;
    }

    .app-rail {
      padding: 18px;
    }

    .project-name-input {
      font-size: 1.2rem;
      max-width: 100%;
    }
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }

    /* Mobile: stack tempo and navigation sections vertically */
    .grid-controls-bar {
      flex-wrap: wrap;
      gap: 12px;
    }

    .tempo-bar-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px; /* Design token: sm (1.5 × base) */
      width: 100%;
    }

    .tempo-bar-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .tempo-bar-field:nth-child(3) {
      /* Loop length field can stay centered */
      justify-content: center;
    }

    .tempo-bar-input {
      width: 100%;
      min-width: 60px;
      max-width: 100px;
    }

    .grid-nav-section {
      width: 100%;
      justify-content: space-around;
    }
  }

  /* Small mobile devices (iPhone SE, etc.) */
  @media (max-width: 560px) {
    .grid-shell {
      padding: 0 12px 12px;
    }

    .grid-toolbar {
      padding: 8px 10px;
      gap: 12px;
    }

    .toolbar-primary {
      gap: 6px; /* Even tighter spacing on small screens */
    }
    
    .app-rail {
      padding: 12px;
    }
    
    .brand-logo {
      max-width: 160px;
    }

    .grid-controls-bar {
      padding: 10px 12px;
      gap: 10px;
    }

    .tempo-bar-section {
      gap: 10px;
    }

    .tempo-bar-input {
      font-size: 0.9rem;
      padding: 5px 8px;
    }
  }

  /* Extra small devices - ensure no horizontal scroll */
  @media (max-width: 375px) {
    .grid-toolbar {
      padding: 6px 8px;
    }

    .toolbar-primary {
      gap: 4px; /* Minimal spacing for very small screens */
    }

    .grid-controls-bar {
      gap: 8px;
      padding: 8px 10px;
    }

    .tempo-bar-section {
      gap: 8px;
    }

    .tempo-bar-label {
      font-size: 0.7rem;
    }

    .tempo-bar-input {
      font-size: 0.85rem;
      min-width: 50px;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  
  /* Touch improvements */
  @media (hover: none) and (pointer: coarse) {
    /* Ensure all interactive elements meet 44px minimum touch target */
    button {
      min-height: 44px;
      min-width: 44px;
      padding: 8px 12px;
    }

    /* Ensure input fields are easy to tap */
    input[type="number"],
    input[type="text"] {
      min-height: 44px;
      padding: 8px 12px;
      font-size: 16px; /* Prevents iOS zoom on focus - iOS zooms on input fields < 16px */
    }

    /* Tempo bar inputs should be easily tappable */
    .tempo-bar-input {
      min-height: 44px;
      padding: 8px 12px;
      font-size: 16px; /* Prevents iOS zoom on focus - iOS zooms on input fields < 16px */
    }
  }

  /* Dev Mode Styles */
  .dev-mode-indicator {
    position: fixed;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 165, 0, 0.95);
    color: #000;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: none;
  }

  .dev-mode-indicator kbd {
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    font-size: 0.7rem;
    font-family: monospace;
  }

  /* Dev mode fixed tooltip box in top-right corner - always visible */
  .dev-mode-tooltip {
    position: fixed;
    top: 60px;
    right: 20px;
    z-index: 10001;
    min-width: 200px;
    max-width: 400px;
    pointer-events: none;
  }

  .tooltip-content {
    padding: 12px 16px;
    background: rgba(255, 165, 0, 0.95);
    color: #000;
    font-size: 0.9rem;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
    word-break: break-word;
    animation: tooltipFadeIn 0.2s ease-out;
  }

  .tooltip-empty {
    opacity: 0.6;
    font-style: italic;
    font-weight: 400;
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Hide tooltip animation on reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .tooltip-content {
      animation: none;
    }
  }
</style>
