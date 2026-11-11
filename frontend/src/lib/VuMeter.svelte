<script lang="ts">
  import { onMount } from 'svelte';
  import { vu } from './vu';

  // Colours come from the theme through CSS variables:
  // --vu-scale, --vu-red, --vu-needle, --vu-font.
  let { channel }: { channel: 'L' | 'R' } = $props();
  let needle: SVGGElement;

  // Angles follow needle deflection = 10^(dB/20), so the scale is a true VU scale.
  const TICKS = [
    { a: -40.3, y: 82, w: 2.5, red: false },
    { a: -26, y: 82, w: 2.5, red: false },
    { a: -17.3, y: 78, w: 2, red: false },
    { a: -9.6, y: 78, w: 2, red: false },
    { a: 0.1, y: 82, w: 2.5, red: false },
    { a: 5.9, y: 76, w: 2, red: false },
    { a: 12.3, y: 76, w: 2, red: false },
    { a: 19.5, y: 84, w: 3, red: true },
    { a: 27.7, y: 78, w: 2, red: true },
    { a: 36.8, y: 78, w: 2, red: true },
    { a: 47, y: 82, w: 2.5, red: true },
  ];
  const NUMBERS = [
    { x: 66.8, y: 98, t: '20', red: false },
    { x: 109.7, y: 70, t: '10', red: false },
    { x: 138.7, y: 58, t: '7', red: false },
    { x: 165.6, y: 52, t: '5', red: false },
    { x: 200.4, y: 49, t: '3', red: false },
    { x: 268.8, y: 61, t: '0', red: true },
    { x: 350.7, y: 114, t: '+3', red: true },
  ];

  onMount(() =>
    // The needle is moved directly, 60 times a second, without re-rendering.
    vu.subscribe((left, right) => {
      const position = channel === 'L' ? left : right;
      needle.setAttribute('transform', `rotate(${(-47 + 94 * position).toFixed(2)} 200 250)`);
    }),
  );
</script>

<svg viewBox="0 0 400 240" role="img" aria-label="{channel === 'L' ? 'Left' : 'Right'} channel VU meter">
  <path class="scale" d="M79.7 108.1 A186 186 0 0 1 262.1 74.7" />
  <path class="zone" d="M262.1 74.7 A186 186 0 0 1 336 123.1" />
  {#each TICKS as tick}
    <line
      class={tick.red ? 'red' : 'ink'}
      x1="200"
      y1="64"
      x2="200"
      y2={tick.y}
      stroke-width={tick.w}
      transform="rotate({tick.a} 200 250)"
    />
  {/each}
  {#each NUMBERS as number}
    <text class={number.red ? 'num red-text' : 'num'} x={number.x} y={number.y}>{number.t}</text>
  {/each}
  <text class="vu" x="200" y="168">VU</text>
  <text class="channel" x="26" y="222">{channel}</text>
  <g bind:this={needle} transform="rotate(-47 200 250)">
    <line class="needle" x1="200" y1="250" x2="200" y2="58" />
  </g>
</svg>

<style>
  svg {
    display: block;
    width: 100%;
  }
  .scale {
    fill: none;
    stroke: var(--vu-scale);
    stroke-width: 3;
  }
  .zone {
    fill: none;
    stroke: var(--vu-red);
    stroke-width: 8;
  }
  .ink {
    stroke: var(--vu-scale);
  }
  .red {
    stroke: var(--vu-red);
  }
  text {
    text-anchor: middle;
    font-family: var(--vu-font);
    fill: var(--vu-scale);
  }
  .num {
    font-size: 16px;
    font-weight: 600;
  }
  .red-text {
    fill: var(--vu-red);
    font-weight: 700;
  }
  .vu {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: 3px;
    fill: var(--vu-label, var(--vu-scale));
  }
  .channel {
    font-size: 24px;
    font-weight: 700;
  }
  .needle {
    stroke: var(--vu-needle);
    stroke-width: var(--vu-needle-width, 2.5);
    stroke-linecap: round;
  }
</style>
