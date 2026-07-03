## Project: MicDrop

A configurable desktop soundboard app (Tauri + React). Users add audio
clips, arrange them in a grid, assign hotkeys, and play them. MicDrop
can also route a native Rust mix of microphone input plus clip playback
to third-party virtual audio cables for Discord/Teams/Slack calls.

## Stack

- Tauri 2.0 (Rust backend, WebView frontend)
- React + TypeScript
- shadcn/ui + Tailwind CSS
- Zustand (state) + tauri-plugin-store (persistence)
- tauri-plugin-global-shortcut (hotkeys)
- tauri-plugin-dialog (file picking)

## Project structure

```

src/
components/ # UI components (shadcn-based)
store/ # Zustand stores
lib/ # helpers, audio utils, hotkey utils
routes/ # if using a router, otherwise pages/
src-tauri/
src/
commands/ # Tauri command handlers (Rust)
main.rs

```

## Commands

```bash
npm install          # install frontend deps
npm run tauri dev    # run app in dev mode
npm run tauri build  # build production app
npm run lint         # lint frontend
```

## Conventions

- **State**: all board/clip state lives in Zustand
  (`src/store/board.ts`). Don't scatter clip state into component
  local state.
- **Persistence**: read/write board config only through
  `tauri-plugin-store`. Never use `localStorage` — this is a native
  app, not a website.
- **Audio playback**: keep HTML5 `Audio` as the fallback when call
  routing is disabled. When call routing is enabled, playback goes
  through the Rust `cpal`/`symphonia` mixer in `src-tauri/src/audio/`.
- **Rust commands**: expose backend functionality (file dialogs,
  store I/O, global shortcuts) as `#[tauri::command]` functions in
  `src-tauri/src/commands/`, invoked from the frontend via
  `invoke()`.
- **Components**: use shadcn/ui primitives; don't hand-roll basic UI
  elements (buttons, dialogs, sliders) that shadcn already provides.
- **Naming**: a single sound entry is called a "clip." A UI button
  representing a clip is called a "pad."

## Out of scope (do not implement without explicit instruction)

- Shipping a custom kernel-level virtual audio driver
- Discord/Teams/Slack API integrations
- Replacing the Rust mixer with Web Audio API mixing

## Testing

- No test suite yet. If adding logic-heavy code (hotkey parsing,
  store migrations), prefer adding Vitest unit tests alongside the
  file (`*.test.ts`).

## Notes for agents

- This app targets Windows, macOS, and Linux — avoid OS-specific
  assumptions in Rust code unless behind `#[cfg(target_os = "...")]`.
- Prefer small, incremental PRs/commits per feature (e.g., "add clip
  grid," "add hotkey registration") rather than one giant change.
