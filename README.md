# Photo Finish

An interactive horse racing game built with Vue 3, Pinia and TypeScript.

Generate a six-round programme from a stable of twenty horses, start the meeting and watch each round play out, with results appearing as every round finishes.

> **Status:** in development. Progress is tracked phase by phase in the [roadmap](./docs/ROADMAP.md).

## Documentation

- [Product requirements](./docs/PRD.md): scope, decisions, architecture and testing strategy
- [Roadmap](./docs/ROADMAP.md): phased task breakdown and workflow

## Getting started

Requires Node.js 22.18 or newer (see `.nvmrc`).

```sh
npm install
npm run dev
```

## Scripts

| Command                 | Description                             |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | Start the development server            |
| `npm run build`         | Type-check and build for production     |
| `npm run preview`       | Serve the production build locally      |
| `npm run lint`          | Lint with Oxlint and ESLint             |
| `npm run format`        | Format the codebase with Prettier       |
| `npm run typecheck`     | Type-check with `vue-tsc`               |
| `npm test`              | Run unit and component tests once       |
| `npm run test:watch`    | Run tests in watch mode                 |
| `npm run test:coverage` | Run tests and produce a coverage report |
