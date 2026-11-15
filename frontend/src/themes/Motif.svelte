<script lang="ts">
  // The decoration beside the title in the Mid-Century themes. "starburst" is
  // the original; MCM - Dynamic lets Gemini pick another one per album.
  // Colours come from --burst-a, --burst-b and --face.
  let { kind = 'starburst' }: { kind?: string } = $props();

  const C = 100;
  const polar = (angle: number, radius: number) => ({
    x: C + radius * Math.cos(angle),
    y: C + radius * Math.sin(angle),
  });

  // Atomic starburst: 16 rays, alternating long and short.
  const rays = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 22.5 * Math.PI) / 180;
    const long = i % 2 === 0;
    const from = polar(angle, 16);
    const to = polar(angle, long ? 90 : 62);
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, dot: long ? 6 : 4.5, long };
  });

  const rings = [90, 76, 62, 48, 34, 20];

  // Halftone: dots grow towards the lower left.
  const dots: { x: number; y: number; r: number }[] = [];
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const x = 12 + col * 22;
      const y = 12 + row * 22;
      if ((x - C) ** 2 + (y - C) ** 2 > 92 ** 2) continue;
      dots.push({ x, y, r: 2 + ((8 - col + row) / 16) * 7 });
    }
  }

  const waves = [40, 64, 88, 112, 136, 160].map((y, i) => {
    let d = `M 0 ${y}`;
    for (let x = 0; x <= 200; x += 50) d += ` q 25 ${i % 2 ? 16 : -16} 50 0`;
    return d;
  });

  const diamonds: { x: number; y: number; filled: boolean }[] = [];
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      diamonds.push({ x: 20 + col * 40, y: 20 + row * 40, filled: (row + col) % 2 === 0 });
    }
  }
</script>

{#if kind !== 'none'}
  <svg viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <clipPath id="motif-disc"><circle cx="100" cy="100" r="92" /></clipPath>
    </defs>

    {#if kind === 'circles'}
      {#each rings as r, i}
        <circle cx="100" cy="100" {r} class={i % 2 ? 'line-b' : 'line-a'} stroke-width="6" fill="none" />
      {/each}
      <circle cx="100" cy="100" r="8" class="fill-a" />
    {:else if kind === 'stripes'}
      <g clip-path="url(#motif-disc)">
        {#each [-80, -40, 0, 40, 80, 120, 160] as offset, i}
          <line x1={offset} y1="200" x2={offset + 200} y2="0" class={i % 2 ? 'line-b' : 'line-a'} stroke-width="16" />
        {/each}
      </g>
    {:else if kind === 'dots'}
      {#each dots as dot, i}
        <circle cx={dot.x} cy={dot.y} r={dot.r} class={i % 3 ? 'fill-a' : 'fill-b'} />
      {/each}
    {:else if kind === 'waves'}
      <g clip-path="url(#motif-disc)">
        {#each waves as d, i}
          <path {d} class={i % 2 ? 'line-b' : 'line-a'} stroke-width="7" fill="none" stroke-linecap="round" />
        {/each}
      </g>
    {:else if kind === 'diamonds'}
      {#each diamonds as d}
        <path
          d="M {d.x} {d.y - 18} L {d.x + 18} {d.y} L {d.x} {d.y + 18} L {d.x - 18} {d.y} Z"
          class={d.filled ? 'fill-a' : 'line-b'}
          stroke-width="3"
          fill={d.filled ? undefined : 'none'}
        />
      {/each}
    {:else}
      {#each rays as ray}
        <line x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} class={ray.long ? 'line-a' : 'line-b'} stroke-width="2.5" />
        <circle cx={ray.x2} cy={ray.y2} r={ray.dot} class={ray.long ? 'fill-a' : 'fill-b'} />
      {/each}
      <circle cx="100" cy="100" r="11" class="hub" stroke-width="2.5" />
    {/if}
  </svg>
{/if}

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .line-a {
    stroke: var(--burst-a, #23201c);
  }
  .line-b {
    stroke: var(--burst-b, #b5431f);
  }
  .fill-a {
    fill: var(--burst-a, #23201c);
  }
  .fill-b {
    fill: var(--burst-b, #b5431f);
  }
  .hub {
    fill: var(--face, #fbf3df);
    stroke: var(--burst-a, #23201c);
  }
  .line-a,
  .line-b,
  .fill-a,
  .fill-b,
  .hub {
    transition:
      fill 1.5s ease,
      stroke 1.5s ease;
  }
</style>
