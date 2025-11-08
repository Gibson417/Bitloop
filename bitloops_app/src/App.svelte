<script>
  import Grid from './components/Grid.svelte';
  import TrackBar from './components/TrackBar.svelte';
  import Transport from './components/Transport.svelte';
  import Footer from './components/Footer.svelte';
  import { project } from './store/projectStore.js';

  // Temporary local state for demonstration
  let selectedTrack = 0;
  let tracks = [
    { name: 'Track 1', color: '#78D2B9' },
    { name: 'Track 2', color: '#A88EF6' }
  ];
  let playing = false;
  let follow = false;
  let activeNotes = Array(8).fill().map(() => Array(16).fill(false));

  const handleToggle = (event) => {
    const { row, col } = event.detail;
    activeNotes[row][col] = !activeNotes[row][col];
  };
  const handleSelect = (event) => {
    selectedTrack = event.detail.index;
  };
  const handleTogglePlay = () => {
    playing = !playing;
  };
  const handleToggleFollow = () => {
    follow = !follow;
  };
</script>

<main class="min-h-screen bg-bg text-white flex flex-col">
  <div class="flex-1 flex">
    <!-- Transport rail -->
    <Transport {playing} {follow}
      on:toggleplay={handleTogglePlay}
      on:togglefollow={handleToggleFollow}
    />
    <div class="flex flex-col flex-1">
      <TrackBar {tracks} selected={selectedTrack} on:select={handleSelect} />
      <div class="flex-1 p-4">
        <Grid rows={8} columns={16} {activeNotes} on:toggle={handleToggle} />
      </div>
      <Footer bars={4} stepsPerBar={16} bpm={120} />
    </div>
  </div>
</main>

<style>
  main { background-color: var(--bg); }
</style>