<script lang="ts">
  // B2 "Sleeve Split": dark, cover and meters on the left, lyrics and trivia on the right.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, headline, lyricView, triviaView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 3));
  const trivia = $derived(triviaView());
</script>

<div class="sleeve">
  <div class="left">
    <div class="cover"><Cover /></div>
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>

  <div class="header">
    <div class="now">
      <span class="dot" class:idle={!head.playing}></span>{head.playing ? 'NOW PLAYING' : 'LISTENING'}
    </div>
    <h1 class="clamp" style="--lines: 2" use:fit={{ max: 96, min: 52, lines: 1, lineHeight: 1.05, text: head.title }}>
      {head.title}
    </h1>
    <div class="byline">
      <div class="artist one-line">{head.artist}</div>
      {#if info.release}<div class="credit release one-line">{info.release}</div>{/if}
    </div>
    {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
  </div>

  <div class="lyrics">
    <div class="heading">
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
        <div class="answer clamp" style="--lines: 3">{trivia.answer}</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .sleeve {
    --record: #060607;
    --record-groove: #34343a;
    --record-label: #ffb547;
    --vu-scale: #d8d8de;
    --vu-red: #ff7a3d;
    --vu-needle: #ffb547;
    --vu-needle-width: 3;
    --vu-label: #a0a0a8;
    --vu-font: 'Space Grotesk', sans-serif;

    width: 1920px;
    height: 1080px;
    padding: 72px;
    display: grid;
    grid-template-columns: 700px minmax(0, 1fr) 420px;
    grid-template-rows: auto minmax(0, 1fr);
    grid-gap: 40px 48px;
    background: #0e0e10;
    color: #f5f5f7;
    font-family: 'Inter', sans-serif;
  }

  .left {
    grid-column: 1;
    grid-row: 1 / span 2;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover {
    width: 700px;
    height: 700px;
    background: #1c1c20;
    border: 1px solid #34343a;
  }
  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 24px;
  }
  .face {
    background: #17171a;
    border: 1px solid #34343a;
    border-radius: 10px;
    overflow: hidden;
  }

  .header {
    grid-column: 2 / span 2;
    grid-row: 1;
    min-width: 0;
    padding-bottom: 28px;
    border-bottom: 1px solid #34343a;
  }
  .now {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 4px;
    color: #ffb547;
  }
  .dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-right: 14px;
    border-radius: 50%;
    background: #ffb547;
  }
  .dot.idle {
    background: #6a6a72;
  }
  h1 {
    margin-top: 10px;
    padding-bottom: 6px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 96px;
    line-height: 1.05;
    font-weight: 700;
    letter-spacing: -2px;
  }
  .byline {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 6px;
  }
  .artist {
    min-width: 0;
    font-size: 44px;
    font-weight: 500;
    color: #c9c9d1;
  }
  .credit {
    margin-top: 10px;
    font-size: 24px;
    color: #a0a0a8;
  }
  .release {
    flex: none;
    max-width: 55%;
    margin: 0 0 0 32px;
  }

  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 4px;
    color: #a0a0a8;
  }

  .lyrics {
    grid-column: 2;
    grid-row: 2;
    min-width: 0;
    overflow: hidden;
  }
  .line {
    margin-top: 18px;
    min-height: 39px;
    font-size: 30px;
    line-height: 1.3;
    color: #8e8e97;
  }
  .heading + .line {
    margin-top: 20px;
  }
  .line.active {
    --lines: 2;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 46px;
    line-height: 1.12;
    font-weight: 500;
    color: #f5f5f7;
  }

  .trivia {
    grid-column: 3;
    grid-row: 2;
    align-self: start;
    max-height: 100%;
    overflow: hidden;
    padding: 28px;
    background: #17171a;
    border: 1px solid #34343a;
    border-radius: 10px;
  }
  .question {
    margin-top: 16px;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.25;
  }
  .choice {
    margin-top: 12px;
    padding: 2px 10px;
    border-radius: 6px;
    font-size: 24px;
    font-weight: 500;
    line-height: 1.3;
    color: #c9c9d1;
  }
  .question + .choice {
    margin-top: 16px;
  }
  .letter {
    display: inline-block;
    width: 34px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    color: #ffb547;
  }
  .revealed .choice {
    opacity: 0.5;
  }
  .revealed .choice.correct {
    opacity: 1;
    background: #ffb547;
    color: #0e0e10;
    font-weight: 600;
  }
  .revealed .choice.correct .letter {
    color: #0e0e10;
  }
  .answer {
    margin-top: 16px;
    font-size: 22px;
    line-height: 1.35;
    color: #c9c9d1;
  }
</style>
