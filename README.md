# MicDrop

MicDrop is a configurable desktop soundboard built with Tauri 2.0, React, and TypeScript. Add local audio clips, arrange them in a grid, assign global hotkeys, and play sounds through your default system output or a routed virtual microphone.

## Features (v1)

- **Modular soundboard grid** — configurable columns, pads default to 1x1 and can be resized (up to 4x4) and repositioned in edit mode
- **Clip management** — import mp3/wav/ogg files, right-click pads to edit/duplicate/delete; editing opens a non-modal, docked properties panel (right rail on desktop, bottom panel on mobile) so the grid stays interactive — you can drag/resize the pad you're editing, or navigate elsewhere, without closing it first
- **Playback** — HTML5 Audio fallback per clip, per-clip volume, master volume, Stop All
- **Call routing (macOS first)** — Rust audio engine mixes your microphone with clips and routes the mix to BlackHole 2ch for Discord/Teams/Slack
- **Global hotkeys** — work even when the app is unfocused (via `tauri-plugin-global-shortcut`)
- **Persistence** — board config saved with `tauri-plugin-store`
- **Settings** — dark/light theme toggle, audio device selection, virtual cable detection, mic volume/mute, and monitor output controls

## Tech stack

- Tauri 2.0 (Rust backend + WebView frontend)
- React 19 + TypeScript
- shadcn/ui + Tailwind CSS v4
- Zustand (state)
- TanStack Router, Form, Hotkeys

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- Platform dependencies for Tauri: see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
- [BlackHole 2ch](https://existential.audio/blackhole/) for macOS call routing

## Setup

```bash
pnpm install
```

## Development

Run the app in dev mode (starts Vite + Tauri):

```bash
pnpm tauri dev
```

## Build

```bash
pnpm tauri build
```

Production bundles are written to `src-tauri/target/release/bundle/`.

## Project structure

```
src/
  components/     # UI (shadcn-based feature folders)
  store/          # Zustand stores (board.ts)
  lib/            # audio, hotkeys, tauri invoke helpers
  routes/         # TanStack Router pages
src-tauri/
  src/
    commands/     # Rust Tauri commands
    lib.rs
```

## Rust commands

| Command | Description |
|---------|-------------|
| `pick_audio_files` | Open native file dialog for mp3/wav/ogg |
| `load_board_config` | Load persisted board from store |
| `save_board_config` | Save board config to store |
| `sync_hotkeys` | Register global shortcuts for clip hotkeys |
| `list_audio_devices` | Enumerate input and output devices |
| `detect_virtual_cable` | Detect BlackHole/VB-Cable/PipeWire-style virtual outputs |
| `start_audio_engine` | Start mic + clip routing to a selected output |
| `stop_audio_engine` | Stop native routed audio |
| `play_clip_routed` | Queue a clip into the native mixer |
| `stop_all_routed` | Stop all routed clip voices |

## Audio routing notes

MicDrop does not ship a kernel-level virtual audio driver. On macOS, install BlackHole 2ch and select it as MicDrop's virtual output and as your call app's microphone input. Windows and Linux support use the same engine with virtual-cable detection heuristics for VB-Cable and PipeWire-style devices.

## License

Private project.
