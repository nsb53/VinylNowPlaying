<script lang="ts">
  // E1 "Mid-Century Modern" and, with `night`, E2 "Mid-Century Night".
  // With `dynamic`, "MCM - Dynamic": colours from the album cover and a title
  // font and motif chosen per album by Gemini. Falls back to E1 when an album
  // has neither.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { app, credits, headline, lyricView, factView, type Palette } from '../lib/store.svelte';
  import Motif from './Motif.svelte';

  let { night = false, dynamic = false }: { night?: boolean; dynamic?: boolean } = $props();

  // Title fonts Gemini can pick from (names match tools/gemini_metadata.py).
  const FONTS: Record<string, { family: string; weight: number; spacing: string }> = {
    geometric: { family: "'Jost', sans-serif", weight: 700, spacing: '-2px' },
    serif: { family: "'Fraunces', serif", weight: 700, spacing: '-1px' },
    retro: { family: "'Righteous', sans-serif", weight: 400, spacing: '0' },
    typewriter: { family: "'Special Elite', monospace", weight: 400, spacing: '0' },
    marker: { family: "'Permanent Marker', cursive", weight: 400, spacing: '0' },
    stencil: { family: "'Saira Stencil One', sans-serif", weight: 400, spacing: '1px' },
    rounded: { family: "'Fredoka', sans-serif", weight: 600, spacing: '-1px' },
    grotesk: { family: "'Space Grotesk', sans-serif", weight: 700, spacing: '-2px' },
    distressed: { family: "'Rubik Dirt', sans-serif", weight: 400, spacing: '0' },
    graffiti: { family: "'Sedgwick Ave Display', cursive", weight: 400, spacing: '0' },
  };

  function paletteVars(p: Palette) {
    return [
      `--bg: ${p.bg}`,
      `--ink: ${p.ink}`,
      `--muted: ${p.muted}`,
      `--current: ${p.current}`,
      `--title-bg: ${p.titleBg}`,
      `--title-ink: ${p.titleInk}`,
      `--meter-bg: ${p.meterBg}`,
      `--card-bg: ${p.cardBg}`,
      `--card-ink: ${p.cardInk}`,
      `--card-tag: ${p.cardTag}`,
      `--burst-a: ${p.burstA}`,
      `--burst-b: ${p.burstB}`,
      `--face: ${p.face}`,
      `--vu-scale: ${p.faceInk}`,
      `--vu-needle: ${p.faceInk}`,
      `--vu-red: ${p.vuRed}`,
      `--cover-bg: ${p.dark ? '#0f0d0c' : p.ink}`,
      `--record-label: ${p.titleBg}`,
    ].join('; ');
  }

  const look = $derived(dynamic ? app.look : null);
  const font = $derived(FONTS[look?.style?.font ?? ''] ?? FONTS.geometric);
  const motif = $derived(look?.style?.motif ?? 'starburst');
  const vars = $derived(
    [
      look?.palette ? paletteVars(look.palette) : '',
      `--title-font: ${font.family}; --title-weight: ${font.weight}; --title-spacing: ${font.spacing}`,
    ]
      .filter(Boolean)
      .join('; '),
  );

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const fact = $derived(factView());

</script>

<div class="mcm" class:night class:dynamic style={vars}>
  <div class="top">
    <div class="cover"><Cover /></div>
    <div class="title-block">
      <div class="burst"><Motif kind={motif} /></div>
      <div class="text">
        <div class="label">{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
        <h1 class="clamp" style="--lines: 2" use:fit={{ max: 100, min: 56, lines: 2, lineHeight: 1.05, text: head.title + font.family }}>
          {head.title}
        </h1>
        <div class="artist one-line">{head.artist}</div>
        {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
        {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
      </div>
    </div>
  </div>

  <div class="bottom">
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
    <div class="rest">
      <div class="lyrics">
        <div class="heading ruled">
          <div>LYRICS</div>
          <div>{lyrics.label}</div>
        </div>
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
            <div class="fact clamp" style="--lines: 8">{fact.text}</div>
          {/key}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .mcm {
    --bg: #efe3c8;
    --ink: #23201c;
    --muted: #5c554a;
    --current: #1f5f63;
    --cover-bg: #23201c;
    --record: #0f0d0c;
    --record-groove: #4a443c;
    --record-label: #d9a21b;
    --vu-scale: #23201c;
    --vu-red: #b5431f;
    --vu-needle: #23201c;
    --vu-font: 'Jost', sans-serif;
    --title-bg: #d9a21b;
    --title-ink: #23201c;
    --meter-bg: #1f5f63;
    --card-bg: #b5431f;
    --card-ink: #fbf3df;
    --card-tag: #ffd79a;
    --burst-a: #23201c;
    --burst-b: #b5431f;
    --face: #fbf3df;

    width: 1920px;
    height: 1080px;
    display: grid;
    grid-template-rows: 500px 580px;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Jost', sans-serif;
  }
  .mcm.night {
    --bg: #1c1917;
    --ink: #efe3c8;
    --muted: #b8ad96;
    --current: #e8b62e;
    --cover-bg: #0f0d0c;
    --record: #000;
  }

  .top,
  .bottom {
    display: flex;
    min-height: 0;
  }

  .cover {
    flex: none;
    width: 500px;
    height: 500px;
    background: var(--cover-bg);
  }

  .title-block {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    padding: 56px 72px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: var(--title-bg);
    color: var(--title-ink);
  }
  /* Album changes fade instead of jumping. */
  .dynamic,
  .dynamic .title-block,
  .dynamic .meters,
  .dynamic .face,
  .dynamic .trivia,
  .dynamic .line,
  .dynamic .cover {
    transition:
      background-color 1.5s ease,
      color 1.5s ease;
  }
  .burst {
    position: absolute;
    right: 72px;
    top: 56px;
    width: 280px;
    height: 280px;
  }
  .text {
    position: relative;
    max-width: 960px;
  }
  .label,
  .heading {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 5px;
  }
  h1 {
    margin-top: 12px;
    padding-bottom: 6px;
    font-family: var(--title-font, 'Jost', sans-serif);
    font-size: 100px;
    line-height: 1.05;
    font-weight: var(--title-weight, 700);
    letter-spacing: var(--title-spacing, -2px);
  }
  .artist {
    margin-top: 6px;
    font-size: 50px;
    font-weight: 500;
  }
  .credit {
    margin-top: 6px;
    font-size: 26px;
    font-weight: 500;
    line-height: 1.4;
  }
  .artist + .credit {
    margin-top: 12px;
  }

  .meters {
    flex: none;
    /* Wider than the 500px cover above it, so the block steps out to the right. */
    width: 580px;
    padding: 48px 102px;
    background: var(--meter-bg);
  }
  .face {
    background: var(--face);
    border-radius: 14px;
    overflow: hidden;
  }
  .face + .face {
    margin-top: 32px;
  }

  .rest {
    flex: 1 1 0;
    min-width: 0;
    padding: 56px 72px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 500px;
    grid-gap: 64px;
  }

  .heading {
    display: flex;
    justify-content: space-between;
  }
  .ruled {
    padding-bottom: 14px;
    border-bottom: 4px solid var(--ink);
    margin-bottom: 4px;
  }
  .line {
    margin-top: 16px;
    min-height: 39px;
    font-size: 30px;
    line-height: 1.3;
    color: var(--muted);
  }
  .line.active {
    --lines: 2;
    font-size: 46px;
    line-height: 1.14;
    font-weight: 700;
    color: var(--current);
  }

  .trivia {
    align-self: start;
    max-height: 468px;
    overflow: hidden;
    padding: 28px;
    background: var(--card-bg);
    color: var(--card-ink);
  }
  .fact-tag {
    margin-top: 16px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
    color: var(--card-tag);
  }
  .fact {
    margin-top: 12px;
    font-size: 27px; font-weight: 500; line-height: 1.32;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
