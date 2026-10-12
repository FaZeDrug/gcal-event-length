(() => {
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const mask = document.createElement('canvas');
  mask.width = 150;
  mask.height = 85;
  const ink = mask.getContext('2d', { willReadFrequently: true });
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let clock = 0, previous = 0, frame = 0, accumulator = 0;
  const anchors = [];
  const petals = Array.from({ length: 4 }, (_, i) => ({ age: i * 1.3, life: 5 + i * .3, origin: null, phase: i * 2.3 }));
  const branches = [
    { length: 95, angle: -.35, phase: 0, flowers: [[30, -8, 13], [61, 7, 14], [86, -9, 12]], children: [
      { length: 86, angle: -.42, phase: 1.3, flowers: [[28, -7, 12], [62, 6, 13]], children: [] },
      { length: 96, angle: .5, phase: 2.4, flowers: [[31, -6, 14], [72, 6, 12]], children: [
        { length: 85, angle: .35, phase: 3, flowers: [[53, -7, 13]], children: [] }
      ] }
    ] },
    { length: 95, angle: -.14, phase: 1.8, flowers: [[34, 6, 13], [72, -8, 12]], children: [
      { length: 83, angle: .24, phase: 3.6, flowers: [[32, 6, 13], [65, -6, 12]], children: [] }
    ] }
  ];

  function flower(x, y, radius, phase, time) {
    radius += 1;
    ink.save();
    ink.translate(x, y);
    ink.rotate(phase + Math.sin(time * .72 - phase) * .035);
    const point = ink.getTransform().transformPoint({ x: 0, y: 0 });
    anchors.push({ x: point.x * 2, y: point.y * 2 });
    for (let p = 0; p < 5; p++) {
      ink.save();
      ink.rotate(p * Math.PI * 2 / 5);
      ink.fillStyle = `rgba(255,255,255,${p % 2 ? .68 : .84})`;
      ink.beginPath();
      ink.moveTo(0, 1);
      ink.bezierCurveTo(-radius * .15, -radius * .18, -radius * .62, -radius * .58, -radius * .4, -radius * .88);
      ink.bezierCurveTo(-radius * .30, -radius * 1.06, -radius * .10, -radius * 1.02, 0, -radius * .86);
      ink.bezierCurveTo(radius * .10, -radius * 1.02, radius * .30, -radius * 1.06, radius * .4, -radius * .88);
      ink.bezierCurveTo(radius * .62, -radius * .58, radius * .15, -radius * .18, 0, 1);
      ink.fill();
      ink.restore();
    }
    ink.clearRect(-2, -2, 4, 4);
    ink.fillStyle = 'rgba(255,255,255,.9)';
    ink.fillRect(-1, -1, 2, 2);
    ink.restore();
  }

  function branch(node, time) {
    ink.save();
    ink.rotate(node.angle + Math.sin(time * .72 - node.phase) * .032);
    ink.strokeStyle = 'rgba(255,255,255,.55)';
    ink.lineWidth = 1.8;
    ink.beginPath();
    ink.moveTo(0, 0);
    ink.quadraticCurveTo(node.length * .5, 3, node.length, 0);
    ink.stroke();
    for (const [x, y, radius] of node.flowers) {
      ink.beginPath(); ink.moveTo(x - 6, 1); ink.lineTo(x, y); ink.stroke();
      flower(x, y, radius, node.phase + x / 70, time);
    }
    ink.fillStyle = 'rgba(255,255,255,.6)';
    ink.beginPath(); ink.ellipse(node.length - 2, -3, 2, 3, -.3, 0, Math.PI * 2); ink.fill();
    ink.translate(node.length, 0);
    for (const child of node.children) branch(child, time);
    ink.restore();
  }

  function render(time, falling = true, dt = 0, exportSVG = false) {
    const begin = performance.now();
    anchors.length = 0;
    ink.setTransform(1, 0, 0, 1, 0, 0);
    ink.clearRect(0, 0, 150, 85);
    ink.scale(1 / 2, 1 / 2);
    for (let i = 0; i < branches.length; i++) {
      ink.save(); ink.translate(-12, i ? 131 : 100); branch(branches[i], time); ink.restore();
    }
    if (falling) for (let i = 0; i < petals.length; i++) {
      const petal = petals[i];
      if (!petal.origin) petal.origin = { ...anchors[(i * 3 + 1) % anchors.length] };
      petal.age += dt;
      if (petal.age > petal.life) { petal.age -= petal.life; petal.origin = { ...anchors[(i * 3 + 1) % anchors.length] }; }
      const x = petal.origin.x + petal.age * 10 + Math.sin(petal.age * 2 + petal.phase) * 5;
      const y = petal.origin.y + petal.age * (170 - petal.origin.y) / petal.life;
      ink.save(); ink.translate(x, y); ink.rotate(petal.phase + Math.sin(petal.age) * .5);
      ink.fillStyle = 'rgba(255,255,255,.72)';
      ink.beginPath(); ink.ellipse(0, 0, 2.8, 5, 0, 0, Math.PI * 2); ink.fill(); ink.restore();
    }
    const pixels = ink.getImageData(0, 0, 150, 85).data;
    context.clearRect(0, 0, 300, 170);
    let path = '';
    for (let y = 0; y < 85; y++) for (let x = 0; x < 150; x++) {
      const alpha = pixels[(y * 150 + x) * 4 + 3] / 255;
      if (alpha > (bayer[(y % 4) * 4 + x % 4] + .5) / 16) {
        context.fillStyle = (x + y) % 11 === 0 ? '#F1D6E3' : '#FFFDF7';
        context.fillRect(x * 2, y * 2, 2, 2);
        if (exportSVG) path += `M${x * 2} ${y * 2}h2v2h-2z`;
      }
    }
    if (exportSVG) window.sakuraSnapshot = `<svg width="300" height="170" viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFDF7" d="${path}"/></svg>`;
    window.sceneMetrics = { blossoms: anchors.length, cells: 2, renderMs: performance.now() - begin, reduced: !falling };
  }

  function tick(now) {
    frame = 0;
    if (document.hidden || reduced.matches) return;
    const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
    previous = now; accumulator += dt;
    if (accumulator >= 1 / 30) { clock += accumulator; render(clock, true, accumulator); accumulator = 0; }
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    if (reduced.matches) render(0, false);
    else if (!document.hidden) frame = requestAnimationFrame(tick);
  }
  window.renderSakura = (time, falling = true) => { cancelAnimationFrame(frame); frame = 0; render(time, falling, 0, true); };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', resume);
  reduced.addEventListener('change', resume);
  render(0, !reduced.matches);
  document.querySelector('.poster').hidden = true;
  resume();
})();
