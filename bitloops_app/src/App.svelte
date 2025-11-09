<script>
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Grid from './components/Grid.svelte';
  import TrackBar from './components/TrackBar.svelte';
  import Transport from './components/Transport.svelte';
  import Footer from './components/Footer.svelte';
  import { Scheduler } from './lib/scheduler.js';
  import { project, totalSteps, loopDuration, maxBars } from './store/projectStore.js';
  import { scales } from './lib/scales.js';
  import { colors } from './lib/colorTokens.js';

  let $project;
  let $totalSteps;
  let $loopDuration;
  let $maxBars;

  const unsubscribers = [
    project.subscribe((value) => ($project = value)),
    totalSteps.subscribe((value) => ($totalSteps = value)),
    loopDuration.subscribe((value) => ($loopDuration = value)),
    maxBars.subscribe((value) => ($maxBars = value))
  ];

  let audioContext;
  let scheduler;
  let masterGain;
  let animationId;

  const ensureAudio = async () => {
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
      scheduler = new Scheduler(audioContext, $project.bpm, $project.stepsPerBar / 4);
      scheduler.onStep = handleStep;
    } else {
      scheduler.setTempo($project.bpm);
      scheduler.setStepsPerBeat($project.stepsPerBar / 4);
      scheduler.onStep = handleStep;
    }
    return true;
  };

  const midiToFrequency = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  const getMidiForCell = (track, row) => {
    const scalePattern = scales[track.scale] ?? scales.major;
    const degrees = scalePattern.length;
    const rows = $project.rows;
    const indexFromBottom = rows - 1 - row;
    const octaveOffset = Math.floor(indexFromBottom / degrees);
    const degree = scalePattern[indexFromBottom % degrees];
    const octave = track.octave + octaveOffset;
    const midi = 12 * (octave + 1) + degree; // C0 = MIDI 12
    return Math.min(Math.max(midi, 21), 108);
  };

  const playTone = (track, frequency, time, duration) => {
    if (!audioContext || !masterGain || !Number.isFinite(frequency)) return;
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, time);
    const attack = 0.01;
    const release = Math.min(0.3, duration * 0.8);
    const sustainTime = time + Math.max(attack, duration * 0.4);
    const releaseStart = time + duration - release;
    gainNode.gain.linearRampToValueAtTime(track.volume, time + attack);
    gainNode.gain.setValueAtTime(track.volume, sustainTime);
    gainNode.gain.linearRampToValueAtTime(0.0001, releaseStart + release);
    gainNode.connect(masterGain);

    if (track.waveform === 'noise') {
      const buffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * (duration + 0.1)), audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(gainNode);
      source.start(time);
      source.stop(releaseStart + release + 0.05);
    } else {
      const osc = audioContext.createOscillator();
      osc.type = track.waveform;
      osc.frequency.setValueAtTime(frequency, time);
      osc.connect(gainNode);
      osc.start(time);
      osc.stop(releaseStart + release + 0.05);
    }
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
    if (!$project?.playing || !audioContext) return;
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
    scheduler.setTempo($project.bpm);
    scheduler.setStepsPerBeat($project.stepsPerBar / 4);
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
    if ($project.playing) {
      stopPlayback();
    } else {
      await startPlayback();
    }
  };

  const handleFollowToggle = (event) => {
    const nextValue = event.detail?.value ?? !$project.follow;
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
    project.toggleNote($project.selectedTrack, row, step, value);
  };

  const handleTrackSelect = (event) => {
    project.selectTrack(event.detail.index);
  };

  const handleTrackUpdate = (event) => {
    const { index, key, value } = event.detail;
    project.setTrackSetting(index, key, value);
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
      }
    } catch (error) {
      console.error('Failed to import project', error);
      // eslint-disable-next-line no-alert
      alert('Unable to import project file. Please ensure it is a valid BitLoops JSON export.');
    }
  };

  onMount(() => {
    return () => {
      stopPlayback();
      if (audioContext) {
        audioContext.close?.();
      }
    };
  });

  onDestroy(() => {
    unsubscribers.forEach((unsubscribe) => unsubscribe?.());
  });

  $: activeTrack = $project.tracks?.[$project.selectedTrack];
  $: columns = $totalSteps;
  $: rows = $project.rows;
  $: gridNotes = activeTrack?.notes ?? [];
  $: trackColor = activeTrack?.color ?? colors.accent;
</script>

<main class="app">
  <aside class="app-rail">
    <div class="rail-inner">
      <div class="brand">
        <span class="brand-mark">BitLoops</span>
        <p class="brand-tag">Dot grid sequencer</p>
      </div>
      <Transport
        playing={$project.playing}
        follow={$project.follow}
        bpm={$project.bpm}
        on:toggleplay={handleTogglePlay}
        on:togglefollow={handleFollowToggle}
        on:changebpm={handleBpmChange}
      />
      <div class="rail-stats">
        <div>
          <span class="label">Loop length</span>
          <span class="value">{$loopDuration.toFixed(1)}s</span>
        </div>
        <div>
          <span class="label">Bars</span>
          <span class="value">{$project.bars}</span>
        </div>
        <div>
          <span class="label">Steps / bar</span>
          <span class="value">{$project.stepsPerBar}</span>
        </div>
      </div>
    </div>
  </aside>
  <section class="workspace">
    <div class="workspace-header">
      <div class="session-info">
        <span class="eyebrow">Active track</span>
        <h1>{activeTrack?.name ?? 'Untitled track'}</h1>
        <p class="session-meta">
          {activeTrack
            ? `${activeTrack.scale} scale • octave ${activeTrack.octave} • ${Math.round(activeTrack.volume * 100)}% vol`
            : 'Select a track to edit settings'}
        </p>
      </div>
      <div class="status-pills">
        <span class={`pill ${$project.playing ? 'playing' : ''}`}>
          {$project.playing ? 'Playing' : 'Stopped'}
        </span>
        <span class={`pill ${$project.follow ? 'following' : ''}`}>
          {$project.follow ? 'Follow on' : 'Follow off'}
        </span>
      </div>
    </div>
    <TrackBar
      tracks={$project.tracks}
      selected={$project.selectedTrack}
      on:select={handleTrackSelect}
      on:update={handleTrackUpdate}
    />
    <div class="grid-shell">
      <div class="grid-backdrop">
        <Grid
          {rows}
          {columns}
          notes={gridNotes}
          playheadStep={$project.playheadStep}
          playheadProgress={$project.playheadProgress}
          trackColor={trackColor}
          follow={$project.follow}
          isPlaying={$project.playing}
          stepsPerBar={$project.stepsPerBar}
          on:notechange={handleNoteChange}
        />
      </div>
    </div>
    <Footer
      bars={$project.bars}
      stepsPerBar={$project.stepsPerBar}
      bpm={$project.bpm}
      loopSeconds={$loopDuration}
      maxBars={$maxBars}
      on:changebars={handleBarsChange}
      on:changesteps={handleStepsChange}
      on:export={handleExport}
      on:import={handleImport}
    />
  </section>
</main>

<style>
  :global(:root) {
    --accent: #78d2b9;
    --note-active: #78d2ff;
    --note-inactive: #3c4450;
    --bg: #0e1016;
    --panel: #161a24;
    --playhead: rgba(120, 210, 185, 0.85);
    --grid-line: rgba(255, 255, 255, 0.08);
  }

  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: radial-gradient(circle at top left, rgba(120, 210, 185, 0.22), transparent 45%),
      radial-gradient(circle at bottom right, rgba(120, 210, 255, 0.18), transparent 40%), var(--bg);
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

  .brand-mark {
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 1rem;
  }

  .brand-tag {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .rail-stats {
    margin-top: auto;
    display: grid;
    gap: 16px;
    padding: 18px;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(120, 210, 185, 0.12), rgba(22, 26, 36, 0.6));
    border: 1px solid rgba(120, 210, 185, 0.24);
  }

  .rail-stats .label {
    display: block;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }

  .rail-stats .value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
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

  .session-info h1 {
    margin: 0;
    font-size: 1.8rem;
    letter-spacing: 0.04em;
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
    border-color: rgba(120, 210, 185, 0.5);
    color: #fff;
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
    border: 1px solid rgba(120, 210, 255, 0.08);
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
</style>
