<script lang="ts">
  // "Mixtape" (1980s): orange ground with yellow scribbles, a big cassette
  // whose reels turn while a song plays, the song written on its label.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());
  const SPOKES = [0, 60, 120, 180, 240, 300];
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
</script>

<div class="mixtape">
  <svg class="bg" viewBox="0 0 1920 1080" aria-hidden="true">
    <path d="M1760 60 l -50 90 l 60 0 l -60 110" class="scribble" />
    <path d="M60 1000 q 40 -60 90 -20 t 90 -10" class="scribble" />
    <ellipse cx="1000" cy="60" rx="22" ry="34" transform="rotate(-25 1000 60)" class="scribble" />
    <path d={star(1850, 640, 40)} fill="#ffd23f" />
    <path d={star(960, 1020, 30)} fill="#ffd23f" />
  </svg>

  <div class="cassette">
    <svg viewBox="0 0 860 540" aria-hidden="true">
      <rect x="8" y="8" width="844" height="524" rx="36" class="shell" />
      <rect x="60" y="56" width="740" height="200" rx="14" class="label" />
      <rect x="170" y="268" width="520" height="124" rx="60" class="window" />
      {#each [270, 590] as cx}
        <g class="reel" class:turning={head.playing}>
          <circle {cx} cy="330" r="62" class="hub" />
          {#each SPOKES as a}<rect x={cx - 9} y="278" width="18" height="30" rx="4" transform="rotate({a} {cx} 330)" class="spoke" />{/each}
          <circle {cx} cy="330" r="16" class="spoke" />
        </g>
      {/each}
      <path d="M180 532 L 230 440 L 630 440 L 680 532" class="foot" />
      <circle cx="300" cy="490" r="11" class="spoke" />
      <circle cx="560" cy="490" r="11" class="spoke" />
    </svg>
    <div class="on-label">
      <div class="side">SIDE A · {head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
      <h1 class="one-line" use:fit={{ max: 64, min: 36, lines: 1, lineHeight: 1.05, text: head.title }}>{head.title}</h1>
      <div class="artist one-line">{head.artist}</div>
    </div>
  </div>

  <div class="cover"><Cover /></div>
  <div class="credits">
    {#if info.release}<div>{info.release}</div>{/if}
    {#if info.writers}<div>{info.writers}</div>{/if}
  </div>

  <div class="lyrics">
    {#if lyrics.lines.length}
      {#each lyrics.lines as l}
        <div class={l.active ? 'line active clamp' : 'line one-line'}>{l.text}</div>
      {/each}
    {:else}
      <div class="line">{lyrics.note}</div>
    {/if}
  </div>

  <div class="side-col">
    {#if fact}
      <div class="trivia">
        <div class="heading"><div>DID YOU KNOW?</div><div>{fact.counter}</div></div>
        {#key fact.index}<div class="fact clamp" style="--lines: 4">{fact.text}</div>{/key}
      </div>
    {/if}
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>
</div>

<style>
  .mixtape {
    --orange: #f28c28;
    --yellow: #ffd23f;
    --ink: #2b1d14;
    --paper: #fff6e8;
    --record: #2b1d14;
    --record-groove: #5a3a22;
    --record-label: #ffd23f;
    --vu-scale: #2b1d14;
    --vu-red: #c2481f;
    --vu-needle: #2b1d14;
    --vu-font: 'Poppins', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--orange);
    color: var(--ink);
    font-family: 'Poppins', sans-serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .scribble {
    fill: none;
    stroke: var(--yellow);
    stroke-width: 12;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .cassette {
    position: absolute;
    left: 72px;
    top: 72px;
    width: 860px;
    height: 540px;
  }
  .cassette svg {
    display: block;
    width: 860px;
    height: 540px;
  }
  .shell {
    fill: var(--yellow);
    stroke: var(--ink);
    stroke-width: 10;
  }
  .label {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 6;
  }
  .window {
    fill: #3a2a1e;
    stroke: var(--ink);
    stroke-width: 6;
  }
  .hub {
    fill: var(--paper);
    stroke: var(--ink);
    stroke-width: 8;
  }
  .spoke {
    fill: var(--ink);
  }
  .foot {
    fill: #f2b705;
    stroke: var(--ink);
    stroke-width: 8;
  }
  .reel {
    transform-box: fill-box;
    transform-origin: center;
  }
  .reel.turning {
    animation: reel 2.4s linear infinite;
  }
  @keyframes reel {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .reel.turning {
      animation: none;
    }
  }
  .on-label {
    position: absolute;
    left: 84px;
    top: 70px;
    width: 692px;
    height: 172px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .side {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 6px;
  }
  h1 {
    margin-top: 4px;
    font-family: 'Bowlby One', sans-serif;
    font-size: 64px;
    line-height: 1.05;
    font-weight: 400;
    text-transform: uppercase;
  }
  .artist {
    margin-top: 2px;
    font-family: 'Permanent Marker', cursive;
    font-size: 38px;
    color: #c2481f;
  }

  .cover {
    position: absolute;
    left: 1060px;
    top: 72px;
    width: 400px;
    height: 400px;
    border: 8px solid var(--ink);
    border-radius: 12px;
    overflow: hidden;
    background: #d9701a;
  }
  .credits {
    position: absolute;
    left: 1500px;
    top: 82px;
    width: 348px;
    font-size: 21px;
    line-height: 1.45;
    color: #5a3a22;
  }
  .lyrics {
    position: absolute;
    left: 72px;
    top: 690px;
    width: 860px;
  }
  .line {
    min-height: 34px;
    margin: 8px 0;
    font-size: 26px;
    line-height: 1.3;
    color: #6a4126;
  }
  .line.active {
    --lines: 2;
    font-family: 'Bowlby One', sans-serif;
    font-size: 40px;
    line-height: 1.15;
    color: var(--ink);
  }
  .side-col {
    position: absolute;
    left: 1060px;
    top: 540px;
    width: 788px;
    height: 468px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .trivia {
    padding: 22px 26px;
    background: var(--ink);
    color: var(--paper);
    border-radius: 18px;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 4px;
    color: var(--yellow);
  }
  .fact {
    margin-top: 8px;
    font-size: 22px;
    font-weight: 500;
    line-height: 1.32;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
  .meters {
    width: 560px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .face {
    background: var(--paper);
    border: 4px solid var(--ink);
    border-radius: 14px;
    overflow: hidden;
  }
</style>
