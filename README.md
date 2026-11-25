<h1 align="center">Photo Finish</h1>

<p align="center">
  An interactive horse racing game built with Vue 3, Pinia, TypeScript and three.js.<br />
  Six rounds. Twenty horses. One finish line, in 3D.
</p>

<p align="center">
  <a href="https://photo-finish.sinemaar1.workers.dev/"><strong>Play it live</strong></a>
  ·
  <a href="./docs/PRD.md">Product requirements</a>
  ·
  <a href="./docs/ROADMAP.md">Roadmap</a>
  ·
  <a href="https://github.com/sinemagar/photo-finish/pulls?q=is%3Apr+is%3Aclosed">Pull requests</a>
</p>

<p align="center">
  <a href="https://github.com/sinemagar/photo-finish/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/sinemagar/photo-finish/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white" />
  <img alt="TypeScript strict" src="https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white" />
  <img alt="Pinia" src="https://img.shields.io/badge/state-Pinia-f7d336" />
  <img alt="three.js" src="https://img.shields.io/badge/3D-three.js-111111?logo=threedotjs&logoColor=white" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-367%20passing-0b7a46" />
  <img alt="Lighthouse" src="https://img.shields.io/badge/Lighthouse-96%20%C2%B7%20100%20%C2%B7%20100%20%C2%B7%20100-0b7a46?logo=lighthouse&logoColor=white" />
</p>

<p align="center">
  <img src="./docs/media/race-desktop.gif" alt="A first-time visitor generates a programme from the welcome card and starts the meeting on the 3D racecourse. The view switches from the TV camera to the chase camera behind the field, then to the aerial camera above it, and back to TV as the horses cross the line and the podium banner counts down to round 2." width="900" />
</p>

---

## Contents

- [At a glance](#at-a-glance)
- [Requirements covered](#requirements-covered)
- [Getting started](#getting-started)
- [Architecture](#architecture)
- [Testing](#testing)
- [Performance](#performance)
- [Assumptions](#assumptions)
- [How it was built](#how-it-was-built)
- [Project structure](#project-structure)
- [Credits](#credits)
- [What could come next](#what-could-come-next)

## At a glance

<table>
  <tr>
    <td width="32%" valign="top">
      <img src="./docs/media/phone.gif" alt="On a phone the 3D track and the controls come first; when the first round ends the result banner appears and the Results tab comes forward, then the Stable tab is opened and the page scrolls through the horse cards." />
    </td>
    <td valign="top">
      <img src="./docs/media/meeting-summary.gif" alt="In dark mode, the sixth round finishes at four times speed and the meeting summary names the horses of the day with their wins and podiums, next to a New programme button." />
    </td>
  </tr>
  <tr>
    <td valign="top"><strong>On a phone</strong><br />Track and controls first; results, programme and stable behind tabs, with the page scrolling as a whole.</td>
    <td valign="top"><strong>End of the meeting, in dark mode</strong><br />After six rounds a summary names the horses of the day and offers a new programme.</td>
  </tr>
</table>

|                   |                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **3D racecourse** | An oval course drawn with three.js: CC0 horses in natural coats, jockeys in each horse's own colour and number, a gallop matched to the ground speed, and horses that pull up gradually after the line |
| **Three cameras** | TV follows the leaders from outside the rail and cuts to the finish line for the last 90 m; chase rides behind the field; aerial looks down on it at an angle. 2D is one tap away                      |
| **Live race**     | Live rank on every horse, the three leaders named under the track, a podium banner with a countdown between rounds                                                                                     |
| **In your hands** | Start, pause and resume; playback at 1×, 2× or 4×; a welcome card and a "How it works" dialog; light and dark mode                                                                                     |
| **Reproducible**  | Every session runs on a seed. `?seed=7` brings back the same horses, programme and races                                                                                                               |
| **For everyone**  | Keyboard-only play, screen-reader announcements once per round, colour never the only cue; the 2D track under `prefers-reduced-motion` or without WebGL                                                |

## Requirements covered

Every point of the brief, and where to find it in the code.

| Requirement                                                | Where                                                                                  |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 20 horses, each with a unique colour and a condition 1–100 | [`domain/stable.ts`](./src/domain/stable.ts)                                           |
| Generate creates 6 rounds of 10 random horses              | [`domain/programme.ts`](./src/domain/programme.ts)                                     |
| Rounds of 1200, 1400, 1600, 1800, 2000 and 2200 m          | [`domain/config.ts`](./src/domain/config.ts)                                           |
| Start runs the rounds one at a time                        | [`stores/meeting.ts`](./src/stores/meeting.ts)                                         |
| Results appear as each round finishes                      | [`components/results`](./src/components/results)                                       |
| Horses move during a race                                  | [`renderers/3d`](./src/renderers/3d) in 3D, [`renderers/2d`](./src/renderers/2d) in 2D |
| State management with Pinia                                | [`stores`](./src/stores)                                                               |
| Component-based design                                     | [`components`](./src/components)                                                       |
| Bonus: unit tests                                          | 309 tests next to the code they cover (`*.spec.ts`)                                    |
| Bonus: E2E tests                                           | [`tests/e2e/meeting.spec.ts`](./tests/e2e/meeting.spec.ts)                             |
| Bonus: visual tests                                        | [`tests/e2e/visual.spec.ts`](./tests/e2e/visual.spec.ts), desktop and mobile           |

## Getting started

### Try it

Open **[photo-finish.sinemaar1.workers.dev](https://photo-finish.sinemaar1.workers.dev/)**, press **Generate programme**, then **Start**.

### Run it locally

You need [Node.js](https://nodejs.org/) 22.18 or newer (see `.nvmrc`) and npm.

```sh
# 1. Get the code
git clone https://github.com/sinemagar/photo-finish.git
cd photo-finish

# 2. Install dependencies
npm install

# 3. Start the development server, then open http://localhost:5173
npm run dev
```

To run the browser tests, install their browser once:

```sh
npx playwright install chromium
npm run test:e2e
```

### Scripts

| Command                 | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `npm run dev`           | Start the development server                                        |
| `npm run build`         | Type-check and build for production                                 |
| `npm run preview`       | Serve the production build locally                                  |
| `npm run lint`          | Lint with Oxlint and ESLint                                         |
| `npm run format`        | Format the codebase with Prettier                                   |
| `npm run typecheck`     | Type-check with `vue-tsc`                                           |
| `npm test`              | Run unit and component tests once                                   |
| `npm run test:coverage` | Run them with a coverage report                                     |
| `npm run test:e2e`      | Run the end-to-end, accessibility and visual tests                  |
| `npm run size`          | Check the built bundle against its size budget                      |
| `npm run perf:frames`   | Measure frame times during a race (needs `npm run preview` running) |

### URL parameters

| Parameter      | Effect                                                                |
| -------------- | --------------------------------------------------------------------- |
| `?seed=7`      | Fixes all randomness: the same horses, programme and races every time |
| `?speed=4`     | Plays the meeting four times faster (the speed control does the same) |
| `?renderer=2d` | Starts on the 2D track instead of the 3D racecourse                   |

### Deployment

The site is a static build hosted on Cloudflare. Every merge to `main` is built and deployed automatically; no configuration is needed beyond the build command `npm run build` and the output folder `dist`.

## Architecture

Dependencies point one way only. Components never contain a game rule, and the rules never import Vue. The track is a renderer: the 2D and 3D tracks take the same props and draw the same simulation.

```mermaid
flowchart TD
    UI["<b>components/</b><br/>What is on screen.<br/>Shows data, forwards clicks."]
    R2["<b>renderers/2d</b><br/>Track2D: DOM and CSS"]
    R3["<b>renderers/3d</b><br/>Track3D: three.js, loaded on demand"]
    STATE["<b>stores/</b> and <b>composables/</b><br/>What is true right now<br/>and what happens next."]
    DOMAIN["<b>domain/</b><br/>Pure TypeScript rules:<br/>stable, programme, simulation, ranking."]
    CLOCK(["requestAnimationFrame"])

    UI --> R2
    UI --> R3
    UI --> STATE --> DOMAIN
    STATE -. "runners and progress" .-> R2
    STATE -. "runners and progress" .-> R3
    CLOCK -- "tick(elapsedMs)" --> STATE
```

The meeting is a state machine. Every button's label and enabled state is derived from this one value, never from separate flags.

```mermaid
stateDiagram-v2
    direction LR
    [*] --> idle
    idle --> ready: generate
    ready --> running: start
    running --> paused: pause
    paused --> running: resume
    running --> intermission: round finished
    intermission --> running: break over
    running --> finished: last round finished
    ready --> ready: generate
    paused --> ready: generate
    finished --> ready: generate
```

Decisions that shape the code:

- **The rules are framework-free.** Everything in `src/domain` is a pure function, tested without mounting anything.
- **Stores orchestrate, the domain computes.** A store action calls a domain function and keeps the result.
- **Time is injected.** The store moves only when `tick(elapsedMs)` is called. One composable, `useFrameLoop`, connects it to the browser; tests call `tick` directly.
- **Randomness is seeded.** One generator for every random choice makes sessions reproducible and tests stable.
- **The result does not depend on frame rate.** The simulation advances in fixed steps and carries leftover time over, so a slow machine or a background tab produces the same race. Between two steps, a horse is drawn where it would be by now, so it moves smoothly without changing the result.
- **The track is a renderer.** Both tracks implement the props contract in `src/renderers/types.ts`: they receive runners and their progress and know nothing about stores. The 3D track was added without changing a line of the domain or the stores' rules.
- **3D maths is plain TypeScript too.** The oval course, the camera poses and the field summary in `src/renderers/3d/geometry` are pure functions with their own unit tests; only the files in `src/renderers/3d/scene` talk to three.js.

The full reasoning, including the race model, is in the [product requirements](./docs/PRD.md).

## Testing

**367 tests**, all running in CI on every pull request.

| Layer                      | Tool                   | Count | What it proves                                                                                                                        |
| -------------------------- | ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Domain                     | Vitest                 | 50    | The rules of the brief, reproducibility from a seed, independence from frame rate, smooth display between steps, the meeting summary  |
| Stores                     | Vitest                 | 52    | Every state transition, including the illegal ones being ignored; results recorded once per round; live ranks and the break countdown |
| 3D scene maths             | Vitest                 | 32    | The oval is closed and continuous, rounds start at the right distance, cameras frame the field, the field stays together across a lap |
| Components and composables | Vitest, Vue Test Utils | 175   | Components render what they are given; controls are enabled and labelled by status; tabs, dialog, theme, frame loop                   |
| End-to-end                 | Playwright             | 22    | A whole meeting in the browser, pause and resume, reset, speed, onboarding, the help dialog, keyboard-only play                       |
| 3D track                   | Playwright             | 6     | Loads by default, runs rounds, switches cameras and back to 2D mid-race, falls back under reduced motion, passes axe                  |
| Phone layout               | Playwright             | 8     | Controls and track on the first screen, lists scroll to their end, no sideways scrolling, tabs                                        |
| Theme                      | Playwright             | 3     | Follows the device, switches and remembers, passes axe in dark mode                                                                   |
| Accessibility              | Playwright, axe        | 7     | No serious issue in seven states, including the dialog and the result banner                                                          |
| Visual                     | Playwright             | 12    | Six states on desktop and phone, compared with committed baselines                                                                    |

Line coverage of the unit and component tests is above 99%.

**How the browser tests stay deterministic.** They take control of the page's clock: time moves only when a test advances it. With a fixed seed a meeting replays frame for frame and no test waits on real time. Visual baselines are produced and compared in the CI container, because screenshots depend on the fonts of the machine. In CI the 3D track is drawn with software WebGL, so its tests check behaviour rather than pixels.

**Tests that paid off.** The accessibility checks found panels that could not be scrolled from the keyboard, low-contrast text in finished rounds, and gold headings unreadable on the light theme; a unit test caught a rounding bug in the condition meter; the first visual baseline exposed a squeezed track at 1280 px. All were fixed in the same pull request that found them.

## Performance

| Measure                                       | Result                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Lighthouse performance                        | 96 (mobile profile with throttling, production build)                                 |
| Lighthouse accessibility, best practices, SEO | 100, 100, 100                                                                         |
| Largest contentful paint                      | 0.8 s                                                                                 |
| Total blocking time                           | 220 ms                                                                                |
| Layout shift                                  | 0                                                                                     |
| Frame time during a 3D race                   | 16.7 ms average and 95th percentile, no long frames (Apple M3, `npm run perf:frames`) |
| First screen                                  | 43.0 kB JS and 6.7 kB CSS, gzip (CI fails above 60 and 10)                            |
| 3D track, loaded on demand                    | 163.3 kB JS, gzip (CI fails above 200), plus the 921 kB horse model                   |

What keeps it fast:

- three.js, the scene and the horse model are downloaded only when the 3D track is shown; the first screen stays small.
- The scene draws a frame only when a horse or the camera moves. A waiting or paused course costs nothing; this alone took total blocking time from 2.5 s to 220 ms.
- The materials of a new field are compiled before the race starts, so the first frame does not stall.
- Static scenery is instanced (rail posts, trees, spectators) and shadows are soft textures rather than shadow maps.
- The stage holds its space while the 3D track loads, so nothing jumps.
- The live round state is immutable and held in a `shallowRef`; a tick replaces one reference instead of triggering deep reactivity.

## Assumptions

The brief leaves some points open. These are the decisions taken; each is isolated in the code and easy to change.

| Open point                                                      | Decision                                                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| "Between 1 and 20 horses" versus "a total of 20 horses"         | Always 20. A round needs 10, so fewer could never work. The size is one constant.                               |
| What the condition score does                                   | It raises a horse's average speed. Form on the day and surges keep upsets possible.                             |
| The example shows "Start / Pause", the text only mentions Start | One control that starts, pauses and resumes.                                                                    |
| Generating while a race is running                              | Disabled during a round; allowed when paused or finished, which resets the results.                             |
| Moving from one round to the next                               | Automatic after a short break.                                                                                  |
| A 2200 m race takes over two minutes in reality                 | Played back five times faster; finish times are still reported in real race time.                               |
| Horses in natural coats can look alike in 3D                    | Each horse's unique colour is carried by its jockey's silks and numbered saddle cloth, as on a real racecourse. |

## How it was built

### Plan first, then phases

The work started with a [product requirements document](./docs/PRD.md) and a [roadmap](./docs/ROADMAP.md), before any code. Each phase was built on its own branch and merged through a pull request that says what changed, why, and how it was verified, with CI green. The [closed pull requests](https://github.com/sinemagar/photo-finish/pulls?q=is%3Apr+is%3Aclosed) tell the story in order:

| Phases | Outcome                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------- |
| 0–2    | Tooling and CI, the rules as pure TypeScript, Pinia stores and the state machine                          |
| 3–4    | A working interface, then the animated track: every requirement of the brief met                          |
| 5–7    | Visual design, end-to-end, accessibility and visual tests, deployment                                     |
| 8–10   | A review of the first delivery, then the phone layout, live standings, onboarding and performance budgets |
| 11–12  | The 3D racecourse with three cameras, then a lighter, mobile-first interface with dark mode               |

The 2D version that met the brief is tagged [`v1.0-2d`](https://github.com/sinemagar/photo-finish/tree/v1.0-2d).

### Working with Claude

I used [Claude Code](https://claude.com/claude-code) as a pair programmer throughout, the same way I use AI tools in my day-to-day work. It helped me most with:

- **Planning:** turning the brief into the PRD and the phased roadmap, and spotting the ambiguities worth deciding up front.
- **Infrastructure:** project scaffolding, the CI workflow, the Playwright set-up with a controlled clock, and the deployment.
- **Design and visualisation:** iterating on the theme, layout and artwork, researching a free horse model, and reviewing screenshots at several screen sizes.
- **3D:** the three.js scene, the course and camera maths, and tracking down issues I spotted while watching races, such as jittering horses and a camera that lost the field at the lap start.
- **Tests:** drafting test cases alongside each feature, which I then extended and kept green.

I set the direction and the priorities, decided between the options it proposed, reviewed every pull request, and checked each phase in the browser on desktop and phone before merging. Nothing was merged on trust: every change had to pass lint, type-check, the unit tests and the browser tests in CI. Being able to explain each decision in this repository was the bar.

## Project structure

```
src/
  domain/                Game rules as pure TypeScript: config, rng, stable, programme,
                         simulation, summary, types. No Vue, no three.js.
  stores/                Pinia: session (seed, speed, renderer), stable, meeting (state machine),
                         and types.ts for the view models they hand out (TrackRunner)
  composables/           useFrameLoop (the game clock), useTheme, useAutoExpand, useRevealInScroller
  components/
    ui/                  Generic building blocks: BaseButton, BasePanel, BaseTabs, BaseDialog
    shared/              Game-aware building blocks: HorseBadge, RoundCard
    layout/              AppHeader
    race/                RacePanel, RaceStage (picks the renderer)
      controls/          ViewControl (TV, Chase, Aerial, 2D), SpeedControl
      overlays/          RaceOverlay and the cards it shows: WelcomeCard, RoundResultBanner, MeetingSummary
      status/            MeetingStatusBadge, RoundStepper, LiveLeaders
    details/             MeetingDetails: results, programme and stable behind tabs
    results/  programme/  stable/  help/
  renderers/             How the race is drawn. Both renderers take the same props.
    types.ts             The contract: TrackRendererProps, the props both renderers take
    choice.ts            Which renderer to start with (WebGL, reduced motion, ?renderer=)
    2d/                  Track2D, TrackLane, HorseSprite: HTML and CSS
    3d/                  Track3D, the Vue component, loaded on demand
      geometry/          Pure maths, unit-tested: the oval course, camera poses
      scene/             three.js only: RaceScene, environment, horses and jockeys, coats
  config/                Playback settings
  utils/                 Formatting, URL options
  styles/                Design tokens for the light and dark themes
  test/                  Helpers shared by component tests
public/models/           The horse model and its credits
tests/e2e/               Playwright specs, page object and visual baselines
scripts/                 Bundle size budgets and frame-timing measurement
docs/                    Product requirements, roadmap and recordings
```

Unit and component tests sit next to the file they test (`simulation.ts` and `simulation.spec.ts`).

## Credits

The horse is the Horse from the [Ultimate Animated Animal Pack](https://quaternius.com/packs/ultimateanimatedanimals.html) by Quaternius, released under CC0 (public domain). The jockeys, course and scenery are built from simple shapes in code.

## What could come next

- Pausing during the break between rounds
- A starting gate and a photo-finish replay in 3D
- Translations, by moving the interface strings into message files
- Keeping past meetings, which would add persistence to the session store
