<script lang="ts">
  // "Jewel Case" (1990s): the cover in a CD jewel case with a ridged hinge, a
  // rainbow disc sliding out behind it and turning while a song plays,
  // liner-notes typography and a barcode.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());
  // A decorative barcode: fixed bar widths.
  const WIDTHS = [2, 3, 1, 4, 2, 1, 3, 2, 1, 2, 4, 1, 2, 3, 1, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 2, 1, 3];
  const bars: { x: number; w: number }[] = [];
  for (let i = 0, x = 0; i < WIDTHS.length; i += 1) {
    if (i % 2 === 0) bars.push({ x, w: WIDTHS[i] * 2 });
    x += WIDTHS[i] * 2 + 1;
  }
</script>

<div class="jewel">
  <div class="disc" class:turning={head.playing}>
    <div class="hub"></div>
    <div class="hole"></div>
  </div>
  <div class="case">
    <div class="hinge"></div>
    <div class="cover"><Cover /></div>
    <div class="glare"></div>
  </div>
  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="right">
    <div class="top-rule"><div>{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div><div>COMPACT · DISC</div></div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 108, min: 60, lines: 2, lineHeight: 0.96, text: head.title }}>{head.title}</h1>
    <div class="artist one-line">{head.artist}</div>
    <div class="credits">
      {#if info.release}<div class="one-line">{info.release}</div>{/if}
      {#if info.writers}<div class="one-line">{info.writers}</div>{/if}
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

    <div class="bottom">
      {#if fact}
        <div class="trivia">
          <div class="heading"><div>DID YOU KNOW?</div><div>{fact.counter}</div></div>
          {#key fact.index}<div class="fact clamp" style="--lines: 4">{fact.text}</div>{/key}
        </div>
      {:else}
        <div></div>
      {/if}
      <div class="barcode" aria-hidden="true">
        <svg viewBox="0 0 150 70">
          {#each bars as b}<rect x={b.x} y="0" width={b.w} height="70" />{/each}
        </svg>
        <div>0 33 1/3 RPM 4</div>
      </div>
    </div>
  </div>
</div>

<style>
  .jewel {
    --text: #e8e8ea;
    --muted: #9a9ea8;
    --rule: #3a3e46;
    --record: #0d0e11;
    --record-groove: #2a2d33;
    --record-label: #9dd3f7;
    --vu-scale: #e8e8ea;
    --vu-red: #9dd3f7;
    --vu-needle: #ffffff;
    --vu-font: 'Inter', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: radial-gradient(ellipse at 30% 40%, #2c3038 0%, #15171b 75%);
    color: var(--text);
    font-family: 'Inter', sans-serif;
  }
  .disc {
    position: absolute;
    left: 330px;
    top: 150px;
    width: 640px;
    height: 640px;
    border-radius: 50%;
    background: conic-gradient(from 30deg, #d8dce6, #f7c6e8, #bfe8f7, #e8f7bf, #f7e2bf, #d8dce6, #c6d0f7, #d8dce6);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  }
  .disc.turning {
    animation: disc 6s linear infinite;
  }
  @keyframes disc {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .disc.turning {
      animation: none;
    }
  }
  .hub {
    position: absolute;
    left: 210px;
    top: 210px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: rgba(240, 240, 245, 0.55);
    border: 2px solid rgba(255, 255, 255, 0.7);
  }
  .hole {
    position: absolute;
    left: 290px;
    top: 290px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #15171b;
  }
  .case {
    position: absolute;
    left: 72px;
    top: 130px;
    width: 680px;
    height: 680px;
    padding: 20px 20px 20px 54px;
    background: rgba(220, 230, 240, 0.12);
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-radius: 6px;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.55);
  }
  .hinge {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 34px;
    background: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0 3px, rgba(255, 255, 255, 0.08) 3px 9px);
    border-right: 2px solid rgba(255, 255, 255, 0.35);
  }
  .cover {
    width: 602px;
    height: 636px;
    background: #2a2d33;
  }
  .glare {
    position: absolute;
    left: 54px;
    top: 20px;
    width: 300px;
    height: 636px;
    background: linear-gradient(115deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 60%);
    pointer-events: none;
  }
  .meters {
    position: absolute;
    left: 72px;
    top: 850px;
    width: 520px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .face {
    background: #1e2026;
    border: 1px solid var(--rule);
    border-radius: 6px;
    overflow: hidden;
  }

  .right {
    position: absolute;
    left: 1080px;
    top: 110px;
    width: 768px;
    height: 900px;
    display: flex;
    flex-direction: column;
  }
  .top-rule {
    display: flex;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--rule);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 6px;
    color: var(--muted);
  }
  h1 {
    margin-top: 22px;
    padding-bottom: 6px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 108px;
    line-height: 0.96;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: -1px;
  }
  .artist {
    margin-top: 10px;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 50px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: #c9cdd6;
  }
  .credits {
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid var(--rule);
    font-size: 20px;
    line-height: 1.5;
    color: var(--muted);
  }
  .lyrics {
    margin-top: auto;
  }
  .line {
    min-height: 34px;
    margin: 6px 0;
    font-size: 26px;
    line-height: 1.3;
    color: #8a8e98;
  }
  .line.active {
    --lines: 2;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 46px;
    line-height: 1.08;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text);
  }
  .bottom {
    margin-top: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 150px;
    gap: 24px;
    align-items: end;
  }
  .trivia {
    padding: 18px 22px;
    border: 1px solid var(--rule);
    background: rgba(255, 255, 255, 0.04);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #9dd3f7;
  }
  .fact {
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.38;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
  .barcode svg {
    display: block;
    width: 150px;
    height: 70px;
    fill: #e8e8ea;
  }
  .barcode div {
    margin-top: 6px;
    font-size: 13px;
    letter-spacing: 2px;
    color: var(--muted);
  }
</style>
