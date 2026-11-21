<script lang="ts">
  // "Retro Stripes" (1970s): a sweeping five-colour band across black, chunky
  // shadowed type, sparkles and a round "Side A" badge.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  const BANDS = ['#f2c14e', '#f08a4b', '#e85d75', '#8fc9c2', '#5b8dbe'];
  const bands = BANDS.map((colour, i) => ({
    colour,
    // Low enough to sweep under the lyrics rather than through them.
    d: `M-40 ${1200 - i * 46} C 500 ${1200 - i * 46}, 760 ${880 - i * 46}, 1980 ${820 - i * 46}`,
  }));
  const sparkles = [
    { x: 1300, y: 110, r: 30, c: '#f2c14e' },
    { x: 1810, y: 470, r: 22, c: '#8fc9c2' },
    { x: 980, y: 520, r: 18, c: '#ffffff' },
    { x: 180, y: 60, r: 16, c: '#f08a4b' },
  ];
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
</script>

<div class="stripes">
  <svg class="bg" viewBox="0 0 1920 1080" aria-hidden="true">
    {#each bands as b}<path d={b.d} stroke={b.colour} />{/each}
    {#each sparkles as s}<path d={star(s.x, s.y, s.r)} fill={s.c} class="spark" />{/each}
  </svg>

  <div class="cover"><Cover /></div>
  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="header">
    <div class="label">{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 100, min: 56, lines: 2, lineHeight: 1.08, text: head.title }}>{head.title}</h1>
    <div class="artist one-line">{head.artist}</div>
    {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
    {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
  </div>

  <div class="badge" aria-hidden="true">
    <div class="small">SIDE A</div>
    <div class="big">33⅓</div>
    <div class="small">RPM</div>
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

  {#if fact}
    <div class="trivia">
      <div class="heading"><div>DID YOU KNOW?</div><div>{fact.counter}</div></div>
      {#key fact.index}<div class="fact clamp" style="--lines: 5">{fact.text}</div>{/key}
    </div>
  {/if}
</div>

<style>
  .stripes {
    --ink: #141210;
    --cream: #fff3de;
    --yellow: #f2c14e;
    --orange: #f08a4b;
    --pink: #e85d75;
    --teal: #8fc9c2;
    --record: #0b0a09;
    --record-groove: #3a332d;
    --record-label: #f2c14e;
    --vu-scale: #141210;
    --vu-red: #e85d75;
    --vu-needle: #141210;
    --vu-font: 'Righteous', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--ink);
    color: var(--cream);
    font-family: 'Poppins', sans-serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .bg path:not(.spark) {
    fill: none;
    stroke-width: 40;
  }
  .cover {
    position: absolute;
    left: 72px;
    top: 72px;
    width: 480px;
    height: 480px;
    border: 10px solid var(--cream);
    transform: rotate(-3deg);
    background: #2a2420;
  }
  .meters {
    position: absolute;
    left: 72px;
    top: 640px;
    width: 480px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .face {
    background: var(--cream);
    border-radius: 12px;
    overflow: hidden;
  }
  .header {
    position: absolute;
    left: 640px;
    top: 64px;
    width: 880px;
  }
  .label {
    font-family: 'Righteous', sans-serif;
    font-size: 28px;
    letter-spacing: 6px;
    color: var(--teal);
  }
  h1 {
    margin-top: 10px;
    padding-bottom: 14px;
    font-family: 'Shrikhand', serif;
    font-size: 100px;
    line-height: 1.08;
    font-weight: 400;
    text-shadow:
      6px 6px 0 var(--orange),
      12px 12px 0 var(--pink);
  }
  .artist {
    margin-top: 10px;
    font-family: 'Righteous', sans-serif;
    font-size: 50px;
    color: var(--yellow);
  }
  .credit {
    font-size: 22px;
    line-height: 1.45;
    color: #bfaf97;
  }
  .artist + .credit {
    margin-top: 6px;
  }
  .badge {
    position: absolute;
    left: 1580px;
    top: 260px;
    width: 250px;
    height: 250px;
    border-radius: 50%;
    background: var(--yellow);
    color: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform: rotate(12deg);
    font-family: 'Righteous', sans-serif;
    box-shadow:
      0 0 0 8px var(--ink),
      0 0 0 12px var(--yellow);
  }
  .badge .small {
    font-size: 30px;
    letter-spacing: 3px;
  }
  .badge .big {
    font-family: 'Shrikhand', serif;
    font-size: 80px;
    line-height: 1;
  }
  .lyrics {
    position: absolute;
    left: 640px;
    top: 560px;
    width: 640px;
  }
  .line {
    min-height: 36px;
    margin: 8px 0;
    font-size: 28px;
    line-height: 1.3;
    color: #bfaf97;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
  }
  .line.active {
    --lines: 2;
    font-family: 'Righteous', sans-serif;
    font-size: 44px;
    line-height: 1.15;
    color: var(--cream);
  }
  .trivia {
    position: absolute;
    left: 1340px;
    bottom: 72px;
    width: 508px;
    padding: 22px 26px;
    background: var(--cream);
    color: var(--ink);
    border-radius: 16px;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Righteous', sans-serif;
    font-size: 18px;
    letter-spacing: 4px;
    color: var(--pink);
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
