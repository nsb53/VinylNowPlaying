<script lang="ts">
  // "Thanksgiving: Harvest Table" (Holiday): warm linen, plaid edges, autumn
  // leaves around the border and a cluster of pumpkins, cover in a wooden frame
  // with a plaid mat.
  import HolidayBase from './HolidayBase.svelte';
  import { seeded } from '../lib/seeded';

  const COLOURS = ['#d9692b', '#8e2a2e', '#d9a53a', '#b5562a', '#6b7a3a'];
  const rand = seeded(42);
  // Leaves only around the edges, clear of the text and cards.
  const leaves: { x: number; y: number; s: number; a: number; c: string }[] = [];
  while (leaves.length < 22) {
    const x = 640 + rand() * 1270;
    const y = 10 + rand() * 1060;
    if (x > 680 && x < 1860 && y > 110 && y < 1000) continue;
    leaves.push({ x, y, s: (18 + rand() * 16) / 30, a: rand() * 360, c: COLOURS[Math.floor(rand() * COLOURS.length)] });
  }
  const pumpkins = [
    { x: 1650, y: 990, r: 80, body: '#d9692b', rib: '#b5501f' },
    { x: 1800, y: 1015, r: 56, body: '#d9a53a', rib: '#b5862a' },
    { x: 1525, y: 1030, r: 46, body: '#e8d9b5', rib: '#c9b48a' },
  ];
  const LOBES = [
    { dx: -0.42, w: 0.55 },
    { dx: 0.42, w: 0.55 },
    { dx: 0, w: 0.6 },
  ];
  const VARS = [
    '--bg: #f5ebdd',
    '--ink: #4a2c1d',
    '--label: #8e2a2e',
    '--title: #4a2c1d',
    '--artist: #d9692b',
    '--credit: #7a5a44',
    '--frame-bg: linear-gradient(135deg, #8a5a32, #5c3a1e)',
    '--frame-pad: 22px',
    '--frame-radius: 6px',
    '--frame-shadow: 0 14px 28px rgba(74, 44, 29, 0.35)',
    '--cover-border: 10px solid #d9a53a',
    '--cover-bg: #3a2418',
    '--meter-face: #fff8ec',
    '--meter-border: 4px solid #4a2c1d',
    '--vu-scale: #4a2c1d',
    '--vu-red: #8e2a2e',
    '--vu-needle: #4a2c1d',
    '--card-bg: #fff8ec',
    '--card-border: 3px solid #d9a53a',
    '--card-shadow: 0 10px 22px rgba(74, 44, 29, 0.18)',
    '--dim: #8a6a55',
    '--current: #8e2a2e',
    '--fact-bg: #8e2a2e',
    '--fact-ink: #fff4e6',
    '--fact-head: #f6c97a',
    '--fact-shadow: 0 10px 22px rgba(74, 44, 29, 0.3)',
    '--record: #2a170b',
    '--record-groove: #5c3a1e',
    '--record-label: #d9692b',
  ].join('; ');
</script>

<HolidayBase vars={VARS} labelPrefix="GIVING THANKS · " titleItalic>
  {#snippet scene()}
    <div class="plaid top"></div>
    <div class="plaid bottom"></div>
    <svg class="scene" viewBox="0 0 1920 1080" aria-hidden="true">
      {#each leaves as l}
        <g transform="translate({l.x} {l.y}) rotate({l.a}) scale({l.s})">
          <path d="M0 -30 C 20 -20, 20 12, 0 30 C -20 12, -20 -20, 0 -30 Z" fill={l.c} />
          <path d="M0 -24 L 0 34" stroke="rgba(60, 30, 15, 0.55)" stroke-width="2.5" />
        </g>
      {/each}
      {#each pumpkins as p}
        {#each LOBES as lobe}
          <ellipse cx={p.x + lobe.dx * p.r} cy={p.y} rx={p.r * lobe.w} ry={p.r * 0.82} fill={p.body} stroke={p.rib} stroke-width="3" />
        {/each}
        <rect x={p.x - p.r * 0.07} y={p.y - p.r * 1.02} width={p.r * 0.14} height={p.r * 0.3} rx="4" fill="#5a3a1e" />
      {/each}
    </svg>
  {/snippet}
</HolidayBase>

<style>
  .plaid {
    position: absolute;
    left: 0;
    width: 1920px;
    height: 28px;
    background:
      repeating-linear-gradient(90deg, rgba(142, 42, 46, 0.85) 0 18px, transparent 18px 36px),
      repeating-linear-gradient(0deg, rgba(74, 44, 29, 0.55) 0 18px, transparent 18px 36px),
      #d9a53a;
  }
  .plaid.top {
    top: 0;
  }
  .plaid.bottom {
    bottom: 0;
  }
  .scene {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
</style>
