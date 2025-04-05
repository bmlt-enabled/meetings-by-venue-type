<script lang="ts">
  import MeetingsByVenueType from './components/MeetingsByVenueType.svelte';
</script>

<main>
  <MeetingsByVenueType />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #000000;
  }

  main {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #000000;
    padding: 20px;
  }
</style>
