<script>
  import Grid from '$components/Grid.svelte';
  import TrackBar from '$components/TrackBar.svelte';
  import Transport from '$components/Transport.svelte';
  import Footer from '$components/Footer.svelte';
  import { project } from '$store/projectStore.js';

  const handleToggle = ({ detail }) => {
    project.toggleNote(detail.row, detail.col);
  };

  const handleSelect = ({ detail }) => {
    project.selectTrack(detail.index);
  };

  const handleTogglePlay = () => {
    project.togglePlay();
  };

  const handleToggleFollow = () => {
    project.toggleFollow();
  };
</script>

<main class="min-h-screen bg-bg text-white flex flex-col">
  <div class="flex-1 flex flex-col md:flex-row">
    <Transport
      class="md:w-48"
      playing={$project.playing}
      follow={$project.follow}
      on:toggleplay={handleTogglePlay}
      on:togglefollow={handleToggleFollow}
    />
    <div class="flex flex-col flex-1">
      <TrackBar tracks={$project.tracks} selected={$project.selectedTrackIndex} on:select={handleSelect} />
      <div class="flex-1 p-4 overflow-auto">
        <Grid
          rows={$project.rows}
          columns={$project.columns}
          activeNotes={$project.activeNotes}
          on:toggle={handleToggle}
        />
      </div>
      <Footer bars={$project.bars} stepsPerBar={$project.stepsPerBar} bpm={$project.bpm} />
    </div>
  </div>
</main>

<style>
  :global(body) {
    background-color: var(--bg);
  }
</style>
