<script lang="ts">
  // "Tie-Dye" (1960s): a rainbow tie-dye spiral, peace signs and daisies,
  // bubbly pink lettering and a cream invitation-style card.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  const peace = [
    { x: 130, y: 110, r: 50 },
    { x: 1800, y: 140, r: 58 },
    { x: 1790, y: 960, r: 46 },
    { x: 990, y: 70, r: 34 },
    { x: 80, y: 980, r: 40 },
  ];
  const daisies = [
    { x: 300, y: 70, r: 52, petal: '#ffffff' },
    { x: 1600, y: 70, r: 40, petal: '#ff8a1c' },
    { x: 1880, y: 560, r: 56, petal: '#ffffff' },
    { x: 40, y: 560, r: 48, petal: '#ff4fc8' },
    { x: 1180, y: 1040, r: 46, petal: '#ffffff' },
    { x: 640, y: 1030, r: 38, petal: '#b04dff' },
  ];
  const ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
  const petal = (d: { x: number; y: number; r: number }, a: number) => ({
    cx: d.x + d.r * 0.62 * Math.cos((a * Math.PI) / 180),
    cy: d.y + d.r * 0.62 * Math.sin((a * Math.PI) / 180),
  });
</script>

<div class="dye">
  <svg class="deco" viewBox="0 0 1920 1080" aria-hidden="true">
    {#each peace as p}
      <g class="peace" style="stroke-width: {p.r / 5.5}px">
        <circle cx={p.x} cy={p.y} r={p.r} />
        <line x1={p.x} y1={p.y - p.r} x2={p.x} y2={p.y + p.r} />
        <line x1={p.x} y1={p.y} x2={p.x - p.r * 0.707} y2={p.y + p.r * 0.707} />
        <line x1={p.x} y1={p.y} x2={p.x + p.r * 0.707} y2={p.y + p.r * 0.707} />
      </g>
    {/each}
    {#each daisies as d}
      {#each ANGLES as a}
        {@const c = petal(d, a)}
        <ellipse cx={c.cx} cy={c.cy} rx={d.r * 0.42} ry={d.r * 0.24} transform="rotate({a} {c.cx} {c.cy})" fill={d.petal} />
      {/each}
      <circle cx={d.x} cy={d.y} r={d.r * 0.3} fill="#ffc21a" />
    {/each}
  </svg>

  <div class="cover"><Cover /></div>
  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="right">
    <div class="now">{head.playing ? 'Now playing' : head.stopped ? 'Stopped' : 'Listening'}</div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 108, min: 60, lines: 2, lineHeight: 1.06, text: head.title }}>{head.title}</h1>

    <div class="card">
      <div class="who">
        <div class="artist one-line">{head.artist}</div>
        <div class="stars" aria-hidden="true">★ ✿ ★</div>
      </div>
      {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
      {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
      <div class="rainbow"></div>
      {#if lyrics.lines.length}
        {#each lyrics.lines as l}
          <div class={l.active ? 'line active clamp' : 'line one-line'}>{l.text}</div>
        {/each}
      {:else}
        <div class="line">{lyrics.note}</div>
      {/if}
    </div>

    {#if fact}
      <div class="trivia">
        <div class="heading"><div>Did you know?</div><div>{fact.counter}</div></div>
        {#key fact.index}<div class="fact clamp" style="--lines: 3">{fact.text}</div>{/key}
      </div>
    {/if}
  </div>
</div>

<style>
  .dye {
    --pink: #ff3d9a;
    --ink: #2a1a3a;
    --cream: #fff6e6;
    --record: #1c1028;
    --record-groove: #4a3460;
    --record-label: #ff3d9a;
    --vu-scale: #2a1a3a;
    --vu-red: #ff3d9a;
    --vu-needle: #2a1a3a;
    --vu-font: 'Poppins', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    color: var(--ink);
    font-family: 'Poppins', sans-serif;
    /* Tie-dye: a rainbow spiral from the centre with soft rings bleeding through. */
    background:
      repeating-radial-gradient(circle at 50% 46%, rgba(255, 255, 255, 0) 0 34px, rgba(255, 255, 255, 0.22) 44px, rgba(255, 255, 255, 0) 60px),
      conic-gradient(from 20deg at 50% 46%, #ff3d7f, #ff8a1c, #ffe14f, #6fe07a, #3fc7ff, #6a6cff, #b04dff, #ff4fc8, #ff3d7f);
  }
  .deco {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .peace {
    fill: none;
    stroke: #fff;
  }
  .cover {
    position: absolute;
    left: 150px;
    top: 150px;
    width: 560px;
    height: 560px;
    border: 14px solid var(--cream);
    border-radius: 36px;
    overflow: hidden;
    box-shadow: 0 14px 0 rgba(42, 26, 58, 0.35);
    background: #f2d9ff;
  }
  .meters {
    position: absolute;
    left: 150px;
    top: 790px;
    width: 560px;
    padding: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    background: var(--cream);
    border: 4px dashed var(--pink);
    border-radius: 28px;
  }
  .face {
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
  }

  .right {
    position: absolute;
    left: 800px;
    top: 100px;
    width: 1000px;
    height: 920px;
    display: flex;
    flex-direction: column;
  }
  .now {
    font-family: 'Kavoon', cursive;
    font-size: 40px;
    color: #fff;
    text-shadow: 0 3px 0 var(--ink);
  }
  h1 {
    margin-top: 4px;
    padding-bottom: 14px;
    font-family: 'Kavoon', cursive;
    font-size: 108px;
    line-height: 1.06;
    font-weight: 400;
    color: var(--pink);
    -webkit-text-stroke: 8px #fff;
    paint-order: stroke fill;
    text-shadow: 0 8px 0 var(--ink);
  }
  .card {
    margin-top: 18px;
    padding: 24px 32px;
    background: var(--cream);
    border: 5px dashed var(--pink);
    border-radius: 32px;
    box-shadow: 0 10px 0 rgba(42, 26, 58, 0.3);
  }
  .who {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
  }
  .artist {
    min-width: 0;
    font-family: 'Kavoon', cursive;
    font-size: 46px;
  }
  .stars {
    flex: none;
    font-size: 28px;
    color: #ff8a1c;
  }
  .credit {
    font-size: 20px;
    line-height: 1.45;
    color: #6a5578;
  }
  .rainbow {
    height: 5px;
    margin: 14px 0 8px;
    border-radius: 3px;
    background: linear-gradient(90deg, #ff3d7f, #ff8a1c, #ffe14f, #6fe07a, #3fc7ff, #b04dff);
  }
  .line {
    min-height: 32px;
    margin: 6px 0;
    font-size: 24px;
    line-height: 1.3;
    color: #8a7598;
  }
  .line.active {
    --lines: 2;
    font-family: 'Kavoon', cursive;
    font-size: 38px;
    line-height: 1.15;
    color: var(--pink);
  }
  .trivia {
    margin-top: auto;
    align-self: flex-end;
    width: 560px;
    padding: 18px 24px;
    background: var(--ink);
    color: var(--cream);
    border-radius: 26px;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Kavoon', cursive;
    font-size: 22px;
    color: #ffe14f;
  }
  .fact {
    margin-top: 6px;
    font-size: 20px;
    font-weight: 500;
    line-height: 1.32;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
