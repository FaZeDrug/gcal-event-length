const fs = require('node:fs');
const path = require('node:path');
const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let top = '', sides = '';
for (let y = 2; y < 560; y += 4) {
  for (let x = 2; x < 360; x += 4) {
    const density = .85 * Math.exp(-Math.pow((x - 15) / 48, 2) - Math.pow((y - 60) / 110, 2))
      + .7 * Math.exp(-Math.pow((x - 314) / 45, 2) - Math.pow((y - 95) / 87, 2));
    const threshold = (bayer[(Math.floor(y / 4) % 4) * 4 + Math.floor(x / 4) % 4] + .5) / 16;
    if (y < 184 && density > threshold) top += `<circle cx="${x}" cy="${y}" r=".9"/>`;
    if (y >= 184 && (x < 18 || x > 342) && threshold < .4) sides += `<circle cx="${x}" cy="${y}" r=".65"/>`;
  }
}
fs.writeFileSync(path.join(__dirname, 'texture.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="560" viewBox="0 0 360 560"><g fill="#FFFDF7" opacity=".65">${top}</g><g fill="#FFFDF7" opacity=".22">${sides}</g></svg>`);
