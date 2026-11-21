<script lang="ts">
  // "Jazz Brunch · Skyline": a mustard Sunday morning, a pale sun, and a
  // charcoal city skyline along the bottom holding the meters, lyrics and facts.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  const HEIGHTS = [70, 110, 60, 150, 90, 200, 120, 80, 170, 100, 60, 130, 240, 90, 150, 70, 110, 190, 80, 130, 60, 160, 100, 220, 120, 70, 140, 90, 180, 60];
  const WIDTHS = [60, 50, 80, 55, 70, 45, 90, 60, 50, 75, 65, 55, 40, 85, 60, 70, 50, 60, 90, 55, 70, 50, 80, 45, 65, 75, 55, 70, 50, 80];
  const buildings: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0, x = 0; x < 1920; i += 1) {
    const h = HEIGHTS[i % HEIGHTS.length];
    const w = WIDTHS[i % WIDTHS.length];
    buildings.push({ x, y: 260 - h, w: w + 2, h });
    // Tall towers get an antenna.
    if (h >= 190) buildings.push({ x: x + Math.floor(w / 2) - 3, y: 260 - h - 46, w: 6, h: 46 });
    x += w;
  }
</script>

<div class="skyline">
  <div class="sun"></div>

  <div class="top">
    <div class="cover"><Cover /></div>
    <div class="header">
      <div class="label">SUNDAY JAZZ BRUNCH · {head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 112, min: 64, lines: 2, lineHeight: 0.98, text: head.title }}>
        {head.title}
      </h1>
      <div class="artist one-line">{head.artist}</div>
      {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
      {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
    </div>
  </div>

  <svg class="city" viewBox="0 0 1920 260" aria-hidden="true">
    {#each buildings as b}
      <rect x={b.x} y={b.y} width={b.w} height={b.h} />
    {/each}
  </svg>
  <div class="band"></div>

  <div class="bottom">
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>

    <div class="lyrics">
      {#if lyrics.lines.length}
        {#each lyrics.lines as line}
          <div class={line.active ? 'line active clamp' : 'line one-line'}>{line.text}</div>
        {/each}
      {:else}
        <div class="line">{lyrics.note}</div>
      {/if}
    </div>

    {#if fact}
      <div class="trivia">
        <div class="heading">
          <div>DID YOU KNOW?</div>
          <div>{fact.counter}</div>
        </div>
        {#key fact.index}
          <div class="fact clamp" style="--lines: 4">{fact.text}</div>
        {/key}
      </div>
    {:else}
      <div></div>
    {/if}
  </div>
</div>

<style>
  .skyline {
    --mustard: #e9b43c;
    --char: #2b2a28;
    --record: #1a1918;
    --record-groove: #3d3b37;
    --record-label: #e9b43c;
    --vu-scale: #2b2a28;
    --vu-red: #c2481f;
    --vu-needle: #2b2a28;
    --vu-font: 'Poppins', sans-serif;

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--mustard);
    color: var(--char);
    font-family: 'Poppins', sans-serif;
  }

  .sun {
    position: absolute;
    left: 1420px;
    top: 60px;
    width: 380px;
    height: 380px;
    border-radius: 50%;
    background: #f6d480;
  }

  .top {
    position: absolute;
    left: 72px;
    top: 64px;
    right: 72px;
    display: grid;
    grid-template-columns: 500px minmax(0, 1fr);
    grid-gap: 72px;
  }
  .cover {
    width: 500px;
    height: 500px;
    border: 10px solid var(--char);
    background: #c99a2e;
  }
  .header {
    position: relative;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .label {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 8px;
  }
  h1 {
    margin-top: 12px;
    padding-bottom: 6px;
    font-family: 'Archivo Black', sans-serif;
    font-size: 112px;
    line-height: 0.98;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: -1px;
  }
  .artist {
    margin-top: 8px;
    font-size: 46px;
    font-weight: 600;
  }
  .credit {
    font-size: 23px;
    line-height: 1.45;
    color: #5a4512;
  }
  .artist + .credit {
    margin-top: 8px;
  }

  .city {
    position: absolute;
    left: 0;
    top: 560px;
    width: 1920px;
    height: 260px;
    fill: var(--char);
  }
  .band {
    position: absolute;
    left: 0;
    top: 818px;
    width: 1920px;
    height: 262px;
    background: var(--char);
  }

  .bottom {
    position: absolute;
    left: 72px;
    right: 72px;
    top: 836px;
    height: 210px;
    display: grid;
    grid-template-columns: 440px minmax(0, 1fr) 560px;
    grid-gap: 56px;
    align-items: center;
  }
  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 20px;
  }
  .face {
    background: #f3e3b5;
    border-radius: 8px;
    overflow: hidden;
  }

  .lyrics {
    min-width: 0;
    color: var(--mustard);
  }
  .line {
    min-height: 31px;
    margin: 4px 0;
    font-size: 24px;
    line-height: 1.3;
    opacity: 0.7;
  }
  .line.active {
    --lines: 2;
    font-size: 38px;
    line-height: 1.15;
    font-weight: 600;
    opacity: 1;
  }

  .trivia {
    padding: 20px 26px;
    background: var(--mustard);
    color: var(--char);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 5px;
  }
  .fact {
    margin-top: 6px;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.3;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
