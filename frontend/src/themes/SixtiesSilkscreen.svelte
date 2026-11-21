<script lang="ts">
  // "Silkscreen Pop" (1960s): four copies of the cover printed in black on
  // flat cyan, pink, yellow and green, halftone dots, colour-block labels.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());
  const TINTS = ['#4fd1e8', '#ff5fa8', '#ffd93d', '#7ed957'];
</script>

<div class="silk">
  <div class="dots"></div>

  <div class="grid">
    {#each TINTS as tint}
      <div class="tile" style="background: {tint}"><Cover /></div>
    {/each}
  </div>
  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="right">
    <div class="tags">
      <div class="letter" style="background: #4fd1e8">P</div>
      <div class="letter" style="background: #ffd93d">O</div>
      <div class="letter" style="background: #4fd1e8">P</div>
      <div class="now">{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
    </div>
    <div class="banner">
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 104, min: 60, lines: 2, lineHeight: 1, text: head.title }}>{head.title}</h1>
    </div>
    <div class="ticket">
      <div class="artist one-line">{head.artist}</div>
      <div class="arrow"></div>
    </div>
    {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
    {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}

    <div class="bottom">
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
          <div class="heading"><div>DID YOU KNOW?</div><div>{fact.counter}</div></div>
          {#key fact.index}<div class="fact clamp" style="--lines: 5">{fact.text}</div>{/key}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .silk {
    --ink: #111111;
    --record: #111;
    --record-groove: #444;
    --record-label: #ff5fa8;
    --vu-scale: #111111;
    --vu-red: #ff5fa8;
    --vu-needle: #111111;
    --vu-font: 'Poppins', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #fff8e7;
    color: var(--ink);
    font-family: 'Poppins', sans-serif;
  }
  .dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(#f2c9d8 22%, transparent 23%);
    background-size: 22px 22px;
    opacity: 0.6;
  }
  .grid {
    position: absolute;
    left: 72px;
    top: 72px;
    display: grid;
    grid-template-columns: 300px 300px;
    gap: 20px;
    padding: 6px;
    background: var(--ink);
    border: 6px solid var(--ink);
  }
  .tile {
    width: 300px;
    height: 300px;
    overflow: hidden;
  }
  /* The cover printed in black over the flat colour, like a silkscreen. */
  .tile :global(img) {
    filter: grayscale(1) contrast(1.5) brightness(1.15);
    mix-blend-mode: multiply;
  }
  .meters {
    position: absolute;
    left: 72px;
    top: 760px;
    width: 632px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .face {
    background: #fff;
    border: 4px solid var(--ink);
  }

  .right {
    position: absolute;
    left: 776px;
    top: 72px;
    width: 1072px;
    height: 936px;
    display: flex;
    flex-direction: column;
  }
  .tags {
    display: flex;
    gap: 12px;
  }
  .letter {
    width: 76px;
    height: 76px;
    border: 4px solid var(--ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Anton', sans-serif;
    font-size: 52px;
  }
  .now {
    padding: 0 22px;
    background: var(--ink);
    color: #fff8e7;
    display: flex;
    align-items: center;
    font-family: 'Anton', sans-serif;
    font-size: 40px;
    letter-spacing: 2px;
  }
  .banner {
    align-self: flex-start;
    max-width: 100%;
    margin-top: 24px;
    padding: 14px 26px;
    background: #ff5fa8;
    border: 4px solid var(--ink);
  }
  h1 {
    font-family: 'Anton', sans-serif;
    font-size: 104px;
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
  }
  .ticket {
    margin-top: 20px;
    display: flex;
    align-items: center;
    max-width: 100%;
  }
  .artist {
    min-width: 0;
    padding: 10px 28px;
    background: #ffd93d;
    border: 4px solid var(--ink);
    font-family: 'Anton', sans-serif;
    font-size: 50px;
    text-transform: uppercase;
  }
  .arrow {
    flex: none;
    width: 0;
    height: 0;
    border-top: 44px solid transparent;
    border-bottom: 44px solid transparent;
    border-left: 40px solid var(--ink);
  }
  .credit {
    font-size: 22px;
    line-height: 1.45;
    color: #333;
  }
  .ticket + .credit {
    margin-top: 14px;
  }
  .bottom {
    margin-top: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 440px;
    gap: 40px;
    align-items: end;
  }
  .lyrics {
    min-width: 0;
  }
  .line {
    min-height: 36px;
    margin: 8px 0;
    font-size: 28px;
    line-height: 1.3;
    color: #555;
  }
  .line.active {
    --lines: 2;
    font-family: 'Anton', sans-serif;
    font-size: 46px;
    line-height: 1.1;
    text-transform: uppercase;
    color: var(--ink);
  }
  .trivia {
    padding: 20px 24px;
    background: #4fd1e8;
    border: 4px solid var(--ink);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Anton', sans-serif;
    font-size: 22px;
    letter-spacing: 3px;
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
</style>
