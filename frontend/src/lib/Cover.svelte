<script lang="ts">
  import { coverView } from './store.svelte';

  // Fills its parent. Shows a record when there is no artwork.
  const cover = $derived(coverView());
</script>

{#if cover}
  <img src={cover.url} alt={cover.alt} />
{:else}
  <svg viewBox="0 0 200 200" role="img" aria-label="No artwork">
    <circle cx="100" cy="100" r="78" class="disc" />
    {#each [66, 56, 46] as r}
      <circle cx="100" cy="100" {r} class="groove" />
    {/each}
    <circle cx="100" cy="100" r="26" class="label" />
    <circle cx="100" cy="100" r="3" class="disc" />
  </svg>
{/if}

<style>
  img,
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  img {
    object-fit: cover;
  }
  .disc {
    fill: var(--record, #0b0b0c);
  }
  .groove {
    fill: none;
    stroke: var(--record-groove, #2c2c30);
    stroke-width: 1;
  }
  .label {
    fill: var(--record-label, #d9a21b);
  }
</style>
