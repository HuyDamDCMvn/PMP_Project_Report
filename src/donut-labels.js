// Keep SVG text at the legend's screen size instead of scaling tiny labels
// with the chart. Long labels widen only the chart's local scroll region.
let observers = [];

export function fitDonutLabels(root) {
  observers.forEach(observer => observer.disconnect());
  observers = [];
  root.querySelectorAll('.donut-wrap').forEach(wrap => {
    const svg = wrap.querySelector('svg');
    const panel = wrap.closest('.pie-panel');
    const name = panel.querySelector('.pie-key span');
    const value = panel.querySelector('.pie-key small');
    if (!svg || !name || !value) return;
    const fit = () => {
      if (!wrap.clientWidth || !panel.open) return;
      const nameSize = parseFloat(getComputedStyle(name).fontSize);
      const valueSize = parseFloat(getComputedStyle(value).fontSize);
      // Narrow charts retain a complete HTML legend; duplicate external labels
      // are hidden rather than forcing a scrolling/cropped SVG.
      const compact = wrap.clientWidth < 520;
      svg.querySelectorAll('.donut-label').forEach(label=>{ label.style.display=compact ? 'none' : ''; });
      if (compact) {
        svg.setAttribute('viewBox','-1 -10 44 62');
        svg.style.maxHeight='320px';
        svg.style.width='100%'; wrap.tabIndex=-1;
        return;
      }
      svg.style.maxHeight='';
      let scale = Math.max(3.5, wrap.clientWidth / 134);
      const texts = [...svg.querySelectorAll('.donut-label text')];
      let left = -1, right = 43;
      for (let pass = 0; pass < 8; pass++) {
        texts.forEach(text => {
          text.style.fontSize = `${nameSize / scale}px`;
          const detail = text.querySelector('tspan');
          if (detail) {
            detail.style.fontSize = `${valueSize / scale}px`;
            detail.setAttribute('dy', (nameSize + 3) / scale);
          }
        });
        const boxes = texts.map(text => text.getBBox());
        left = Math.min(-1, ...boxes.map(box => box.x)) - 2;
        right = Math.max(43, ...boxes.map(box => box.x + box.width)) + 2;
        const width = (right - left) * scale;
        if (width <= wrap.clientWidth + 1 || scale === 3.5 || pass === 7) break;
        scale = Math.max(3.5, scale * wrap.clientWidth / width);
      }
      svg.setAttribute('viewBox', `${left} -10 ${right - left} 62`);
      svg.style.width = `${(right - left) * scale}px`;
      wrap.tabIndex = (right - left) * scale > wrap.clientWidth + 1 ? 0 : -1;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', `${panel.querySelector('h2').textContent} chart`);
    };
    const observer = new ResizeObserver(fit);
    observers.push(observer);
    observer.observe(wrap);
    panel.addEventListener('toggle', fit);
    fit();
  });
}
