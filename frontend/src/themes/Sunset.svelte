<script lang="ts">
  // "80's": warm brown ground with a band of sunset stripes behind the cover.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, headline, lyricView, triviaView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const trivia = $derived(triviaView());
  const credit = $derived([info.release, info.writers].filter(Boolean).join(' · '));
</script>

<div class="sunset">
  <div class="stripes">
    <div style="background: #f2b33d"></div>
    <div style="background: #e8792b"></div>
    <div style="background: #c8402a"></div>
    <div style="background: #7a2a2a"></div>
  </div>

  <div class="left">
    <div class="cover"><Cover /></div>
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>

  <div class="right">
    <div class="header">
      <div class="label">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 88, min: 44, lines: 1, lineHeight: 1.05, text: head.title }}>
        {head.title}
      </h1>
      <div class="artist one-line">{head.artist}</div>
      {#if credit}<div class="credit one-line">{credit}</div>{/if}
    </div>

    <div class="body">
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
            <div class="answer clamp" style="--lines: 2">{trivia.answer}</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .sunset {
    --record: #0d0705;
    --record-groove: #5a3524;
    --record-label: #f2b33d;
    --vu-scale: #2a1710;
    --vu-red: #c8402a;
    --vu-needle: #2a1710;
    --vu-font: 'Outfit', sans-serif;

    position: relative;
    width: 1920px;
    height: 1080px;
    padding: 72px;
    display: grid;
    grid-template-columns: 690px minmax(0, 1fr);
    grid-gap: 64px;
    background: #2a1710;
    color: #f6e7c8;
    font-family: 'Outfit', sans-serif;
  }

  /* The stripes run the full width, behind the cover and through the gap
     the right column leaves for them. */
  .stripes {
    position: absolute;
    left: 0;
    top: 366px;
    width: 1920px;
  }
  .stripes div {
    height: 28px;
  }

  .left,
  .right {
    position: relative;
    height: 936px;
    min-width: 0;
  }
  .left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover {
    width: 690px;
    height: 690px;
    overflow: hidden;
    background: #1a0e09;
    border: 6px solid #f6e7c8;
    border-radius: 28px;
  }
  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 24px;
  }
  .face {
    background: #f6e7c8;
    border-radius: 20px;
    overflow: hidden;
  }

  .header {
    height: 270px;
    overflow: hidden;
  }
  .label,
  .heading {
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 4px;
  }
  .label {
    color: #f2b33d;
  }
  h1 {
    margin-top: 8px;
    padding-bottom: 4px;
    font-family: 'Righteous', sans-serif;
    font-size: 88px;
    line-height: 1.05;
    font-weight: 400;
  }
  .artist {
    margin-top: 6px;
    font-size: 46px;
    font-weight: 500;
  }
  .credit {
    margin-top: 6px;
    font-size: 26px;
    color: #d9c7a3;
  }

  /* 160px gap under the header is where the stripes show through. */
  .body {
    height: 506px;
    margin-top: 160px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 440px;
    grid-gap: 48px;
  }

  .heading {
    display: flex;
    justify-content: space-between;
    color: #d9c7a3;
  }
  .lyrics {
    min-width: 0;
    overflow: hidden;
  }
  .line {
    margin-top: 16px;
    min-height: 39px;
    font-size: 30px;
    line-height: 1.3;
    color: #d9c7a3;
  }
  .heading + .line {
    margin-top: 18px;
  }
  .line.active {
    --lines: 2;
    font-family: 'Righteous', sans-serif;
    font-size: 44px;
    line-height: 1.14;
    color: #f2b33d;
  }

  .trivia {
    align-self: start;
    max-height: 100%;
    overflow: hidden;
    padding: 28px;
    background: #f6e7c8;
    color: #2a1710;
    border-radius: 28px;
  }
  .trivia .heading {
    color: #6b3a22;
  }
  .question {
    margin-top: 14px;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.25;
  }
  .choice {
    margin-top: 8px;
    padding: 0 10px;
    border-radius: 10px;
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
    font-family: 'Righteous', sans-serif;
    color: #c8402a;
  }
  .revealed .choice {
    opacity: 0.55;
  }
  .revealed .choice.correct {
    opacity: 1;
    background: #c8402a;
    color: #f6e7c8;
    font-weight: 600;
  }
  .revealed .choice.correct .letter {
    color: #f6e7c8;
  }
  .answer {
    margin-top: 14px;
    font-size: 22px;
    line-height: 1.3;
  }
</style>
