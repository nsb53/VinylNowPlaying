<script lang="ts">
  // "Disco Ball" (1970s): purple night, a field of coloured lights that
  // twinkle, a tiled mirror ball that glints, neon outline type.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  // A fixed pseudo-random sequence, so the lights look the same on every screen.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const COLOURS = ['#ff4fd8', '#b36bff', '#4fe3ff', '#ffe14f', '#7dff6b'];
  const lights: { x: number; y: number; r: number; fill: string; o: number; twinkle: boolean; delay: number; dur: number }[] = [];
  for (let x = 30; x < 1920; x += 60) {
    for (let y = 30; y < 1080; y += 60) {
      lights.push({
        x,
        y,
        r: 3 + Math.floor(rand() * 3),
        fill: COLOURS[Math.floor(rand() * COLOURS.length)],
        o: 0.25 + rand() * 0.6,
        twinkle: rand() < 0.33,
        delay: rand() * 4,
        dur: 1.6 + rand() * 2.4,
      });
    }
  }
  const tiles: { x: number; y: number; shade: number; o: number }[] = [];
  for (let row = -6; row <= 6; row += 1) {
    for (let col = -6; col <= 6; col += 1) {
      const x = 1660 + col * 26;
      const y = 210 + row * 26;
      if ((x - 1660) ** 2 + (y - 210) ** 2 < 160 ** 2) {
        tiles.push({ x, y, shade: 200 + Math.floor(rand() * 55), o: [0.5, 0.7, 0.9, 1][Math.floor(rand() * 4)] });
      }
    }
  }
  const glints = [
    { x: 1580, y: 130, r: 30, delay: 0 },
    { x: 1740, y: 290, r: 22, delay: 1.1 },
    { x: 1700, y: 120, r: 16, delay: 2.2 },
    { x: 1600, y: 280, r: 18, delay: 3.0 },
  ];
  const star = (x: number, y: number, r: number) =>
    `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
</script>

<div class="disco">
  <svg class="bg" viewBox="0 0 1920 1080" aria-hidden="true">
    {#each lights as l}
      <circle
        cx={l.x}
        cy={l.y}
        r={l.r}
        fill={l.fill}
        class:twinkle={l.twinkle}
        style="opacity: {l.o}; animation-delay: {l.delay}s; animation-duration: {l.dur}s"
      />
    {/each}
    <line x1="1660" y1="0" x2="1660" y2="50" stroke="#bbb" stroke-width="3" />
    <clipPath id="disco-ball"><circle cx="1660" cy="210" r="160" /></clipPath>
    <circle cx="1660" cy="210" r="164" fill="#6e6a80" />
    <g clip-path="url(#disco-ball)">
      {#each tiles as t}
        <rect x={t.x - 12} y={t.y - 12} width="24" height="24" fill="rgb({t.shade},{t.shade - 20},{t.shade + 10})" opacity={t.o} />
      {/each}
    </g>
    {#each glints as g}
      <path d={star(g.x, g.y, g.r)} class="glint" style="animation-delay: {g.delay}s" />
    {/each}
  </svg>

  <div class="cover"><Cover /></div>
  <div class="meters">
    <div class="face"><VuMeter channel="L" /></div>
    <div class="face"><VuMeter channel="R" /></div>
  </div>

  <div class="right">
    <div class="label">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 88, min: 52, lines: 2, lineHeight: 1.15, text: head.title }}>{head.title}</h1>
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
  .disco {
    --pink: #ff4fd8;
    --violet: #b36bff;
    --record: #0d0418;
    --record-groove: #3a1a55;
    --record-label: #ff4fd8;
    --vu-scale: #e6c8ff;
    --vu-red: #ff4fd8;
    --vu-needle: #ffffff;
    --vu-font: 'Poppins', sans-serif;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: radial-gradient(ellipse at 60% 30%, #3a0f57 0%, #12061f 70%);
    color: #fff;
    font-family: 'Poppins', sans-serif;
  }
  .bg {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .twinkle {
    animation: twinkle 2.4s ease-in-out infinite;
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.15;
    }
    50% {
      opacity: 1;
    }
  }
  .glint {
    fill: #fff;
    transform-box: fill-box;
    transform-origin: center;
    animation: glint 4s ease-in-out infinite;
  }
  @keyframes glint {
    0%,
    70%,
    100% {
      opacity: 0;
      transform: scale(0.2) rotate(0deg);
    }
    80% {
      opacity: 1;
      transform: scale(1) rotate(45deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .twinkle,
    .glint {
      animation: none;
    }
    .glint {
      opacity: 0.8;
    }
  }

  .cover {
    position: absolute;
    left: 72px;
    top: 120px;
    width: 540px;
    height: 540px;
    border: 4px solid var(--pink);
    box-shadow:
      0 0 24px var(--pink),
      0 0 60px rgba(255, 79, 216, 0.5);
    background: #2a0e3d;
  }
  .meters {
    position: absolute;
    left: 72px;
    top: 760px;
    width: 540px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .face {
    background: #170a24;
    border: 2px solid var(--violet);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 0 14px rgba(179, 107, 255, 0.6);
  }

  .right {
    position: absolute;
    left: 700px;
    top: 120px;
    width: 1148px;
    height: 900px;
    display: flex;
    flex-direction: column;
  }
  .label {
    width: 760px;
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 10px;
    color: #e6c8ff;
  }
  h1 {
    width: 820px;
    margin-top: 14px;
    padding-bottom: 6px;
    font-family: 'Monoton', sans-serif;
    font-size: 88px;
    line-height: 1.15;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffd1f5;
    text-shadow:
      0 0 8px var(--pink),
      0 0 24px var(--pink),
      0 0 48px var(--violet);
  }
  .artist {
    width: 820px;
    margin-top: 14px;
    font-size: 48px;
    font-weight: 600;
    color: #f4ff8a;
    text-shadow: 0 0 16px rgba(244, 255, 138, 0.7);
  }
  .credit {
    width: 820px;
    font-size: 22px;
    line-height: 1.45;
    color: #c9a8e0;
  }
  .artist + .credit {
    margin-top: 8px;
  }
  .bottom {
    margin-top: auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 480px;
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
    color: #b9a0cc;
  }
  .line.active {
    --lines: 2;
    font-size: 42px;
    line-height: 1.15;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 0 14px rgba(255, 79, 216, 0.6);
  }
  .trivia {
    padding: 22px 26px;
    background: rgba(18, 6, 31, 0.85);
    border: 2px solid var(--pink);
    border-radius: 14px;
    box-shadow: 0 0 16px rgba(255, 79, 216, 0.5);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
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
