# Calendar Event Length

A small Manifest V3 extension that adds `2h 21m` beside the time text of supported Google Calendar event blocks. Plain JavaScript/CSS, no build step, backend, external APIs, storage, or analytics. The installed extension runs only on `https://calendar.google.com/*`.

**Status: locally tested prototype, not live-Calendar verified.** The cloud browser redirected to Google's public Calendar landing page. Access to the owner's Chrome was blocked by macOS Accessibility permissions. No authenticated event DOM was captured. The compatibility adapter uses publicly documented selectors, not selectors observed on the owner's Calendar. It may display no labels if Google has changed those classes.

## Install locally

1. Download this repository (or extract the supplied ZIP).
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder, which contains `manifest.json`. Do not select the repository root.
4. Refresh Google Calendar and explicitly select **Day** or **Week** view.

No Node installation or account authorization is required to install the extension. Your existing Calendar sign-in is used only by Calendar itself. After code updates, click **Reload** on the extension card and refresh Calendar. Disable/remove the extension there and refresh Calendar to remove its labels.

## Local interactive demo

With Node 22 or later:

```sh
npm run demo
```

Open `http://localhost:4173`. No dependency installation is needed for this demo. It provides edit, view-switch, DOM-replacement, click, and drag controls. This is an explicitly synthetic fixture using the same content script and CSS; it is **not** a replica or capture of live Google Calendar. The demo loads scripts directly, so the extension does not need localhost permission. The local development server is not part of the extension or a production backend.

## Behavior and deliberate limits

- Operates on explicit `/r/day` and `/r/week` routes, including dated routes. Other views and the initial route before Calendar redirects are skipped.
- Requires exactly one recognized, standalone time-range element per event block inside Calendar's main region. Dialogs, unsupported markup, all-day labels, and multiple time fields are skipped.
- Supports English AM/PM, `noon`, `midnight`, and colon-separated 24-hour times. `9:11–11:32pm` gives `2h 21m`; `12am–1am` gives `1h`.
- A shared trailing period, as in `9–10pm`, applies to both endpoints only when the result is positive. `11–1pm` is skipped rather than guessing the start period. Unmarked `9–10` is also skipped.
- Reverse/equal ranges are skipped. Overnight, multi-day, time-zone/DST elapsed-time calculations, non-English time words, and date-bearing ranges are not supported. These labels represent same-day wall-clock differences, not API-derived elapsed time.
- Batches DOM changes, updates reused nodes, removes stale/duplicate labels, and checks URL changes every 500 ms without patching Calendar's history methods. The observer disconnects during its own writes, preventing self-triggered loops.
- Labels have no event handlers, are hidden from accessibility naming, and cannot receive pointer events. Existing event content and handlers are preserved. Small blocks can clip the extra line; the extension does not resize Calendar blocks or change drag geometry intentionally.

## Selector evidence (not live verification)

The adapter intentionally isolates the fragile selectors at the top of `extension/content.js`:

- Event roots: `[data-eventid][role="button"]` and direct-child buttons, supported by [calblend's selectors](https://github.com/avelino/calblend/blob/2c7af04a9bccff84429ae7c7da44c444706d87f0/src/selectors.ts).
- Time text: `.Jmftzc.gVNoLb.EiZ8Dd`, documented by the older [Event Durations extension](https://github.com/adridesweb/event-durations-google-calendar/blob/5666d4aba61f99e61e4da4f7bece6fc7a7730dab/content.js). This historical selector is a compatibility hypothesis, not a claim that current Calendar still uses it.

The combined fixture is synthetic; neither source supplies a current captured DOM fixture. No third-party implementation code is bundled. We do not scan arbitrary event titles for time-looking text or infer durations from pixel heights.

If no labels appear, the smallest useful input is **Copy outerHTML** of one real timed event block from Chrome DevTools, including its time descendants. Redact the event title, identifiers, and private content while retaining element structure/classes and time text. This allows a targeted adapter update without sharing a login. All-day and Day/Week samples improve coverage.

## Tests

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

On a minimal Linux system, use `npx playwright install --with-deps chromium`. Playwright is a development-only dependency; nothing from `node_modules` ships in `extension/`.

Verified locally:

- 37 parser/manifest tests, including noon, midnight, 12/24-hour input, invalid times, ambiguous ranges, and host scope.
- Browser tests of synthetic DOM edits, text-node changes, replacement, duplicate cleanup, view navigation, pointer pass-through, and an actual mouse drag reaching the fixture's original handler.
- Loading the real unpacked MV3 extension into Chromium and automatic injection on a **network-intercepted, synthetic** Calendar-origin page; absence of injection on a different origin.
- Visual inspection of the local demo. `artifacts/demo.png` is generated by the browser test.

Not verified: actual Google Calendar selectors/layout, real event edits or drag/resize behavior, all-day detection across Calendar locales, and actual Day/Week navigation. These require an authenticated page or captured DOM plus a final live check. A passing synthetic test does not establish them.

## Before calling live compatibility verified

Use a test calendar to confirm `9:11–11:32pm`, noon/midnight and 24-hour events, all-day/ambiguous skips, week/date navigation, event-time edits, dragging/resizing, clicking and keyboard activation, and short-block clipping. Check that no duplicate or stale labels remain. Do not add credentials or captured private calendar data to this repository.

## Project setup

Runtime files require no install/build. The demo uses Node's standard library. Tests use the locked Playwright dependency and its Chromium download. No shared Capy Setup, environment variables, or snapshot settings were changed; the commands above reproduce the tested development environment.
