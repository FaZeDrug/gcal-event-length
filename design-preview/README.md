# Sakura popup study — revision 2, unapproved

This folder is an isolated design/motion prototype. **Nothing in `extension/` or the installed extension was changed.** Native radio inputs simulate a saving state here; they do not write `durationStyle` or communicate with Calendar tabs. Production integration and real unpacked-extension motion/settings checks are deliberately deferred until the design is chosen.

## Open the designs

[Editable Paper file](https://app.paper.design/file/01M4Q7CYXXCX8K6YDF3PKJJYNR/p-1-0). **Paper still contains revision 1:** its weekly MCP quota was reached before revision 2 could be applied. The preview in this folder is revision 2, with corrected spelling, rounder/lighter blossoms, a more pronounced milky-white vignette, and visible ordered-dot background clouds inspired by the latest reference. Apply these changes to the existing frames when Paper access is available; do not replace the editable UI with a screenshot.

- File ID: `01M4Q7CYXXCX8K6YDF3PKJJYNR`
- Page ID: `p-1-0`
- Twelve frames: ready/box, loading, saving, saved, save error, load error, reduced motion, keyboard focus, gentle-gust keyframe, drifting-petal keyframe, enlarged blossom detail, and parentheses selected.
- Popup frames are 360 × 560 CSS pixels; the detail frame is enlarged 2×.
- Text, controls, surfaces and focus indicators are editable Paper nodes. The illustration is a grouped **SVG vector path of dither cells**, not a pasted screenshot or raster image. The static vectors are keyframes; independent motion is implemented only in the standalone Canvas preview.
- The preview title is corrected to **Google Calendar Event Length**. Paper's revision 1 still has the old misspelling pending the quota reset. The installed extension retains its existing name until approval.

## Run the preview

```sh
python3 -m http.server 4174 --directory design-preview
```

Open `http://localhost:4174`. The popup is exactly 360px wide, not scaled to fill the screen. Query parameters `?state=loading`, `saving`, `saved`, `error`, `load-error`, and `focus` show the UI states. System reduced-motion preference renders the static branches without falling petals.

## Illustration and motion

- Twelve simplified rounded five-petal blossoms, nominal diameters 26–30 CSS pixels, on connected slender branches entering from beyond the left edge. No trunk, roots, ground, or pot.
- Deterministic 4×4 Bayer coverage at **2 CSS pixels per logical cell**, independent of device pixel ratio. Transparent purple gaps remain inside flower silhouettes. Ordered-dot clouds decorate the top corners, with subdued stippling confined to the sides below the artwork. Regenerate `texture.svg` with `node design-preview/make-texture.cjs`. No random flickering noise or dither over text/controls.
- Hierarchical branch rotations with distinct phases: approximately 1.8-degree sway, roughly 8.7-second period, and delayed cluster motion. Four independently recycled small petals, with 5–5.9-second lifetimes, downward/right drift and flutter. The decorative region clips everything above the heading.
- Canvas and mask buffers are reused. Rendering targets about 30 updates per second, caps elapsed time after inactivity, stops while hidden or after pagehide, and restarts on pageshow/visibility change. A packaged SVG poster remains visible if Canvas context creation fails.
- Preview uses bundled local Inter fonts with license notices. No shader package, React, CDN, remote assets, analytics, or APIs.

## Checks and limits

Run `node design-preview/verify.cjs` after `npm ci` and `npx playwright install chromium`. It produces screenshots and a WebM under ignored `artifacts/`. MP4 conversion:

```sh
ffmpeg -y -i artifacts/sakura-video/preview.webm -t 8 -c:v libx264 -pix_fmt yuv420p -an artifacts/sakura-preview.mp4
```

Checked: actual 360×560 fit, 1× and 2× captures, 12 blossom anchors, changing animation frames, static reduced motion, hidden-page pause, simulated radio/save interaction, disabled loading/saving controls, error and keyboard-focus states, and zero HTTP/HTTPS requests. A revision-2 cloud Chromium sample measured mean draw cost about **0.74 ms**, maximum **0.8 ms** across 20 samples (not a hardware-independent guarantee). Revision 1 Paper frames were checked with Paper screenshots; revision 2 could not be applied or verified there because of the weekly quota.

The Paper state drawings are not interactive HTML controls. The prototype uses native radios, but persistence and two live Calendar-tab updates remain the responsibility of the existing extension and must be retested when this design is integrated. No claim of live-extension animation verification is made at this design-only stage.
