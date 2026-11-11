// Shrinks an element's font size until its text fits in a set number of lines.

type FitOptions = { max: number; min: number; lines: number; lineHeight: number; text?: unknown };

export function fit(node: HTMLElement, options: FitOptions) {
  function run(o: FitOptions) {
    const style = getComputedStyle(node);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    let size = o.max;
    node.style.fontSize = `${size}px`;
    while (
      size > o.min &&
      (node.scrollHeight > o.lines * size * o.lineHeight + padding + size * 0.25 || node.scrollWidth > node.clientWidth + 1)
    ) {
      size -= 4;
      node.style.fontSize = `${size}px`;
    }
  }

  run(options);
  // Measure again once the web font has replaced the fallback font.
  document.fonts?.ready.then(() => run(options));

  return {
    update(next: FitOptions) {
      options = next;
      run(next);
    },
  };
}
