const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const routes = {
  '/': 'demo/index.html',
  '/calendar/u/0/r/week': 'demo/index.html',
  '/calendar/u/0/r/day': 'demo/index.html',
  '/demo.js': 'demo/demo.js',
  '/demo.css': 'demo/demo.css',
  '/extension/duration.js': 'extension/duration.js',
  '/extension/content.js': 'extension/content.js',
  '/extension/content.css': 'extension/content.css'
};
const server = http.createServer((req, res) => {
  const file = routes[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404).end(); return; }
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
  res.setHeader('Content-Type', types[path.extname(file)]);
  res.end(fs.readFileSync(path.join(root, file)));
});
if (require.main === module) server.listen(4173, '0.0.0.0', () => console.log('Local fixture demo: http://localhost:4173'));
module.exports = server;
