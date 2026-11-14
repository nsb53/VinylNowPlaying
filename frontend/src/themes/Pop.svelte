<script lang="ts">
  // "90's Pop": bright outlined panels with hard shadows on a dark indigo ground.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, headline, lyricView, factView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const fact = $derived(factView());
  const credit = $derived([info.release, info.writers].filter(Boolean).join(' · '));
</script>

<div class="pop">
  <svg class="shapes" viewBox="0 0 1920 1080" aria-hidden="true">
    <path class="line yellow" d="M650 30 q20 -26 40 0 t40 0 t40 0 t40 0 t40 0" />
    <path class="line pink" d="M1560 1040 q20 -26 40 0 t40 0 t40 0 t40 0 t40 0" />
    <path class="solid" fill="#ffd23f" d="M30 640 l26 44 l-52 0 z" />
    <path class="solid" fill="#18a999" d="M1880 300 l26 44 l-52 0 z" />
    <circle class="solid" fill="#e5247b" cx="640" cy="560" r="16" />
    <circle class="solid" fill="#ffd23f" cx="1890" cy="640" r="12" />
    <circle class="solid" fill="#18a999" cx="32" cy="30" r="12" />
    <path class="cross" d="M610 1046 l24 0 M622 1034 l0 24" />
    <path class="cross" d="M1250 24 l24 0 M1262 12 l0 24" />
  </svg>

  <div class="left">
    <div class="box cover"><Cover /></div>
    <div class="box meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>

  <div class="right">
    <div class="box header">
      <div class="label">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 108, min: 56, lines: 1, lineHeight: 1.05, text: head.title }}>
        {head.title}
      </h1>
      <div class="artist one-line">{head.artist}</div>
      {#if credit}<div class="credit one-line">{credit}</div>{/if}
    </div>

    <div class="body">
      <div class="box lyrics">
        <div class="heading">
          <div>LYRICS</div>
          <div class="state">{lyrics.label}</div>
        </div>
        {#if lyrics.lines.length}
          {#each lyrics.lines as line}
            <div class={line.active ? 'line active clamp' : 'line one-line'}>{line.text}</div>
          {/each}
        {:else}
          <div class="line">{lyrics.note}</div>
        {/if}
      </div>

      {#if fact}
        <div class="trivia">
          <div class="heading">
            <div>DID YOU KNOW?</div>
            <div>{fact.counter}</div>
          </div>
          {#key fact.index}
            <div class="fact-tag">{fact.category}</div>
            <div class="fact clamp" style="--lines: 8">{fact.text}</div>
          {/key}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .pop {
    --ink: #1b1b1b;
    --record: #1b1b1b;
    --record-groove: #6a5560;
    --record-label: #ffd23f;
    --vu-scale: #1b1b1b;
    --vu-red: #e5247b;
    --vu-needle: #6b3fa0;
    --vu-needle-width: 3;
    --vu-font: 'Fredoka', sans-serif;

    position: relative;
    width: 1920px;
    height: 1080px;
    padding: 64px 74px 74px 64px;
    display: grid;
    grid-template-columns: 560px minmax(0, 1fr);
    grid-gap: 64px;
    overflow: hidden;
    background: #2b1e52;
    color: var(--ink);
    font-family: 'Fredoka', sans-serif;
  }

  .shapes {
    position: absolute;
    left: 0;
    top: 0;
    width: 1920px;
    height: 1080px;
  }
  .line {
    fill: none;
    stroke-width: 9;
    stroke-linecap: round;
  }
  .yellow {
    stroke: #ffd23f;
  }
  .pink {
    stroke: #e5247b;
  }
  .solid {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .cross {
    stroke: #fff1d6;
    stroke-width: 6;
    stroke-linecap: round;
  }

  /* Every panel: thick outline and a hard offset shadow. */
  .box {
    border: 5px solid var(--ink);
    border-radius: 22px;
    box-shadow: 10px 10px 0 #0d0820;
  }

  .left,
  .right {
    position: relative;
    height: 942px;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .left {
    justify-content: space-between;
  }
  .cover {
    width: 560px;
    height: 560px;
    overflow: hidden;
    background: #e5247b;
  }
  .meters {
    padding: 22px;
    background: #ffd23f;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 20px;
  }
  .face {
    background: #fff;
    border: 4px solid var(--ink);
    border-radius: 14px;
    overflow: hidden;
  }

  .header {
    flex: none;
    padding: 36px 44px;
    background: #7d4fbe;
    color: #fff1d6;
  }
  .label,
  .heading {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
  }
  .label {
    color: #ffd23f;
  }
  h1 {
    margin-top: 6px;
    padding-bottom: 4px;
    font-size: 108px;
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: -1px;
  }
  .artist {
    margin-top: 4px;
    font-size: 50px;
    font-weight: 600;
  }
  .credit {
    margin-top: 6px;
    font-size: 26px;
    font-weight: 500;
    color: #e9dcf7;
  }

  .body {
    flex: 1 1 0;
    min-height: 0;
    margin-top: 48px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 470px;
    grid-gap: 48px;
  }

  .heading {
    display: flex;
    justify-content: space-between;
  }
  .lyrics {
    min-width: 0;
    overflow: hidden;
    padding: 32px 36px;
    background: #fff;
  }
  .state {
    color: #6b3fa0;
  }
  .line {
    margin-top: 16px;
    min-height: 39px;
    font-size: 30px;
    font-weight: 500;
    line-height: 1.3;
    color: #55504a;
  }
  .line.active {
    --lines: 2;
    font-size: 46px;
    line-height: 1.14;
    font-weight: 700;
    color: #e5247b;
  }

  .trivia {
    align-self: start;
    max-height: 100%;
    overflow: hidden;
    padding: 20px 28px;
    background: #18a999;
  }
  .fact-tag {
    margin-top: 16px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
    display: inline-block; padding: 2px 12px; border: 3px solid var(--ink); border-radius: 999px; background: #ffd23f;
  }
  .fact {
    margin-top: 12px;
    font-size: 27px; font-weight: 600; line-height: 1.3;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
