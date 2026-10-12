# Sakura popup study — revision 1, unapproved

This folder is an isolated design/motion prototype. **Nothing in `extension/` or the installed extension was changed.** Native radio inputs simulate a saving state here; they do not write `durationStyle` or communicate with Calendar tabs. Production integration and real unpacked-extension motion/settings checks are deliberately deferred until the design is chosen.

## Open the designs

[Editable Paper file](https://app.paper.design/file/01M4Q7CYXXCX8K6YDF3PKJJYNR/p-1-0)

- File ID: `01M4Q7CYXXCX8K6YDF3PKJJYNR`
- Page ID: `p-1-0`
- Twelve frames: ready/box, loading, saving, saved, save error, load error, reduced motion, keyboard focus, gentle-gust keyframe, drifting-petal keyframe, enlarged blossom detail, and parentheses selected.
- Popup frames are 360 × 560 CSS pixels; the detail frame is enlarged 2×.
- Text, controls, surfaces and focus indicators are editable Paper nodes. The illustration is a grouped **SVG vector path of dither cells**, not a pasted screenshot or raster image. The static vectors are keyframes; independent motion is implemented only in the standalone Canvas preview.
- The spelling **Google Calender Event Length** follows the requested title. The installed extension retains its existing name until approval.

## Run the preview

```sh
python3 -m http.server 4174 --directory design-preview
```

Open `http://localhost:4174`. The popup is exactly 360px wide, not scaled to fill the screen. Query parameters `?state=loading`, `saving`, `saved`, `error`, `load-error`, and `focus` show the UI states. System reduced-motion preference renders the static branches without falling petals.

## Illustration and motion

- Twelve simplified five-petal blossoms, nominal diameters 24–28 CSS pixels, on connected slender branches entering from beyond the left edge. No trunk, roots, ground, or pot.
- Deterministic 4×4 Bayer coverage at **2 CSS pixels per logical cell**, independent of device pixel ratio. Transparent purple gaps remain inside flower silhouettes. No random flickering noise or dither over text/controls.
- Hierarchical branch rotations with distinct phases: approximately 1.8-degree sway, roughly 8.7-second period, and delayed cluster motion. Four independently recycled small petals, with 5–5.9-second lifetimes, downward/right drift and flutter. The decorative region clips everything above the heading.
- Canvas and mask buffers are reused. Rendering targets about 30 updates per second, caps elapsed time after inactivity, stops while hidden or after pagehide, and restarts on pageshow/visibility change. A packaged SVG poster remains visible if Canvas context creation fails.
- Preview uses bundled local Inter fonts with license notices. No shader package, React, CDN, remote assets, analytics, or APIs.

## Checks and limits

Run `node design-preview/verify.cjs` after `npm ci` and `npx playwright install chromium`. It produces screenshots and a WebM under ignored `artifacts/`. MP4 conversion:

```sh
ffmpeg -y -i artifacts/sakura-video/preview.webm -t 8 -c:v libx264 -pix_fmt yuv420p -an artifacts/sakura-preview.mp4
```

Checked: actual 360×560 fit, 1× and 2× captures, 12 blossom anchors, changing animation frames, static reduced motion, hidden-page pause, simulated radio/save interaction, disabled loading/saving controls, error and keyboard-focus states, and zero HTTP/HTTPS requests. Last cloud Chromium sample: mean draw cost about **1.35 ms**, maximum **1.7 ms** across 20 samples (not a hardware-independent guarantee). Paper frames were checked with Paper screenshots.

The Paper state drawings are not interactive HTML controls. The prototype uses native radios, but persistence and two live Calendar-tab updates remain the responsibility of the existing extension and must be retested when this design is integrated. No claim of live-extension animation verification is made at this design-only stage.
