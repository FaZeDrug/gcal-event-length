const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'docs', 'store-assets');
const data = (file, type) => 'data:' + type + ';base64,' + fs.readFileSync(file).toString('base64');
const img = (name) => data(path.join(assets, 'source', name), 'image/png');
const inter = data(path.join(root, 'extension', 'fonts', 'Inter-Regular.otf'), 'font/otf');
const serif = data(path.join(assets, 'fonts', 'Newsreader.ttf'), 'font/ttf');

const style = `
  @font-face { font-family: Inter; src: url(${inter}); }
  @font-face { font-family: Newsreader; src: url(${serif}); font-weight: 200 800; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1280px; height: 800px; overflow: hidden; background: #fff; color: #111; font-family: Inter, sans-serif; position: relative; -webkit-font-smoothing: antialiased; }
  .line { position: absolute; background: #e7e7e7; }
  .h { height: 1px; left: 0; right: 0; }
  .v { width: 1px; top: 0; bottom: 0; }
  .tick { position: absolute; width: 9px; height: 9px; margin: -4px 0 0 -4px; }
  .tick::before, .tick::after { content: ''; position: absolute; background: #b8b8b8; }
  .tick::before { left: 4px; top: 0; width: 1px; height: 9px; }
  .tick::after { top: 4px; left: 0; height: 1px; width: 9px; }
  h1 { position: absolute; left: 80px; top: 34px; font: 400 50px/1.1 Newsreader, serif; letter-spacing: -.025em; font-variation-settings: 'opsz' 60; }
  .dots { position: absolute; background-image: radial-gradient(#cfcfcf 1px, transparent 1.2px); background-size: 9px 9px; }
  .frame { position: absolute; overflow: hidden; }
  .frame img { display: block; width: 100%; }
  .popup { border: 1px solid #e2e2e2; box-shadow: 0 24px 60px rgba(40, 30, 90, .12), 0 2px 6px rgba(0, 0, 0, .05); background: #fff; }
  .calendar { border-radius: 14px; box-shadow: 0 20px 50px rgba(0, 0, 0, .18); }
  .label { position: absolute; font-size: 14px; color: #8b8b8b; letter-spacing: .01em; }
  .copy { position: absolute; font-size: 15px; line-height: 1.5; color: #6b6b6b; }
  .facts { position: absolute; font-size: 13px; color: #8b8b8b; line-height: 2.3; }
  .facts span { display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #5b3fd3; margin: 0 10px 2px 0; vertical-align: middle; }
  .tabs { position: absolute; left: 40px; right: 40px; top: 737px; height: 63px; display: flex; align-items: center; gap: 0; }
  .tab { padding: 0 36px; height: 44px; display: flex; align-items: center; font-size: 16px; color: #9a9a9a; }
  .tab.on { color: #111; text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 1px; background-image: radial-gradient(#d3d3d3 1px, transparent 1.2px); background-size: 6px 6px; margin-left: 0; }
`;

const tabs = ['Outlined box', 'Parentheses', 'Event details', 'Off'];
const grid = (divider) => [128, 736].map((y) => `<div class="line h" style="top:${y}px"></div>`).join('')
  + [40, divider, 1240].map((x) => `<div class="line v" style="left:${x}px; ${x === divider ? 'top:128px; bottom:64px' : ''}"></div>`).join('')
  + [[40, 128], [divider, 128], [1240, 128], [40, 736], [divider, 736], [1240, 736]].map(([x, y]) => `<div class="tick" style="left:${x}px; top:${y}px"></div>`).join('');
const slide = (active, title, body) => grid(500) + `<h1>${title}</h1>${body}<div class="tabs">${tabs.map((tab, i) => `<div class="tab${i === active ? ' on' : ''}">${tab}</div>`).join('')}</div>`;
const popup = (state) => `<div class="dots" style="left:41px; top:129px; width:459px; height:607px; -webkit-mask-image: radial-gradient(ellipse at 50% 55%, transparent 38%, #000 75%);"></div>
  <div class="frame popup" style="left:90px; top:174px; width:360px; height:480px;"><img src="${img('popup-' + state + '.png')}"></div>`;
const facts = (items, top = 470) => `<div class="facts" style="left:540px; top:${top}px;">${items.map((item) => `<div><span></span>${item}</div>`).join('')}</div>`;
const calendar = (state, label, copy, items) => popup(state) + `
  <div class="label" style="left:540px; top:172px;">${label}</div>
  <div class="copy" style="left:540px; top:214px; width:210px;">${copy}</div>
  ${facts(items)}
  <div class="dots" style="left:540px; top:640px; width:200px; height:72px;"></div>
  <div class="frame calendar" style="left:776px; top:168px; width:420px;"><img src="${img('calendar-' + state + '.png')}"></div>`;

const pages = {
  'screenshot-1-box.png': [1280, 800, slide(0, 'See event durations at a glance', calendar('box', 'Outlined box', 'A compact badge sits right beside each event time, so you never do the math again.', ['Day and Week views', 'Short events too', 'Black or white for contrast']))],
  'screenshot-2-text.png': [1280, 800, slide(1, 'Prefer plain text? Use parentheses', calendar('text', 'Parentheses', 'Pick the style in the popup. Open Calendar tabs switch instantly, no refresh needed.', ['Saved on this device', 'Updates open tabs live', 'No account or sign-in']))],
  'screenshot-3-details.png': [1280, 800, slide(2, 'Click an event to see its length', popup('box') + `
    <div class="label" style="left:540px; top:172px;">Event details</div>
    <div class="copy" style="left:540px; top:214px; width:520px;">Open any event and the duration appears next to its time, in whichever style you chose.</div>
    <div class="label" style="left:540px; top:330px;">Outlined box</div>
    <div class="frame calendar" style="left:540px; top:362px; padding:22px 30px; background:#1e1f20;"><img src="${img('details-box.png')}" style="width:432px;"></div>
    <div class="label" style="left:540px; top:500px;">Parentheses</div>
    <div class="frame calendar" style="left:540px; top:532px; padding:22px 30px; background:#1e1f20;"><img src="${img('details-text.png')}" style="width:432px;"></div>
`)],
  'screenshot-4-off.png': [1280, 800, slide(3, 'Turn durations off anytime', calendar('off', 'Show durations', 'One switch hides every label. Turn it back on and your style returns.', ['Your style choice is kept', 'Applies to every open tab', 'No data leaves your browser']))],
  'promo-440x280.png': [440, 280, `
    <style>body { width: 440px; height: 280px; } h1 { left: 34px; top: 34px; font-size: 34px; width: 260px; }</style>
    <div class="line h" style="top:20px"></div><div class="line h" style="top:260px"></div>
    <div class="line v" style="left:20px"></div><div class="line v" style="left:420px"></div>
    ${[[20, 20], [420, 20], [20, 260], [420, 260]].map(([x, y]) => `<div class="tick" style="left:${x}px; top:${y}px"></div>`).join('')}
    <h1>Event durations at a glance</h1>
    <div class="dots" style="left:34px; top:176px; width:130px; height:66px;"></div>
    <div class="frame calendar" style="left:180px; top:160px; width:224px; border-radius:8px;"><img src="${img('event-chip.png')}"></div>`]
};

(async () => {
  const browser = await chromium.launch();
  for (const [file, [width, height, body]] of Object.entries(pages)) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent('<!doctype html><meta charset="utf-8"><style>' + style + '</style>' + body);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(assets, file) });
    await page.close();
  }
  await browser.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
