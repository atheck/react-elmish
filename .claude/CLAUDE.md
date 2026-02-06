# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`react-elmish` is a TypeScript library implementing the Elm architecture (Model-Update-View) for React. It provides both a hook-based API (`useElmish`) and a class-based API (`ElmComponent`), with optional immutable state support via Immer.

## Build & Development Commands

```bash
npm run build            # Full build (types + JS)
npm run build:types      # TypeScript declaration files only
npm run build:js         # Babel transpilation only
npm test                 # Jest with coverage
npm run test:watch       # Jest in watch mode
npx jest path/to/file    # Run a single test file
npm run lint             # Biome + ESLint
```

Build uses Babel for JS output and `tsc --emitDeclarationOnly` for `.d.ts` files. Output goes to `dist/`.

## Architecture

### Core Elm Pattern

The library follows Model → Message → Update → View:

- **Model**: Plain state object
- **Message**: Discriminated union with `name` field (e.g., `{ name: "increment" }`)
- **Init**: `(props) => [model, ...cmds]` — initializes state, optionally dispatches commands
- **Update**: Either an `UpdateMap` (object mapping message names to handlers) or a single update function
- **Commands** (`cmd`): Side-effect system — `ofMsg`, `ofEither`, `ofSuccess`, `ofError`, `ofNone`, `ofSub`, `batch`

### Module Structure

| Path | Purpose |
|------|---------|
| `src/useElmish.ts` | Hook implementation — returns `[model, dispatch]` |
| `src/ElmComponent.ts` | Abstract class component base |
| `src/cmd.ts` | Command creation functions |
| `src/Types.ts` | Core type definitions (`Message`, `Cmd`, `UpdateMap`, `Dispatch`, etc.) |
| `src/Init.ts` | Library initialization (logger, middleware, DevTools) |
| `src/ErrorHandling.ts` | Error message pattern and handler utilities |
| `src/Common.ts` | Shared internals (logging, model diffing, command execution) |
| `src/createDefer.ts` | Defer function factory for update options |
| `src/createCallBase.ts` | CallBase function factory for composition |
| `src/mergeSubscriptions.ts` | Combines multiple subscription functions |
| `src/testing/` | Test utilities (`getUpdateFn`, `execCmd`, `initAndExecCmd`, `renderWithModel`, etc.) |
| `src/immutable/` | Immer-based variants — update handlers receive `Draft<TModel>` and mutate directly |
| `src/extend/` | Extension API for advanced composition (`createCallBase`, `createDefer`) |

### Package Exports

The library exposes multiple entry points:
- `react-elmish` — core API
- `react-elmish/testing` — test utilities
- `react-elmish/immutable` — Immer-based variants
- `react-elmish/immutable/testing` — immutable test utilities
- `react-elmish/extend` — extension API
- `react-elmish/immutable/extend` — immutable extension API

### Key Patterns

**UpdateMap** (preferred over switch-based update functions): handlers are keyed by message name and receive `(msg, model, props, { defer, callBase })`.

**Composition**: Multiple modules share messages and update maps via spread operators. `MsgSource<"ModuleName">` disambiguates message origins. `callBase` invokes parent handlers; `defer` schedules updates to run after the current handler.

**Immutable variant**: Same API surface but update handlers receive an Immer `Draft<TModel>` and return only commands (no partial model).

## Testing

Tests are colocated as `.spec.ts`/`.spec.tsx` files next to source. Uses Jest with `ts-jest`, `jsdom` environment, and `@testing-library/react`.

The `testing/` subpackage provides helpers:
- `getCreateUpdateArgs` / `createUpdateArgsFactory` — build typed test arguments
- `getUpdateFn` / `getUpdateAndExecCmdFn` — extract and run update handlers from an UpdateMap
- `getConsecutiveUpdateFn` — run chained updates until message queue is empty
- `execCmd` — execute commands and collect dispatched messages
- `initAndExecCmd` — test init function with command execution
- `renderWithModel` — render a component with a fake model/dispatch

## Configuration

- **TypeScript**: Strict mode, `esnext` target, `Node16` module resolution, `react-jsx`
- **Linting**: Biome (primary, 130 char line width) + ESLint, configs extend `eslint-config-heck`
- **CI**: GitHub Actions — feature branches run lint+test; main/beta/alpha run lint+test+build+semantic-release
- **Releases**: Semantic Release with `main`, `beta` (prerelease), and `alpha` (prerelease) branches
