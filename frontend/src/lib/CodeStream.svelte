<script lang="ts">
  // A column of text lines streaming downwards: every `every` ms a new line
  // from `next()` appears at the top and the rest move down and fade.
  // Colours come from --stream-head (newest line) and --stream-ink.
  import { onMount } from 'svelte';

  let {
    next,
    rows,
    every = 120,
    size = 17,
    lineHeight = 23.5,
  }: { next: () => string; rows: number; every?: number; size?: number; lineHeight?: number } = $props();

  let lines = $state<string[]>([]);

  onMount(() => {
    // Fill the column at once so it never starts empty.
    const first: string[] = [];
    for (let i = 0; i < rows; i += 1) first.push(next());
    lines = first;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      lines = [next(), ...lines.slice(0, rows - 1)];
    }, every);
    return () => clearInterval(timer);
  });

  const fade = (i: number) => (i === 0 ? 1 : Math.max(0.12, 1 - (i / rows) * 0.9));
</script>

<div class="stream" style="--size: {size}px; --line: {lineHeight}px" aria-hidden="true">
  {#each lines as line, i}
    <div class="row" class:head={i === 0} style="opacity: {fade(i)}">{line}</div>
  {/each}
</div>

<style>
  .stream {
    overflow: hidden;
    height: 100%;
  }
  .row {
    height: var(--line);
    line-height: var(--line);
    font-size: var(--size);
    white-space: pre;
    overflow: hidden;
    color: var(--stream-ink);
  }
  .row.head {
    color: var(--stream-head);
  }
</style>
