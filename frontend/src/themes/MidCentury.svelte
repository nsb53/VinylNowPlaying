<script lang="ts">
  // E1 "Mid-Century Modern" and, with `night`, E2 "Mid-Century Night".
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, headline, lyricView, triviaView } from '../lib/store.svelte';

  let { night = false }: { night?: boolean } = $props();

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const trivia = $derived(triviaView());

  // Atomic starburst: 16 rays, alternating long and short.
  const rays = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 22.5 * Math.PI) / 180;
    const long = i % 2 === 0;
    const reach = long ? 90 : 62;
    return {
      x1: 100 + 16 * Math.cos(angle),
      y1: 100 + 16 * Math.sin(angle),
      x2: 100 + reach * Math.cos(angle),
      y2: 100 + reach * Math.sin(angle),
      dot: long ? 6 : 4.5,
      colour: long ? '#23201C' : '#B5431F',
    };
  });
</script>

<div class="mcm" class:night>
  <div class="top">
    <div class="cover"><Cover /></div>
    <div class="title-block">
      <svg class="burst" viewBox="0 0 200 200" aria-hidden="true">
        {#each rays as ray}
          <line x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} stroke={ray.colour} stroke-width="2.5" />
          <circle cx={ray.x2} cy={ray.y2} r={ray.dot} fill={ray.colour} />
        {/each}
        <circle cx="100" cy="100" r="11" fill="#FBF3DF" stroke="#23201C" stroke-width="2.5" />
      </svg>
      <div class="text">
        <div class="label">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
        <h1 class="clamp" style="--lines: 2" use:fit={{ max: 100, min: 56, lines: 2, lineHeight: 1.05, text: head.title }}>
          {head.title}
        </h1>
        <div class="artist one-line">{head.artist}</div>
        {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
        {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
      </div>
    </div>
  </div>

  <div class="bottom">
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
    <div class="rest">
      <div class="lyrics">
        <div class="heading ruled">
          <div>LYRICS</div>
          <div>{lyrics.label}</div>
        </div>
        {#if lyrics.lines.length}
          {#each lyrics.lines as line}
            <div class={line.active ? 'line active clamp' : 'line one-line'}>{line.text}</div>
          {/each}
        {:else}
          <div class="line">{lyrics.note}</div>
        {/if}
      </div>

      {#if trivia}
        <div class="trivia" class:revealed={trivia.revealed}>
          <div class="heading">
            <div>TRIVIA · {trivia.topic}</div>
            <div>{trivia.counter}</div>
          </div>
          <div class="question clamp" style="--lines: 4">{trivia.question}</div>
          {#each trivia.choices as choice}
            <div class="choice clamp" class:correct={choice.correct} style="--lines: 2">
              <span class="letter">{choice.letter}</span>{choice.text}
            </div>
          {/each}
          {#if trivia.revealed && trivia.answer}
            <div class="answer clamp" style="--lines: 2">{trivia.answer}</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .mcm {
    --bg: #efe3c8;
    --ink: #23201c;
    --muted: #5c554a;
    --current: #1f5f63;
    --cover-bg: #23201c;
    --record: #0f0d0c;
    --record-groove: #4a443c;
    --record-label: #d9a21b;
    --vu-scale: #23201c;
    --vu-red: #b5431f;
    --vu-needle: #23201c;
    --vu-font: 'Jost', sans-serif;

    width: 1920px;
    height: 1080px;
    display: grid;
    grid-template-rows: 500px 580px;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Jost', sans-serif;
  }
  .mcm.night {
    --bg: #1c1917;
    --ink: #efe3c8;
    --muted: #b8ad96;
    --current: #e8b62e;
    --cover-bg: #0f0d0c;
    --record: #000;
  }

  .top,
  .bottom {
    display: flex;
    min-height: 0;
  }

  .cover {
    flex: none;
    width: 500px;
    height: 500px;
    background: var(--cover-bg);
  }

  .title-block {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    padding: 56px 72px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #d9a21b;
    color: #23201c;
  }
  .burst {
    position: absolute;
    right: 72px;
    top: 56px;
    width: 280px;
    height: 280px;
  }
  .text {
    position: relative;
    max-width: 960px;
  }
  .label,
  .heading {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 5px;
  }
  h1 {
    margin-top: 12px;
    padding-bottom: 6px;
    font-size: 100px;
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: -2px;
  }
  .artist {
    margin-top: 6px;
    font-size: 50px;
    font-weight: 500;
  }
  .credit {
    margin-top: 6px;
    font-size: 26px;
    font-weight: 500;
    line-height: 1.4;
  }
  .artist + .credit {
    margin-top: 12px;
  }

  .meters {
    flex: none;
    /* Wider than the 500px cover above it, so the block steps out to the right. */
    width: 580px;
    padding: 48px 102px;
    background: #1f5f63;
  }
  .face {
    background: #fbf3df;
    border-radius: 14px;
    overflow: hidden;
  }
  .face + .face {
    margin-top: 32px;
  }

  .rest {
    flex: 1 1 0;
    min-width: 0;
    padding: 56px 72px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 500px;
    grid-gap: 64px;
  }

  .heading {
    display: flex;
    justify-content: space-between;
  }
  .ruled {
    padding-bottom: 14px;
    border-bottom: 4px solid var(--ink);
    margin-bottom: 4px;
  }
  .line {
    margin-top: 16px;
    min-height: 39px;
    font-size: 30px;
    line-height: 1.3;
    color: var(--muted);
  }
  .line.active {
    --lines: 2;
    font-size: 46px;
    line-height: 1.14;
    font-weight: 700;
    color: var(--current);
  }

  .trivia {
    align-self: start;
    max-height: 468px;
    overflow: hidden;
    padding: 28px;
    background: #b5431f;
    color: #fbf3df;
  }
  .question {
    margin-top: 14px;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.25;
  }
  .choice {
    margin-top: 8px;
    padding: 0 8px;
    font-size: 24px;
    font-weight: 500;
    line-height: 1.3;
  }
  .question + .choice {
    margin-top: 14px;
  }
  .letter {
    display: inline-block;
    width: 34px;
    font-weight: 700;
  }
  .revealed .choice {
    opacity: 0.55;
  }
  .revealed .choice.correct {
    opacity: 1;
    background: #fbf3df;
    color: #8f3013;
    font-weight: 700;
  }
  .answer {
    margin-top: 14px;
    font-size: 22px;
    line-height: 1.3;
  }
</style>
