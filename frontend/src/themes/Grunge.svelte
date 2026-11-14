<script lang="ts">
  // "Grunge": dark and worn, the cover on a square of flannel, facts on a torn scrap of paper.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, headline, lyricView, factView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const fact = $derived(factView());
</script>

<div class="grunge">
  <div class="scratches"></div>

  <div class="left">
    <div class="stack">
      <div class="plaid"></div>
      <div class="cover"><Cover /></div>
      <div class="tape"></div>
    </div>
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>

  <div class="right">
    <div class="header">
      <div class="label">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 112, min: 60, lines: 2, lineHeight: 0.98, text: head.title }}>
        {head.title}
      </h1>
      <div class="artist one-line">{head.artist}</div>
      {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
      {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
    </div>

    <div class="body">
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
  .grunge {
    --paper: #d9d2be;
    --rust: #8e2b1f;
    --mustard: #c9a227;
    --muted: #a39e8c;
    --record: #000;
    --record-groove: #45473c;
    --record-label: #c9a227;
    --vu-scale: #1b1c18;
    --vu-red: #8e2b1f;
    --vu-needle: #1b1c18;
    --vu-font: 'Special Elite', monospace;

    position: relative;
    width: 1920px;
    height: 1080px;
    padding: 64px;
    display: grid;
    grid-template-columns: 660px minmax(0, 1fr);
    grid-gap: 72px;
    overflow: hidden;
    background: radial-gradient(1500px 900px at 55% 40%, #2b2d25 0%, #151612 100%);
    color: var(--paper);
    font-family: 'Special Elite', monospace;
  }
  .scratches {
    position: absolute;
    left: 0;
    top: 0;
    width: 1920px;
    height: 1080px;
    background-image:
      repeating-linear-gradient(112deg, rgba(255, 255, 255, 0.035) 0 2px, rgba(255, 255, 255, 0) 2px 13px),
      repeating-linear-gradient(8deg, rgba(0, 0, 0, 0.22) 0 1px, rgba(0, 0, 0, 0) 1px 7px);
  }

  .left,
  .right {
    position: relative;
    height: 952px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .stack {
    position: relative;
    width: 660px;
    height: 660px;
  }
  /* Red and black flannel check. */
  .plaid {
    position: absolute;
    left: 0;
    top: 14px;
    width: 640px;
    height: 640px;
    transform: rotate(-3deg);
    background-color: #7a1f1a;
    background-image:
      repeating-linear-gradient(
        0deg,
        rgba(15, 12, 10, 0.72) 0 46px,
        rgba(15, 12, 10, 0) 46px 92px,
        rgba(15, 12, 10, 0.3) 92px 100px,
        rgba(15, 12, 10, 0) 100px 150px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(15, 12, 10, 0.72) 0 46px,
        rgba(15, 12, 10, 0) 46px 92px,
        rgba(15, 12, 10, 0.3) 92px 100px,
        rgba(15, 12, 10, 0) 100px 150px
      );
  }
  .cover {
    position: absolute;
    left: 34px;
    top: 22px;
    width: 600px;
    height: 600px;
    overflow: hidden;
    background: #0e0f0c;
    border: 10px solid var(--paper);
    transform: rotate(1.5deg);
  }
  .tape {
    position: absolute;
    left: 250px;
    top: 0;
    width: 170px;
    height: 46px;
    background: rgba(217, 210, 190, 0.55);
    transform: rotate(-4deg);
  }

  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 28px;
  }
  .face {
    background: var(--paper);
    border: 5px solid #0e0f0c;
    overflow: hidden;
  }

  .label,
  .heading {
    font-size: 22px;
    letter-spacing: 4px;
  }
  .label {
    color: var(--mustard);
  }
  h1 {
    margin-top: 10px;
    padding-bottom: 4px;
    font-family: 'Rubik Dirt', sans-serif;
    font-size: 112px;
    line-height: 0.98;
    font-weight: 400;
    text-transform: uppercase;
  }
  .artist {
    margin-top: 6px;
    padding: 4px 8px 4px 0;
    font-family: 'Permanent Marker', cursive;
    font-size: 60px;
    line-height: 1.15;
    color: var(--mustard);
    transform: rotate(-1.5deg);
    transform-origin: left center;
  }
  .credit {
    font-size: 24px;
    line-height: 1.45;
    color: var(--muted);
  }
  .artist + .credit {
    margin-top: 10px;
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 470px;
    grid-gap: 56px;
    align-items: end;
  }

  .heading {
    display: flex;
    justify-content: space-between;
    color: var(--muted);
  }
  .ruled {
    padding-bottom: 10px;
    border-bottom: 3px solid #5b6236;
  }
  .lyrics {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .lyrics .heading {
    align-self: stretch;
  }
  .line {
    max-width: 100%;
    margin-top: 14px;
    min-height: 37px;
    font-size: 28px;
    line-height: 1.3;
    color: var(--muted);
  }
  .line.active {
    --lines: 2;
    font-family: 'Permanent Marker', cursive;
    font-size: 44px;
    line-height: 1.2;
    color: #f0ead8;
    border-bottom: 7px solid var(--rust);
  }

  /* A scrap of paper with ragged top and bottom edges. */
  .trivia {
    max-height: 524px;
    overflow: hidden;
    padding: 34px 30px;
    background: var(--paper);
    color: #1b1c18;
    transform: rotate(-1.5deg);
    clip-path: polygon(
      0 3%, 6% 0, 13% 2.5%, 21% 0.5%, 30% 3%, 39% 0, 48% 2%, 57% 0.5%, 66% 3%, 75% 0, 84% 2.5%, 92% 0.5%, 100% 3%,
      100% 97%, 93% 100%, 85% 97.5%, 76% 99.5%, 67% 97%, 58% 100%, 49% 98%, 40% 99.5%, 31% 97%, 22% 100%, 14% 97.5%,
      7% 99.5%, 0 97%
    );
  }
  .trivia .heading {
    color: #5a1a12;
  }
  .fact-tag {
    margin-top: 16px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
    font-family: 'Permanent Marker', cursive; letter-spacing: 1px; color: var(--rust);
  }
  .fact {
    margin-top: 12px;
    font-size: 26px; line-height: 1.35;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
