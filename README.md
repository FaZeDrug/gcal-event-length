# Google Calendar Event Length

**See how long an event lasts, right beside its time.**

An independent Chrome extension for Google Calendar's Day and Week views. Choose an outlined duration badge or simple parentheses from a small, animated sakura popup.

<img src="docs/images/popup.png" width="360" height="560" alt="The extension's sakura popup, with a Show durations on/off switch and Outlined box and Parentheses style choices">

*Screenshot of the real unpacked extension popup, at its actual 360 × 560 size.*

## What it does

- Turns `9:11–11:32pm` into **`2h 21m`** or **`(2 hr 21 min)`**—no mental math.
- Puts durations **beside the time**, including tall events and events with locations.
- Uses black or white for contrast, and hides the label when it cannot fit without covering the original time.
- Saves your style choice locally and updates open Calendar tabs automatically.
- Adds gentle dithered sakura motion **only inside the popup**. Reduced-motion preferences produce a static scene; closing or hiding the popup stops animation.

No backend, external API, analytics, or separate sign-in. Not affiliated with or endorsed by Google.

## Install it now

This project is currently distributed as an unpacked extension; it has not been published to the Chrome Web Store.

1. Extract the **install ZIP**, or download this repository.
2. In Chrome, open **`chrome://extensions`** and turn on **Developer mode**.
3. Click **Load unpacked**. Select the folder containing `manifest.json`: `google-calendar-event-length` from the install ZIP, or `extension/` from the repository. Do not select the repository root.
4. Refresh Google Calendar and select **Day** or **Week**.
5. Click Chrome's **Extensions** puzzle-piece icon → **Google Calendar Event Length**. Pin it if you want the popup one click away.
6. Use **Show durations** to turn labels **On** or **Off**, and choose **Outlined box** or **Parentheses**. There is no Save button: each change saves immediately and updates open Calendar tabs without a refresh. Turning durations off removes every label; turning them back on restores them in your chosen style.

**Already installed an earlier version?** Replace the files in the same extension folder, click **Reload** on its Chrome extension card, and refresh Calendar. This loads the new popup without changing the extension's ID or clearing your preference. Moving to a different folder can create a second installation; disable/remove the old one to avoid duplicate extensions.

**“Manifest file is missing”?** You selected the wrong folder. Open it and select the inner folder that actually contains `manifest.json`.

## What is—and isn't—supported

| Supported | Deliberately skipped |
| --- | --- |
| Timed events in explicit Day/Week views | All-day events and other views |
| English AM/PM, 24-hour times, noon/midnight | Unsupported locale formats |
| Same-day ranges with unambiguous start/end times | Overnight, multi-day, reversed, or ambiguous ranges |
| Exact hours and minutes | Time-zone/DST-aware elapsed-time calculations |
| Updating labels after DOM changes and navigation | Events displaying only a start time |

If a label doesn't fit, it disappears rather than resizing the event or truncating its time. Google Calendar's markup is not a public extension API and may change. If labels stop appearing, a redacted **Copy outerHTML** sample of an event block helps diagnose the selector without sharing your login.

## Privacy and permissions

The extension reads supported Calendar event time text and nearby DOM metadata **locally**, to calculate durations and identify eligible blocks. Event content is not saved or transmitted. Only your `durationEnabled` (on/off) and `durationStyle` preferences are saved in Chrome's local extension storage.

- **Site access:** `https://calendar.google.com/*` only.
- **`storage`:** remembers whether durations are on and which style you chose, and updates other open Calendar tabs.
- Fonts, illustration, scripts, and fallback artwork are packaged locally; there are no remote assets.

Read the [privacy policy](PRIVACY.md). The sakura illustration is decorative and cannot intercept clicks or keyboard focus.

## Publish your own copy

Start with the [Chrome Web Store publishing guide](docs/PUBLISHING.md). It includes a step-by-step checklist, account requirements, package selection, privacy disclosures, reviewer instructions, and update instructions.

The [ready-to-use listing copy](docs/STORE-LISTING.md) includes the description, single-purpose statement, and permission explanations. Publishing still requires **your developer account, registration payment, privacy declarations, and explicit submission**; this repository does not do those for you.

## Develop and test

The extension needs no build step. For tests, use Node 22+:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:browser
```

On a minimal Linux machine, install browser system dependencies with `npx playwright install --with-deps chromium`.

To build both release ZIPs with Python 3:

```sh
python3 scripts/package.py
```

Outputs go to `artifacts/`:

- `*-install.zip`: extract it and load the resulting folder in Chrome.
- `*-store.zip`: upload this ZIP directly to the Web Store; `manifest.json` is at its root.

`npm run demo` starts the **synthetic Calendar fixture** at `http://localhost:4173`. It is not live Google Calendar. `design-preview/` preserves the original design sandbox; the shipped popup lives in `extension/`.

## Verification

The test suite covers time parsing, manifest scope, duplicate/stale-label cleanup, inline fit, contrast, navigation, and actual MV3 injection on controlled Calendar-origin fixtures. It loads the real popup and checks both style choices, persistence after reopening, instant changes in two supported fixture tabs, keyboard focus, loading/saving/error states, motion, reduced motion, hidden-page pausing, fallback artwork, dimensions, and absence of remote requests.

Earlier versions were inspected on live Google Calendar for Day/Week labels, navigation, and clicking. **This release's automated Calendar checks use controlled fixtures**, not a fresh live Calendar session. Before publishing, run the manual checklist in [PUBLISHING.md](docs/PUBLISHING.md), especially real event edits and drag/resize behavior.

## Project layout

```text
extension/       Installable Manifest V3 extension
tests/           Parser, Calendar-fixture, and real-popup tests
docs/            Screenshots, store copy, and publishing guide
scripts/         Demo server and ZIP packaging
design-preview/  Historical, standalone sakura design sandbox
```

The popup uses the locally bundled Inter font; its licenses are in `extension/fonts/`. No React or shader dependency is required.
