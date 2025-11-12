<script>
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Grid from './components/Grid.svelte';
  import TrackSelector from './components/TrackSelector.svelte';
  import TrackControls from './components/TrackControls.svelte';
  import TrackEffectsPanel from './components/TrackEffectsPanel.svelte';
  import Transport from './components/Transport.svelte';
  import Footer from './components/Footer.svelte';
  import SettingsMenu from './components/SettingsMenu.svelte';
  import KnobControl from './components/KnobControl.svelte';
  import ShareMenu from './components/ShareMenu.svelte';
  import FollowToggle from './components/FollowToggle.svelte';
  import ArrowSelector from './components/ArrowSelector.svelte';
  import { Scheduler } from './lib/scheduler.js';
  import { project, totalSteps, loopDuration, maxBars, TRACK_LIMIT, historyStatus, BASE_RESOLUTION } from './store/projectStore.js';
  import { scales } from './lib/scales.js';
  import { colors } from './lib/colorTokens.js';
  import { library } from './store/libraryStore.js';
  import { renderProjectToWav } from './lib/offlineRenderer.js';
  import { renderProjectToMidi } from './lib/midiExporter.js';
  import { getCustomWave, connectTrackEffects, buildShareUrl, decodeShareSnapshot, SHARE_TEXT } from './lib/sound.js';
  import { getRowNoteNames } from './lib/notes.js';

  let projectState;
  let historyState;
  let libraryState;
  let totalStepsValue = 0;
  let loopDurationValue = 0;
  let maxBarsValue = 0;

  const unsubscribers = [
    project.subscribe((value) => (projectState = value)),
    totalSteps.subscribe((value) => (totalStepsValue = value)),
    loopDuration.subscribe((value) => (loopDurationValue = value)),
    maxBars.subscribe((value) => (maxBarsValue = value)),
    historyStatus.subscribe((value) => (historyState = value)),
    library.subscribe((value) => (libraryState = value))
  ];

  let audioContext;
  let scheduler;
  let masterGain;
  let animationId;
  let shareStatus = 'idle';
  let shareMessage = '';
  let shareLink = '';
  let shareFeedbackTimer;
  // When initialization fails, set mountError to show a visible overlay instead of a white screen.
  let mountError = null;

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
      scheduler = new Scheduler(audioContext, projectState.bpm, projectState.stepsPerBar / 4);
      scheduler.onStep = handleStep;
    } else {
      scheduler.setTempo(projectState.bpm);
      scheduler.setStepsPerBeat(projectState.stepsPerBar / 4);
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
      for (let row = 0; row < rows; row += 1) {
          // Map logical stepIndex -> storage index using BASE_RESOLUTION
          const storageIndex = Math.floor(stepIndex * (BASE_RESOLUTION / state.stepsPerBar));
          if (track.notes?.[row]?.[storageIndex]) {
          const midi = getMidiForCell(track, row);
          const frequency = midiToFrequency(midi);
          // Apply minimum duration of 50ms to prevent clicks on very short notes
          const minDuration = 0.05; // 50ms minimum gate time
          const safeDuration = Math.max(stepDuration * 0.95, minDuration);
          playTone(track, frequency, time, safeDuration);
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
    if (!(await ensureAudio())) return;
    project.resetPlayhead();
    project.setPlaying(true);
    scheduler.setTempo(projectState.bpm);
    scheduler.setStepsPerBeat(projectState.stepsPerBar / 4);
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
    project.resetPlayhead();
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

  const DEFAULT_NOTE_LENGTH = `${NOTE_LENGTH_OPTIONS.find((option) => option.label === '1/16')?.value ?? NOTE_LENGTH_OPTIONS[0].value}`;
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

  const handleStepsChange = (event) => {
    const value = Number(event.detail?.value ?? event.target?.value);
    project.setStepsPerBar(value);
    if (scheduler) {
      scheduler.setStepsPerBeat(get(project).stepsPerBar / 4);
    }
  };

  const handleNoteLengthSelect = (value) => {
    selectedNoteLength = `${value}`;
    const denom = Number(value) || 1;
    // If the selected denominator requires higher resolution than current stepsPerBar,
    // increase the project's stepsPerBar so the grid can represent the finer subdivisions.
    try {
      const currentSteps = projectState?.stepsPerBar ?? 0;
      if (denom > currentSteps) {
        project.setStepsPerBar(denom);
      }
    } catch (e) {
      // ignore if project not ready
    }
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
          scheduler.setStepsPerBeat(get(project).stepsPerBar / 4);
        }
        library.renameCurrent(project.getName());
      }
      return success;
    } catch (error) {
      console.error('Failed to import project', error);
      // eslint-disable-next-line no-alert
      alert('Unable to import project file. Please ensure it is a valid Bloops JSON export.');
      return false;
    }
  };

  const handleImport = (event) => {
    const json = event.detail?.json;
    importProjectFromJson(json);
  };

  const handleUndo = () => {
    project.undo();
  };

  const handleRedo = () => {
    project.redo();
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
    };
    // Run boot and surface any errors to the UI so we don't leave the user on a white screen.
    boot().catch((err) => {
      console.error('Initialization failed', err);
      mountErrorLocal = err?.message || String(err);
      // expose to reactive scope
      mountError = mountErrorLocal;
    });
    return () => {
      disposed = true;
      stopPlayback();
      if (audioContext) {
        audioContext.close?.();
      }
    };
  });

  onDestroy(() => {
    library.dispose();
    unsubscribers.forEach((unsubscribe) => unsubscribe?.());
    clearShareFeedback();
  });

  $: activeTrack = projectState?.tracks?.[projectState?.selectedTrack ?? 0];
  $: columns = Math.max(totalStepsValue || 64, 1);
  $: rows = Math.max(projectState?.rows || 8, 1);
  $: gridNotes = activeTrack?.notes ?? [];
  $: trackColor = activeTrack?.color ?? colors.accent;
  $: normalizedTrackColor = normalizeHex(trackColor);
  $: noteChipGlow = normalizedTrackColor ? hexToRgba(normalizedTrackColor, 0.32) ?? DEFAULT_NOTE_GLOW : DEFAULT_NOTE_GLOW;
  $: isPlaying = projectState?.playing ?? false;
  $: isFollowing = projectState?.follow ?? false;
  $: projectName = projectState?.name ?? 'Untitled loop';
  $: totalBars = projectState?.bars ?? 0;
  $: stepsPerBar = projectState?.stepsPerBar ?? 0;
  $: loopSecondsDisplay = (loopDurationValue ?? 0).toFixed(1);
  $: canUndo = historyState?.canUndo ?? false;
  $: canRedo = historyState?.canRedo ?? false;
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

<main class="app">
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
  <aside class="app-rail">
    <div class="rail-inner">
      <div class="brand">
        <div class="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
            <!-- Stylized "B" made of dots -->
            <circle cx="8" cy="8" r="4" fill="currentColor" opacity="0.9" />
            <circle cx="8" cy="20" r="4" fill="currentColor" opacity="0.9" />
            <circle cx="8" cy="32" r="4" fill="currentColor" opacity="0.9" />
            <circle cx="8" cy="44" r="4" fill="currentColor" opacity="0.9" />
            <circle cx="20" cy="8" r="4" fill="currentColor" opacity="0.9" />
            <circle cx="20" cy="24" r="4" fill="currentColor" opacity="0.9" />
            <circle cx="20" cy="40" r="4" fill="currentColor" opacity="0.9" />
            <circle cx="32" cy="12" r="4" fill="currentColor" opacity="0.8" />
            <circle cx="32" cy="24" r="4" fill="currentColor" opacity="0.8" />
            <circle cx="32" cy="36" r="4" fill="currentColor" opacity="0.8" />
          </svg>
        </div>
        <div class="brand-text">
          <h1 class="brand-mark">Bloops</h1>
          <p class="brand-tag">Dot grid sequencer</p>
        </div>
      </div>
      {#if activeTrack}
        <div class="volume-card">
          <div class="volume-heading">
            <span class="track-name" style={`color: ${trackColor}`}>{activeTrack.name ?? `Track ${(projectState?.selectedTrack ?? 0) + 1}`}</span>
          </div>
          <KnobControl
            id={`rail-volume-${projectState?.selectedTrack ?? 0}`}
            label="Volume"
            min={0}
            max={1}
            step={0.01}
            value={activeTrack.volume ?? 0}
            accent={trackColor}
            valueFormatter={(val) => `${Math.round((val ?? 0) * 100)}%`}
            className="volume-knob"
            on:change={handleVolumeChange}
          />
        </div>
      {/if}
    <Transport
      playing={isPlaying}
      on:toggleplay={handleTogglePlay}
      on:skipback={handleSkipBack}
      on:skip={handleSkip}
    />
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
      <div class="rail-stats">
        <div class="stat-field">
          <label for="rail-tempo" class="label">Tempo</label>
          <input
            id="rail-tempo"
            type="number"
            min="30"
            max="260"
            value={projectState?.bpm ?? 120}
            on:input={handleBpmChange}
            class="stat-input"
          />
        </div>
        <div class="stat-field">
          <label for="rail-bars" class="label">Bars</label>
          <input
            id="rail-bars"
            type="number"
            min="1"
            max={maxBarsValue}
            value={totalBars}
            on:change={handleBarsChange}
            class="stat-input"
          />
        </div>
        <div class="stat-field">
          <label for="rail-steps" class="label">Steps / bar</label>
          <input
            id="rail-steps"
            type="number"
            min="4"
            max="64"
            step="1"
            value={stepsPerBar}
            on:change={handleStepsChange}
            class="stat-input"
          />
        </div>
        <div>
          <span class="label">Loop length</span>
          <span class="value">{loopSecondsDisplay}s</span>
        </div>
      </div>
    </div>
  </aside>
  <section class="workspace">
    <div class="workspace-header">
      <div class="session-info">
        <span class="eyebrow">Project</span>
        <input
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
        <div class="status-controls">
          <span class={`pill ${isPlaying ? 'playing' : ''}`}>
            {isPlaying ? 'Playing' : 'Stopped'}
          </span>
          <FollowToggle active={isFollowing} on:toggle={handleFollowToggle} />
        </div>
        <div class="history-buttons">
          <button
            type="button"
            class="icon-btn"
            on:click={handleUndo}
            disabled={!canUndo}
            title="Undo"
            aria-label="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            class="icon-btn"
            on:click={handleRedo}
            disabled={!canRedo}
            title="Redo"
            aria-label="Redo"
          >
            ↷
          </button>
        </div>
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
    <div class="track-controls-wrapper">
      <TrackControls
        track={activeTrack}
        trackIndex={projectState?.selectedTrack ?? 0}
        on:update={handleTrackUpdate}
      />
    </div>
    <div class="grid-shell">
      <div class="grid-toolbar">
        <div class="note-length-group">
          <ArrowSelector
            label="Note length"
            options={NOTE_LENGTH_OPTIONS}
            value={selectedNoteLengthValue}
            on:change={handleNoteLengthChange}
          />
        </div>
      </div>
      <div class="grid-backdrop">
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
          on:notechange={handleNoteChange}
        />
      </div>
    </div>
    <div class="track-effects-wrapper">
      <TrackEffectsPanel
        track={activeTrack}
        trackIndex={projectState?.selectedTrack ?? 0}
        on:update={handleTrackUpdate}
      />
    </div>
    <Footer
      projects={projects}
      currentId={currentProjectId}
      on:selectproject={handleProjectSelect}
      on:newproject={handleNewProject}
      on:duplicateproject={handleDuplicateProject}
      on:deleteproject={handleDeleteProject}
    />
  </section>
</main>

<style>
  :global(:root) {
    --color-accent: #78d2b9;
    --color-accent-rgb: 120, 210, 185;
    --color-accent-bright: #9BFFE0;
    --color-accent-bright-rgb: 155, 255, 224;
    --color-note-active: #78d2ff;
    --color-note-active-rgb: 120, 210, 255;
    --color-note-inactive: #3c4450;
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
    background: linear-gradient(180deg, rgba(34, 38, 50, 0.95) 0%, rgba(26, 29, 40, 0.98) 100%);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: center;
    padding: 28px 24px;
  }

  .rail-inner {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .logo-icon {
    width: 78px;
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
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-size: 1.6rem;
    line-height: 1.05;
  }

  .brand-tag {
    margin: 0;
    font-size: 0.64rem;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.1;
    white-space: nowrap;
  }

  .rail-stats {
    margin-top: auto;
    display: grid;
    gap: 16px;
    padding: 18px;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.12), rgba(22, 26, 36, 0.6));
    border: 1px solid rgba(var(--color-accent-rgb), 0.24);
  }

  .rail-stats .label {
    display: block;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 6px;
    font-weight: 600;
  }

  .rail-stats .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
  }

  .stat-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .stat-input {
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 8px 12px;
    font-size: 1rem;
    font-weight: 600;
    appearance: textfield;
    width: 100%;
    display: block;
  }

  .stat-input::-webkit-outer-spin-button,
  .stat-input::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .stat-input:focus {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.5);
    outline-offset: 2px;
  }

  .workspace {
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(20px);
    background: rgba(26, 29, 40, 0.65);
    min-width: 0;
    overflow-x: auto;
    min-height: 100vh;
  }

  .workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px 8px;
    gap: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  .session-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.7rem;
    font-weight: 700;
    color: rgba(var(--color-accent-rgb), 0.85);
  }

  .project-name-input {
    margin: 0;
    padding: 8px 12px;
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: 0.01em;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    transition: all 0.15s ease;
    width: 100%;
    max-width: 420px;
    cursor: text;
  }

  .project-name-input:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(var(--color-accent-rgb), 0.2);
    cursor: text;
  }

  .project-name-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(var(--color-accent-rgb), 0.4);
    box-shadow: 0 0 0 1px rgba(var(--color-accent-rgb), 0.2);
  }

  .header-actions {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    flex-shrink: 0;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .history-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .utility-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.16);
    color: rgba(var(--color-accent-rgb), 0.9);
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .icon-btn:hover:not(:disabled) {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.26);
    color: #fff;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-accent-rgb), 0.2);
  }

  .icon-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: 2px;
  }

  .icon-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.05);
  }

  .project-meta {
    color: rgba(255, 255, 255, 0.7);
  }

  .session-meta {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.95rem;
  }

  .status-controls {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    align-items: center;
  }

  .status-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .pill {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.05);
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.75);
  }

  .pill.playing,
  .pill.following {
    border-color: rgba(var(--color-accent-rgb), 0.6);
    background: rgba(var(--color-accent-rgb), 0.12);
    color: #fff;
  }

  .grid-shell {
    flex: 1;
    padding: 0 24px 18px;
    box-sizing: border-box;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .track-controls-wrapper {
    padding: 0 24px;
    margin-bottom: 20px;
  }

  .track-effects-wrapper {
    padding: 0 24px;
    margin-bottom: 20px;
  }

  .volume-card {
    margin-top: 10px;
    padding: 16px 14px 18px;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.12), rgba(22, 26, 36, 0.6));
    border: 1px solid rgba(var(--color-accent-rgb), 0.24);
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    text-align: center;
  }

  .volume-heading {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.85rem;
    letter-spacing: 0.04em;
    text-transform: none;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 700;
  }

  .volume-heading .track-name {
    color: inherit;
  }

  .volume-card :global(.volume-knob) {
    transform: scale(0.85);
    transform-origin: center top;
  }

  .grid-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin: 0 0 18px;
    padding: 0;
    border-radius: 0;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.95rem;
  }

  .note-length-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 240px;
    align-self: flex-start;
  }

  .grid-backdrop {
    position: relative;
    border-radius: 20px;
    padding: 16px;
    box-sizing: border-box;
    background: linear-gradient(135deg, rgba(22, 26, 36, 0.92), rgba(12, 14, 20, 0.88));
    border: 2px solid rgba(var(--color-accent-rgb), 0.3);
    box-shadow: 0 20px 60px rgba(12, 14, 20, 0.4);
    margin-bottom: 20px;
    min-height: 300px;
    flex: 1;
  }

  .grid-backdrop :global(.grid-wrapper) {
    height: auto;
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
    
    .rail-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 720px) {
    .workspace-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px 20px 12px;
      gap: 16px;
    }

    .status-controls {
      width: 100%;
    }

    .grid-shell {
      padding: 0 16px 16px;
    }

    .grid-toolbar {
      padding: 10px 14px;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .note-length-group {
      width: 100%;
    }

    .grid-backdrop {
      padding: 12px;
      border-radius: 18px;
    }

    .app-rail {
      padding: 18px;
    }

    .trackbar {
      padding: 20px 20px 12px;
    }
    
    .project-name-input {
      font-size: 1.4rem;
      max-width: 100%;
    }
    
    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
    
    .history-buttons {
      flex-shrink: 0;
    }
  }

  @media (max-width: 560px) {
    .app {
      padding: 12px;
    }

    .grid-backdrop {
      border-radius: 14px;
    }
    
    .app-rail {
      padding: 12px;
    }
    
    .rail-stats {
      grid-template-columns: 1fr;
    }
    
    .brand-logo {
      max-width: 160px;
    }
    
    .icon-btn {
      width: 32px;
      height: 32px;
      font-size: 1.2rem;
    }
    
    .pill {
      padding: 6px 10px;
      font-size: 0.7rem;
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

    .play-button,
    .control-button,
    .icon-btn,
    .follow,
    .toggle-btn,
    .share-btn {
      transform: none !important;
    }
  }
  
  /* Touch improvements */
  @media (hover: none) and (pointer: coarse) {
    .icon-btn,
    button,
    select {
      min-height: 44px;
      min-width: 44px;
    }
    
    .play-button {
      width: 72px;
      height: 72px;
    }
    
    .follow {
      padding: 12px 16px;
    }
  }
</style>
