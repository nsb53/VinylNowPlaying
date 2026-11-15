<script lang="ts">
  // "Techno · Acid Log": black, acid yellow and white, brutalist type, and the
  // app's own live log streaming down the left. New log lines enter first;
  // between them the recent log keeps cycling so the column never stops.
  import { onMount } from 'svelte';
  import Cover from '../lib/Cover.svelte';
  import CodeStream from '../lib/CodeStream.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  type LogLine = { seq: number; time: string; event: string; text: string };
  const KEEP = 80;
  let recent: string[] = [];
  let fresh: string[] = [];
  let cursor = 0;
  let after = 0;

  const format = (line: LogLine) => `[${line.time}] ${line.event} ${line.text}`;

  async function poll() {
    try {
      const response = await fetch(`/api/logs?after=${after}`, { cache: 'no-store' });
      const data = await response.json();
      // Skip request lines and the TVs' screen-size reports: noise, not activity.
      const lines = (data.lines ?? []).filter((line: LogLine) => line.event !== 'http' && line.event !== 'screen');
      if (data.lines?.length) after = data.lines[data.lines.length - 1].seq;
      if (lines.length) {
        const text = lines.map(format);
        fresh.push(...text.slice(-KEEP));
        recent = [...recent, ...text].slice(-KEEP);
      }
    } catch {
      // Keep cycling what we have; the state poll reports a lost connection.
    }
  }

  onMount(() => {
    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  });

  const nextLine = () => {
    if (fresh.length) return fresh.shift() as string;
    if (!recent.length) return '';
    cursor = (cursor + 1) % recent.length;
    return recent[recent.length - 1 - cursor];
  };
</script>

<div class="acid">
  <div class="stream"><CodeStream next={nextLine} rows={44} every={260} size={17} lineHeight={24.5} /></div>

  <div class="main">
    <div class="rpm" aria-hidden="true">33⅓</div>

    <div class="top">
      <div class="header">
        <div class="tag">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
        <h1 class="clamp" style="--lines: 2" use:fit={{ max: 92, min: 56, lines: 2, lineHeight: 1.02, text: head.title }}>
          {head.title}
        </h1>
        <div class="artist one-line">{head.artist}</div>
        {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
        {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
      </div>
      <div class="sleeve">
        <div class="block"></div>
        <div class="cover"><Cover /></div>
      </div>
    </div>

    <div class="lyrics">
      {#if lyrics.lines.length}
        {#each lyrics.lines as l}
          <div class={l.active ? 'line active clamp' : 'line one-line'}>{l.text}</div>
        {/each}
      {:else}
        <div class="line">{lyrics.note}</div>
      {/if}
    </div>

    <div class="bottom">
      <div class="meters">
        <div class="face"><VuMeter channel="L" /></div>
        <div class="face"><VuMeter channel="R" /></div>
      </div>
      {#if fact}
        <div class="trivia">
          <div class="heading">
            <div>DID YOU KNOW?</div>
            <div>{fact.counter}</div>
          </div>
          {#key fact.index}
            <div class="fact clamp" style="--lines: 4">{fact.text}</div>
          {/key}
        </div>
      {:else}
        <div></div>
      {/if}
    </div>
  </div>
</div>

<style>
  .acid {
    --bg: #0a0a0a;
    --acid: #e4ff1a;
    --grey: #7a7a7a;
    --white: #ffffff;
    --stream-head: #e4ff1a;
    --stream-ink: #9a9a9a;
    --record: #000;
    --record-groove: #2a2a2a;
    --record-label: #e4ff1a;
    --vu-scale: #0a0a0a;
    --vu-red: #ff3b1f;
    --vu-needle: #0a0a0a;
    --vu-font: 'IBM Plex Mono', monospace;

    width: 1920px;
    height: 1080px;
    display: grid;
    grid-template-columns: 560px minmax(0, 1fr);
    overflow: hidden;
    background: var(--bg);
    color: var(--white);
    font-family: 'Space Grotesk', sans-serif;
  }

  .stream {
    height: 1080px;
    padding: 0 30px;
    border-right: 6px solid var(--acid);
    font-family: 'IBM Plex Mono', monospace;
  }

  .main {
    position: relative;
    min-width: 0;
    height: 1080px;
    padding: 64px 72px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .rpm {
    position: absolute;
    right: 60px;
    top: 500px;
    font-family: 'Unbounded', sans-serif;
    font-size: 200px;
    font-weight: 900;
    line-height: 1;
    color: transparent;
    -webkit-text-stroke: 2px #2e2e2e;
  }

  .top {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 400px;
    grid-gap: 56px;
  }
  .header {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .tag {
    align-self: flex-start;
    padding: 8px 16px;
    background: var(--acid);
    color: var(--bg);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 3px;
  }
  h1 {
    margin-top: 16px;
    padding-bottom: 6px;
    font-family: 'Unbounded', sans-serif;
    font-size: 92px;
    line-height: 1.02;
    font-weight: 900;
    text-transform: uppercase;
    color: var(--acid);
  }
  .artist {
    margin-top: 10px;
    font-size: 46px;
    font-weight: 700;
  }
  .credit {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 19px;
    line-height: 1.6;
    color: var(--grey);
  }
  .artist + .credit {
    margin-top: 10px;
  }

  .sleeve {
    position: relative;
    width: 400px;
    height: 400px;
    margin-top: 40px;
  }
  .block {
    position: absolute;
    left: 18px;
    top: 18px;
    width: 400px;
    height: 400px;
    background: var(--acid);
  }
  .cover {
    position: absolute;
    inset: 0;
    background: #1c1c1c;
  }

  .line {
    min-height: 36px;
    margin: 10px 0;
    font-size: 28px;
    line-height: 1.3;
    color: var(--grey);
  }
  .line.active {
    --lines: 2;
    font-size: 46px;
    line-height: 1.15;
    font-weight: 700;
    color: var(--white);
  }

  .bottom {
    display: grid;
    grid-template-columns: 520px minmax(0, 1fr);
    grid-gap: 48px;
    align-items: end;
  }
  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 24px;
  }
  .face {
    background: var(--white);
    overflow: hidden;
  }
  .trivia {
    padding: 22px 26px;
    background: var(--acid);
    color: var(--bg);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
  }
  .fact {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
