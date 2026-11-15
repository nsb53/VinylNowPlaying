<script lang="ts">
  // "Spin": deep navy, the record half out of its sleeve with the label turning while a song plays.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const fact = $derived(factView());
  const grooves = [136, 154, 172, 190, 208, 226, 244, 262, 280];
</script>

<div class="spin">
  <div class="left">
    <div class="deck">
      <svg class="record" viewBox="0 0 592 592" aria-hidden="true">
        <circle cx="296" cy="296" r="296" class="vinyl" />
        {#each grooves as r}
          <circle cx="296" cy="296" {r} class="groove" />
        {/each}
        <g class="turn" class:playing={head.playing}>
          <circle cx="296" cy="296" r="108" class="label" />
          <text x="296" y="258" class="side">SIDE A</text>
          <text x="296" y="350" class="rpm">33 RPM</text>
          <circle cx="296" cy="296" r="9" class="hole" />
        </g>
      </svg>
      <div class="sleeve"><Cover /></div>
    </div>
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>

  <div class="right">
    <div class="header">
      <div class="label-text">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 80, min: 48, lines: 1, lineHeight: 1.04, text: head.title }}>
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
          <div>DID YOU KNOW?</div>
          <div>{fact.counter}</div>
        </div>
        {#key fact.index}
          <div class="fact-tag">{fact.category}</div>
          <div class="fact clamp" style="--lines: 4">{fact.text}</div>
        {/key}
      </div>
    {:else}
      <div></div>
    {/if}
  </div>
</div>

<style>
  .spin {
    --navy: #101826;
    --cream: #f2e8d5;
    --orange: #f2643d;
    --muted: #aeb6c6;
    --rule: #34425c;
    --record: #06080c;
    --record-groove: #1e2a3f;
    --record-label: #f2643d;
    --vu-scale: #101826;
    --vu-red: #d2431f;
    --vu-needle: #101826;
    --vu-font: 'DM Sans', sans-serif;

    width: 1920px;
    height: 1080px;
    padding: 72px;
    display: grid;
    grid-template-columns: 940px minmax(0, 1fr);
    grid-gap: 64px;
    overflow: hidden;
    background: var(--navy);
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
  }

  .left,
  .right {
    height: 936px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  /* The record sits behind the sleeve and slides out to the right. */
  .deck {
    position: relative;
    width: 940px;
    height: 620px;
  }
  .record {
    position: absolute;
    left: 334px;
    top: 14px;
    width: 592px;
    height: 592px;
  }
  .vinyl {
    fill: var(--record);
  }
  .groove {
    fill: none;
    stroke: var(--record-groove);
    stroke-width: 1.5;
  }
  .turn {
    transform-box: fill-box;
    transform-origin: center;
  }
  .turn.playing {
    /* 33 1/3 turns a minute. */
    animation: turn 1.8s linear infinite;
  }
  @keyframes turn {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .turn.playing {
      animation: none;
    }
  }
  .label {
    fill: var(--orange);
  }
  .side,
  .rpm {
    text-anchor: middle;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    fill: var(--navy);
  }
  .side {
    font-size: 22px;
    letter-spacing: 3px;
  }
  .rpm {
    font-size: 20px;
    letter-spacing: 2px;
  }
  .hole {
    fill: var(--navy);
  }
  .sleeve {
    position: absolute;
    left: 0;
    top: 0;
    width: 620px;
    height: 620px;
    overflow: hidden;
    background: #1b2638;
    border: 1px solid var(--rule);
    box-shadow: 14px 0 28px rgba(0, 0, 0, 0.55);
  }

  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 20px;
  }
  .face {
    background: var(--cream);
    border-radius: 8px;
    overflow: hidden;
  }

  .label-text {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
    color: var(--orange);
  }
  h1 {
    margin-top: 10px;
    padding-bottom: 4px;
    font-family: 'Fraunces', serif;
    font-size: 80px;
    line-height: 1.04;
    font-weight: 700;
    letter-spacing: -1px;
  }
  .artist {
    margin-top: 8px;
    font-size: 44px;
    font-weight: 500;
  }
  .credit {
    font-size: 24px;
    line-height: 1.4;
    color: var(--muted);
  }
  .artist + .credit {
    margin-top: 10px;
  }

  .lyrics {
    padding: 26px 0 10px;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }
  .line {
    min-height: 39px;
    margin-bottom: 16px;
    font-size: 30px;
    line-height: 1.3;
    color: var(--muted);
  }
  .line.active {
    --lines: 2;
    font-family: 'Fraunces', serif;
    font-size: 44px;
    line-height: 1.14;
    font-weight: 600;
    color: var(--cream);
  }

  .trivia {
    padding: 26px 28px;
    background: var(--cream);
    color: var(--navy);
    border-radius: 8px;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #3c475b;
  }
  .fact-tag {
    margin-top: 12px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #b8361a;
  }
  .fact {
    margin-top: 8px;
    font-size: 27px;
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
