<script>
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Grid from './components/Grid.svelte';
  import TrackSelector from './components/TrackSelector.svelte';
  import TrackControls from './components/TrackControls.svelte';
  import Transport from './components/Transport.svelte';
  import Footer from './components/Footer.svelte';
  import { Scheduler } from './lib/scheduler.js';
  import { project, totalSteps, loopDuration, maxBars, TRACK_LIMIT, historyStatus } from './store/projectStore.js';
  import { scales } from './lib/scales.js';
  import { colors } from './lib/colorTokens.js';
  import { library } from './store/libraryStore.js';
  import { renderProjectToWav } from './lib/offlineRenderer.js';
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
    const scalePattern = scales[track.scale] ?? scales.major;
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
    voiceGain.gain.setValueAtTime(0, time);
    const attack = 0.01;
    const release = Math.min(0.3, duration * 0.8);
    const sustainTime = time + Math.max(attack, duration * 0.4);
    const releaseStart = time + duration - release;
    voiceGain.gain.linearRampToValueAtTime(track.volume, time + attack);
    voiceGain.gain.setValueAtTime(track.volume, sustainTime);
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
        if (track.notes?.[row]?.[stepIndex]) {
          const midi = getMidiForCell(track, row);
          const frequency = midiToFrequency(midi);
          playTone(track, frequency, time, stepDuration * 0.95);
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

  const handleNoteChange = (event) => {
    const { row, step, value } = event.detail;
    project.toggleNote(projectState?.selectedTrack ?? 0, row, step, value);
  };

  const handleTrackSelect = (event) => {
    project.selectTrack(event.detail.index);
  };

  const handleTrackUpdate = (event) => {
    const { index, key, value } = event.detail;
    project.setTrackSetting(index, key, value);
  };

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

  const handleExport = () => {
    if (typeof window === 'undefined') return;
    const data = project.serialize();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'bitloops-project.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const json = event.detail?.json;
    if (!json) return;
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
    } catch (error) {
      console.error('Failed to import project', error);
      // eslint-disable-next-line no-alert
      alert('Unable to import project file. Please ensure it is a valid BitLoops JSON export.');
    }
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
    const boot = async () => {
      await library.initialize();
      if (!disposed) {
        await attemptLoadSharedSnapshot();
      }
    };
    boot();
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
  $: columns = totalStepsValue ?? 0;
  $: rows = projectState?.rows ?? 0;
  $: gridNotes = activeTrack?.notes ?? [];
  $: trackColor = activeTrack?.color ?? colors.accent;
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
</script>

<main class="app">
  <aside class="app-rail">
    <div class="rail-inner">
      <div class="brand">
        <div class="brand-logo">
          <svg viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
            <!-- Stylized "B" made of dots -->
            <circle cx="8" cy="8" r="3" fill="currentColor" opacity="0.9"/>
            <circle cx="8" cy="16" r="3" fill="currentColor" opacity="0.9"/>
            <circle cx="8" cy="24" r="3" fill="currentColor" opacity="0.9"/>
            <circle cx="8" cy="32" r="3" fill="currentColor" opacity="0.9"/>
            <circle cx="16" cy="8" r="3" fill="currentColor" opacity="0.9"/>
            <circle cx="16" cy="20" r="3" fill="currentColor" opacity="0.9"/>
            <circle cx="16" cy="32" r="3" fill="currentColor" opacity="0.9"/>
            <circle cx="24" cy="10" r="3" fill="currentColor" opacity="0.8"/>
            <circle cx="24" cy="18" r="3" fill="currentColor" opacity="0.8"/>
            <circle cx="24" cy="30" r="3" fill="currentColor" opacity="0.8"/>
            
            <!-- Text -->
            <text x="34" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" letter-spacing="0.08em" fill="currentColor">BITLOOPS</text>
          </svg>
        </div>
        <p class="brand-tag">Dot grid sequencer</p>
      </div>
      <Transport
        playing={isPlaying}
        follow={isFollowing}
        on:toggleplay={handleTogglePlay}
        on:togglefollow={handleFollowToggle}
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
        />
      </div>
      <div class="header-actions">
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
        <div class="status-pills">
          <span class={`pill ${isPlaying ? 'playing' : ''}`}>
            {isPlaying ? 'Playing' : 'Stopped'}
          </span>
          <span class={`pill ${isFollowing ? 'following' : ''}`}>
            {isFollowing ? 'Follow on' : 'Follow off'}
          </span>
          <span class={`pill ${isSaving ? 'saving' : ''}`}>
            {isSaving ? 'Saving…' : 'Saved'}
          </span>
        </div>
      </div>
    </div>
    <TrackControls
      track={activeTrack}
      trackIndex={projectState?.selectedTrack ?? 0}
      on:update={handleTrackUpdate}
    />
    <div class="grid-shell">
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
          on:notechange={handleNoteChange}
        />
      </div>
    </div>
    <Footer
      projects={projects}
      currentId={currentProjectId}
      shareStatus={shareStatus}
      shareMessage={shareMessage}
      shareLink={shareLink}
      on:export={handleExport}
      on:import={handleImport}
      on:selectproject={handleProjectSelect}
      on:newproject={handleNewProject}
      on:duplicateproject={handleDuplicateProject}
      on:deleteproject={handleDeleteProject}
      on:render={handleRenderWav}
      on:share={handleShare}
    />
  </section>
</main>

<style>
  :global(:root) {
    --color-accent: #78d2b9;
    --color-accent-rgb: 120, 210, 185;
    --color-note-active: #78d2ff;
    --color-note-active-rgb: 120, 210, 255;
    --color-note-inactive: #3c4450;
    --color-background: #0e1016;
    --color-panel: #161a24;
    --color-playhead: rgba(var(--color-accent-rgb), 0.85);
    --color-grid-line: rgba(255, 255, 255, 0.08);
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

  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: radial-gradient(circle at top left, rgba(var(--color-accent-rgb), 0.22), transparent 45%),
      radial-gradient(circle at bottom right, rgba(var(--color-note-active-rgb), 0.18), transparent 40%),
      var(--color-background);
    background-attachment: fixed;
    background-size: 100% 100%;
    color: #fff;
    min-height: 100vh;
  }

  .app {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 280px 1fr;
    backdrop-filter: blur(0px);
    color: #fff;
  }

  .app-rail {
    background: linear-gradient(180deg, rgba(22, 26, 36, 0.95) 0%, rgba(14, 16, 22, 0.98) 100%);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: center;
    padding: 32px 28px;
  }

  .rail-inner {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .brand {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
  }

  .logo-svg {
    width: 100%;
    height: auto;
    max-width: 200px;
    color: var(--color-accent);
  }

  .brand-mark {
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 2.4rem;
  }

  .brand-tag {
    margin: 0;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
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
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
    margin-bottom: 6px;
  }

  .rail-stats .value {
    font-size: 1.1rem;
    font-weight: 600;
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
    background: rgba(14, 16, 22, 0.72);
  }

  .workspace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28px 32px 16px;
    gap: 24px;
  }

  .session-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.48);
  }

  .project-name-input {
    margin: 0;
    padding: 4px 8px;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: #fff;
    font-family: inherit;
    transition: all 0.2s ease;
    width: 100%;
    max-width: 500px;
  }

  .project-name-input:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }

  .project-name-input:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(var(--color-accent-rgb), 0.7);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .history-buttons {
    display: flex;
    gap: 8px;
  }

  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.75);
    font-size: 1.4rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .icon-btn:hover:not(:disabled) {
    border-color: rgba(var(--color-accent-rgb), 0.4);
    background: rgba(var(--color-accent-rgb), 0.1);
    color: #fff;
  }

  .icon-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .project-meta {
    color: rgba(255, 255, 255, 0.7);
  }

  .session-meta {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.95rem;
  }

  .status-pills {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .pill {
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    font-size: 0.8rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
  }

  .pill.playing,
  .pill.following {
    border-color: rgba(var(--color-accent-rgb), 0.5);
    color: #fff;
  }

  .pill.saving {
    border-color: rgba(var(--color-accent-rgb), 0.35);
    color: rgba(255, 255, 255, 0.8);
  }

  .grid-shell {
    flex: 1;
    padding: 0 32px 32px;
  }

  .grid-backdrop {
    position: relative;
    height: 100%;
    border-radius: 24px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(22, 26, 36, 0.92), rgba(12, 14, 20, 0.88));
    border: 1px solid rgba(var(--color-note-active-rgb), 0.08);
    box-shadow: 0 30px 80px rgba(12, 14, 20, 0.6);
  }

  .grid-backdrop :global(.grid-wrapper) {
    height: 100%;
  }

  @media (max-width: 960px) {
    .app {
      grid-template-columns: 1fr;
    }

    .app-rail {
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
  }

  @media (max-width: 720px) {
    .workspace-header {
      flex-direction: column;
      align-items: flex-start;
      padding: 20px 20px 12px;
      gap: 16px;
    }

    .status-pills {
      width: 100%;
    }

    .grid-shell {
      padding: 0 16px 16px;
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
  }

  @media (max-width: 560px) {
    .app {
      padding: 12px;
    }

    .grid-backdrop {
      border-radius: 14px;
    }
  }
</style>
