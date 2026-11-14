<script lang="ts">
  // "Graffiti": spray paint on a dark brick wall, the meters as stickers, facts as a pasted-up poster.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, headline, lyricView, factView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 2));
  const fact = $derived(factView());
</script>

<div class="graffiti">
  <!-- The painted wall. It never changes, so it is kept on its own layer and drawn once. -->
  <svg class="wall" viewBox="0 0 1920 1080" aria-hidden="true">
    <defs>
      <pattern id="gf-bricks" width="150" height="120" patternUnits="userSpaceOnUse">
        <path d="M0 2 H150 M0 62 H150 M2 0 V60 M77 60 V120" fill="none" stroke="#0b0b0c" stroke-width="4" />
      </pattern>
      <filter id="gf-grit" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.9  0 0 0 0 0.9  0 0 0 0 0.86  0 0 0 2.4 -1.1" />
      </filter>
      <filter id="gf-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="11" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="14" />
      </filter>
      <filter id="gf-spray" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="soft" />
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="n" />
        <feDisplacementMap in="soft" in2="n" scale="16" />
      </filter>
      <filter id="gf-tag" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="1.2" result="soft" />
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="2" result="n" />
        <feDisplacementMap in="soft" in2="n" scale="5" />
      </filter>
    </defs>
    <rect x="0" y="0" width="1920" height="1080" fill="url(#gf-bricks)" opacity="0.55" />
    <g filter="url(#gf-spray)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="34" y="44" width="700" height="700" rx="40" transform="rotate(-3 384 394)" stroke="#19d3e0" stroke-width="30" opacity="0.9" />
      <path d="M800 532 C1060 486 1420 578 1860 512" stroke="#ff2e88" stroke-width="30" />
      <path d="M990 520 V612 M1340 548 V668 M1712 528 V590" stroke="#ff2e88" stroke-width="13" />
      <path d="M330 742 V806 M610 748 V790" stroke="#19d3e0" stroke-width="13" />
      <path d="M1690 392 V318 L1730 356 L1772 300 L1814 356 L1852 318 V392 Z" stroke="#c6f432" stroke-width="13" />
      <circle cx="1880" cy="1040" r="70" fill="#c6f432" opacity="0.8" />
      <circle cx="20" cy="1060" r="90" fill="#ff2e88" opacity="0.7" />
    </g>
    <g filter="url(#gf-tag)" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <text class="tag big" x="1010" y="900" transform="rotate(-9 1010 900)">LOUD</text>
      <text class="tag" x="96" y="792" transform="rotate(-5 96 792)">side A!</text>
      <path d="M300 770 q40 -22 78 4 M362 752 l18 24 l-30 6" stroke="#c6f432" stroke-width="7" />
      <path d="M1560 60 l44 44 M1604 60 l-44 44 M1640 60 l44 44 M1684 60 l-44 44" stroke="#edeae0" stroke-width="9" />
    </g>
    <g filter="url(#gf-rough)">
      <circle cx="770" cy="1016" r="34" fill="#0a0a0a" />
      <circle cx="822" cy="1046" r="12" fill="#0a0a0a" />
      <circle cx="742" cy="968" r="8" fill="#0a0a0a" />
      <circle cx="1894" cy="230" r="26" fill="#19d3e0" />
      <circle cx="1862" cy="268" r="9" fill="#19d3e0" />
    </g>
    <rect x="0" y="0" width="1920" height="1080" filter="url(#gf-grit)" opacity="0.4" />
  </svg>

  <div class="left">
    <div class="stack">
      <div class="frame">
        <div class="paper"></div>
        <div class="cover"><Cover /></div>
      </div>
      <div class="tape"></div>
    </div>
    <div class="meters">
      <div class="face"><VuMeter channel="L" /></div>
      <div class="face"><VuMeter channel="R" /></div>
    </div>
  </div>

  <div class="right">
    <div class="header">
      <div class="stencil">{head.playing ? 'NOW PLAYING' : 'LISTENING'}</div>
      <h1 class="clamp" style="--lines: 2" use:fit={{ max: 116, min: 60, lines: 2, lineHeight: 1, text: head.title }}>
        {head.title}
      </h1>
      <div class="artist one-line">{head.artist}</div>
      {#if info.release}<div class="credit one-line">{info.release}</div>{/if}
      {#if info.writers}<div class="credit one-line">{info.writers}</div>{/if}
    </div>

    <div class="body">
      <div class="lyrics">
        <div class="stencil heading">
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
  .graffiti {
    --pink: #ff2e88;
    --cyan: #19d3e0;
    --acid: #c6f432;
    --muted: #c9c9c4;
    --record: #000;
    --record-groove: #4a4a50;
    --record-label: #c6f432;
    --vu-scale: #111;
    --vu-red: #e0186f;
    --vu-needle: #111;
    --vu-font: 'Special Elite', monospace;

    position: relative;
    width: 1920px;
    height: 1080px;
    padding: 64px;
    display: grid;
    grid-template-columns: 660px minmax(0, 1fr);
    grid-gap: 72px;
    overflow: hidden;
    background: radial-gradient(1400px 850px at 55% 40%, #3a3b3f 0%, #232427 60%, #0e0e10 100%);
    color: #edeae0;
    font-family: 'Special Elite', monospace;
  }

  .wall {
    position: absolute;
    left: 0;
    top: 0;
    width: 1920px;
    height: 1080px;
    /* Own layer: the moving meters must not make the browser redraw the paint effects. */
    will-change: transform;
  }
  .tag {
    font-family: 'Sedgwick Ave Display', cursive;
    font-size: 62px;
    fill: var(--acid);
  }
  .tag.big {
    font-size: 300px;
    fill: var(--pink);
    opacity: 0.16;
  }

  .left,
  .right {
    position: relative;
    height: 952px;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .stack {
    position: relative;
    width: 660px;
    height: 660px;
  }
  .frame {
    position: absolute;
    left: 30px;
    top: 26px;
    width: 600px;
    height: 600px;
    transform: rotate(2deg);
  }
  /* Ragged white border; the artwork inside it stays clean. */
  .paper {
    position: absolute;
    left: 0;
    top: 0;
    width: 600px;
    height: 600px;
    background: #f1eee4;
    filter: url(#gf-rough);
  }
  .cover {
    position: absolute;
    left: 16px;
    top: 16px;
    width: 568px;
    height: 568px;
    overflow: hidden;
    background: #0e0e10;
  }
  .tape {
    position: absolute;
    left: 226px;
    top: -4px;
    width: 200px;
    height: 56px;
    background: #8c8c86;
    opacity: 0.92;
    transform: rotate(-6deg);
    filter: url(#gf-rough);
  }

  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 28px;
  }
  /* Stickers. */
  .face {
    background: #f4f1e8;
    border: 9px solid #fff;
    border-radius: 20px;
    box-shadow: 6px 8px 0 rgba(0, 0, 0, 0.5);
    overflow: hidden;
    transform: rotate(-2.5deg);
  }
  .face + .face {
    transform: rotate(2deg);
  }

  .stencil {
    font-family: 'Saira Stencil One', sans-serif;
    font-size: 24px;
    letter-spacing: 4px;
  }
  h1 {
    margin-top: 8px;
    padding-bottom: 6px;
    font-family: 'Rubik Wet Paint', sans-serif;
    font-size: 116px;
    line-height: 1;
    font-weight: 400;
    text-transform: uppercase;
    color: var(--acid);
    text-shadow: 6px 6px 0 #0a0a0a;
    transform: rotate(-1.5deg);
    transform-origin: left center;
  }
  .artist {
    padding: 6px 12px 6px 0;
    font-family: 'Sedgwick Ave Display', cursive;
    font-size: 84px;
    line-height: 1.1;
    color: var(--pink);
    text-shadow: 3px 3px 0 #0a0a0a;
    transform: rotate(-3deg);
    transform-origin: left center;
  }
  .credit {
    font-size: 24px;
    line-height: 1.45;
    color: var(--muted);
    text-shadow: 2px 2px 0 #0a0a0a;
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 470px;
    grid-gap: 56px;
    align-items: end;
  }

  .heading {
    display: flex;
    justify-content: space-between;
    color: var(--muted);
  }
  .lyrics {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .lyrics .heading {
    align-self: stretch;
  }
  .line {
    max-width: 100%;
    margin-top: 14px;
    min-height: 37px;
    font-size: 28px;
    line-height: 1.3;
    color: var(--muted);
    text-shadow: 2px 2px 0 #0a0a0a;
  }
  .line.active {
    --lines: 2;
    font-family: 'Permanent Marker', cursive;
    font-size: 46px;
    line-height: 1.2;
    color: #fff;
    text-shadow: 3px 3px 0 #0a0a0a;
    border-bottom: 9px solid var(--cyan);
    transform: rotate(-1.5deg);
    transform-origin: left center;
  }

  /* A pasted-up poster with ragged top and bottom edges. */
  .trivia {
    max-height: 524px;
    overflow: hidden;
    padding: 32px 30px 28px;
    background: linear-gradient(175deg, #efebdd 0%, #dcd6c2 100%);
    color: #151515;
    transform: rotate(3deg);
    clip-path: polygon(
      0 3%, 6% 0, 13% 2.5%, 21% 0.5%, 30% 3%, 39% 0, 48% 2%, 57% 0.5%, 66% 3%, 75% 0, 84% 2.5%, 92% 0.5%, 100% 3%,
      100% 97%, 93% 100%, 85% 97.5%, 76% 99.5%, 67% 97%, 58% 100%, 49% 98%, 40% 99.5%, 31% 97%, 22% 100%, 14% 97.5%,
      7% 99.5%, 0 97%
    );
  }
  .trivia .heading {
    color: #c4145f;
  }
  .fact-tag {
    margin-top: 16px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 3px;
    font-family: 'Permanent Marker', cursive; letter-spacing: 1px; color: #c4145f;
  }
  .fact {
    margin-top: 12px;
    font-size: 26px; line-height: 1.35;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }
</style>
