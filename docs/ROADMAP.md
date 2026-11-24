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
| 2     | State management            | Not started |
| 3     | Functional interface        | Not started |
| 4     | Race engine and animation   | Not started |
| 5     | Visual design and polish    | Not started |
| 6     | End-to-end and visual tests | Not started |
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

- [ ] `useStableStore`: holds the horses, creates them on initialisation
- [ ] `useMeetingStore`: status, programme, current round, live round state, results
- [ ] Actions: `generateProgramme`, `start`, `pause`, `resume`, `tick(elapsed)`, plus the internal round transitions
- [ ] Getters: current round, runners with progress, `canGenerate`, `canStart`, label for the start control
- [ ] Guard illegal transitions (PRD §5.1, decision A4)
- [ ] Unit tests for every transition, result recording and reset on regenerate (FR-09)

**Exit criteria:** driving the store with `tick` alone completes a meeting and yields six results, in a test with no components mounted.

## Phase 3 — Functional interface

**Outcome:** the full flow works in the browser with plain styling; horses do not animate yet, and rounds resolve through the store.

- [ ] `ui/`: button, panel, data table
- [ ] `AppHeader` with Generate and Start / Pause controls (FR-11, FR-12)
- [ ] `StablePanel`: name, condition, colour swatch (FR-04)
- [ ] `ProgrammePanel`: six rounds with distance and runners (FR-08)
- [ ] `ResultsPanel`: results appended per round, with a polite live region (FR-20, FR-21, FR-23)
- [ ] Three-column layout that stacks on narrow screens (NFR-03)
- [ ] Component tests for each panel and for the header's enabled, disabled and label states

**Exit criteria:** Generate fills the programme; Start produces six results in order; all controls work from the keyboard.

## Phase 4 — Race engine and animation

**Outcome:** rounds play out visibly on the track in real time. This completes every requirement of the brief.

- [ ] `useRaceLoop` composable: drives `tick` from `requestAnimationFrame`, clamps large gaps, stops when not running (NFR-02)
- [ ] `RaceTrack` renderer: ten lanes, lane numbers, finish line, round label (FR-15)
- [ ] `TrackLane` and `HorseSprite`: position from progress using `transform` only, coloured per horse (FR-16, FR-17, NFR-01)
- [ ] Pause and resume hold and continue positions exactly (FR-12)
- [ ] Intermission between rounds and the meeting-finished state (FR-14)
- [ ] `?seed=` and test-only speed multiplier wired through to the stores
- [ ] Tests for the loop composable with a fake frame source; component tests for the track

**Exit criteria:** a full meeting can be watched from start to finish; pausing freezes every horse; the same seed yields the same race.

## Phase 5 — Visual design and polish

**Outcome:** the game looks and feels finished.

- [ ] Design tokens: colour, spacing, type scale, radii, motion durations
- [ ] Horse artwork as an SVG tinted with the horse's colour, with a gallop cycle (FR-18)
- [ ] Track styling: turf, rails, distance markers, finish post
- [ ] Empty, ready, intermission and finished states with clear messaging
- [ ] Podium highlight in results; currently running round highlighted in the programme
- [ ] Live standings during a round (FR-24, if time allows)
- [ ] `prefers-reduced-motion` support (FR-19)
- [ ] Accessibility pass: focus order, contrast, labels (NFR-04)
- [ ] Responsive pass at 360, 768 and 1280 px

**Exit criteria:** no layout breakage at the three widths; keyboard-only use is comfortable; an automated accessibility check reports no serious issues.

## Phase 6 — End-to-end and visual tests

**Outcome:** the bonus test suites exist and run in CI.

- [ ] Playwright set-up with a production build as the web server
- [ ] E2E: happy path through all six rounds
- [ ] E2E: pause and resume; regenerate clears results; Start disabled before Generate
- [ ] Visual: initial, programme generated, mid-race (paused at a known time), finished; desktop and mobile
- [ ] Generate visual baselines in the CI container; upload diffs as artefacts on failure
- [ ] Add E2E and visual jobs to the workflow

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
