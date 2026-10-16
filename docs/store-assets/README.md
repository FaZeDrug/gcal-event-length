# Chrome Web Store images (v0.6.0)

Upload-ready files (Chrome Web Store sizes: screenshots 1280×800, small promo tile 440×280):

| File | Use |
| --- | --- |
| `screenshot-1-box.png` | First screenshot: Calendar with outlined-box durations beside the popup |
| `screenshot-2-text.png` | Calendar with parentheses durations beside the popup |
| `screenshot-3-details.png` | Durations in Calendar's event-details popup, both styles |
| `screenshot-4-off.png` | Durations switched off |
| `promo-440x280.png` | Small promotional tile |
| `../../extension/icons/icon128.png` | Store icon |

## Editable sources

`source/` holds the cropped captures every image is built from. They come from one live Google Calendar session (Week view, Sunday, October 18, 2026) with the unpacked 0.6.0 extension: `calendar-*.png` is one day's 1–8 PM column in each state (no date header), `popup-*.png` is the real extension popup in the same states, captured at 2× on a settled animation frame, `details-*.png` is the time line of one event's details popup, and `event-chip.png` is one event from the same session. `calendar-hero.png` is a screenshot of the same events from the maintainer's own Chrome, used on the first image for its thinner outlined boxes. The sidebar, other days, account details, and browser chrome were cropped out before saving. Raw full-window captures are not in the repository.

`fonts/Newsreader.ttf` (SIL Open Font License, see `fonts/OFL.txt`) is the headline font for these images only; it is not part of the extension.

To change captions or layout, edit `scripts/store_assets.cjs` and run:

```sh
node scripts/store_assets.cjs
```
