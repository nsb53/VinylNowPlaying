<script lang="ts">
  // "Jazz · After Hours": a late-night club. Brick wall, a neon sign, the
  // cover pinned up like a gig poster.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const fact = $derived(factView());
</script>

<div class="neon">
  <svg class="wall" viewBox="0 0 1920 1080" aria-hidden="true">
    <defs>
      <pattern id="neon-bricks" width="160" height="72" patternUnits="userSpaceOnUse">
        <rect width="160" height="72" class="mortar" />
        <rect x="3" y="3" width="154" height="30" rx="2" class="brick" />
        <rect x="-77" y="39" width="154" height="30" rx="2" class="brick alt" />
        <rect x="83" y="39" width="154" height="30" rx="2" class="brick alt" />
      </pattern>
      <radialGradient id="neon-light" cx="0.62" cy="0.12" r="0.75">
        <stop offset="0" stop-color="#ff4f9a" stop-opacity="0.22" />
        <stop offset="0.45" stop-color="#3a1030" stop-opacity="0.1" />
        <stop offset="1" stop-color="#000" stop-opacity="0.72" />
      </radialGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#neon-bricks)" />
    <rect width="1920" height="1080" fill="url(#neon-light)" />
  </svg>

  <div class="left">
    <div class="poster">
      <div class="pin"></div>
      <div class="cover"><Cover /></div>
    </div>
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>

  <div class="right">
    <div class="header">
      <div class="sign" class:on={head.playing}>{head.playing ? 'Now Playing' : 'Listening'}</div>
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 96, min: 56, lines: 2, lineHeight: 1.06, text: head.title }}>
        {head.title}
      </h1>
      <div class="artist one-line">{head.artist}</div>
      {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
      {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
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
          <div class="script">Did you know?</div>
          <div>{fact.counter}</div>
        </div>
        {#key fact.index}
          <div class="fact-tag">{fact.category}</div>
          <div class="fact clamp" style="--lines: 3">{fact.text}</div>
        {/key}
      </div>
    {:else}
      <div></div>
    {/if}
  </div>
</div>

<style>
  .neon {
    --pink: #ff5fa2;
    --cyan: #5fe3ff;
    --white: #fbf4f8;
    --muted: #b6a6b4;
    --record: #050306;
    --record-groove: #2a1a26;
    --record-label: #ff5fa2;
    --vu-scale: #9feeff;
    --vu-red: #ff4f8b;
    --vu-needle: #fbf4f8;
    --vu-font: 'Jost', sans-serif;

    position: relative;
    width: 1920px;
    height: 1080px;
    padding: 72px;
    display: grid;
    grid-template-columns: 600px minmax(0, 1fr);
    grid-gap: 96px;
    overflow: hidden;
    background: #120c10;
    color: var(--white);
    font-family: 'Jost', sans-serif;
  }

  .wall {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .mortar {
    fill: #0d080b;
  }
  .brick {
    fill: #2b1a1f;
  }
  .brick.alt {
    fill: #26161b;
  }

  .left,
  .right {
    position: relative;
    height: 936px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .poster {
    position: relative;
    width: 600px;
    height: 600px;
    margin-top: 8px;
    transform: rotate(-2.2deg);
  }
  .cover {
    width: 100%;
    height: 100%;
    border: 14px solid #f1ebe2;
    background: #1b1218;
    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.7);
  }
  .pin {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: -10px;
    width: 26px;
    height: 26px;
    margin-left: -13px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #ff9cc6, #c2185b 70%);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.6);
  }

  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 24px;
  }
  .face {
    background: #0b070c;
    border: 2px solid var(--cyan);
    border-radius: 12px;
    overflow: hidden;
    box-shadow:
      0 0 12px rgba(95, 227, 255, 0.45),
      inset 0 0 18px rgba(95, 227, 255, 0.18);
  }

  .sign {
    font-family: 'Yellowtail', cursive;
    font-size: 92px;
    line-height: 1;
    color: #ffd3e6;
    opacity: 0.55;
  }
  .sign.on {
    opacity: 1;
    text-shadow:
      0 0 6px #fff,
      0 0 14px var(--pink),
      0 0 30px var(--pink),
      0 0 60px var(--pink),
      0 0 90px rgba(255, 95, 162, 0.6);
    animation: flicker 9s infinite;
  }
  @keyframes flicker {
    0%,
    91%,
    93%,
    95%,
    100% {
      opacity: 1;
    }
    92%,
    94% {
      opacity: 0.55;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sign.on {
      animation: none;
    }
  }

  h1 {
    margin-top: 22px;
    padding-bottom: 6px;
    font-size: 96px;
    line-height: 1.06;
    font-weight: 700;
    text-shadow: 0 0 22px rgba(255, 255, 255, 0.18);
  }
  .artist {
    margin-top: 6px;
    font-size: 48px;
    font-weight: 500;
    color: var(--cyan);
    text-shadow: 0 0 18px rgba(95, 227, 255, 0.55);
  }
  .credit {
    font-size: 23px;
    line-height: 1.45;
    color: var(--muted);
  }
  .artist + .credit {
    margin-top: 10px;
  }

  .line {
    min-height: 39px;
    margin-bottom: 14px;
    font-size: 30px;
    line-height: 1.3;
    color: var(--muted);
  }
  .line.active {
    --lines: 2;
    font-size: 46px;
    line-height: 1.16;
    font-weight: 600;
    color: var(--white);
    text-shadow: 0 0 16px rgba(95, 227, 255, 0.5);
  }

  .trivia {
    padding: 22px 30px 26px;
    background: rgba(10, 5, 10, 0.78);
    border: 2px solid var(--pink);
    border-radius: 14px;
    box-shadow:
      0 0 14px rgba(255, 95, 162, 0.5),
      inset 0 0 14px rgba(255, 95, 162, 0.15);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
    color: var(--muted);
  }
  .script {
    font-family: 'Yellowtail', cursive;
    font-size: 44px;
    font-weight: 400;
    letter-spacing: 0;
    color: var(--pink);
    text-shadow: 0 0 12px rgba(255, 95, 162, 0.7);
  }
  .fact-tag {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--cyan);
  }
  .fact {
    margin-top: 8px;
    font-size: 27px;
    line-height: 1.34;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
