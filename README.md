# Konbini – miniature 3D diorama

An interactive, low-poly miniature Japanese convenience store on a floating base, with a full
day → sunset → dusk → night cycle, rain, wet reflections and fireflies. Everything is built
procedurally in code (no model downloads). See [CLAUDE.md](./CLAUDE.md) for the full spec.

```bash
npm install
npm run dev      # http://localhost:5173  (leva panel + stats on window.__qa in dev only)
npm run build    # production bundle, dev tooling stripped
```

**Rename the shop:** change `STORE_NAME` in [`src/config.ts`](./src/config.ts) (banner, pole sign, loader, title).

**Controls:** drag to orbit · scroll / pinch to zoom · click the store for a close-up (Esc, “Back” or click empty space to return) ·
bottom bar: tour play/pause, time-of-day slider, rain (auto / on / off), sound (rain + crickets, off by default).
The tour resumes 6 s after you stop interacting. `prefers-reduced-motion` disables the tour and rain.

**URL params (handy for QA / sharing):** `?t=0.8` time of day · `?rain=1|0` · `?q=high|low` force quality · `?tour=0` start paused.
Dev only: `?perf` shows the r3f-perf overlay, `?qa` hides leva and makes gsap use real time (for slow software GL).

## How it is put together
- `src/systems/dayNight.ts` – keyframed palette (sky, fog, sun/moon, ambient, wheat tint, clouds, emissive, bloom), smoothstep-interpolated; shared per-frame `env` read by every component (no React re-renders). Lights fade in between t = 0.6 and 0.8.
- `src/systems/cameraRig.ts` + `components/CameraRig.tsx` – one gsap timeline (~50 s, loopable) drives camera **and** time of day; drag pauses it, 6 s idle eases back in.
- `src/utils/mergeGeometry.ts` – `GeoBuilder` bakes primitives + vertex colours into one geometry; two shared materials (flat, and flat+emissive) cover nearly the whole scene.
- Wheat: one `InstancedMesh` (32k blades high / 12k low) with a custom wind vertex shader injected into a Lambert material, so it still receives lights and shadows.
- Quality tiers (drei `PerformanceMonitor`; phones start on `low`): wheat/rain counts, shadow map 2048→1024, reflector off, DPR cap 2 (1.5 on mobile).

## QA report (Chromium 141 in a headless Linux sandbox, software WebGL)

| # | Check | Result |
|---|-------|--------|
| 1 | Console errors/warnings | **0** across day, sunset, night + rain, close-up, mobile emulation and 5 tour loops. (One real bug found and fixed along the way: the ripple shader’s mask placeholder.) |
| 2 | FPS + draw calls | Draw calls per frame, *including* shadow pass, reflector pass and post-processing: **48–65** (low tier), **57–95** (high tier, night rain with reflector) – under the 150 budget. **FPS not verifiable here**: software rendering gives 1–2 fps, so 60 fps desktop / 30 fps Android are untested on real GPUs. Use `?perf` in dev. |
| 3 | Resize / rotate | Pixel 7 emulation portrait and landscape: no stretching; camera pulls back on narrow aspect ratios. |
| 4 | Browsers | Only Chromium tested. Firefox, Safari (macOS/iOS) and Facebook/Messenger in-app browser **not tested**. A WebGL-missing fallback message is included. |
| 5 | Day/night continuity | Palette is C¹-continuous by construction; checked at t = 0, .35, .5, .7, 1 and by seeking through the tour with no errors. Not verified frame by frame. |
| 6 | Z-fighting / acne / gaps | Reviewed overview and close-up shots at several times of day; none seen. Props and walls are built without overlapping coplanar faces. |
| 7 | Touch / notches | Layout uses safe-area insets and 44 px targets; emulated touch viewport only, real device gestures **not tested**. |
| 8 | Memory over 5 loops | Geometries 39 → 39, textures 34 → 34, programs 41 → 41, JS heap 43 → 43 MB. |
| 9 | Lighthouse | Accessibility **100**. Performance 0.47 measured on software rendering (TBT ≈ 49 s from the CPU rasteriser), so not representative; FCP/LCP 3.3 s, CLS 0. Needs a re-run on real hardware. |

Bundle (gzip): app 196 kB + three 177 kB + gsap 28 kB ≈ **401 kB**, under the 1.5 MB budget. leva and r3f-perf are not in the production bundle.

Re-run the QA scripts with the dev server up: `node qa/shot.mjs "t=1&rain=1&q=high&qa=1" out.png`, `node qa/mobile.mjs`, `node qa/behavior.mjs`.
