<script lang="ts">
  // "Snowy Christmas Light: Winter Wonderland" (Holiday): pale icy sky, snow
  // hills, snow-laden pines and a little red cabin, gentle snowfall, and snow
  // piled on top of the cover, meters and cards.
  import HolidayBase from './HolidayBase.svelte';
  import SnowFall from '../lib/SnowFall.svelte';

  // Snow-laden pine: three tiers, each with a cap of snow.
  const pines = [
    { x: 1440, base: 830, h: 240 },
    { x: 1840, base: 840, h: 300 },
    { x: 1560, base: 980, h: 150 },
    { x: 70, base: 880, h: 260 },
    { x: 200, base: 900, h: 180 },
  ].map(({ x, base, h }) => {
    const w = h * 0.6;
    const tiers = [0, 1, 2].map((i) => {
      const top = base - h + i * h * 0.24;
      const bottom = base - h * 0.4 + i * h * 0.24;
      const half = w * (0.42 + i * 0.16);
      const mid = top + (bottom - top) * 0.55;
      return {
        tree: `${x},${top} ${x - half},${bottom} ${x + half},${bottom}`,
        snow: `M${x - half * 0.55} ${mid} Q ${x} ${top + (bottom - top) * 0.35} ${x + half * 0.55} ${mid} Q ${x} ${top + (bottom - top) * 0.7} ${x - half * 0.55} ${mid} Z`,
      };
    });
    return { tiers, trunk: { x: x - h * 0.05, y: base - h * 0.42 + 2 * h * 0.24, w: h * 0.1, h: h * 0.12 } };
  });
  const VARS = [
    '--bg: linear-gradient(180deg, #cfe6f7 0%, #eaf4fb 60%, #f7fbff 100%)',
    '--ink: #1e3a5f',
    '--label: #b3122e',
    '--title: #1e3a5f',
    '--artist: #b3122e',
    '--credit: #4a6a8a',
    '--frame-bg: #ffffff',
    '--frame-border: 4px solid #9cc7e8',
    '--frame-radius: 10px',
    '--frame-shadow: 0 14px 28px rgba(30, 58, 95, 0.18)',
    '--cover-bg: #dce9f3',
    '--meter-face: #ffffff',
    '--meter-border: 3px solid #9cc7e8',
    '--vu-scale: #1e3a5f',
    '--vu-red: #b3122e',
    '--vu-needle: #1e3a5f',
    '--card-bg: rgba(255, 255, 255, 0.92)',
    '--card-border: 3px solid #9cc7e8',
    '--dim: #6a86a3',
    '--current: #1e3a5f',
    '--fact-bg: #b3122e',
    '--fact-ink: #fff6f0',
    '--fact-head: #ffe3b0',
    '--record: #10213a',
    '--record-groove: #34507a',
    '--record-label: #b3122e',
  ].join('; ');
</script>

<HolidayBase vars={VARS} label="festive" artistItalic snow>
  {#snippet scene()}
    <svg class="scene" viewBox="0 0 1920 1080" aria-hidden="true">
      <path d="M0 820 C 300 760, 600 800, 900 770 S 1500 740, 1920 790 L 1920 1080 L 0 1080 Z" fill="#eaf4fb" />
      <path d="M0 900 C 400 860, 800 920, 1200 880 S 1700 860, 1920 900 L 1920 1080 L 0 1080 Z" fill="#ffffff" />
      <path d="M0 900 C 400 860, 800 920, 1200 880 S 1700 860, 1920 900" fill="none" stroke="#d6e7f4" stroke-width="6" />
      {#each pines as p}
        {#each p.tiers as t}
          <polygon points={t.tree} fill="#1f5a3a" />
          <path d={t.snow} fill="#ffffff" />
        {/each}
        <rect x={p.trunk.x} y={p.trunk.y} width={p.trunk.w} height={p.trunk.h} fill="#5a3a2a" />
      {/each}
      <g transform="translate(1180 925)">
        <path d="M70 -76 q -10 -16 8 -30" fill="none" stroke="#c9d8e6" stroke-width="10" stroke-linecap="round" opacity="0.8" />
        <rect x="55" y="-70" width="28" height="50" fill="#7a3a2a" />
        <rect x="-10" y="0" width="200" height="120" fill="#b3122e" />
        <polygon points="-30,8 90,-80 210,8" fill="#5a2a22" />
        <path d="M-36 12 L 90 -86 L 216 12 Q 200 -2 186 6 Q 160 -14 140 0 Q 110 -24 90 -10 Q 64 -26 44 -2 Q 20 -16 2 4 Q -16 -6 -36 12 Z" fill="#ffffff" />
        <rect x="20" y="30" width="44" height="40" fill="#ffd27a" />
        <rect x="116" y="30" width="44" height="40" fill="#ffd27a" />
        <rect x="72" y="58" width="36" height="62" fill="#5a2a22" />
      </g>
    </svg>
    <SnowFall count={90} sizes={[3, 4, 5]} flakes={10} seconds={36} seed={4} />
  {/snippet}
</HolidayBase>

<style>
  .scene {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
</style>
