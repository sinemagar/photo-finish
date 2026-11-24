# Photo Finish — Roadmap

Phased task breakdown derived from the [PRD](./PRD.md). Requirement IDs (FR-xx, NFR-xx) refer to that document.

**Ordering rule:** a complete, tested game exists at the end of Phase 4. Everything after that improves it without changing the rules. Tests are written within the phase that introduces the code, not saved for the end; Phase 6 adds only the browser-level suites.

## Workflow

- One branch per phase, named `phase-N/short-name`, opened as a pull request against `main`.
- A phase is merged only when its exit criteria are met and CI is green.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and are kept small enough to review one at a time.
- `main` always builds and is always deployable.

| Phase | Outcome                     | Status      |
| ----- | --------------------------- | ----------- |
| 0     | Project foundation          | Done        |
| 1     | Domain core                 | Done        |
| 2     | State management            | Done        |
| 3     | Functional interface        | Done        |
| 4     | Race engine and animation   | Done        |
| 5     | Visual design and polish    | Done        |
| 6     | End-to-end and visual tests | Done        |
| 7     | Delivery                    | Not started |
| 8     | Stretch: 3D renderer        | Optional    |

---

## Phase 0 — Project foundation

**Outcome:** an empty application that builds, lints, type-checks and runs an example test, locally and in CI.

- [x] Scaffold Vue 3, TypeScript (strict) and Vite
- [x] Add Pinia and SCSS
- [x] Configure ESLint, Prettier and `vue-tsc`
- [x] Configure Vitest with Vue Test Utils and coverage
- [x] Set up the `@/` path alias; folders from PRD §6.2 are added as each phase fills them
- [x] Add npm scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`
- [x] Add a GitHub Actions workflow: lint, type-check, unit tests, build

**Exit criteria:** `npm run lint && npm run typecheck && npm test && npm run build` passes; CI is green on `main`.

## Phase 1 — Domain core

**Outcome:** all game rules exist as pure, fully tested TypeScript with no Vue imports.

- [x] `config`: stable size, runners per round, round distances, simulation coefficients
- [x] `rng`: seeded pseudo-random generator with integer, float, `shuffle` and `sample` helpers
- [x] `types`: `Horse`, `Round`, `Runner`, `RoundState`, `RoundResult`, `MeetingStatus`
- [x] `stable`: create 20 horses with unique names and colours and a random condition (FR-01 to FR-03)
- [x] `programme`: create 6 rounds with fixed distances and 10 distinct runners each, with lanes (FR-05 to FR-07)
- [x] `simulation`: create the initial round state, advance it by a time step, detect completion, produce the finishing order (FR-13, FR-22, NFR-02)
- [x] Unit tests for every module, including determinism under a seed, step-size independence and the statistical effect of condition

**Exit criteria:** a whole meeting can be simulated in a unit test from a seed, with the same result every time; coverage on `domain/` is at least 90%.

## Phase 2 — State management

**Outcome:** Pinia stores expose the game to the interface through a strict state machine.

- [x] `useSessionStore`: seed, playback speed and the shared random source
- [x] `useStableStore`: holds the horses and creates them on request
- [x] `useMeetingStore`: status, programme, current round, live round state, results
- [x] Actions: `generateProgramme`, `start`, `pause`, `resume`, `toggle`, `tick(elapsed)`, plus the internal round transitions
- [x] Getters: current round, runners with progress, `canGenerate`, `canToggle`, label for the start control
- [x] Guard illegal transitions (PRD §5.1, decision A4)
- [x] Unit tests for every transition, result recording and reset on regenerate (FR-09)

**Exit criteria:** driving the store with `tick` alone completes a meeting and yields six results, in a test with no components mounted.

## Phase 3 — Functional interface

**Outcome:** the full flow works in the browser with plain styling. The track is a list of progress bars for now; the animated renderer replaces it in Phase 4.

- [x] `ui/`: button and panel
- [x] `shared/`: horse badge and the round table used by both the programme and the results
- [x] `AppHeader` with Generate and Start / Pause controls (FR-11, FR-12)
- [x] `StablePanel`: name, colour, condition (FR-04)
- [x] `ProgrammePanel`: six rounds with distance and runners, current round highlighted (FR-08)
- [x] `ResultsPanel`: results appended per round with finish times, with a polite live region (FR-20, FR-21, FR-23)
- [x] `TrackPanel`: round title, status message and per-lane progress (FR-15)
- [x] `useFrameLoop` composable: drives `tick` from `requestAnimationFrame`, clamps late frames, stops when the clock is not running (NFR-02). Brought forward from Phase 4 so that the flow can be exercised end to end here
- [x] `?seed=` and `?speed=` query parameters wired through to the session store
- [x] Layout that stacks on narrow screens, track first (NFR-03)
- [x] Component tests for each panel, the header's enabled, disabled and label states, and the frame loop with a hand-stepped scheduler

**Exit criteria:** Generate fills the programme; Start produces six results in order; all controls work from the keyboard.

## Phase 4 — Race engine and animation

**Outcome:** rounds play out visibly on the track in real time. This completes every requirement of the brief.

- [x] `RaceTrack` renderer: ten lanes, lane numbers and the finish line; takes runners and progress as props and knows nothing about stores (FR-15)
- [x] `TrackLane` and `HorseSprite`: position from progress using `transform` only, coloured per horse (FR-16, FR-17, NFR-01)
- [x] Gallop cycle that plays only while a horse is actually running, and not at all with `prefers-reduced-motion` (FR-18, FR-19)
- [x] The upcoming round is lined up on the starting line as soon as a programme exists
- [x] Finishing position shown next to each horse as it crosses the line
- [x] Pause and resume hold and continue positions exactly (FR-12)
- [x] Intermission between rounds and the meeting-finished state (FR-14)
- [x] Surges tuned to last longer, so that horses visibly gain and lose ground during a round
- [x] Component tests for the sprite, the lane, the renderer and the panel

**Exit criteria:** a full meeting can be watched from start to finish; pausing freezes every horse; the same seed yields the same race.

## Phase 5 — Visual design and polish

**Outcome:** the game looks and feels finished.

- [x] Design tokens: colour, spacing, type scale, radii, shadow, motion duration
- [x] Horse artwork redrawn as an SVG tinted with the horse's colour, with jointed legs, a gallop cycle and the lane number on the saddle cloth (FR-18)
- [x] Track styling: striped turf, rails, a gate board with lane number and horse name, start line, quarter markers labelled with the round's distances, finish line
- [x] Status badge next to the round title; message shown over the track while it is empty or paused
- [x] Podium highlight in the results and on the finish line; current round highlighted and completed rounds played down in the programme
- [x] Programme and results scroll to the current round by themselves, without moving the page on small screens
- [x] Condition meter in the stable list
- [x] Branded header with the main action in the accent colour
- [x] Responsive pass at 390, 900 and 1440 px
- [ ] Live standings during a round (FR-24): left out; the finishing positions on the line cover the need

**Exit criteria:** no layout breakage at the three widths; keyboard-only use is comfortable. The automated accessibility check is part of the browser tests in Phase 6.

## Phase 6 — End-to-end and visual tests

**Outcome:** the bonus test suites exist and run in CI.

- [x] Playwright set-up with the production build as the web server
- [x] Controlled browser clock: time moves only when a test advances it, so a seed replays frame for frame and no test waits on real time
- [x] E2E: the whole meeting, with each result appearing as its round finishes and in round order
- [x] E2E: pause and resume; Generate locked while racing; regenerate clears results; Start disabled before Generate; same seed gives the same programme; keyboard-only play
- [x] Accessibility: automated axe check of four states reports no serious issues (NFR-04). It found two real problems, both fixed: scrolling panels that could not be reached from the keyboard, and low-contrast text in finished rounds
- [x] Visual: initial, programme generated, paused mid-race, first round finished, meeting finished; desktop and mobile
- [x] Visual baselines generated in the CI container; report and screenshots uploaded as artefacts
- [x] Browser tests added to the workflow as a second job

**Exit criteria:** the whole suite passes in CI three times in a row without retries.

## Phase 7 — Delivery

**Outcome:** the project can be evaluated from a link.

- [ ] Deploy to Cloudflare Pages with automatic deploys from `main`
- [ ] README: live link, screenshot, how to run, test and build, architecture summary, assumptions (PRD §2.2), what would come next
- [ ] Review the commit history and the PRD traceability table against the brief
- [ ] Final cross-browser check (NFR-05)

**Exit criteria:** every item in the PRD's definition of done is met.

## Phase 8 — Stretch: 3D renderer

Only started when Phases 0 to 7 are complete.

- [ ] Extract the renderer contract from `RaceTrack` (runners in, pixels out)
- [ ] Add a lazily loaded 3D track that implements the same contract
- [ ] Runtime switch between 2D and 3D; 2D remains the default and the one under visual test
- [ ] Verify that no file in `domain/` or `stores/` changed

**Exit criteria:** switching the renderer mid-race continues the same race from the same positions.
