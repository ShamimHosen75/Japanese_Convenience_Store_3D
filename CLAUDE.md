# CLAUDE.md — Miniature Konbini Diorama (3D Web App)

## Role
You are a senior creative-technology web developer AND a strict QA engineer.
After every phase: run the dev server, check the browser console for errors/warnings,
report FPS and draw calls, and list any visual bugs before moving on.

## Goal
Build an interactive 3D web app: a stylized low-poly miniature diorama of a small
Japanese convenience store ("[MY STORE NAME]") on a floating square base, with a
full animated day → sunset → dusk → night cycle, rain, wet reflections and fireflies.
Look: cozy, toy-like, soft-shaded, clean flat colors (Ghibli / Animal Crossing / isometric
diorama vibe). NOT realistic.

> Store name lives in one constant: `STORE_NAME` in `src/config.ts` (default "Konbini").

## Tech stack (do not change without asking)
- Vite + React 18 + TypeScript
- three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- zustand (global state: timeOfDay 0–1, weather, cameraMode)
- leva (dev-only debug panel, stripped in production)
- gsap (camera and scene-transition tweens)
- All models built PROCEDURALLY in code from primitives (Box, Cylinder, Plane,
  merged geometry). No external model downloads. Text/signs via canvas textures.

## Folder structure
src/
  components/scene/   Base.tsx, Roads.tsx, Wheat.tsx, Store.tsx, StoreInterior.tsx,
                      Props.tsx (vending machines, bikes, mailbox, umbrella stand,
                      stop sign, scarecrow), UtilityPoles.tsx, Clouds.tsx, Sign.tsx
  components/effects/ Rain.tsx, Puddles.tsx, Fireflies.tsx, Sky.tsx
  components/ui/      TimeSlider.tsx, WeatherToggle.tsx, Loader.tsx
  systems/            dayNight.ts (palette keyframes + interpolation), cameraRig.ts
  shaders/            wheat.vert/frag, rain, ripple
  store/              useSceneStore.ts
  utils/              canvasTexture.ts, mergeGeometry.ts

## Scene spec
BASE: ~20×20 unit square slab, 1.5 units thick, warm brown sides (#8B5A2B → #6B4423),
slight bevel, floating in empty space with a soft contact shadow under it.

ROADS: two dark asphalt roads (#3a3f47) forming an L/corner; white dashed center lines,
white zebra crosswalks, curb edges. Small stop sign and a round road mirror at the corner.

WHEAT FIELDS: thick golden grass (#E8B33A → #C98A1C gradient tip-to-base) filling the
border strips. Use ONE InstancedMesh (~20k–40k blades) with a custom vertex shader
for wind sway (sin(time + worldPos.x*k) * heightFactor). At night it tints toward
blue-purple (#4a4a9a) via the palette system.

STORE: single-story box building, cream/white walls, green + orange horizontal
stripe band, flat roof with 2–3 AC units, front glass facade with an awning.
Front banner sign with "[MY STORE NAME]" + "24H OPEN" drawn via canvas texture.
INTERIOR (visible through glass): rows of colorful shelves, drink fridge with
glowing doors, ATM, counter, small posters (my own text, e.g., "Fresh coffee ¥100").
Interior lights are emissive and turn on at dusk.

PROPS: red + blue vending machines (emissive fronts at night), 2 bicycles,
umbrella stand, red post box, trash bins, a scarecrow figure in the wheat,
tall pole sign with a round orange logo (emissive at night).

UTILITY POLES: 5–6 wooden poles around the edges with crossbars. Wires are
CatmullRom/quadratic curves with natural sag (TubeGeometry, very thin, dark).
Streetlights on 2 poles that turn on at night.

CLOUDS: 6–10 puffy cartoon clouds made from merged spheres, drifting slowly
above the diorama; colors follow the palette (white → peach/pink at sunset → hidden at night).

## Day/night system (core feature)
timeOfDay: 0 = day, 0.35 = golden hour, 0.5 = sunset, 0.7 = dusk, 1 = night.
Keyframe palette for each stop: background/sky gradient, fog color, sun color/intensity/
angle, ambient/hemisphere colors, wheat tint, cloud tint, emissive strength.
- Day: bg #F3E9D2 to light blue, warm sun, soft shadows
- Sunset: bg #F2A97E → #D97A8C, orange clouds, long shadows
- Dusk: purple #5B3A6E
- Night: deep blue #1B1F5E → #0B0D2A, moonlight, emissives ON, bloom ON
Smoothly lerp ALL values. Store and sign lights fade in between 0.6 and 0.8.

## Weather / night effects
RAIN: GPU line/points particles (~8k) falling at a slight angle, only when
weather = "rain" (auto ON at night in auto mode).
WET GROUND: at night + rain, roads/pavement become glossy (lower roughness,
MeshReflectorMaterial from drei on the store forecourt), showing reflections of the
lit store and signs. Animated ripple rings at random positions (shader or pooled sprites).
FIREFLIES: ~60 small additive glowing points drifting with noise over the wheat,
pulsing in brightness, visible only at dusk/night.

## Camera & interaction
- Default: perspective camera, slow auto-orbit around the diorama (OrbitControls,
  damping, limited polar angle so you never go under the base, zoom limits).
- Cinematic intro (gsap timeline, ~50s, loopable): orbit during day → sunset →
  night with rain → dolly-in close to the storefront glass → pull back.
- User can drag to orbit anytime (pauses auto-tour; resumes after 6s idle).
- Click the store → camera smoothly flies to a storefront close-up; click empty space → back.
- UI (minimal, bottom center, glassmorphism): time-of-day slider, play/pause tour,
  rain toggle, sound toggle (optional ambient rain + crickets, off by default).

## Post-processing
Bloom (only at night, selective on emissives), subtle vignette, SMAA,
ACESFilmic tone mapping, sRGB output.

## Performance budget (QA must verify)
- 60 FPS on a mid-range laptop, ≥30 FPS on a mid-range Android phone
- < 150 draw calls (use instancing + merged geometry)
- DPR capped at 2 (1.5 on mobile); shadow map 1024–2048; reduce wheat count,
  rain count and disable reflector on low-end (detect via drei PerformanceMonitor)
- Initial JS bundle < 1.5 MB gz; show a loader with progress
- prefers-reduced-motion: disable auto-tour and rain animation

## QA checklist (run after each phase, report results as a table)
1. Console: zero errors/warnings
2. FPS + draw calls (r3f-perf in dev)
3. Resize window / rotate phone: no stretching, correct aspect
4. Chrome, Firefox, Safari (macOS/iOS), Facebook/Messenger in-app browser
5. Day/night transition: no color "jumps", lights fade smoothly
6. No z-fighting, no shadow acne, no gaps between meshes
7. Touch controls on mobile (orbit, pinch zoom), UI not covered by notches
8. Memory: no leaks after 5 loops of the tour (dispose geometries/materials)
9. Lighthouse performance ≥ 80, accessibility ≥ 90
