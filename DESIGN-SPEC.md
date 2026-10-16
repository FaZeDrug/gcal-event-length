# Calendar Event Length — design specification

Implementation reference: version 0.6.0, matching the approved monochrome Figma frames (`35:2` enabled/box, `35:30` enabled/parentheses, `35:58` disabled). The popup is 300×400 with a white background and square outer corners. Every UI element is black, grey, or white; only the animated ASCII tear-away calendar is purple. Heading **Event Duration** in Daisler Light (see the font-license note in the README).

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

Information order, implemented with native HTML controls (measured from Figma at 2×; values in CSS px):

- Animated calendar canvas: 300×200 at the top, calendar body about 145 wide, filling the upper area. The detached page drifts out at the top right.
- Left/right margin 18. Heading 24px, top 198.5. Subtitle 10px grey `#808080`. Show durations row 12px at y 250 with a 32×18 switch (on `#1f1f1f`, off `#c7c7c7`).
- Legend 8px uppercase grey. Options 264×33.5, radius 6, 6.5 apart; unselected border `#d9d9d9`, selected border `#666` on `#f6f6f6`. 14px radio, 11px label, 30×21 `1h` preview box with radius 3.
- Status 9px grey: “✓ Saved automatically” when on, “Off · preference saved” when off.
- Off state: switch grey, option text `#979797`, borders `#ececec`. The chosen style stays marked with a grey radio so it is still visible which style returns when durations turn on (the Figma frame shows no radio filled; this is a deliberate accessibility deviation).

Content:

1. Heading: **Event Duration**.
2. Short description: **Show event lengths in Google Calendar.**
3. A **Show durations** switch (`checkbox` with `role="switch"`). On is the default. Off removes every label from open Calendar tabs and dims the style choices, which stay selectable so the next On uses them.
4. Fieldset named **Duration style**, with two mutually exclusive radio choices:
   - **Outlined box**, with a boxed `1h` sample.
   - **Parentheses**, with a `(1 hr)` sample.
5. A status line for loading, saving, saved, or error feedback.

Flipping the switch or selecting a radio saves immediately. There is no Save/Apply button. Existing supported Calendar tabs update without refreshing. The choice persists across popup closures and page reloads in the same Chrome profile, and is stored on that device, not synced to other devices. The initial default is Outlined box. Unknown saved values fall back to that default.

The popup is exactly 300px wide and 400px tall with no scrolling. It uses native switch and radio semantics, visible black keyboard focus rings, and a live status region. The calendar canvas is aria-hidden and non-interactive, renders at device resolution (up to 2×) for crisp glyphs, draws a single still frame for reduced motion, and stops while the popup is hidden or closed. Scripts and fonts are packaged locally; the extension CSP blocks inline and remote scripts, so the animation lives in `calendar.js`.

## Popup states to mock up

| State | Control behavior | Feedback |
| --- | --- | --- |
| Opening/loading | Switch and radios disabled until preferences load | “Loading…” |
| Ready, box selected | Box radio checked | “✓ Saved automatically” |
| Switched off | Switch grey; style cards dimmed but selectable; labels removed from Calendar tabs | “Off · preference saved” |
| Switched on | Switch dark; labels return in the chosen style | “✓ Saved automatically” |
| Switch save error | Switch returns to its previous position | “Could not save. Try the switch again.” |
| Ready, parentheses selected | Parentheses radio checked | Same ready message |
| Saving | Radios temporarily disabled | “Saving…” |
| Saved | Selected radio checked; controls enabled | “✓ Saved automatically” |
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

Manifest V3; plain JavaScript, HTML, and CSS. Content scripts run only on `https://calendar.google.com/*`. The popup is packaged with the extension. The only additional permission is `storage`, used for the `durationEnabled` (`true`/`false`) and `durationStyle` (`box`/`text`) preferences. The extension does not store event content, send calendar data, use analytics, call external APIs, or require a backend or separate login.

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

Automated Chromium tests load the real unpacked extension and verify both popup choices, persistence after reopening, updates in two Calendar-origin fixture tabs, refresh persistence, inline-only placement, and existing parsing/lifecycle behavior. Additional tests cover popup motion, keyboard focus, reduced motion, hidden pause, fallback artwork, controlled storage errors, and dimensions. Popup screenshots show the actual extension page; Calendar screenshots use controlled fixtures. Earlier versions were inspected on live Calendar, but this release has not been rechecked against a fresh live Calendar session.
