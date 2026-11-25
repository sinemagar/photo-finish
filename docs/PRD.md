# Photo Finish — Product Requirements Document

|                  |                                                                               |
| ---------------- | ----------------------------------------------------------------------------- |
| **Status**       | Draft v1                                                                      |
| **Last updated** | 2026-11-24                                                                    |
| **Owner**        | Elif Sinem Ağar                                                               |
| **Related**      | [ROADMAP.md](./ROADMAP.md) — phased task breakdown derived from this document |

## 1. Purpose

Photo Finish is an interactive horse racing game that runs entirely in the browser. A player generates a six-round race programme from a stable of twenty horses, starts the meeting, watches each round play out as an animation, and reads the results as each round finishes.

It is built in response to a frontend assessment brief. The brief states that the game is a vehicle for showing **component structure, code organisation and state management within a complex feature**, written "as if for a large-scale project". This document therefore treats maintainability and testability as product requirements, not as afterthoughts.

### 1.1 Goals

1. Satisfy every functional rule in the brief, verifiably (see the traceability table in §9).
2. Keep game rules independent of the framework, so they can be unit-tested without mounting a component and reused by any renderer.
3. Make the simulation deterministic under a seed, so behaviour is reproducible in tests and bug reports.
4. Deliver a polished, responsive interface that is pleasant to watch, without letting visuals leak into game logic.
5. Cover the three bonus items: unit, end-to-end and visual tests, all running in CI.

### 1.2 Non-goals

- Betting, accounts, scores across sessions, or any backend.
- Multiplayer or real-time synchronisation.
- Persisting state across page reloads.
- Realistic horse-racing physics. The model only needs to be plausible and fair.
- Internationalisation. The interface is in English; strings are kept in one place so that i18n could be added later.

## 2. Analysis of the brief

### 2.1 What is explicitly required

| Area       | Requirement                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| Stable     | 20 horses in total; each has a unique colour and a condition score from 1 to 100                            |
| Programme  | A **Generate** button creates a schedule of 6 rounds; each round has 10 horses picked at random from the 20 |
| Distances  | Round 1 to 6: 1200 m, 1400 m, 1600 m, 1800 m, 2000 m, 2200 m, in that order                                 |
| Racing     | A **Start** button runs the rounds one at a time                                                            |
| Animation  | Horses visibly move during each round                                                                       |
| Results    | Each round's result appears in a Results panel as soon as that round finishes                               |
| Technology | Vue; state management with Vuex or Pinia; component-based design                                            |
| Bonus      | Unit tests, E2E tests, visual tests                                                                         |

### 2.2 Ambiguities and the decisions taken

The brief leaves several points open. Each decision below is deliberate and isolated in code, so that changing it is a small edit.

| #   | Ambiguity                                                                            | Decision                                                                                                                 | Reasoning                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | "The horse list should contain between 1 to 20 horses" versus "a total of 20 horses" | Always generate **20** horses; their condition is random                                                                 | A round needs 10 horses, so fewer than 10 can never work. The reference screenshot labels the list "Horse List (1–20)", which reads as row numbering. The stable size is a single config constant. |
| A2  | The effect of the condition score is not defined                                     | Condition raises a horse's average speed, combined with per-round form and moment-to-moment variance                     | A fitter horse should win more often, but not every time; otherwise the race is decided before it starts.                                                                                          |
| A3  | The reference screenshot shows "Start / Pause", but the text only mentions Start     | Implement **Start / Pause / Resume** as one toggle                                                                       | It matches the reference and exercises the state machine properly.                                                                                                                                 |
| A4  | Behaviour of Generate while a meeting is in progress                                 | Generate is disabled while a round is running; when paused or finished it creates a new programme and clears the results | Avoids a half-finished meeting with mixed data.                                                                                                                                                    |
| A5  | When the horse list itself is created                                                | On application load. Generate re-rolls the programme, not the stable                                                     | The list is visible in the reference before anything is clicked; a stable roster makes rounds comparable.                                                                                          |
| A6  | Transition between rounds                                                            | A short automatic pause, then the next round starts by itself                                                            | "Running one round at a time" implies a sequence that does not need a click per round.                                                                                                             |
| A7  | Real-world duration of a 2200 m race is over two minutes                             | Played back five times faster: about 15 s for 1200 m and 27 s for 2200 m, longer rounds taking proportionally longer     | Keeps the meeting watchable while preserving the difference between distances.                                                                                                                     |
| A8  | In 3D, horses with natural coats can look alike                                      | Each horse's unique colour is carried by its jockey's silks and numbered saddle cloth; the coat is decorative            | As on a real racecourse: the brief's rule is kept and the field still looks like horses.                                                                                                           |

## 3. Users and experience

There is one user type: a person opening the page on a desktop or mobile browser.

**Primary flow**

1. The page opens showing the stable of 20 horses with name, condition and colour. The track is empty and prompts the player to generate a programme.
2. The player clicks **Generate Programme**. The Programme panel fills with six rounds, each listing its ten runners and distance.
3. The player clicks **Start**. Round 1 begins: ten horses run in ten lanes towards the finish line.
4. When the last horse finishes, the round's finishing order is appended to the Results panel. After a short break, the next round starts.
5. At any point during a round the player can pause and resume.
6. After round 6 the meeting is complete. The player can generate a new programme.

**Layout (desktop)**: header with the two actions; three columns below: stable, track, programme with results. On narrow screens the columns stack, with the track first.

## 4. Functional requirements

Priorities: **M** = must (from the brief), **S** = should (our decision), **C** = could (stretch).

### 4.1 Stable

| ID    | Requirement                                                                                                    | Pri |
| ----- | -------------------------------------------------------------------------------------------------------------- | --- |
| FR-01 | The stable contains exactly 20 horses, generated on load                                                       | M   |
| FR-02 | Every horse has a unique name and a unique colour drawn from a curated palette of 20 visually distinct colours | M   |
| FR-03 | Every horse has an integer condition score between 1 and 100 inclusive, chosen at random                       | M   |
| FR-04 | The stable is listed with name, condition and a colour swatch                                                  | M   |

### 4.2 Programme

| ID    | Requirement                                                                                         | Pri |
| ----- | --------------------------------------------------------------------------------------------------- | --- |
| FR-05 | Clicking Generate creates a programme of exactly 6 rounds                                           | M   |
| FR-06 | Each round has 10 distinct horses selected at random from the 20, each assigned a lane from 1 to 10 | M   |
| FR-07 | Round distances are 1200, 1400, 1600, 1800, 2000 and 2200 m, in that order                          | M   |
| FR-08 | The Programme panel lists each round with its distance and runners in lane order                    | M   |
| FR-09 | Generating again replaces the programme and clears earlier results (see A4)                         | S   |

### 4.3 Racing

| ID    | Requirement                                                                    | Pri |
| ----- | ------------------------------------------------------------------------------ | --- |
| FR-10 | Clicking Start runs the rounds one at a time, in order                         | M   |
| FR-11 | Start is disabled until a programme exists                                     | M   |
| FR-12 | The same control pauses and resumes the running round without losing positions | S   |
| FR-13 | A round ends when all ten horses have crossed the finish line                  | M   |
| FR-14 | After a round ends, the next one starts automatically after a short break      | S   |
| FR-15 | The track shows the current round number and distance                          | M   |

### 4.4 Animation

| ID    | Requirement                                                                                  | Pri |
| ----- | -------------------------------------------------------------------------------------------- | --- |
| FR-16 | Each runner moves along its lane in proportion to the distance it has covered                | M   |
| FR-17 | Each runner is drawn in its own colour                                                       | M   |
| FR-18 | Running horses have a gallop animation, which stops when paused or finished                  | S   |
| FR-19 | With `prefers-reduced-motion`, decorative animation is removed while position updates remain | S   |

### 4.5 Results

| ID    | Requirement                                                                                     | Pri |
| ----- | ----------------------------------------------------------------------------------------------- | --- |
| FR-20 | When a round finishes, its finishing order (positions 1 to 10) is appended to the Results panel | M   |
| FR-21 | Results accumulate in round order and stay visible until a new programme is generated           | M   |
| FR-22 | Finishing order is determined by finish time; ties are broken deterministically                 | M   |
| FR-23 | New results are announced to assistive technology through a polite live region                  | S   |

### 4.6 Stretch

| ID    | Requirement                                                                        | Pri |
| ----- | ---------------------------------------------------------------------------------- | --- |
| FR-24 | Live standings during a round                                                      | C   |
| FR-25 | Alternative 3D track renderer, switchable at runtime, with no change to game logic | C   |

## 5. Game model

### 5.1 Meeting state machine

```
idle ──generate──▶ ready ──start──▶ running ◀──resume── paused
                     ▲                 │  └────pause────▶
                     │                 │ round finished
                  generate             ▼
                     │             intermission ──(next round)──▶ running
                     │                 │ last round finished
                     └──────────── finished
```

The meeting is always in exactly one of `idle`, `ready`, `running`, `paused`, `intermission` or `finished`. Every button's enabled state and label is derived from this value, never from scattered booleans.

### 5.2 Simulation

The simulation is a pure function: given the current round state, an elapsed time and a random source, it returns the next round state.

- **Base speed** grows with condition, so a horse with condition 100 is clearly but not overwhelmingly faster than one with condition 1.
- **Form** is a per-horse, per-round multiplier, drawn once at the start of the round. It represents a good or bad day.
- **Variance** is a small fluctuation applied over time, so the order changes during a round.
- **Finish time** is interpolated within the step in which the horse crosses the line, so the result does not depend on frame rate.

All coefficients live in a single configuration module and are tuned so that the favourite wins often but not always.

### 5.3 Randomness

All random choices go through one seeded pseudo-random generator that is passed into the domain functions. In production the seed comes from the clock. A `?seed=` query parameter fixes it, which makes a whole meeting reproducible for tests and for reporting a bug.

## 6. Technical requirements

### 6.1 Stack

| Concern                  | Choice                                                                    | Why                                                            |
| ------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Framework                | Vue 3, Composition API, `<script setup>`                                  | Required by the brief; current idiomatic Vue                   |
| Language                 | TypeScript, strict mode                                                   | Typed domain model, safer refactoring                          |
| State                    | Pinia                                                                     | Named in the brief; the officially recommended store for Vue 3 |
| Build                    | Vite                                                                      | Standard Vue toolchain                                         |
| Styling                  | SCSS with design tokens as CSS custom properties, scoped component styles | Themeable, no runtime cost                                     |
| Unit and component tests | Vitest, Vue Test Utils                                                    | Native to Vite                                                 |
| E2E and visual tests     | Playwright                                                                | One tool for both; screenshot comparison built in              |
| Quality                  | ESLint, Prettier, `vue-tsc`                                               | Enforced in CI                                                 |
| CI                       | GitHub Actions                                                            | Lint, type-check, unit, E2E on every push                      |
| Hosting                  | Cloudflare                                                                | Free static hosting with automatic deploys                     |

### 6.2 Architecture

Dependencies point in one direction only: components → stores and composables → domain.

```
src/
  domain/         Pure TypeScript. No Vue imports. Horses, programme, simulation, RNG, config.
  stores/         Pinia stores. Hold state, call the domain, expose getters and actions.
  composables/    Vue glue, e.g. the animation-frame loop that drives the simulation.
  components/     Feature folders: race (with controls, overlays, status), details,
                  results, programme, stable, help, layout.
    ui/           Small generic building blocks (button, panel, tabs, dialog).
    shared/       Presentational pieces used by several features (horse badge, round card).
  renderers/      How the race is drawn, behind one props contract (types.ts).
    2d/           HTML and CSS.
    3d/           three.js: geometry/ is pure maths, scene/ talks to three.js.
  config/         Presentation settings such as playback speed. Game rules stay in domain/.
  utils/          Framework-free helpers: formatting, reading URL options.
  styles/         Tokens, reset.
  App.vue
tests/
  e2e/            Playwright specs and visual snapshots.
```

Unit tests sit next to the file they test (`simulation.ts`, `simulation.spec.ts`).

**Principles**

1. **The domain is framework-free.** Rules can be read, tested and changed without knowing Vue.
2. **Stores orchestrate, they do not compute.** A store action calls a domain function and stores the result.
3. **Components are either containers or presentational.** Containers read from stores; presentational components receive props and emit events, which keeps them trivially testable.
4. **The track is a renderer.** It receives runners and their progress (0 to 1) and draws them. The 3D racecourse (FR-25) was added this way, beside the 2D track, without touching anything else.
5. **Time is injected.** The simulation receives elapsed time as an argument; only one composable knows about `requestAnimationFrame`.

### 6.3 Stores

| Store             | State                                                             | Responsibility                                                                       |
| ----------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `useSessionStore` | seed, playback speed                                              | The single seeded random source shared by the other stores                           |
| `useStableStore`  | horses                                                            | Creating and exposing the stable                                                     |
| `useMeetingStore` | status, programme, current round index, live round state, results | The state machine, programme generation, advancing the simulation, recording results |

### 6.4 Non-functional requirements

| ID     | Requirement                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Animation uses only `transform` and `opacity`, targeting 60 fps on a mid-range laptop                                               |
| NFR-02 | The simulation result is independent of frame rate and of the tab being throttled in the background                                 |
| NFR-03 | Usable from 360 px width upwards                                                                                                    |
| NFR-04 | All controls are keyboard-operable with visible focus; colour is never the only carrier of information; text contrast meets WCAG AA |
| NFR-05 | Works in the current versions of Chrome, Firefox, Safari and Edge                                                                   |
| NFR-06 | No runtime dependencies beyond Vue and Pinia for the core game                                                                      |
| NFR-07 | No ESLint or type errors; CI must be green before merging to `main`                                                                 |

## 7. Testing strategy

| Layer        | Tool                   | What it proves                                                                                                                                                                                                                                                                                                                                              |
| ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit: domain | Vitest                 | Stable has 20 horses with unique names and colours and conditions in range; programme has 6 rounds with the right distances and 10 distinct runners each; the simulation is deterministic under a seed, independent of step size, and every horse finishes; finishing order follows finish time; higher condition wins more often over many simulated races |
| Unit: stores | Vitest, Pinia testing  | Every state-machine transition, including the illegal ones being ignored; results are recorded once per round; Generate resets correctly                                                                                                                                                                                                                    |
| Component    | Vue Test Utils         | Panels render the data they are given; buttons are enabled, disabled and labelled according to status; events are emitted                                                                                                                                                                                                                                   |
| End-to-end   | Playwright             | The full flow from Generate to the sixth result; pause holds positions and resume continues; regenerating clears results                                                                                                                                                                                                                                    |
| Visual       | Playwright screenshots | Key states with a fixed seed: initial, programme generated, mid-race (paused at a known time), meeting finished; desktop and mobile widths                                                                                                                                                                                                                  |

Two things make the browser tests fast and stable: the fixed seed (§5.3) and Playwright's clock control. The tests take over the page's clock, so animation frames only run when a test advances time; a whole meeting replays in a few seconds and always frame for frame. Visual baselines are generated and compared in the same containerised environment in CI, to avoid font-rendering differences between machines; on other machines the comparison is skipped.

**Target:** at least 90% line coverage on `domain/` and `stores/`.

## 8. Risks

| Risk                                              | Mitigation                                                                                          |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Timer-based tests are flaky                       | Simulation takes time as an argument; unit tests never wait on real time                            |
| Visual snapshots differ between operating systems | Baselines are produced in CI only; animations are frozen before capture                             |
| Polish consumes the time needed for tests         | Phases are ordered so that a complete, tested game exists before visual polish begins (see roadmap) |
| The 3D renderer destabilises the core             | It is a stretch item behind the renderer boundary and is only started when everything else is done  |
| Background tabs throttle animation frames         | Elapsed time is clamped per frame and the simulation steps in fixed increments                      |

## 9. Traceability to the brief

| Brief item                                        | Covered by           |
| ------------------------------------------------- | -------------------- |
| Use Vue                                           | §6.1                 |
| Generate horse list                               | FR-01 to FR-04       |
| Generate race schedule of 6 rounds                | FR-05 to FR-09       |
| Start runs one round at a time                    | FR-10 to FR-15       |
| Results shown sequentially as each race concludes | FR-20 to FR-23       |
| Animated horse movement                           | FR-16 to FR-19       |
| Clean, maintainable, large-scale coding style     | §6.2, NFR-06, NFR-07 |
| 20 horses in total                                | FR-01                |
| Unique colour per horse                           | FR-02                |
| Condition from 1 to 100                           | FR-03                |
| 6 rounds                                          | FR-05                |
| 10 random horses per round                        | FR-06                |
| Round distances                                   | FR-07                |
| Vuex or Pinia                                     | §6.3                 |
| Component-based design                            | §6.2                 |
| Bonus: unit, E2E, visual tests                    | §7                   |

## 10. Definition of done

- Every **M** and **S** requirement is implemented and covered by at least one automated test.
- CI is green: lint, type-check, unit and component tests, E2E and visual tests.
- The game is deployed and the link is in the README.
- The README explains how to run, test and build the project, summarises the architecture and lists the assumptions from §2.2.
