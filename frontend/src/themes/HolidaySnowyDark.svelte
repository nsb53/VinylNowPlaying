<script lang="ts">
  // "Snowy Christmas Dark: Snowfall Village" (Holiday): a navy night with a
  // glowing moon, houses with snow on their roofs and warm lit windows, snow
  // falling in two layers, and snow piled on top of the cover, meters and cards.
  import HolidayBase from './HolidayBase.svelte';
  import SnowFall from '../lib/SnowFall.svelte';

  const FROST = '#eaf2ff';
  const houses = [
    { x: 0, w: 210, h: 150, roof: 70 },
    { x: 200, w: 170, h: 190, roof: 80 },
    { x: 360, w: 230, h: 140, roof: 90 },
    { x: 1300, w: 200, h: 170, roof: 80 },
    { x: 1490, w: 250, h: 130, roof: 100 },
    { x: 1730, w: 210, h: 180, roof: 80 },
  ].map(({ x, w, h, roof }) => {
    const top = 1080 - h;
    const windows: number[] = [];
    for (let wx = x + 30; wx < x + w - 40; wx += 70) windows.push(wx);
    return {
      wall: { x, y: top, w, h },
      roof: `${x - 14},${top + 2} ${x + w / 2},${top - roof} ${x + w + 14},${top + 2}`,
      snow:
        `M${x - 18} ${top + 6} L ${x + w / 2} ${top - roof - 6} L ${x + w + 18} ${top + 6} ` +
        `Q ${x + w * 0.8} ${top - 6} ${x + w * 0.62} ${top + 2} Q ${x + w / 2} ${top - 12} ${x + w * 0.38} ${top + 2} ` +
        `Q ${x + w * 0.2} ${top - 6} ${x - 18} ${top + 6} Z`,
      windows: windows.map((wx) => ({ x: wx, y: top + 40 })),
    };
  });
  const VARS = [
    '--bg: linear-gradient(180deg, #0b1630 0%, #1c2c4f 100%)',
    `--ink: ${FROST}`,
    '--label: #ffc46b',
    `--title: ${FROST}`,
    '--title-glow: 0 0 22px rgba(234, 242, 255, 0.35)',
    '--artist: #ffc46b',
    '--credit: #9fb4d4',
    '--frame-bg: #13213f',
    '--frame-pad: 12px',
    '--frame-border: 3px solid rgba(234, 242, 255, 0.7)',
    '--frame-radius: 10px',
    '--frame-shadow: 0 0 40px rgba(255, 196, 107, 0.15)',
    '--cover-bg: #1a2a4a',
    '--meter-face: #13213f',
    '--meter-border: 2px solid rgba(234, 242, 255, 0.6)',
    `--vu-scale: ${FROST}`,
    '--vu-red: #ffc46b',
    '--vu-needle: #ffffff',
    '--card-bg: rgba(11, 22, 48, 0.85)',
    '--card-border: 2px solid rgba(234, 242, 255, 0.5)',
    '--dim: #8fa3c4',
    `--current: ${FROST}`,
    '--fact-bg: #13213f',
    `--fact-ink: ${FROST}`,
    '--fact-head: #ffc46b',
    '--fact-border: 2px solid #ffc46b',
    '--record: #060c1a',
    '--record-groove: #24365a',
    '--record-label: #ffc46b',
  ].join('; ');
</script>

<HolidayBase vars={VARS} labelPrefix="❄ " labelSuffix=" ❄" artistItalic snow snowColour={FROST} snowShade="rgba(0, 0, 0, 0.45)">
  {#snippet scene()}
    <div class="moon"></div>
    <SnowFall count={120} sizes={[2, 2.5, 3]} opacity={0.6} seconds={36} seed={21} />
    <svg class="scene" viewBox="0 0 1920 1080" aria-hidden="true">
      <path d="M0 1010 C 500 980, 1100 1030, 1920 995 L 1920 1080 L 0 1080 Z" fill={FROST} />
      {#each houses as h}
        <rect x={h.wall.x} y={h.wall.y} width={h.wall.w} height={h.wall.h} fill="#0a1226" />
        <polygon points={h.roof} fill="#0a1226" />
        <path d={h.snow} fill={FROST} />
        {#each h.windows as win}
          <rect x={win.x} y={win.y} width="34" height="40" fill="#ffc46b" class="window" />
        {/each}
      {/each}
    </svg>
    <SnowFall count={45} sizes={[4, 5, 6]} flakes={8} seconds={16} seed={22} />
  {/snippet}
</HolidayBase>

<style>
  .moon {
    position: absolute;
    left: 1700px;
    top: 10px;
    width: 190px;
    height: 190px;
    border-radius: 50%;
    background: radial-gradient(circle, #fff8e7 0 38%, rgba(255, 248, 231, 0.25) 40%, rgba(255, 248, 231, 0) 70%);
  }
  .scene {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
  }
  .window {
    filter: drop-shadow(0 0 12px #ffc46b);
  }
</style>
