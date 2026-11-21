<script lang="ts">
  // "Jazz Brunch · Ticket": a teal ticket with notched edges on a cream page,
  // a "Side A" badge, and a black band with the artist and meters.
  import Cover from '../lib/Cover.svelte';
  import VuMeter from '../lib/VuMeter.svelte';
  import { fit } from '../lib/fit';
  import { credits, factView, headline, lyricView } from '../lib/store.svelte';

  const head = $derived(headline());
  const info = $derived(credits());
  const lyrics = $derived(lyricView(1, 1));
  const fact = $derived(factView());
  const details = $derived([info.release, info.writers].filter(Boolean).join(' · '));

  // Faint music staff with a few notes drifting across the ticket.
  const staff = [0, 1, 2, 3, 4].map((n) => {
    const y = 250 + n * 22;
    return `M0 ${y} C 300 ${y - 90}, 640 ${y + 120}, 1000 ${y - 30}`;
  });
  const notes = [
    { x: 300, y: 238 },
    { x: 470, y: 262 },
    { x: 640, y: 270 },
    { x: 820, y: 236 },
  ];
</script>

<div class="ticket-page">
  <div class="ticket">
    <svg class="staff" viewBox="0 0 1000 400" aria-hidden="true">
      {#each staff as d}
        <path {d} />
      {/each}
      {#each notes as n}
        <ellipse cx={n.x} cy={n.y} rx="17" ry="12" transform="rotate(-20 {n.x} {n.y})" />
        <line x1={n.x + 15} y1={n.y - 4} x2={n.x + 15} y2={n.y - 74} />
      {/each}
    </svg>
    <div class="notch left"></div>
    <div class="notch right"></div>

    <div class="main">
      <div class="cover"><Cover /></div>

      <div class="middle">
        <div class="header">
          <div class="label">SUNDAY BRUNCH</div>
          <h1 class="clamp" style="--lines: 2" use:fit={{ max: 92, min: 56, lines: 2, lineHeight: 1, text: head.title }}>
            {head.title}
          </h1>
          <div class="label">{head.playing ? 'SESSIONS' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
        </div>
        <div class="lyrics">
          {#if lyrics.lines.length}
            {#each lyrics.lines as line}
              <div class={line.active ? 'line active clamp' : 'line one-line'}>{line.text}</div>
            {/each}
          {:else}
            <div class="line">{lyrics.note}</div>
          {/if}
        </div>
      </div>

      <div class="side">
        <div class="badge" aria-hidden="true">
          <div class="small">Side A</div>
          <div class="big">33⅓</div>
          <div class="small">rpm</div>
        </div>
        {#if fact}
          <div class="trivia">
            <div class="heading">
              <div>DID YOU KNOW?</div>
              <div>{fact.counter}</div>
            </div>
            {#key fact.index}
              <div class="fact clamp" style="--lines: 6">{fact.text}</div>
            {/key}
          </div>
        {/if}
      </div>
    </div>

    <div class="band">
      <div class="who">
        <div class="now">{head.playing ? 'NOW PLAYING' : head.stopped ? 'STOPPED' : 'LISTENING'}</div>
        <div class="artist one-line">{head.artist}</div>
        <div class="rule"></div>
        <div class="details one-line">{details}</div>
      </div>
      <div class="meters">
        <div class="face"><VuMeter channel="L" /></div>
        <div class="face"><VuMeter channel="R" /></div>
      </div>
    </div>
  </div>
</div>

<style>
  .ticket-page {
    --teal: #2a9499;
    --cream: #fbefdd;
    --ink: #1c1c1c;
    --record: #141414;
    --record-groove: #2f3a3b;
    --record-label: #fbefdd;
    --vu-scale: #1c1c1c;
    --vu-red: #c2481f;
    --vu-needle: #1c1c1c;
    --vu-font: 'Poppins', sans-serif;

    width: 1920px;
    height: 1080px;
    padding: 48px;
    overflow: hidden;
    background: var(--cream);
    font-family: 'Poppins', sans-serif;
  }

  .ticket {
    position: relative;
    width: 1824px;
    height: 984px;
    overflow: hidden;
    background: var(--teal);
    color: var(--cream);
  }
  .staff {
    position: absolute;
    left: 520px;
    top: 260px;
    width: 1000px;
    height: 400px;
  }
  .staff path,
  .staff line {
    fill: none;
    stroke: #1f7a7e;
    stroke-width: 3;
  }
  .staff line {
    stroke-width: 4;
  }
  .staff ellipse {
    fill: #1f7a7e;
  }
  .notch {
    position: absolute;
    top: 128px;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    background: var(--cream);
  }
  .notch.left {
    left: -38px;
  }
  .notch.right {
    right: -38px;
  }

  .main {
    position: absolute;
    left: 72px;
    top: 64px;
    right: 72px;
    height: 640px;
    display: grid;
    grid-template-columns: 470px minmax(0, 1fr) 420px;
    grid-gap: 60px;
  }
  .cover {
    width: 470px;
    height: 470px;
    border: 10px solid var(--cream);
    background: #23797d;
  }

  .middle {
    position: relative;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .label {
    font-size: 24px;
    font-weight: 500;
    letter-spacing: 12px;
  }
  h1 {
    margin: 10px 0;
    padding-bottom: 4px;
    font-size: 92px;
    line-height: 1;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: -1px;
  }
  .line {
    min-height: 34px;
    margin: 8px 0;
    font-size: 26px;
    line-height: 1.3;
    opacity: 0.75;
  }
  .line.active {
    --lines: 2;
    font-family: 'Abril Fatface', serif;
    font-size: 42px;
    line-height: 1.15;
    opacity: 1;
  }

  .side {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
  }
  .badge {
    width: 250px;
    height: 250px;
    border-radius: 50%;
    background: var(--ink);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Abril Fatface', serif;
    transform: rotate(-8deg);
  }
  .badge .small {
    font-size: 32px;
    line-height: 1;
  }
  .badge .big {
    font-size: 76px;
    line-height: 1.05;
  }
  .trivia {
    width: 420px;
    padding: 22px 26px;
    background: var(--cream);
    color: var(--ink);
  }
  .heading {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 5px;
    color: #1f7a7e;
  }
  .fact {
    margin-top: 8px;
    font-size: 23px;
    font-weight: 500;
    line-height: 1.32;
    animation: fact-in 700ms ease-out;
  }
  @keyframes fact-in {
    from {
      opacity: 0;
    }
  }

  .band {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 1824px;
    height: 236px;
    padding: 26px 72px;
    background: var(--ink);
    display: grid;
    grid-template-columns: minmax(0, 1fr) 540px;
    grid-gap: 60px;
    align-items: center;
  }
  .who {
    min-width: 0;
  }
  .now {
    font-size: 20px;
    font-weight: 500;
    letter-spacing: 10px;
  }
  .artist {
    margin-top: 4px;
    font-family: 'Abril Fatface', serif;
    font-size: 66px;
    line-height: 1.1;
  }
  .rule {
    height: 2px;
    margin: 8px 0;
    background: var(--cream);
    opacity: 0.4;
  }
  .details {
    font-size: 21px;
    font-weight: 500;
    color: #cfcfcf;
  }
  .meters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-gap: 24px;
  }
  .face {
    background: var(--cream);
    border-radius: 8px;
    overflow: hidden;
  }
</style>
