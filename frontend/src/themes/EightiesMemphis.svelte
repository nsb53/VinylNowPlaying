<script lang="ts">
  // "Memphis" (1980s): electric blue with pink blobs, yellow zigzags,
  // triangles, crosses and confetti; a tilted cover with a hard shadow.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());
  const crosses = [
    { x: 990, y: 560 },
    { x: 1450, y: 950 },
    { x: 110, y: 620 },
  ];
  const dots = [
    { x: 700, y: 300 },
    { x: 1300, y: 530 },
    { x: 1880, y: 760 },
    { x: 520, y: 60 },
  ];
</script>

<div class="memphis">
  <svg class="bg" viewBox="0 0 1920 1080" aria-hidden="true">
    <path d="M1500 -40 C 1700 60, 1980 0, 1980 0 L 1980 380 C 1820 420, 1700 300, 1560 280 S 1380 120, 1500 -40 Z" fill="#ff4f9a" />
    <path d="M-40 760 C 120 700, 260 820, 380 900 S 520 1120, 380 1120 L -40 1120 Z" fill="#ff4f9a" />
    <path d="M760 70 l 30 -30 l 30 30 l 30 -30 l 30 30 l 30 -30 l 30 30" class="zig" />
    <path d="M1650 960 l 30 -30 l 30 30 l 30 -30 l 30 30 l 30 -30" class="zig" />
    <path d="M760 1060 q 40 -40 80 0 t 80 0 t 80 0" class="squiggle" />
    <polygon points="1180,40 1240,140 1120,140" fill="#ffd23f" />
    <polygon points="640,520 690,600 590,600" class="outline" />
    <circle cx="1830" cy="560" r="34" class="outline" />
    {#each crosses as c}
      <g transform="translate({c.x} {c.y}) rotate(45)">
        <rect x="-22" y="-5" width="44" height="10" rx="4" fill="#fff" />
        <rect x="-5" y="-22" width="10" height="44" rx="4" fill="#fff" />
      </g>
    {/each}
    {#each dots as d}<circle cx={d.x} cy={d.y} r="9" fill="#ffd23f" />{/each}
  </svg>

  <div class="cover"><Cover /></div>
  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="right">
    <div class="pill">{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 92, min: 52, lines: 2, lineHeight: 1.04, text: head.title }}>{head.title}</h1>
    <div class="artist one-line">{head.artist}</div>
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
  .memphis {
    --blue: #3d5afe;
    --pink: #ff4f9a;
    --yellow: #ffd23f;
    --ink: #1b1b3a;
    --record: #10102a;
    --record-groove: #34346a;
    --record-label: #ffd23f;
    --vu-scale: #1b1b3a;
    --vu-red: #ff4f9a;
    --vu-needle: #1b1b3a;
    --vu-font: 'Poppins', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--blue);
    color: #fff;
    font-family: 'Poppins', sans-serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .zig {
    fill: none;
    stroke: var(--yellow);
    stroke-width: 12;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .squiggle {
    fill: none;
    stroke: #fff;
    stroke-width: 10;
    stroke-linecap: round;
  }
  .outline {
    fill: none;
    stroke: #fff;
    stroke-width: 8;
  }
  .cover {
    position: absolute;
    left: 110px;
    top: 90px;
    width: 470px;
    height: 470px;
    border: 12px solid #fff;
    transform: rotate(-4deg);
    box-shadow: 14px 14px 0 var(--yellow);
    background: #2f46d6;
  }
  .meters {
    position: absolute;
    left: 110px;
    top: 690px;
    width: 520px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
  }
  .face {
    background: #fff;
    border: 4px solid var(--ink);
    border-radius: 18px;
    overflow: hidden;
  }
  .right {
    position: absolute;
    left: 700px;
    top: 110px;
    width: 1148px;
    height: 900px;
    display: flex;
    flex-direction: column;
  }
  .pill {
    align-self: flex-start;
    padding: 8px 20px;
    background: var(--yellow);
    color: var(--ink);
    border-radius: 30px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 4px;
  }
  h1 {
    width: 900px;
    margin-top: 18px;
    padding-bottom: 8px;
    font-family: 'Bungee', sans-serif;
    font-size: 92px;
    line-height: 1.04;
    font-weight: 400;
    text-transform: uppercase;
    text-shadow: 6px 6px 0 var(--pink);
  }
  .artist {
    width: 900px;
    margin-top: 14px;
    font-size: 50px;
    font-weight: 800;
    color: var(--yellow);
  }
  .credit {
    width: 900px;
    font-size: 22px;
    line-height: 1.45;
    color: #dde3ff;
  }
  .artist + .credit {
    margin-top: 6px;
  }
  .bottom {
    margin-top: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 470px;
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
    color: #c9d2ff;
  }
  .line.active {
    --lines: 2;
    font-size: 42px;
    line-height: 1.15;
    font-weight: 800;
    color: #fff;
  }
  .trivia {
    padding: 22px 26px;
    background: var(--yellow);
    color: var(--ink);
    border: 4px solid var(--ink);
    border-radius: 22px;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 4px;
  }
  .fact {
    margin-top: 8px;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.32;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
