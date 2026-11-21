<script lang="ts">
  // "Psychedelic Poster" (1960s): vibrating rings of orange, magenta, lime and
  // purple around a round cover, fat melting type.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  const RING = ['#ff7a00', '#e0218a', '#c6e23a', '#7b2fbe'];
  const rings = Array.from({ length: 15 }, (_, i) => ({ r: 980 - i * 48, fill: RING[i % 4] }));
  const waves = Array.from({ length: 13 }, (_, i) => {
    const y = 40 + i * 80;
    return `M0 ${y} C 240 ${y - 40}, 480 ${y + 40}, 720 ${y} S 1200 ${y - 40}, 1440 ${y} S 1680 ${y + 40}, 1920 ${y}`;
  });
</script>

<div class="psych">
  <svg class="bg" viewBox="0 0 1920 1080" aria-hidden="true">
    {#each rings as ring}<circle cx="420" cy="540" r={ring.r} fill={ring.fill} />{/each}
    {#each waves as d}<path {d} class="wave" />{/each}
  </svg>
  <div class="cover"><Cover /></div>
  <div class="panel"></div>

  <div class="right">
    <div class="label">{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 100, min: 56, lines: 2, lineHeight: 1.04, text: head.title }}>{head.title}</h1>
    <div class="artist one-line">{head.artist}</div>
    {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
    {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}

    <div class="lyrics">
      {#if lyrics.lines.length}
        {#each lyrics.lines as l}
          <div class={l.active ? 'line active clamp' : 'line one-line'}>{l.text}</div>
        {/each}
      {:else}
        <div class="line">{lyrics.note}</div>
      {/if}
    </div>

    <div class="bottom">
      <div class="meters">
        <div class="face"><VuMeter channel="L" /></div>
        <div class="face"><VuMeter channel="R" /></div>
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
  .psych {
    --purple: #2b0f4a;
    --cream: #fff4d6;
    --lime: #c6e23a;
    --orange: #ff7a00;
    --magenta: #e0218a;
    --record: #1a0830;
    --record-groove: #4a2a70;
    --record-label: #c6e23a;
    --vu-scale: #2b0f4a;
    --vu-red: #e0218a;
    --vu-needle: #2b0f4a;
    --vu-font: 'Poppins', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--purple);
    color: var(--cream);
    font-family: 'Poppins', sans-serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .wave {
    fill: none;
    stroke: var(--purple);
    stroke-width: 3;
    opacity: 0.25;
  }
  /* Round, like a record label in the middle of the rings. */
  .cover {
    position: absolute;
    left: 170px;
    top: 290px;
    width: 500px;
    height: 500px;
    border: 10px solid var(--cream);
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 0 0 8px var(--purple);
    background: #3b1866;
  }
  .panel {
    position: absolute;
    left: 980px;
    top: 0;
    width: 940px;
    height: 1080px;
    background: var(--purple);
  }
  .right {
    position: absolute;
    left: 1040px;
    top: 70px;
    width: 810px;
    height: 950px;
    display: flex;
    flex-direction: column;
  }
  .label {
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 30px;
    letter-spacing: 4px;
    color: var(--lime);
  }
  h1 {
    margin-top: 10px;
    padding-bottom: 10px;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 100px;
    line-height: 1.04;
    font-weight: 400;
    color: var(--lime);
    -webkit-text-stroke: 3px var(--magenta);
    paint-order: stroke fill;
    text-shadow: 7px 7px 0 var(--orange);
  }
  .artist {
    margin-top: 10px;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 48px;
    color: var(--orange);
  }
  .credit {
    font-size: 21px;
    line-height: 1.45;
    color: #d7c2f0;
  }
  .artist + .credit {
    margin-top: 8px;
  }
  .lyrics {
    margin-top: auto;
  }
  .line {
    min-height: 34px;
    margin: 8px 0;
    font-size: 26px;
    line-height: 1.3;
    color: #bfa8de;
  }
  .line.active {
    --lines: 2;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 42px;
    line-height: 1.15;
    color: var(--cream);
  }
  .bottom {
    margin-top: 28px;
    display: grid;
    grid-template-columns: 400px minmax(0, 1fr);
    gap: 28px;
    align-items: end;
  }
  .meters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .face {
    background: var(--cream);
    border-radius: 12px;
    overflow: hidden;
  }
  .trivia {
    padding: 18px 22px;
    background: var(--lime);
    color: var(--purple);
    border-radius: 18px;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Bagel Fat One', sans-serif;
    font-size: 20px;
    letter-spacing: 3px;
    color: #7b2fbe;
  }
  .fact {
    margin-top: 6px;
    font-size: 20px;
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
