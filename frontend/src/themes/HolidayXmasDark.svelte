<script lang="ts">
  // "Christmas Dark: Silent Night" (Holiday): a midnight sky with a swag of
  // twinkling string lights, falling snow, gold stars and pine silhouettes;
  // gold-framed cover and glowing gold lettering.
  import HolidayBase from './HolidayBase.svelte';
  import SnowFall from '../lib/SnowFall.svelte';

  const BULBS = ['#ff4d4d', '#ffd23f', '#4fd18b', '#4fa8ff', '#ff8a3d'];
  const sag = (x: number) => 40 + (46 * (1 - Math.cos(((x % 444) / 444) * 2 * Math.PI))) / 2;
  const bulbs = Array.from({ length: 26 }, (_, i) => {
    const x = 30 + i * 74;
    return { x, y: sag(x), colour: BULBS[i % BULBS.length], delay: ((i * 0.37) % 2.4).toFixed(2) };
  });
  let wire = 'M0 ' + (sag(0) - 4).toFixed(0);
  for (let x = 12; x <= 1920; x += 12) wire += ` L${x} ${(sag(x) - 4).toFixed(0)}`;
  const pines = [
    { x: 40, h: 300 },
    { x: 170, h: 220 },
    { x: 1590, h: 190 },
    { x: 1720, h: 260 },
    { x: 1860, h: 340 },
  ].map(({ x, h }) => {
    const w = h * 0.55;
    return [0, 1, 2].map((i) => {
      const top = 1080 - h + i * h * 0.22;
      const bottom = 1080 - h * 0.45 + i * h * 0.22;
      const half = w * (0.5 + i * 0.18);
      return `${x},${top} ${x - half},${bottom} ${x + half},${bottom}`;
    });
  });
  const star = (cx: number, cy: number, r: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const rad = i % 2 ? r * 0.42 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  const stars = [star(1360, 150, 10), star(1500, 230, 7), star(980, 120, 6), star(1770, 300, 9)];
  const VARS = [
    '--bg: linear-gradient(180deg, #08131a 0%, #0b1a1f 55%, #10302a 100%)',
    '--ink: #f4f7fa',
    '--label: #e8c468',
    '--title: #fff1c9',
    '--title-glow: 0 0 24px rgba(232, 196, 104, 0.45)',
    '--artist: #e8c468',
    '--credit: #9fb4ba',
    '--frame-bg: linear-gradient(135deg, #f2d68a, #b8892e)',
    '--frame-pad: 12px',
    '--frame-radius: 6px',
    '--frame-shadow: 0 0 40px rgba(232, 196, 104, 0.25)',
    '--cover-bg: #13262b',
    '--meter-face: #0f2328',
    '--meter-border: 2px solid #e8c468',
    '--vu-scale: #e8c468',
    '--vu-red: #ff4d4d',
    '--vu-needle: #f4f7fa',
    '--card-bg: rgba(10, 26, 31, 0.85)',
    '--card-border: 1px solid rgba(232, 196, 104, 0.6)',
    '--dim: #8fa3a8',
    '--current: #fff1c9',
    '--current-style: italic',
    '--fact-bg: #0f2328',
    '--fact-ink: #f4f7fa',
    '--fact-head: #e8c468',
    '--fact-border: 2px solid #e8c468',
    '--fact-shadow: 0 0 24px rgba(232, 196, 104, 0.2)',
    '--record: #050c0e',
    '--record-groove: #1f3a40',
    '--record-label: #e8c468',
  ].join('; ');
</script>

<HolidayBase vars={VARS} labelPrefix="✦ " labelSuffix=" ✦" titleItalic>
  {#snippet scene()}
    <SnowFall count={110} sizes={[2, 2.5, 3, 4]} opacity={0.7} seconds={40} seed={9} />
    <svg class="scene" viewBox="0 0 1920 1080" aria-hidden="true">
      {#each stars as points}<polygon {points} fill="#e8c468" />{/each}
      {#each pines as tiers}
        {#each tiers as points}<polygon {points} fill="#06110f" />{/each}
      {/each}
      <path d={wire} fill="none" stroke="#3a3a34" stroke-width="3" />
      {#each bulbs as b}
        <g class="bulb" style="animation-delay: {b.delay}s">
          <rect x={b.x - 5} y={b.y - 4} width="10" height="9" rx="2" fill="#6e6a60" />
          <ellipse cx={b.x} cy={b.y + 16} rx="9" ry="14" fill={b.colour} style="filter: drop-shadow(0 0 10px {b.colour})" />
        </g>
      {/each}
    </svg>
  {/snippet}
</HolidayBase>

<style>
  .scene {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .bulb {
    animation: twinkle 2.4s ease-in-out infinite;
  }
  @keyframes twinkle {
    50% {
      opacity: 0.35;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bulb {
      animation: none;
    }
  }
</style>
