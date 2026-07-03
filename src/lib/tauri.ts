import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import type { BoardConfig, HotkeyBinding } from "@/lib/types";

export async function pickAudioFiles(): Promise<string[]> {
  return invoke<string[]>("pick_audio_files");
}

export async function loadBoardConfig(): Promise<BoardConfig | null> {
  return invoke<BoardConfig | null>("load_board_config");
}

export async function saveBoardConfig(config: BoardConfig): Promise<void> {
  await invoke("save_board_config", { config });
}

export async function syncHotkeys(bindings: HotkeyBinding[]): Promise<void> {
  await invoke("sync_hotkeys", { bindings });
}

export function onClipHotkey(callback: (clipId: string) => void) {
  return listen<string>("clip-hotkey", (event) => {
    callback(event.payload);
  });
}
