# Daily Routine AR Challenge

A cheerful, browser-based English practice game for Thai primary students. Across three six-question rounds, learners connect daily-routine vocabulary to pictures, comprehend routine times, and choose complete model sentences. The 18-point activity is designed for a focused 15-minute lesson station.

Live site: https://dimon-ton.github.io/routine_ar_game/

## Technology

React, strict TypeScript, Vite, MediaPipe Hand Landmarker, Canvas, Web Speech and Web Audio APIs, Vitest, and Playwright. The app is single-page, has no backend, and can be deployed as static files.

## Run locally

```bash
npm install
npm run dev
```

Then open the localhost URL shown by Vite. Other commands:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

Playwright is configured to use the locally installed Google Chrome. If Chrome is unavailable, remove
`channel: 'chrome'` from `playwright.config.ts` and install Playwright Chromium with
`npx playwright install chromium`.

## Hand tracking

Choose **Hand Tracking**, then press **Start Game**. Camera permission is requested only at that point. Raise one hand, move the index-fingertip cursor to the calibration target, and pinch to select. In Teacher Settings, selection can be changed to a dwell gesture (hold on a target until the ring fills). MediaPipe inference and camera frames stay in the browser; frames are never uploaded or stored. Only preferences and the latest score summary use `localStorage`.

When a hand is detected, the canvas overlay draws its landmark skeleton. After the initial Start click grants camera access, students can point and pinch to activate Continue buttons, answer cards, and other enabled buttons throughout the activity.

Camera APIs require **HTTPS or localhost**. Current Chromium browsers are recommended. If permission is denied or the model cannot load, use the immediate **Mouse / Touch** fallback. To repair permissions, open the browser's site controls, allow Camera, reload, and press Start again. The first hand-tracking launch needs internet access to load MediaPipe runtime/model files.

Keyboard shortcuts: `F` fullscreen, `M` mute, `R` restart the current question, and `Esc` close settings or exit fullscreen. Buttons also support Tab and Enter/Space.

## Classroom setup

- Use one student at a time in front of the camera.
- Provide good front lighting and, when possible, a plain background.
- Position the student approximately 1–2 metres from the camera.
- Use a fullscreen projector display at 16:9.
- Place the camera near the projected display so pointing feels natural.

Teacher Settings also controls hand input, Pinch/Dwell, sound (including routine ambience), speech, camera visibility, cursor sensitivity, dwell duration, question/round restart, skip, and fullscreen.

## Editing lesson content

All typed lesson records live in [`src/data/routines.ts`](src/data/routines.ts). Edit a phrase, question, model answer, displayed time, spoken time, illustration path, ambience path, or distractor IDs there. Add matching local images under `public/illustrations/` and audio under `public/audio/`. The current routine artwork was generated with Codex Image 2 and optimized as WebP for the game. Question choices are generated in `src/utils/questionFactory.ts`; duplicate time choices and repeated correct-card positions are prevented automatically.

The six routine ambience clips are local, web-compressed versions of free Mixkit sound effects. Source and license details are recorded in [`public/audio/SOURCES.md`](public/audio/SOURCES.md).

## Static deployment

Run `npm run build` and upload the contents of `dist/` to any static host (GitHub Pages, Netlify, Cloudflare Pages, or an HTTPS school server). Vite uses a relative base and the game has no nested routes, so refreshes do not require rewrite rules. Production camera use still requires HTTPS.

## Troubleshooting

- **No permission prompt:** verify the site is HTTPS/localhost and camera permission is not blocked in browser settings.
- **Hand not detected:** improve front lighting, use a plain background, and keep the full hand in view.
- **Pointer moves too little or too far:** adjust Cursor sensitivity in Teacher Settings.
- **Model load error or restricted network:** switch to Mouse / Touch; the complete learning game remains available without a webcam.
- **No spoken audio:** unmute, enable English speech, and check the device volume. Some browsers require one click before audio starts.
