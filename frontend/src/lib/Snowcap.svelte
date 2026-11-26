<script lang="ts">
  // A drift of snow sitting on top of a box, with a few icicles. Place it
  // inside a positioned box; it overhangs the top edge.
  import { seeded } from './seeded';

  let {
    width,
    seed = 1,
    colour = '#ffffff',
    shade = 'rgba(150, 180, 210, 0.45)',
  }: { width: number; seed?: number; colour?: string; shade?: string } = $props();

  const shape = $derived.by(() => {
    const rand = seeded(seed);
    const w = width + 24;
    let d = 'M0 26 L 0 6';
    for (let i = 0; i < 7; i += 1) {
      d += ` Q ${((w * (i + 0.5)) / 7).toFixed(0)} ${-(8 + rand() * 14).toFixed(0)} ${((w * (i + 1)) / 7).toFixed(0)} ${(2 + rand() * 6).toFixed(0)}`;
    }
    d += ` L ${w} 26 Z`;
    const icicles = Array.from({ length: 4 }, () => ({ x: 30 + rand() * (w - 70), h: 10 + rand() * 12 }));
    return { w, d, icicles };
  });
</script>

<svg
  class="cap"
  viewBox="0 -24 {shape.w} 58"
  style="width: {shape.w}px; --shade: {shade}"
  aria-hidden="true"
>
  <path d={shape.d} fill={colour} />
  {#each shape.icicles as i}
    <path d="M{i.x.toFixed(0)} 26 l 5 {i.h.toFixed(0)} l 5 -{i.h.toFixed(0)} Z" fill={colour} />
  {/each}
</svg>

<style>
  .cap {
    position: absolute;
    left: -12px;
    top: -30px;
    height: 58px;
    overflow: visible;
    z-index: 2;
    filter: drop-shadow(0 4px 3px var(--shade));
    pointer-events: none;
  }
</style>
