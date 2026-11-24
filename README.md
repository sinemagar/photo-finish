# Photo Finish

An interactive horse racing game built with Vue 3, Pinia and TypeScript.

**[Play it live](https://photo-finish.sinemaar1.workers.dev/)**

Generate a six-round programme from a stable of twenty horses, start the meeting and watch each round play out on the track, with results appearing as every round finishes.

![Photo Finish after the first round: ten horses on the finish line with their positions, the programme and the first result](./docs/images/screenshot.png)

## Contents

- [Requirements covered](#requirements-covered)
- [Getting started](#getting-started)
- [Architecture](#architecture)
- [Testing](#testing)
- [Assumptions](#assumptions)
- [Project structure](#project-structure)
- [How the work was organised](#how-the-work-was-organised)
- [What could come next](#what-could-come-next)

## Requirements covered

| Requirement                                                | Where                                                                        |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 20 horses, each with a unique colour and a condition 1–100 | [`domain/stable.ts`](./src/domain/stable.ts)                                 |
| Generate creates 6 rounds of 10 random horses              | [`domain/programme.ts`](./src/domain/programme.ts)                           |
| Rounds of 1200, 1400, 1600, 1800, 2000 and 2200 m          | [`domain/config.ts`](./src/domain/config.ts)                                 |
| Start runs the rounds one at a time                        | [`stores/meeting.ts`](./src/stores/meeting.ts)                               |
| Results appear as each round finishes                      | [`components/results`](./src/components/results)                             |
| Horses move during a race                                  | [`components/track`](./src/components/track)                                 |
| State management with Pinia                                | [`stores`](./src/stores)                                                     |
| Component-based design                                     | [`components`](./src/components)                                             |
| Bonus: unit tests                                          | 182 tests next to the code they cover (`*.spec.ts`)                          |
| Bonus: E2E tests                                           | [`tests/e2e/meeting.spec.ts`](./tests/e2e/meeting.spec.ts)                   |
| Bonus: visual tests                                        | [`tests/e2e/visual.spec.ts`](./tests/e2e/visual.spec.ts), desktop and mobile |

Beyond the brief: pause and resume, realistic finish times, a reproducible session from a seed, automated accessibility checks and a responsive layout.

## Getting started

Requires Node.js 22.18 or newer (see `.nvmrc`).

```sh
npm install
npm run dev
```

| Command                 | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Start the development server                       |
| `npm run build`         | Type-check and build for production                |
| `npm run preview`       | Serve the production build locally                 |
| `npm run lint`          | Lint with Oxlint and ESLint                        |
| `npm run format`        | Format the codebase with Prettier                  |
| `npm run typecheck`     | Type-check with `vue-tsc`                          |
| `npm test`              | Run unit and component tests once                  |
| `npm run test:coverage` | Run them with a coverage report                    |
| `npm run test:e2e`      | Run the end-to-end, accessibility and visual tests |

The end-to-end tests need a browser once: `npx playwright install chromium`.

Two URL parameters help when exploring or debugging:

- `?seed=7` fixes all randomness, so the same horses, programme and races come back every time.
- `?speed=5` plays the meeting five times faster.

## Architecture

Dependencies point one way only: components use stores and composables, which use the domain.

```
components/   What is on screen. Shows data and forwards clicks. Contains no game rule.
     ↓
stores/       What is true right now: the programme, the live round, the results.
composables/  Decides what happens next and delegates every calculation downwards.
     ↓
domain/       The rules, as pure TypeScript with no Vue import: create the stable,
              draw the programme, advance a race, rank the finishers.
```

A few decisions shape the code:

- **The rules are framework-free.** Everything in `src/domain` is a pure function, so it is tested without mounting anything and would survive a change of framework or renderer.
- **The meeting is a state machine.** It is always in exactly one of `idle`, `ready`, `running`, `paused`, `intermission` or `finished`. What each button allows and says is derived from that single value, never from separate flags.
- **Time is injected.** The store moves only when `tick(elapsedMs)` is called. One composable, `useFrameLoop`, connects it to `requestAnimationFrame`; tests call `tick` directly.
- **Randomness is seeded.** Every random choice goes through one generator, which makes a session reproducible and the tests stable.
- **The result does not depend on frame rate.** The simulation advances in fixed steps and carries leftover time over, so a slow machine or a background tab produces the same race.
- **The track is a renderer.** `RaceTrack` receives runners and their progress as props and knows nothing about stores. Horses move by `transform` alone.

The full reasoning, including the race model, is in the [product requirements](./docs/PRD.md).

## Testing

| Layer         | Tool                   | Count | What it proves                                                                                             |
| ------------- | ---------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| Domain        | Vitest                 | 43    | The rules of the brief, reproducibility from a seed, independence from frame rate, the effect of condition |
| Stores        | Vitest                 | 42    | Every state transition, including the illegal ones being ignored; results recorded once per round          |
| Components    | Vitest, Vue Test Utils | 97    | Panels render what they are given; controls are enabled and labelled by status; the frame loop             |
| End-to-end    | Playwright             | 12    | A whole meeting in the browser, pause and resume, reset, keyboard-only play                                |
| Accessibility | Playwright, axe        | 4     | No serious issue in the initial, ready, paused and finished states                                         |
| Visual        | Playwright             | 10    | Five states on desktop and mobile, compared with committed baselines                                       |

Line coverage of the unit and component tests is 100%.

The browser tests take control of the page's clock: time moves only when a test advances it. A given seed therefore replays frame for frame, a full meeting runs in a few seconds, and no test waits on real time. Visual baselines are generated and compared in the CI container, because screenshots depend on the fonts of the machine; elsewhere the comparison is skipped.

CI runs lint, formatting, type-check, unit tests and build in one job and the browser tests in another, on every pull request.

## Assumptions

The brief leaves some points open. These are the decisions taken; each is isolated in the code and easy to change.

| Open point                                                      | Decision                                                                            |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| "Between 1 and 20 horses" versus "a total of 20 horses"         | Always 20. A round needs 10, so fewer could never work. The size is one constant.   |
| What the condition score does                                   | It raises a horse's average speed. Form on the day and surges keep upsets possible. |
| The example shows "Start / Pause", the text only mentions Start | One control that starts, pauses and resumes.                                        |
| Generating while a race is running                              | Disabled during a round; allowed when paused or finished, which resets the results. |
| Moving from one round to the next                               | Automatic after a short break.                                                      |
| A 2200 m race takes over two minutes in reality                 | Played back nine times faster; finish times are still reported in real race time.   |

## Project structure

```
src/
  domain/         Game rules: config, rng, stable, programme, simulation, types
  stores/         Pinia stores: session, stable, meeting
  composables/    useFrameLoop, useRevealInScroller
  components/
    ui/           BaseButton, BasePanel
    shared/       HorseBadge, RoundTable
    layout/       AppHeader
    stable/  programme/  results/  track/
  config/         Playback settings
  utils/          Formatting, URL options
  styles/         Design tokens and base styles
tests/e2e/        Playwright specs, page object and visual baselines
docs/             Product requirements and roadmap
```

## How the work was organised

The project started with a [product requirements document](./docs/PRD.md) and a [roadmap](./docs/ROADMAP.md) that splits the work into phases. Each phase was built on its own branch, reviewed as a pull request with a description of what changed and how it was verified, and merged only with CI green. The [closed pull requests](../../pulls?q=is%3Apr+is%3Aclosed) tell the story in order.

## What could come next

- Live standings during a round
- Pausing during the break between rounds
- A second, 3D renderer behind the same `RaceTrack` props
- Translations, by moving the interface strings into message files
- Keeping past meetings, which would add persistence to the session store
