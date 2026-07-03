import { onClipHotkey } from "@/lib/tauri";
import { useAudioRoutingStore } from "@/store/audio-routing";
import { useBoardStore } from "@/store/board";

import { playClipRouted, stopAllRouted } from "./audio-routing";
import { playClip, stopAllAudio } from "./audio";

let hotkeyListenerReady = false;

export function playClipById(clipId: string): void {
  const { clips, masterVolume } = useBoardStore.getState();
  const clip = clips.find((item) => item.id === clipId);
  if (!clip) {
    return;
  }

  const routing = useAudioRoutingStore.getState();
  if (routing.config.enabled && routing.isEngineRunning) {
    void playClipRouted(clip.id, clip.filePath, clip.volume).catch((error) => {
      useAudioRoutingStore.setState({
        error: error instanceof Error ? error.message : String(error),
      });
    });
    return;
  }

  playClip(clip.id, clip.filePath, clip.volume, masterVolume);
}

export function stopAllPlayback(): void {
  const routing = useAudioRoutingStore.getState();
  if (routing.config.enabled && routing.isEngineRunning) {
    void stopAllRouted().catch(() => {});
    return;
  }

  stopAllAudio();
}

export function initClipHotkeyListener(): void {
  if (hotkeyListenerReady) {
    return;
  }

  hotkeyListenerReady = true;

  void onClipHotkey((clipId) => {
    playClipById(clipId);
  });
}
