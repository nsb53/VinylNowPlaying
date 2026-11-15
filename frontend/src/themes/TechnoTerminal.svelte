<script lang="ts">
  // "Techno · Terminal": near-black and cyan, the app's own code streaming down
  // the left, HUD brackets around the cover.
  import Cover from '../lib/Cover.svelte';
  import CodeStream from '../lib/CodeStream.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());

  // Lines adapted from the app itself: the level meter, recognition and lyric timing.
  const CODE = `def level_loop(self):
    peak = meter.read_peak()
    rms = 20 * log10(abs(sample) + 1e-9)
    if peak <= DEAD_INPUT_DB:
        self.reopen_meter()
    vu.push(left_db, right_db)
sample = capture(seconds=8)
track = shazam.identify(sample)
if track and not same_track(track, current):
    current = track
    lyrics = lrclib.search(track)
    info = gemini.lookup(track)
    palette = album_style.from_cover(track.cover)
offset = track.recognized_offset
position = offset + elapsed + lyric_offset
for line in synced_lyrics:
    if line.time <= position:
        active = line
needle = -47 + 94 * deflection
deflection = 0.7079 * 10 ** (db / 20)
stream.send(level=rms, bands=spectrum)
fact = facts[index % len(facts)]
if silence_seconds > 120:
    clear_now_playing()
theme = settings.display_theme
render(theme, track, lyrics, fact)`.split('\n');
  // New lines enter at the top, so feed the code backwards: the column then
  // reads top to bottom in the right order while it flows down.
  let line = 0;
  const nextCode = () => CODE[CODE.length - 1 - (line++ % CODE.length)];
</script>

<div class="terminal">
  <div class="stream"><CodeStream next={nextCode} rows={46} /></div>

  <div class="main">
    <div class="top">
      <div class="cover-box">
        <i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>
        <div class="cover"><Cover /></div>
      </div>
      <div class="header">
        <div class="prompt">&gt; {head.playing ? 'NOW_PLAYING' : 'LISTENING'}  //  SIDE_A  //  33.3_RPM</div>
        <h1 class="clamp" style="--lines: 2" use:fit={{ max: 84, min: 52, lines: 2, lineHeight: 1.04, text: head.title }}>
          {head.title}
        </h1>
        <div class="artist one-line">{head.artist}</div>
        {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
        {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
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
            <div>&gt; did_you_know()</div>
            <div>{fact.counter ? `[${fact.counter.replace(/ /g, '')}]` : ''}</div>
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
  .terminal {
    --bg: #05070a;
    --cyan: #3cf2c0;
    --dim: #5e8f84;
    --white: #f2fffb;
    --stream-head: #f2fffb;
    --stream-ink: #3cf2c0;
    --record: #000;
    --record-groove: #12302a;
    --record-label: #3cf2c0;
    --vu-scale: #3cf2c0;
    --vu-red: #ff4d6d;
    --vu-needle: #f2fffb;
    --vu-font: 'JetBrains Mono', monospace;

    width: 1920px;
    height: 1080px;
    display: grid;
    grid-template-columns: 500px minmax(0, 1fr);
    overflow: hidden;
    background: var(--bg);
    color: var(--white);
    font-family: 'Chakra Petch', sans-serif;
  }

  .stream {
    height: 1080px;
    padding: 0 28px;
    border-right: 1px solid rgba(60, 242, 192, 0.35);
    background: #070b0e;
    font-family: 'JetBrains Mono', monospace;
  }

  .main {
    min-width: 0;
    height: 1080px;
    padding: 72px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .top {
    display: grid;
    grid-template-columns: 420px minmax(0, 1fr);
    grid-gap: 64px;
  }
  .cover-box {
    position: relative;
    width: 420px;
    height: 420px;
  }
  .cover {
    width: 420px;
    height: 420px;
    background: #0e1a1a;
  }
  .cover-box i {
    position: absolute;
    width: 36px;
    height: 36px;
    border: 0 solid var(--cyan);
  }
  .tl {
    left: -14px;
    top: -14px;
    border-width: 4px 0 0 4px !important;
  }
  .tr {
    right: -14px;
    top: -14px;
    border-width: 4px 4px 0 0 !important;
  }
  .bl {
    left: -14px;
    bottom: -14px;
    border-width: 0 0 4px 4px !important;
  }
  .br {
    right: -14px;
    bottom: -14px;
    border-width: 0 4px 4px 0 !important;
  }

  .header {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .prompt {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    white-space: pre;
    color: var(--cyan);
  }
  h1 {
    margin-top: 14px;
    padding-bottom: 6px;
    font-family: 'Orbitron', sans-serif;
    font-size: 84px;
    line-height: 1.04;
    font-weight: 900;
    text-transform: uppercase;
  }
  .artist {
    margin-top: 8px;
    font-size: 44px;
    font-weight: 600;
    color: var(--cyan);
  }
  .credit {
    font-family: 'JetBrains Mono', monospace;
    font-size: 19px;
    line-height: 1.6;
    color: var(--dim);
  }
  .artist + .credit {
    margin-top: 10px;
  }

  .line {
    min-height: 36px;
    margin: 10px 0;
    font-size: 28px;
    line-height: 1.3;
    color: var(--dim);
  }
  .line.active {
    --lines: 2;
    font-size: 46px;
    line-height: 1.15;
    font-weight: 700;
    color: var(--white);
    text-shadow: 0 0 18px rgba(60, 242, 192, 0.55);
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
    background: #071210;
    border: 1px solid rgba(60, 242, 192, 0.6);
    border-radius: 4px;
    overflow: hidden;
  }
  .trivia {
    padding: 20px 24px;
    border: 1px solid var(--cyan);
    background: rgba(60, 242, 192, 0.06);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    color: var(--cyan);
  }
  .fact {
    margin-top: 8px;
    font-size: 24px;
    line-height: 1.32;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
