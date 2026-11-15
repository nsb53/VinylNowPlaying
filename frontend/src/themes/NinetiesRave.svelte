<script lang="ts">
  // "Rave Flyer" (1990s): black with holographic blobs and a faint grid,
  // liquid-chrome type, flyer-style sticker tags.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());
</script>

<div class="rave">
  <div class="blob one"></div>
  <div class="blob two"></div>
  <div class="grid"></div>

  <div class="sleeve"><Cover /></div>

  <div class="header">
    <div class="tags">
      <div class="tag solid">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
      <div class="tag">STRICTLY VINYL</div>
      <div class="tag">33⅓ RPM</div>
    </div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 112, min: 60, lines: 2, lineHeight: 0.98, text: head.title }}>{head.title}</h1>
    <div class="artist one-line">+ {head.artist} +</div>
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
  .rave {
    --ink: #060607;
    --white: #f2f2f2;
    --holo: conic-gradient(from 200deg at 50% 50%, #ff9de6, #9dfcff, #c7a6ff, #fff3a0, #9dffb8, #ff9de6);
    --record: #000;
    --record-groove: #2a2a30;
    --record-label: #9dfcff;
    --vu-scale: #060607;
    --vu-red: #ff4fd8;
    --vu-needle: #060607;
    --vu-font: 'Space Mono', monospace;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--ink);
    color: var(--white);
    font-family: 'Space Mono', monospace;
  }
  .blob {
    position: absolute;
    background: var(--holo);
  }
  .blob.one {
    left: 1080px;
    top: -220px;
    width: 1100px;
    height: 1100px;
    border-radius: 47% 53% 41% 59% / 52% 38% 62% 48%;
    opacity: 0.9;
  }
  .blob.two {
    left: -420px;
    top: 820px;
    width: 700px;
    height: 700px;
    border-radius: 58% 42% 55% 45% / 45% 60% 40% 55%;
    opacity: 0.55;
  }
  .grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
    background-size: 80px 80px;
  }
  .sleeve {
    position: absolute;
    left: 1240px;
    top: 140px;
    width: 520px;
    height: 520px;
    border: 3px solid var(--ink);
    transform: rotate(4deg);
    box-shadow: -18px 18px 0 var(--ink);
    background: #1a1a1f;
  }
  .header {
    position: absolute;
    left: 72px;
    top: 70px;
    width: 1100px;
  }
  .tags {
    display: flex;
    gap: 12px;
    font-size: 20px;
    letter-spacing: 3px;
  }
  .tag {
    padding: 6px 12px;
    border: 2px solid var(--white);
  }
  .tag.solid {
    background: var(--white);
    color: var(--ink);
    font-weight: 700;
  }
  h1 {
    margin-top: 26px;
    padding-bottom: 10px;
    font-family: 'Syne', sans-serif;
    font-size: 112px;
    line-height: 0.98;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: -3px;
    /* Liquid chrome. */
    background: linear-gradient(180deg, #ffffff 0%, #bfc3cc 40%, #6e7380 50%, #e8ebf0 62%, #9097a3 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .artist {
    margin-top: 14px;
    font-family: 'Syne', sans-serif;
    font-size: 50px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .credit {
    font-size: 20px;
    line-height: 1.6;
    color: #a8a8b3;
  }
  .artist + .credit {
    margin-top: 10px;
  }
  .lyrics {
    position: absolute;
    left: 72px;
    top: 600px;
    width: 1000px;
  }
  .line {
    min-height: 32px;
    margin: 6px 0;
    font-size: 24px;
    line-height: 1.3;
    color: #8a8a96;
  }
  .line.active {
    --lines: 2;
    font-family: 'Syne', sans-serif;
    font-size: 44px;
    line-height: 1.12;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--white);
  }
  .meters {
    position: absolute;
    left: 72px;
    top: 850px;
    width: 560px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .face {
    background: var(--white);
    overflow: hidden;
  }
  .trivia {
    position: absolute;
    right: 72px;
    bottom: 72px;
    width: 608px;
    padding: 22px 26px;
    background: var(--ink);
    border: 2px solid var(--white);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #9dfcff;
  }
  .fact {
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.4;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
