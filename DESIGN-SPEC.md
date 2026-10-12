# Calendar Event Length — design specification

Implementation reference: version 0.3.0. The UI is intentionally a plain functional starting point, not a visual design recommendation.

## Product in one sentence

A Chrome extension that adds an automatically calculated duration immediately to the right of each supported Google Calendar event's time range, so users can read the length without doing time arithmetic or opening the event.

## Scope and surfaces

There are two surfaces to design:

1. **The in-calendar duration.** A small, non-interactive addition to the time row of timed event blocks in Day and Week views. It is not a button and has no hover menu or separate click action.
2. **The extension popup.** Opened by clicking Calendar Event Length in Chrome's Extensions menu or its pinned toolbar icon. It contains one preference: the visual style of the duration. It works even when the active tab is not Calendar.

There is no dashboard, login, onboarding flow, calendar picker, event editor, or standalone settings page in the current scope.

## In-calendar presentation

**Placement:** always immediately after the time text, regardless of event height or whether it has a location. The event title remains above, and the location remains on its original line below. There is no bottom-of-block or below-time placement mode anymore.

**Fit:** preserve the complete original time range. If the time plus duration will not fit horizontally or vertically, omit the duration. Never resize the event, overlap its contents, wrap the duration onto another row, or truncate the original time. A long-duration event can still be too narrow to label; duration and rendered block size are separate facts.

**Color:** choose pure black or pure white by contrast against the event's composited background color. Text and box outline share the chosen color. No gray/tinted fill; backgrounds stay transparent. Background images and gradients are not sampled.

**Style choices:**

| Duration | Outlined box (default) | Parentheses |
| --- | --- | --- |
| 45 minutes | `45m` inside an outline | `(45 min)` with no box |
| 1 hour | `1h` inside an outline | `(1 hr)` with no box |
| 1 hour 30 minutes | `1h 30m` inside an outline | `(1 hr 30 min)` with no box |
| 2 hours 21 minutes | `2h 21m` inside an outline | `(2 hr 21 min)` with no box |

Parentheses keep exact minutes rather than decimal-hour rounding. `hr` and `min` are invariant abbreviations. Box labels currently use 11px semibold Arial, a 1px outline and a 3px corner radius. Parentheses use the time text's font. Both have a small gap after the time. These are implementation defaults you can redesign, provided fit and contrast are retained.

**Interactions:** clicking, dragging, and keyboard navigation belong to Calendar. The added label must not intercept input or introduce a tab stop. It is hidden from accessibility naming so it does not replace Calendar's event announcement.

## Popup layout and behavior

Suggested information order, implemented with native HTML controls:

1. Heading: **Calendar Event Length**.
2. Short description: **Show event durations beside the time in Google Calendar.**
3. Fieldset named **Duration style**, with two mutually exclusive radio choices:
   - **Outlined box**, with a boxed `1h` sample.
   - **Parentheses**, with a `(1 hr)` sample.
4. A status line for loading, saving, saved, or error feedback.
5. Supporting copy: **Changes apply automatically to open Calendar tabs. Day and Week views only.**

Selecting a radio saves immediately. There is no Save/Apply button. Existing supported Calendar tabs update without refreshing. The choice persists across popup closures and page reloads in the same Chrome profile, and is stored on that device, not synced to other devices. The initial default is Outlined box. Unknown saved values fall back to that default.

The current popup is approximately 312px wide including margins. Its styling is deliberately basic. Use native radio semantics, visible keyboard focus, readable labels, and a live status region in a redesigned version.

## Popup states to mock up

| State | Control behavior | Feedback |
| --- | --- | --- |
| Opening/loading | Radios disabled until the preference loads | “Loading preference…” |
| Ready, box selected | Box radio checked | “Preferences are saved on this device.” |
| Ready, parentheses selected | Parentheses radio checked | Same ready message |
| Saving | Radios temporarily disabled | “Saving…” |
| Saved | Selected radio checked; controls enabled | “Saved.” |
| Load failed | Controls disabled | Close and reopen to retry |
| Save failed | Controls enabled; failed selection cleared | Select a style again to retry |

The popup does not inspect the active tab or claim that a particular Calendar page is supported. A settings change is global to supported Calendar tabs in this Chrome profile, not per event or per calendar.

## Runtime states to account for

- **Initial Calendar load:** wait briefly for its DOM to settle before adding labels, avoiding insertion into transient event blocks. The settling window is 250ms of quiet, capped at two seconds once settings are available.
- **Navigation, time edits, or resizing:** re-evaluate time text and available space, update the existing label, remove stale labels, and avoid duplicates.
- **All-day, single-start-time, ambiguous or unsupported event:** no duration label. Do not use an error badge or estimate from the event's pixel height.
- **Too little space:** no label; the original time stays intact. A wider event or shorter style may allow it to return.
- **Unsupported view:** no labels. Current scope is explicit Day and Week routes only.

## Parsing boundaries

Supported: English AM/PM, 24-hour colon-separated times, noon/midnight words, and same-day positive time ranges. `9:11–11:32pm` is `2h 21m`. Explicit `12am–1am` is `1h`.

Skipped: all-day events, zero/reversed ranges, overnight/multi-day events, ranges lacking enough AM/PM context, unsupported locales, and date-bearing ranges. The extension computes displayed wall-clock differences, not time-zone/DST-aware elapsed time from an API.

## Privacy and implementation

Manifest V3; plain JavaScript, HTML, and CSS. Content scripts run only on `https://calendar.google.com/*`. The popup is packaged with the extension. The only additional permission is `storage`, used for the single `durationStyle` preference (`box` or `text`). The extension does not store event content, send calendar data, use analytics, call external APIs, or require a backend or separate login.

The extension reads supported DOM structures rather than an official Google Calendar extension API, so Google UI changes can require adapter updates. A Chrome account is needed only for Calendar itself, not for the extension.

## Mockup checklist

- Show both style choices and the selected radio in the popup.
- Show a tall event without a location with its duration to the right of its time.
- Show an event with a location: title, time + duration, then location.
- Include light and black event backgrounds to show black/white contrast.
- Include short and narrow events; demonstrate omission when the full label cannot fit.
- Use exact-minute examples, including `2h 21m` / `(2 hr 21 min)`.
- Include loading, saved, and error feedback without adding unimplemented controls.

## Verification boundary

Automated Chromium tests load the real unpacked extension and verify both popup choices, persistence after reopening, updates in two Calendar-origin fixture tabs, refresh persistence, inline-only placement, and existing parsing/lifecycle behavior. The screenshots for this release are controlled local fixtures. Earlier versions were inspected on a live Calendar, but the 0.3.0 popup and inline-only update have not yet been rechecked live on the user's Calendar.
