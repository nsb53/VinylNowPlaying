<script lang="ts">
  // "Techno · Desktop": the 90s desktop (bevelled grey windows, blue title
  // bars, teal desktop, taskbar) with a Console window where the app's live
  // log scrolls like a terminal. Every window has a fixed size so the meters
  // and the fact always fit.
  import Cover from '../lib/Cover.svelte';
  import LogStream from '../lib/LogStream.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const fact = $derived(factView());
</script>

{#snippet titlebar(title: string)}
  <div class="titlebar">
    <div class="one-line">{title}</div>
    <div class="buttons" aria-hidden="true">
      <div class="btn"><div class="min"></div></div>
      <div class="btn"><div class="max"></div></div>
    </div>
  </div>
{/snippet}

<div class="desktop">
  <div class="area">
    <section class="window now">
      {@render titlebar(head.playing ? 'Now Playing' : head.stopped ? 'Stopped' : 'Listening')}
      <div class="now-body">
        <div class="cover sunken"><Cover /></div>
        <h1 class="clamp" style="--lines: 2" use:fit={{ max: 52, min: 34, lines: 2, lineHeight: 1.08, text: head.title }}>{head.title}</h1>
        <div class="artist one-line">{head.artist}</div>
        {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
        {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
      </div>
    </section>

    <div class="column">
      <section class="window lyrics-win">
        {@render titlebar(`Lyrics · ${lyrics.label.toLowerCase()}`)}
        <div class="paper sunken lyrics">
          {#if lyrics.lines.length}
            {#each lyrics.lines as l}
              <div class={l.active ? 'line active clamp' : 'line one-line'}>{l.text}</div>
            {/each}
          {:else}
            <div class="line">{lyrics.note}</div>
          {/if}
        </div>
      </section>
      <section class="window meters-win">
        {@render titlebar('VU Meters')}
        <div class="meters">
          <div class="face sunken"><VuMeter channel="L" /></div>
          <div class="face sunken"><VuMeter channel="R" /></div>
        </div>
      </section>
    </div>

    <div class="column">
      <section class="window fact-win">
        {@render titlebar('Did you know?')}
        <div class="paper sunken fact-body">
          {#if fact}
            <div class="fact-tag">{fact.category}{fact.counter ? ` · ${fact.counter.replace(' / ', ' OF ')}` : ''}</div>
            {#key fact.index}<div class="fact clamp" style="--lines: 4">{fact.text}</div>{/key}
          {:else}
            <div class="fact-tag">Facts appear here when a song is recognised.</div>
          {/if}
        </div>
      </section>
      <section class="window console-win">
        {@render titlebar('Console — C:\\VINYL')}
        <div class="terminal sunken">
          <div class="log"><LogStream rows={40} size={22} lineHeight={25} terminal /></div>
          <div class="prompt">C:\VINYL&gt; <span class="cursor"></span></div>
        </div>
      </section>
    </div>
  </div>

  <div class="taskbar">
    <div class="task raised start">VINYL</div>
    <div class="task raised">Now Playing</div>
    <div class="task raised">Lyrics</div>
    <div class="task pressed">Console</div>
    <div class="task pressed clock">SIDE A · 33 RPM</div>
  </div>
</div>

<style>
  .desktop {
    --grey: #c6c6c6;
    --hi: #ffffff;
    --lo: #4a4a4a;
    --navy: #15157a;
    --record: #111;
    --record-groove: #444;
    --record-label: #c6c6c6;
    --vu-scale: #111111;
    --vu-red: #b00020;
    --vu-needle: #111111;
    --vu-font: 'Arimo', sans-serif;
    --stream-ink: #c0c0c0;
    --stream-head: #ffffff;
    --stream-time: #8a8a8a;
    --stream-good: #7cff7c;
    --stream-bad: #ff6b6b;
    width: 1920px;
    height: 1080px;
    display: flex;
    flex-direction: column;
    background: #0f7b7b;
    color: #111;
    font-family: 'Arimo', sans-serif;
  }
  .raised {
    border: 4px solid;
    border-color: var(--hi) var(--lo) var(--lo) var(--hi);
  }
  .sunken,
  .pressed {
    border: 4px solid;
    border-color: var(--lo) var(--hi) var(--hi) var(--lo);
  }

  .area {
    flex: 1 1 0;
    min-height: 0;
    padding: 40px;
    display: grid;
    grid-template-columns: 560px minmax(0, 1fr) 660px;
    gap: 32px;
  }
  .column {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .window {
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--grey);
    border: 4px solid;
    border-color: var(--hi) var(--lo) var(--lo) var(--hi);
  }
  .titlebar {
    flex: none;
    height: 52px;
    padding: 0 8px 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: linear-gradient(90deg, var(--navy), #2e6bd6);
    color: #fff;
    font-size: 24px;
    font-weight: 700;
  }
  .buttons {
    flex: none;
    display: flex;
    gap: 6px;
  }
  .btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--grey);
    border: 4px solid;
    border-color: var(--hi) var(--lo) var(--lo) var(--hi);
  }
  .min {
    width: 14px;
    height: 4px;
    margin-top: 12px;
    background: #111;
  }
  .max {
    width: 14px;
    height: 12px;
    border: 3px solid #111;
  }

  /* Now Playing: cover on top, words below. */
  .now-body {
    flex: 1 1 0;
    min-height: 0;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  .cover {
    flex: none;
    width: 512px;
    height: 512px;
    background: #111;
  }
  h1 {
    margin-top: 18px;
    font-size: 52px;
    line-height: 1.08;
    font-weight: 700;
  }
  .artist {
    margin-top: 4px;
    font-size: 36px;
  }
  .credit {
    font-size: 21px;
    line-height: 1.4;
    color: #333;
  }
  .artist + .credit {
    margin-top: 6px;
  }

  .paper {
    background: #fff;
  }
  .lyrics-win {
    flex: 1 1 0;
  }
  .lyrics {
    flex: 1 1 0;
    min-height: 0;
    margin: 16px;
    padding: 20px 24px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .line {
    min-height: 34px;
    margin: 6px 0;
    font-size: 26px;
    line-height: 1.3;
    color: #555;
  }
  .line.active {
    --lines: 2;
    padding: 4px 10px;
    font-size: 38px;
    line-height: 1.16;
    font-weight: 700;
    background: var(--navy);
    color: #fff;
  }

  /* Fixed height: two meters side by side always fit. */
  .meters-win {
    flex: none;
    height: 256px;
  }
  .meters {
    flex: 1 1 0;
    min-height: 0;
    padding: 14px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    align-items: center;
  }
  .face {
    background: #fff;
    overflow: hidden;
  }

  /* Fixed height sized for four lines of fact text. */
  .fact-win {
    flex: none;
    height: 268px;
  }
  .fact-body {
    flex: 1 1 0;
    min-height: 0;
    margin: 16px;
    padding: 14px 18px;
    overflow: hidden;
  }
  .fact-tag {
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #333;
  }
  .fact {
    margin-top: 6px;
    font-size: 22px;
    line-height: 1.3;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }

  .console-win {
    flex: 1 1 0;
  }
  .terminal {
    flex: 1 1 0;
    min-height: 0;
    margin: 16px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    background: #000;
    color: #c0c0c0;
    font-family: 'VT323', monospace;
  }
  .log {
    flex: 1 1 0;
    min-height: 0;
  }
  .prompt {
    flex: none;
    height: 30px;
    line-height: 30px;
    font-size: 24px;
    color: #fff;
  }
  .cursor {
    display: inline-block;
    width: 12px;
    height: 20px;
    vertical-align: -2px;
    background: #fff;
    animation: blink 1s steps(1) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cursor {
      animation: none;
    }
  }

  .taskbar {
    flex: none;
    height: 64px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--grey);
    border-top: 4px solid var(--hi);
    font-size: 22px;
  }
  .task {
    height: 46px;
    padding: 0 18px;
    display: flex;
    align-items: center;
    background: var(--grey);
  }
  .task.start {
    font-weight: 700;
  }
  .task.pressed {
    background: #d8d8d8;
  }
  .task.clock {
    margin-left: auto;
    background: var(--grey);
  }
</style>
