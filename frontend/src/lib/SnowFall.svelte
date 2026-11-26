<script lang="ts">
  // A layer of snow drifting down the whole 1920x1080 stage. Two copies are
  // stacked and slid down together, so the fall loops without a seam. Stays
  // still when the screen asks for reduced motion.
  import { seeded } from './seeded';

  let {
    count = 90,
    sizes = [3, 4, 5],
    colour = '#ffffff',
    opacity = 0.9,
    flakes = 0,
    seconds = 36,
    seed = 3,
  }: {
    count?: number;
    sizes?: number[];
    colour?: string;
    opacity?: number;
    flakes?: number;
    seconds?: number;
    seed?: number;
  } = $props();

  const layer = $derived.by(() => {
    const rand = seeded(seed);
    const dots = Array.from({ length: count }, () => ({
      x: rand() * 1920,
      y: rand() * 1080,
      r: sizes[Math.floor(rand() * sizes.length)],
    }));
    const stars = Array.from({ length: flakes }, () => ({ x: rand() * 1920, y: rand() * 1080, r: 9 + rand() * 4 }));
    return { dots, stars };
  });
  const ARMS = [0, 60, 120, 180, 240, 300].map((a) => (a * Math.PI) / 180);
</script>

<div class="fall" style="--seconds: {seconds}s" aria-hidden="true">
  {#each [0, 1] as copy (copy)}
    <svg viewBox="0 0 1920 1080">
      {#each layer.dots as d}<circle cx={d.x} cy={d.y} r={d.r} fill={colour} {opacity} />{/each}
      {#each layer.stars as s}
        {#each ARMS as a}
          <line
            x1={s.x}
            y1={s.y}
            x2={s.x + s.r * Math.cos(a)}
            y2={s.y + s.r * Math.sin(a)}
            stroke={colour}
            stroke-width="2.5"
            stroke-linecap="round"
            {opacity}
          />
        {/each}
      {/each}
    </svg>
  {/each}
</div>

<style>
  .fall {
    position: absolute;
    left: 0;
    top: -1080px;
    width: 1920px;
    height: 2160px;
    animation: fall var(--seconds) linear infinite;
    pointer-events: none;
  }
  svg {
    display: block;
    width: 1920px;
    height: 1080px;
  }
  @keyframes fall {
    to {
      transform: translateY(1080px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fall {
      animation: none;
    }
  }
</style>
