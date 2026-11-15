<script lang="ts">
  // The app's live console, the same lines as the control page's console:
  // scans, Shazam matches, lyrics and metadata lookups, sync. Newest at the
  // top; lines arrive only when something happens, at most one every PACE ms
  // so a burst still reads as it comes in.
  // Colours: --stream-head (newest line), --stream-ink, --stream-time,
  // --stream-good (matches), --stream-bad (errors).
  // With `terminal`, the newest line is at the bottom and older ones scroll
  // up, as in a terminal window; nothing fades.
  import { onMount } from 'svelte';

  let {
    rows,
    size = 17,
    lineHeight = 24,
    terminal = false,
  }: { rows: number; size?: number; lineHeight?: number; terminal?: boolean } = $props();

  type LogLine = { seq: number; time: string; event: string; text: string };
  const PACE = 350;

  let lines = $state<LogLine[]>([]);
  let queue: LogLine[] = [];
  let after = 0;

  const kind = (line: LogLine) => {
    if (/error|failed/i.test(`${line.event} ${line.text}`)) return 'bad';
    if (/result=matched|action=matched/.test(line.text)) return 'good';
    return '';
  };

  async function poll() {
    try {
      const response = await fetch(`/api/logs?after=${after}`, { cache: 'no-store' });
      const data = await response.json();
      if (data.last < after) {
        // The server restarted and numbers its lines from 1 again.
        after = 0;
        return;
      }
      const fresh: LogLine[] = data.lines ?? [];
      if (!fresh.length) return;
      after = fresh[fresh.length - 1].seq;
      if (!lines.length && !queue.length) {
        // First load: show the recent history at once, newest at the top.
        lines = fresh.slice(-rows).reverse();
        return;
      }
      queue.push(...fresh);
    } catch {
      // Restarting or unreachable; the next poll tries again.
    }
  }

  onMount(() => {
    poll();
    const pollTimer = setInterval(poll, 1000);
    const paceTimer = setInterval(() => {
      if (!queue.length) return;
      // A long backlog (the screen was asleep) skips ahead rather than crawling.
      if (queue.length > rows) queue = queue.slice(-rows);
      lines = [queue.shift() as LogLine, ...lines].slice(0, rows);
    }, PACE);
    return () => {
      clearInterval(pollTimer);
      clearInterval(paceTimer);
    };
  });

  const fade = (i: number) => (terminal ? 1 : i === 0 ? 1 : Math.max(0.15, 1 - (i / rows) * 0.85));
  // `lines` is kept newest first; a terminal shows it the other way up.
  const shown = $derived(terminal ? [...lines].reverse() : lines);
  const age = (i: number) => (terminal ? shown.length - 1 - i : i);
</script>

<div class="stream" class:terminal style="--size: {size}px; --line: {lineHeight}px" aria-hidden="true">
  {#each shown as line, i (line.seq)}
    <div class="row {kind(line)}" class:head={age(i) === 0} style="opacity: {fade(age(i))}">
      <span class="time">{line.time}</span> <span class="tag">{line.event}</span> {line.text}
    </div>
  {/each}
</div>

<style>
  .stream {
    overflow: hidden;
    height: 100%;
  }
  .stream.terminal {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .stream.terminal .row {
    flex: none;
  }
  /* Long entries (a Shazam match, a lyrics search) wrap onto up to three
     lines rather than being cut off, indented under the time. */
  .row {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    margin-bottom: 6px;
    padding-left: 2em;
    text-indent: -2em;
    line-height: var(--line);
    font-size: var(--size);
    overflow-wrap: anywhere;
    color: var(--stream-ink);
  }
  .row.head {
    color: var(--stream-head);
    animation: enter 300ms ease-out;
  }
  .time {
    color: var(--stream-time, inherit);
  }
  .tag {
    font-weight: 700;
  }
  .row.good {
    color: var(--stream-good, var(--stream-head));
  }
  .row.bad {
    color: var(--stream-bad, #ff5a5a);
  }
  @keyframes enter {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .row.head {
      animation: none;
    }
  }
</style>
