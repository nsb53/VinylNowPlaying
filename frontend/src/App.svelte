<script lang="ts">
  import { onMount } from 'svelte';
  import { app, start } from './lib/store.svelte';
  import MidCentury from './themes/MidCentury.svelte';
  import Sleeve from './themes/Sleeve.svelte';

  // Every theme is drawn on a fixed 1920x1080 stage and scaled to the screen,
  // so the layout is identical on every 16:9 TV.
  const PAGE_BG = { mcm: '#EFE3C8', 'mcm-night': '#1C1917', sleeve: '#0E0E10' };
  let scale = $state(1);

  function resize() {
    scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  }

  onMount(() => {
    resize();
    return start();
  });

  $effect(() => {
    document.body.style.background = PAGE_BG[app.theme];
  });
</script>

<svelte:window onresize={resize} />

<div class="stage" style="transform: translate(-50%, -50%) scale({scale})">
  {#if app.theme === 'sleeve'}
    <Sleeve />
  {:else}
    <MidCentury night={app.theme === 'mcm-night'} />
  {/if}
</div>

<style>
  .stage {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    transform-origin: center;
  }
</style>
