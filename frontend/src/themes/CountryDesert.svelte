<script lang="ts">
  // "Desert Sunset" (Country): a purple-to-orange sunset over mesas and
  // saguaro cacti, a silver-and-turquoise framed cover, Western lettering,
  // lyrics on a stitched tooled-leather card and a turquoise fact card.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  // Saguaro silhouettes: a trunk and two arms, each arm an elbow and an upright.
  const cacti = [
    { x: 1780, base: 900, h: 330, s: 1.2 },
    { x: 660, base: 930, h: 220, s: 0.8 },
    { x: 1300, base: 880, h: 160, s: 0.6 },
  ].map(({ x, base, h, s }) => {
    const w = 34 * s;
    return [
      { x: x - w / 2, y: base - h, w, h, r: w / 2 },
      { x: x - w / 2 - 46 * s, y: base - h * 0.62, w: w * 0.8, h: h * 0.34, r: w * 0.4 },
      { x: x - w / 2 - 46 * s, y: base - h * 0.34, w: 50 * s, h: w * 0.7, r: w * 0.35 },
      { x: x + w / 2 + 18 * s, y: base - h * 0.78, w: w * 0.8, h: h * 0.38, r: w * 0.4 },
      { x: x + w / 2 - 4 * s, y: base - h * 0.46, w: 50 * s, h: w * 0.7, r: w * 0.35 },
    ];
  });
</script>

<div class="desert">
  <svg class="land" viewBox="0 0 1920 1080" aria-hidden="true">
    <circle cx="1500" cy="640" r="230" class="sun" />
    <path d="M0 760 L 120 760 L 160 700 L 420 700 L 470 760 L 900 760 L 940 720 L 1180 720 L 1220 770 L 1920 770 L 1920 1080 L 0 1080 Z" class="mesa" />
    <path d="M0 860 C 400 830, 900 880, 1920 840 L 1920 1080 L 0 1080 Z" class="ground" />
    {#each cacti as parts}
      {#each parts as p}<rect x={p.x} y={p.y} width={p.w} height={p.h} rx={p.r} class="cactus" />{/each}
    {/each}
  </svg>

  <div class="frame"><div class="cover"><Cover /></div></div>
  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="header">
    <div class="label">★ {head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'} ★</div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 96, min: 56, lines: 2, lineHeight: 1.08, text: head.title }}>{head.title}</h1>
    <div class="artist one-line">{head.artist}</div>
    {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
    {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
  </div>

  <div class="leather">
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
      {#key fact.index}<div class="fact clamp" style="--lines: 6">{fact.text}</div>{/key}
    </div>
  {/if}
</div>

<style>
  .desert {
    --cream: #fff4e6;
    --gold: #ffd27a;
    --plum: #5a2e3a;
    --turquoise: #2a9d8f;
    --leather: #8b5a2b;
    --stitch: #f3d9b1;
    --record: #22101a;
    --record-groove: #4a2a36;
    --record-label: #2a9d8f;
    --vu-scale: #3a1c26;
    --vu-red: #e8674a;
    --vu-needle: #3a1c26;
    --vu-font: 'Bitter', serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: linear-gradient(180deg, #3b1e54 0%, #8e3b6b 30%, #e8674a 58%, #f6b05b 75%, #f6b05b 100%);
    color: var(--cream);
    font-family: 'Bitter', serif;
  }
  .land {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .sun {
    fill: var(--gold);
    opacity: 0.95;
  }
  .mesa {
    fill: var(--plum);
  }
  .ground {
    fill: #3a1c26;
  }
  .cactus {
    fill: #22101a;
  }

  /* Silver frame with a turquoise edge, like a Western belt buckle. */
  .frame {
    position: absolute;
    left: 90px;
    top: 90px;
    width: 520px;
    height: 520px;
    padding: 12px;
    background: linear-gradient(135deg, #e3e6ea, #9aa3ad);
    border: 6px solid var(--turquoise);
    border-radius: 10px;
  }
  .cover {
    width: 100%;
    height: 100%;
    background: #3a2a40;
  }
  .meters {
    position: absolute;
    left: 90px;
    top: 700px;
    width: 520px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .face {
    background: var(--cream);
    border: 4px solid var(--turquoise);
    border-radius: 10px;
    overflow: hidden;
  }

  .header {
    position: absolute;
    left: 700px;
    top: 80px;
    width: 1140px;
  }
  .label {
    font-family: 'Alfa Slab One', serif;
    font-size: 28px;
    letter-spacing: 8px;
    color: var(--gold);
  }
  h1 {
    margin-top: 14px;
    padding-bottom: 10px;
    font-family: 'Rye', serif;
    font-size: 96px;
    line-height: 1.08;
    font-weight: 400;
    text-shadow: 5px 5px 0 var(--plum);
  }
  .artist {
    margin-top: 12px;
    font-family: 'Alfa Slab One', serif;
    font-size: 50px;
    color: var(--gold);
    text-shadow: 3px 3px 0 rgba(90, 46, 58, 0.6);
  }
  .credit {
    font-size: 22px;
    line-height: 1.45;
    color: #fce3d0;
  }
  .artist + .credit {
    margin-top: 6px;
  }

  /* Tooled leather with a stitched edge. */
  .leather {
    position: absolute;
    left: 700px;
    top: 520px;
    width: 700px;
    padding: 34px 40px;
    background-color: var(--leather);
    background-image: radial-gradient(rgba(0, 0, 0, 0.12) 1px, transparent 1.5px);
    background-size: 6px 6px;
    border-radius: 18px;
    outline: 3px dashed var(--stitch);
    outline-offset: -16px;
    box-shadow: 0 14px 26px rgba(34, 16, 26, 0.45);
  }
  .line {
    min-height: 33px;
    margin: 8px 0;
    font-size: 25px;
    line-height: 1.3;
    color: var(--stitch);
  }
  .line.active {
    --lines: 2;
    font-family: 'Rye', serif;
    font-size: 38px;
    line-height: 1.18;
    color: var(--cream);
  }

  .trivia {
    position: absolute;
    left: 1440px;
    top: 560px;
    width: 400px;
    padding: 22px 24px;
    background: var(--turquoise);
    color: #f4fffc;
    border: 4px solid #e3e6ea;
    border-radius: 14px;
    box-shadow: 0 14px 26px rgba(34, 16, 26, 0.45);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'Alfa Slab One', serif;
    font-size: 17px;
    letter-spacing: 2px;
    color: #ffe7a8;
  }
  .fact {
    margin-top: 8px;
    font-size: 20px;
    line-height: 1.35;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
