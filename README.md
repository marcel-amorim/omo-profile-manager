# OMO Profile Manager

Desktop application to manage configuration profiles for Claude Code and OpenCode.

## What it does

- Create, edit, duplicate, and delete profiles
- Apply profiles with automatic backup support
- Import and export profile files
- Switch themes and use keyboard shortcuts
- Package and distribute with Electron Builder

## Tech stack

- Electron + Vite
- React 18 + TypeScript
- Tailwind CSS
- Zod for data validation
- Vitest and Playwright for testing

## Requirements

- Node.js 18+
- npm 9+

## Getting started

```bash
npm install
npm run dev
```

## Available scripts

- `npm run dev` - run app in development mode
- `npm run build` - type-check and build renderer/main bundles
- `npm run lint` - run ESLint
- `npm run test` - run unit tests once
- `npm run test:watch` - run unit tests in watch mode
- `npm run test:e2e` - run Playwright E2E tests
- `npm run dist` - build desktop distributables
- `npm run dist:mac` - build macOS package
- `npm run dist:win` - build Windows package
- `npm run dist:linux` - build Linux package

## Project structure

- `src/main` - Electron main process
- `src/preload` - context bridge APIs
- `src/renderer` - React UI
- `src/shared` - shared schemas and utilities

## Distribution

Electron Builder config lives in `electron-builder.json5`.
Build artifacts are generated into `dist/`.

## Additional documentation

- `RELEASE_NOTES.md`
- `QA_REPORT.md`
