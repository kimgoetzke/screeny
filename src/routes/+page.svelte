<script lang="ts">
  import Toolbar from "$lib/components/Toolbar.svelte";
  import FrameViewer from "$lib/components/FrameViewer.svelte";
  import Timeline from "$lib/components/Timeline.svelte";
</script>

<div class="app" data-testid="app">
  <Toolbar />
  <FrameViewer />
  <Timeline />
</div>

<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(html, body) {
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #1e1e1e;
    color: #eee;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
</style>
