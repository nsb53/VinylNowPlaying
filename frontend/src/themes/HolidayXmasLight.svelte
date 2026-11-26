<script lang="ts">
  // "Christmas Light: Snowy Morning" (Holiday): cream with soft snowflakes,
  // an evergreen garland with red berries along the top, and the cover wrapped
  // like a present.
  import HolidayBase from './HolidayBase.svelte';
  import { seeded } from '../lib/seeded';

  const rand = seeded(7);
  const ANGLES = [-30, -15, 0, 15, 30, 160, 180, 200];
  const sprigs = Array.from({ length: 29 }, (_, i) => {
    const x = -20 + i * 70;
    const length = 70 + Math.floor(rand() * 40);
    const needles: number[] = [];
    for (let n = 4; n < length; n += 9) needles.push(n);
    return {
      x,
      y: 34 + 26 * Math.sin((x / 1920) * Math.PI),
      a: ANGLES[Math.floor(rand() * ANGLES.length)],
      length,
      needles,
      berry: rand() < 0.6,
    };
  });
  const flakes = Array.from({ length: 36 }, () => ({ x: rand() * 1920, y: 130 + rand() * 930, r: [8, 10, 14][Math.floor(rand() * 3)] }));
  const ARMS = [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180);
  const VARS = [
    '--bg: #fbf7f0',
    '--ink: #2a2320',
    '--label: #1f5a3a',
    '--title: #c8102e',
    '--artist: #1f5a3a',
    '--credit: #6a5a50',
    '--frame-bg: #1f5a3a',
    '--frame-pad: 18px',
    '--frame-shadow: 0 14px 28px rgba(31, 90, 58, 0.3)',
    '--cover-border: 6px solid #fbf7f0',
    '--cover-bg: #e8e0d2',
    '--ribbon: #c8102e',
    '--ribbon-dark: #a50e25',
    '--meter-face: #ffffff',
    '--meter-border: 4px solid #1f5a3a',
    '--vu-scale: #2a2320',
    '--vu-red: #c8102e',
    '--vu-needle: #2a2320',
    '--card-bg: #ffffff',
    '--card-border: 3px dashed #c8102e',
    '--card-shadow: 0 10px 22px rgba(42, 35, 32, 0.1)',
    '--dim: #8a7a70',
    '--current: #1f5a3a',
    '--fact-bg: #1f5a3a',
    '--fact-ink: #fbf7f0',
    '--fact-head: #f2d57a',
    '--fact-border: 3px solid #c9a227',
    '--record: #1c1a18',
    '--record-groove: #4a4440',
    '--record-label: #c8102e',
  ].join('; ');
</script>

<HolidayBase vars={VARS} label="festive" artistItalic gift>
  {#snippet scene()}
    <svg class="scene" viewBox="0 0 1920 1080" aria-hidden="true">
      {#each flakes as f}
        {#each ARMS as a}
          <line x1={f.x} y1={f.y} x2={f.x + f.r * Math.cos(a)} y2={f.y + f.r * Math.sin(a)} stroke="#c9d6e3" stroke-width="2" stroke-linecap="round" />
        {/each}
      {/each}
      {#each sprigs as s}
        <g transform="translate({s.x} {s.y}) rotate({s.a})">
          <line x1="0" y1="0" x2={s.length} y2="0" stroke="#3e5a2b" stroke-width="4" />
          {#each s.needles as n}
            <line x1={n} y1="0" x2={n + 8} y2="-12" stroke="#2f6b3a" stroke-width="3" stroke-linecap="round" />
            <line x1={n} y1="0" x2={n + 8} y2="12" stroke="#2f6b3a" stroke-width="3" stroke-linecap="round" />
          {/each}
          {#if s.berry}
            <circle cx={s.length * 0.35} cy="-4" r="7" fill="#c8102e" />
            <circle cx={s.length * 0.35 + 11} cy="5" r="6" fill="#a50e25" />
          {/if}
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
</style>
