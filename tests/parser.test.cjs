const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../extension/duration.js');
const { duration, format } = globalThis.CalendarLength;

for (const [input, expected] of [
  ['9:11–11:32pm', 141], ['9:11 PM – 11:32 PM', 141],
  ['21:11–23:32', 141], ['9am to 10am', 60], ['12pm–1pm', 60],
  ['12am–1am', 60], ['11am–12pm', 60], ['00:00–01:00', 60],
  ['12:00–13:00', 60], ['noon–1pm', 60], ['midnight–1am', 60],
  ['9:11\u202fPM–11:32\u00a0PM', 141], ['9 a.m. - 10 a.m.', 60],
  ['9–10pm', 60], ['12–1pm', 60], ['14:00—14:45', 45]
]) test(`parse ${input}`, () => assert.equal(duration(input), expected));

for (const input of [
  'All day', '9–10', '11–1pm', '11pm–1am', '23:00–01:00',
  '12am–12am', '12pm–12pm', '9am–10', '25:00–26:00',
  '9:60–10:00', '0am–1am', '13pm–14pm', '21:00–11pm',
  'Meeting 9am–10am', '9am–10am tomorrow', '9am–10am, 11am–12pm',
  '9:1–10:00', '', '9:00–9:00'
]) test(`reject ${JSON.stringify(input)}`, () => assert.equal(duration(input), null));

test('compact duration formatting', () => {
  assert.equal(format(141), '2h 21m');
  assert.equal(format(60), '1h');
  assert.equal(format(45), '45m');
});

test('manifest is MV3 with only Calendar content access', () => {
  const manifest = require('../extension/manifest.json');
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://calendar.google.com/*']);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.background, undefined);
});
