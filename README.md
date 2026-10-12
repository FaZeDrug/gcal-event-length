# Calendar Event Length

A small Manifest V3 extension that adds `2h 21m` or `(2 hr 21 min)` beside the time text of supported Google Calendar event blocks. Plain JavaScript/CSS, no build step, backend, external APIs, or analytics. Calendar content scripts run only on `https://calendar.google.com/*`. Local extension storage holds the style preference, not event data.

**Status: version 0.3.0 makes all labels inline and adds a basic style popup, verified with the real extension in Chromium fixture tests.** Earlier versions were verified on live Calendar, but this release's new behavior has not yet been rechecked there. Google can change this unsupported DOM integration in future. See [the design specification](DESIGN-SPEC.md) for the popup, formatting, states, and mockup checklist.

## Install locally

1. Download this repository (or extract the supplied ZIP).
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder, which contains `manifest.json`. Do not select the repository root.
4. Refresh Google Calendar and explicitly select **Day** or **Week** view.

No Node installation or account authorization is required to install the extension. Your existing Calendar sign-in is used only by Calendar itself. After code updates, click **Reload** on the extension card and refresh Calendar. Disable/remove the extension there and refresh Calendar to remove its labels.

## Change the duration style

Click Chrome's **Extensions** puzzle-piece menu, then **Calendar Event Length** (or pin it and click its toolbar icon). Choose **Outlined box** or **Parentheses**. Changes save automatically and update open Calendar tabs. Box is the default; parentheses use exact minutes, such as `(1 hr 30 min)`, not rounded decimal hours. Preferences persist locally in your Chrome profile. Version 0.3.0 adds the `storage` permission; approve it if Chrome asks when updating.

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
- Label text and its box outline are pure black or white, whichever has higher contrast against the composited background color. The inside stays transparent, so there is no gray or tinted fill. Background images/gradients are not sampled.
- Every duration goes to the right of the time, even on tall events without a location. If the inline label cannot fit, it is hidden instead of wrapping, truncating the original time, or clipping. Events that only show a start time still cannot be labeled safely.
- On initial load, labels wait for 250 ms without DOM updates (at most two seconds) so they are not repeatedly inserted into Calendar's transient startup DOM. Later updates run before the next animation-frame paint instead of after an 80 ms timer. Measurement no longer toggles every existing badge through hidden/below/inline states; unchanged badges receive no layout/color writes. This intentionally trades a brief initial delay for stable appearance.
- A ResizeObserver and window/font change listeners recheck layout after resizing. Labels have no event handlers, are hidden from accessibility naming, and cannot receive pointer events. Existing content and handlers are preserved; the extension does not resize Calendar blocks.

## Selector evidence

The adapter intentionally isolates the fragile selectors at the top of `extension/content.js`:

- Event roots: `[data-eventid][role="button"]` and direct-child buttons, supported by [calblend's selectors](https://github.com/avelino/calblend/blob/2c7af04a9bccff84429ae7c7da44c444706d87f0/src/selectors.ts).
- Time text: `.gVNoLb.EiZ8Dd`, observed on an authenticated Calendar test event on October 11, 2026. The older [Event Durations extension](https://github.com/adridesweb/event-durations-google-calendar/blob/5666d4aba61f99e61e4da4f7bece6fc7a7730dab/content.js) additionally required `Jmftzc`; current Calendar no longer uses that class on the observed time element.

The demo is synthetic. `tests/fixtures/current-event.html` preserves the inspected test event's class/child structure with identifiers and calendar name redacted, wrapped in a minimal main element. Inline colors in that regression fixture simulate the observed inherited-color mismatch. No third-party implementation code is bundled. We do not scan arbitrary event titles for time-looking text or infer durations from pixel heights.

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

- 38 parser/manifest tests, including noon, midnight, 12/24-hour input, invalid times, ambiguous ranges, both duration formats, and host scope.
- Browser tests of synthetic DOM edits, text-node changes, replacement, duplicate cleanup, view navigation, pointer pass-through, and an actual mouse drag reaching the fixture's original handler.
- Loading the real unpacked MV3 extension into Chromium and automatic injection on a **network-intercepted, synthetic** Calendar-origin page; absence of injection on a different origin.
- Visual inspection of the local demo. `artifacts/demo.png` is generated by the browser test.
- A regression test loading the current, redacted event structure through the real extension, checking its `1h` label, text updates, and color.
- Version 0.2.0 layout/contrast fixture covers black and light backgrounds, text/outline colors, short/tall/narrow blocks, and changes in event height and background. `artifacts/badge-layout.png` shows the local layout fixture.
- Browser regressions simulate repeated initial DOM replacements and assert that badges do not appear before settling. They also check zero badge attribute writes during unrelated DOM churn and inline placement regardless of location or height.
- The actual popup saves both styles, retains selection when reopened, updates two fixture Calendar tabs, and preserves the preference across page reloads. Screenshots are generated at `artifacts/popup.png` and `artifacts/parentheses-layout.png`.

Verified live on the owner's Chrome: installed extension reloaded as version 0.1.1; the `1:30–2:30pm` test event displays `1h`; other visible ranges display `45m` and `1h 30m`; switching Week → Day → Week preserves the labels; clicking the labeled test event still opens its details. No event data was edited.

Not verified live: event edits, dragging/resizing, all-day detection across locales, time-format setting changes, or every Calendar layout. Those checks remain separate from the passing automated fixture tests.

## Before calling live compatibility verified

Use a test calendar to confirm `9:11–11:32pm`, noon/midnight and 24-hour events, all-day/ambiguous skips, week/date navigation, event-time edits, dragging/resizing, clicking and keyboard activation, and short-block clipping. Check that no duplicate or stale labels remain. Do not add credentials or captured private calendar data to this repository.

## Project setup

Runtime files require no install/build. The demo uses Node's standard library. Tests use the locked Playwright dependency and its Chromium download. No shared Capy Setup, environment variables, or snapshot settings were changed; the commands above reproduce the tested development environment.
