<script lang="ts">
  // "Techno · Spectral HUD": navy grid, magenta and cyan, the app's live
  // console streaming down the right.
  import Cover from '../lib/Cover.svelte';
  import LogStream from '../lib/LogStream.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

</script>

<div class="hud">
  <svg class="grid" viewBox="0 0 1920 1080" aria-hidden="true">
    {#each Array.from({ length: 33 }, (_, i) => i * 60) as x}
      <line x1={x} y1="0" x2={x} y2="1080" />
    {/each}
    {#each Array.from({ length: 19 }, (_, i) => i * 60) as y}
      <line x1="0" y1={y} x2="1920" y2={y} />
    {/each}
  </svg>

  <div class="bytes"><LogStream rows={43} size={16} lineHeight={24} /></div>

  <div class="main">
    <div class="top">
      <div class="cover-box">
        <i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>
        <div class="cover"><Cover /></div>
      </div>
      <div class="header">
        <div class="status"><span class="dot"></span>{head.playing ? 'NOW PLAYING' : 'LISTENING'} · CH 01</div>
        <h1 class="clamp" style="--lines: 2" use:fit={{ max: 66, min: 44, lines: 2, lineHeight: 1.12, text: head.title }}>
          {head.title}
        </h1>
        <div class="artist one-line">{head.artist}</div>
        {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
        {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
      </div>
    </div>

    <div class="middle">
      <div class="lyrics">
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

    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>
</div>

<style>
  .hud {
    --bg: #070b1e;
    --magenta: #ff3ea5;
    --cyan: #36e3ff;
    --text: #eaf2ff;
    --muted: #8e9ad0;
    --stream-head: #ffffff;
    --stream-ink: #36e3ff;
    --stream-time: #6f7bb5;
    --stream-good: #ff3ea5;
    --record: #02040c;
    --record-groove: #1b2550;
    --record-label: #ff3ea5;
    --vu-scale: #36e3ff;
    --vu-red: #ff3ea5;
    --vu-needle: #ffffff;
    --vu-font: 'Space Mono', monospace;
    --clip: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 28px 100%, 0 calc(100% - 28px));

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    font-family: 'Sora', sans-serif;
  }

  .grid {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .grid line {
    stroke: #141d45;
    stroke-width: 1;
  }

  .bytes {
    position: absolute;
    right: 0;
    top: 0;
    width: 560px;
    height: 1080px;
    padding: 24px 32px;
    border-left: 1px solid rgba(54, 227, 255, 0.35);
    background: rgba(7, 11, 30, 0.85);
    font-family: 'Space Mono', monospace;
  }

  .main {
    position: absolute;
    left: 72px;
    top: 72px;
    width: 1216px;
    height: 936px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top {
    display: grid;
    grid-template-columns: 440px minmax(0, 1fr);
    grid-gap: 64px;
  }
  .cover-box {
    position: relative;
    width: 440px;
    height: 440px;
  }
  .cover {
    width: 440px;
    height: 440px;
    background: #121a3d;
  }
  .cover-box i {
    position: absolute;
    width: 44px;
    height: 44px;
    border: 0 solid var(--magenta);
  }
  .tl {
    left: -14px;
    top: -14px;
    border-width: 5px 0 0 5px !important;
  }
  .tr {
    right: -14px;
    top: -14px;
    border-width: 5px 5px 0 0 !important;
  }
  .bl {
    left: -14px;
    bottom: -14px;
    border-width: 0 0 5px 5px !important;
  }
  .br {
    right: -14px;
    bottom: -14px;
    border-width: 0 5px 5px 0 !important;
  }

  .header {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 14px;
    font-family: 'Space Mono', monospace;
    font-size: 20px;
    letter-spacing: 3px;
    color: var(--cyan);
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--magenta);
  }
  h1 {
    margin-top: 14px;
    padding-bottom: 6px;
    font-family: 'Michroma', sans-serif;
    font-size: 66px;
    line-height: 1.12;
    font-weight: 400;
    text-transform: uppercase;
  }
  .artist {
    margin-top: 8px;
    font-size: 42px;
    font-weight: 600;
    color: var(--magenta);
  }
  .credit {
    font-size: 21px;
    line-height: 1.5;
    color: var(--muted);
  }
  .artist + .credit {
    margin-top: 10px;
  }

  .middle {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 480px;
    grid-gap: 48px;
    align-items: end;
  }
  .lyrics {
    min-width: 0;
  }
  .line {
    min-height: 36px;
    margin: 10px 0;
    font-size: 28px;
    line-height: 1.3;
    color: var(--muted);
  }
  .line.active {
    --lines: 2;
    font-size: 44px;
    line-height: 1.15;
    font-weight: 700;
    color: #fff;
  }
  .trivia {
    padding: 22px 28px;
    background: rgba(255, 62, 165, 0.14);
    border-top: 3px solid var(--magenta);
    clip-path: var(--clip);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--magenta);
  }
  .fact {
    margin-top: 8px;
    font-size: 23px;
    line-height: 1.34;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }

  .meters {
    width: 620px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 24px;
  }
  .face {
    background: #0b1230;
    border: 1px solid rgba(54, 227, 255, 0.5);
    clip-path: var(--clip);
    overflow: hidden;
  }
</style>
