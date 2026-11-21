<script lang="ts">
  // "Synthwave" (1980s): a striped sun over a neon perspective grid, chrome
  // title, cyan glow.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  const rays = Array.from({ length: 25 }, (_, i) => 960 + (i - 12) * 220);
  const rows = [6, 20, 40, 68, 106, 156, 222, 306, 360];
  const cuts = [
    { y: 420, h: 8 },
    { y: 448, h: 12 },
    { y: 480, h: 16 },
    { y: 516, h: 20 },
    { y: 556, h: 26 },
  ];
</script>

<div class="synth">
  <svg class="bg" viewBox="0 0 1920 1080" aria-hidden="true">
    <defs>
      <linearGradient id="synth-sun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe14f" />
        <stop offset="1" stop-color="#ff2bd6" />
      </linearGradient>
    </defs>
    <circle cx="1590" cy="420" r="280" fill="url(#synth-sun)" />
    {#each cuts as c}<rect x="1290" y={c.y} width="600" height={c.h} fill="#2b0a4a" />{/each}
    <rect x="0" y="720" width="1920" height="360" fill="#0b0016" />
    <g transform="translate(0 720)" class="grid">
      {#each rays as x}<line x1="960" y1="0" x2={x} y2="360" />{/each}
      {#each rows as y}<line x1="0" y1={y} x2="1920" y2={y} />{/each}
    </g>
  </svg>

  <div class="cover"><Cover /></div>

  <div class="header">
    <div class="label">{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 92, min: 52, lines: 2, lineHeight: 1.08, text: head.title }}>{head.title}</h1>
    <div class="artist one-line">{head.artist}</div>
    {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
    {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
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

  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>
  {#if fact}
    <div class="trivia">
      <div class="heading"><div>DID YOU KNOW?</div><div>{fact.counter}</div></div>
      {#key fact.index}<div class="fact clamp" style="--lines: 4">{fact.text}</div>{/key}
    </div>
  {/if}
</div>

<style>
  .synth {
    --pink: #ff2bd6;
    --cyan: #2bf0ff;
    --lilac: #c9b6f0;
    --record: #0b0016;
    --record-groove: #3a1a6a;
    --record-label: #ff2bd6;
    --vu-scale: #2bf0ff;
    --vu-red: #ff2bd6;
    --vu-needle: #ffffff;
    --vu-font: 'Audiowide', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: linear-gradient(180deg, #12002b 0%, #2b0a4a 55%, #0b0016 100%);
    color: #fff;
    font-family: 'Poppins', sans-serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .grid line {
    stroke: var(--pink);
    stroke-width: 2;
  }
  .cover {
    position: absolute;
    left: 72px;
    top: 90px;
    width: 520px;
    height: 520px;
    border: 4px solid var(--cyan);
    box-shadow: 0 0 20px var(--cyan);
    background: #1c0638;
  }
  .header {
    position: absolute;
    left: 680px;
    top: 90px;
    width: 1168px;
  }
  .label {
    font-family: 'Audiowide', sans-serif;
    font-size: 26px;
    letter-spacing: 8px;
    color: var(--cyan);
  }
  h1 {
    margin-top: 12px;
    padding-bottom: 8px;
    font-family: 'Audiowide', sans-serif;
    font-size: 92px;
    line-height: 1.08;
    font-weight: 400;
    text-transform: uppercase;
    /* Chrome lettering. */
    background: linear-gradient(180deg, #ffffff 0%, #bfe9ff 45%, #ff2bd6 52%, #ffe14f 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 4px 0 #2b0a4a);
  }
  .artist {
    margin-top: 12px;
    font-size: 48px;
    font-weight: 700;
    color: var(--cyan);
    text-shadow: 0 0 16px rgba(43, 240, 255, 0.7);
  }
  .credit {
    font-size: 22px;
    line-height: 1.45;
    color: var(--lilac);
    text-shadow: 0 2px 6px #12002b;
  }
  .artist + .credit {
    margin-top: 6px;
  }
  .lyrics {
    position: absolute;
    left: 680px;
    top: 500px;
    width: 760px;
  }
  .line {
    min-height: 34px;
    margin: 6px 0;
    font-size: 26px;
    line-height: 1.3;
    color: var(--lilac);
    text-shadow: 0 2px 6px #12002b;
  }
  .line.active {
    --lines: 2;
    font-size: 42px;
    line-height: 1.15;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 0 14px rgba(255, 43, 214, 0.7);
  }
  .meters {
    position: absolute;
    left: 72px;
    top: 790px;
    width: 560px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .face {
    background: #12002b;
    border: 2px solid var(--cyan);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 0 12px rgba(43, 240, 255, 0.5);
  }
  .trivia {
    position: absolute;
    right: 72px;
    bottom: 72px;
    width: 508px;
    padding: 22px 26px;
    background: rgba(11, 0, 22, 0.88);
    border: 2px solid var(--pink);
    border-radius: 8px;
    box-shadow: 0 0 16px rgba(255, 43, 214, 0.5);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Audiowide', sans-serif;
    font-size: 17px;
    letter-spacing: 3px;
    color: var(--pink);
  }
  .fact {
    margin-top: 8px;
    font-size: 21px;
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
