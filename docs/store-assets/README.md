# Chrome Web Store images (v0.6.0)

Upload-ready files (Chrome Web Store sizes: screenshots 1280×800, small promo tile 440×280, both full-bleed with square corners):

| File | Use |
| --- | --- |
| `screenshot-1-box.png` | Screenshot: popup + Calendar with outlined-box durations |
| `screenshot-2-text.png` | Screenshot: popup + Calendar with parentheses durations |
| `screenshot-3-off.png` | Screenshot: durations switched off |
| `screenshot-4-popup.png` | Screenshot: the three popup states |
| `promo-440x280.png` | Small promotional tile (required) |
| `../../extension/icons/icon128.png` | Store icon |

## Editable sources

`source/` holds the cropped captures every image is built from: `popup-*.png` and `calendar-*.png` come from one live Google Calendar session with the real unpacked 0.6.0 extension, and `event-chip.png` is one event from that session. Only generic events ("busy", "test", "standup") appear; personal events, the sidebar, account details, and browser chrome were cropped out before saving. Raw full-window captures are not in the repository.

To change captions or layout, edit `scripts/store_assets.py` and run:

```sh
python3 scripts/store_assets.py
```

Nothing here has been uploaded to the Chrome Web Store.
