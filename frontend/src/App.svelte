<script lang="ts">
  import { onMount } from 'svelte';
  import { app, start } from './lib/store.svelte';
  import MidCentury from './themes/MidCentury.svelte';
  import Sleeve from './themes/Sleeve.svelte';

  // Every theme is drawn on a fixed 1920x1080 stage and scaled to the screen,
  // so the layout is identical on every 16:9 TV.
  const PAGE_BG = { mcm: '#EFE3C8', 'mcm-night': '#1C1917', sleeve: '#0E0E10' };
  let frame: HTMLDivElement;
  let scaleX = $state(1);
  let scaleY = $state(1);
  let left = $state(0);
  let top = $state(0);
  let reported = '';

  // Measure the box the browser actually lays the page out in. TV browsers
  // can report a window size that does not match it, which crops the stage.
  function resize() {
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    if (!width || !height) return;
    let x = width / 1920;
    let y = height / 1080;
    // A screen within 3% of 16:9 (a TV browser that keeps a few pixels for
    // itself) is filled edge to edge; the stretch is too small to see. Any
    // other shape keeps the proportions and centres the stage.
    if (Math.abs(x / y - 1) > 0.03) x = y = Math.min(x, y);
    scaleX = x;
    scaleY = y;
    left = (width - 1920 * x) / 2;
    top = (height - 1080 * y) / 2;
    report(width, height);
  }

  // Tell the server what this screen measures, so a cropped TV can be diagnosed from its log.
  function report(width: number, height: number) {
    // Chrome's documented test for its automatic dark theme: a light-scheme
    // canvas colour that is not white means the browser is recolouring the page.
    const probe = document.createElement('div');
    probe.style.cssText = 'display: none; background-color: canvas; color-scheme: light';
    document.body.appendChild(probe);
    const autoDark = getComputedStyle(probe).backgroundColor !== 'rgb(255, 255, 255)';
    document.body.removeChild(probe);
    const info = {
      autoDark,
      prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      layout: `${width}x${height}`,
      window: `${window.innerWidth}x${window.innerHeight}`,
      screen: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent,
    };
    const body = JSON.stringify(info);
    if (body === reported) return;
    reported = body;
    fetch('/api/screen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  }

  onMount(() => {
    resize();
    // Some TV browsers settle their size late and never fire a resize event.
    const timer = setInterval(resize, 2000);
    const stop = start();
    return () => {
      clearInterval(timer);
      stop();
    };
  });

  $effect(() => {
    document.body.style.background = PAGE_BG[app.theme];
  });
</script>

<svelte:window onresize={resize} />

<div class="frame" bind:this={frame}>
  <div class="stage" style="left: {left}px; top: {top}px; transform: scale({scaleX}, {scaleY})">
    {#if app.theme === 'sleeve'}
      <Sleeve />
    {:else}
      <MidCentury night={app.theme === 'mcm-night'} />
    {/if}
  </div>
</div>

<style>
  .frame {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .stage {
    position: absolute;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    transform-origin: 0 0;
  }
</style>
