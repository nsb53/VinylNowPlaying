<script lang="ts">
  // Shared layout for the Holiday themes: cover in a frame on the left with
  // the meters below, title block, lyrics card and "Did you know?" card on the
  // right. Each theme passes its colours (CSS variables in `vars`), its
  // background scenery (`scene`), and options: snow drifts on every box, a
  // gift ribbon on the cover, festive or capital-letter label.
  import type { Snippet } from 'svelte';
  import Cover from '../lib/Cover.svelte';
  import Snowcap from '../lib/Snowcap.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  let {
    vars,
    scene,
    label = 'caps',
    labelPrefix = '',
    labelSuffix = '',
    titleItalic = false,
    artistItalic = false,
    snow = false,
    snowColour = '#ffffff',
    snowShade = 'rgba(150, 180, 210, 0.45)',
    gift = false,
  }: {
    vars: string;
    scene?: Snippet;
    label?: 'caps' | 'festive';
    labelPrefix?: string;
    labelSuffix?: string;
    titleItalic?: boolean;
    artistItalic?: boolean;
    snow?: boolean;
    snowColour?: string;
    snowShade?: string;
    gift?: boolean;
  } = $props();

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());
  const status = $derived(
    head.playing ? 'Now Playing' : head.stopped ? 'Stopped' : 'Listening',
  );
</script>

<div class="holiday" style={vars}>
  {#if scene}{@render scene()}{/if}

  <div class="frame">
    {#if snow}<Snowcap width={540} seed={11} colour={snowColour} shade={snowShade} />{/if}
    {#if gift}
      <div class="ribbon across" aria-hidden="true"></div>
      <div class="ribbon down" aria-hidden="true"></div>
      <svg class="bow" viewBox="0 0 120 80" aria-hidden="true">
        <path d="M60 50 C 20 10, 0 40, 30 56 Z" />
        <path d="M60 50 C 100 10, 120 40, 90 56 Z" />
        <circle cx="60" cy="50" r="10" class="knot" />
      </svg>
    {/if}
    <div class="cover"><Cover /></div>
  </div>

  <div class="meters">
    {#if snow}<Snowcap width={540} seed={12} colour={snowColour} shade={snowShade} />{/if}
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="header">
    <div class="label" class:festive={label === 'festive'}>
      {labelPrefix}{label === 'festive' ? status : status.toUpperCase()}{labelSuffix}
    </div>
    <h1 class="clamp" class:italic={titleItalic} style="--lines: 2" use:fit={{ max: 100, min: 56, lines: 2, lineHeight: 1.05, text: head.title }}>
      {head.title}
    </h1>
    <div class="artist one-line" class:italic={artistItalic}>{head.artist}</div>
    {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
    {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
  </div>

  <div class="card lyrics">
    {#if snow}<Snowcap width={660} seed={13} colour={snowColour} shade={snowShade} />{/if}
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
      {#if snow}<Snowcap width={410} seed={14} colour={snowColour} shade={snowShade} />{/if}
      <div class="heading"><div>DID YOU KNOW?</div><div>{fact.counter}</div></div>
      {#key fact.index}<div class="fact clamp" style="--lines: 6">{fact.text}</div>{/key}
    </div>
  {/if}
</div>

<style>
  .holiday {
    --vu-font: 'Inter', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Inter', sans-serif;
  }

  .frame {
    position: absolute;
    left: 90px;
    top: 130px;
    width: 540px;
    padding: var(--frame-pad, 14px);
    background: var(--frame-bg);
    border: var(--frame-border, none);
    border-radius: var(--frame-radius, 8px);
    box-shadow: var(--frame-shadow, none);
  }
  .cover {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border: var(--cover-border, none);
    background: var(--cover-bg, #222);
    overflow: hidden;
  }
  .ribbon {
    position: absolute;
    z-index: 1;
    background: var(--ribbon);
    pointer-events: none;
  }
  .ribbon.across {
    left: 0;
    right: 0;
    top: 46%;
    height: 26px;
  }
  .ribbon.down {
    top: 0;
    bottom: 0;
    left: 46%;
    width: 26px;
  }
  .bow {
    position: absolute;
    z-index: 2;
    left: 210px;
    top: -46px;
    width: 120px;
    height: 80px;
    fill: var(--ribbon);
  }
  .bow .knot {
    fill: var(--ribbon-dark);
  }

  .meters {
    position: absolute;
    left: 90px;
    top: 780px;
    width: 540px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .face {
    background: var(--meter-face);
    border: var(--meter-border, none);
    border-radius: 10px;
    overflow: hidden;
  }

  .header {
    position: absolute;
    left: 720px;
    top: 120px;
    width: 1110px;
  }
  .label {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 8px;
    color: var(--label);
  }
  .label.festive {
    font-family: 'Mountains of Christmas', cursive;
    font-size: 46px;
    letter-spacing: 0;
  }
  h1 {
    margin-top: 10px;
    padding-bottom: 8px;
    font-family: 'Fraunces', serif;
    font-size: 100px;
    line-height: 1.05;
    font-weight: 700;
    color: var(--title);
    text-shadow: var(--title-glow, none);
  }
  .italic {
    font-style: italic;
  }
  .artist {
    margin-top: 10px;
    font-family: 'Fraunces', serif;
    font-size: 50px;
    font-weight: 600;
    color: var(--artist);
  }
  .credit {
    font-size: 22px;
    line-height: 1.45;
    color: var(--credit);
  }
  .artist + .credit {
    margin-top: 6px;
  }

  .card {
    position: absolute;
    left: 720px;
    top: 580px;
    width: 660px;
    padding: 30px 32px 24px;
    background: var(--card-bg);
    border: var(--card-border);
    border-radius: 16px;
    box-shadow: var(--card-shadow, none);
  }
  .line {
    min-height: 34px;
    margin: 8px 0;
    font-size: 26px;
    line-height: 1.3;
    color: var(--dim);
  }
  .line.active {
    --lines: 2;
    font-family: 'Fraunces', serif;
    font-size: 40px;
    line-height: 1.15;
    font-weight: 700;
    font-style: var(--current-style, normal);
    color: var(--current);
  }

  .trivia {
    position: absolute;
    left: 1420px;
    top: 580px;
    width: 410px;
    padding: 28px 24px 22px;
    background: var(--fact-bg);
    color: var(--fact-ink);
    border: var(--fact-border, none);
    border-radius: 16px;
    box-shadow: var(--fact-shadow, none);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Fraunces', serif;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--fact-head);
  }
  .fact {
    margin-top: 8px;
    font-size: 21px;
    line-height: 1.35;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
