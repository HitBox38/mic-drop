import { convertFileSrc } from "@tauri-apps/api/core";

const activeByClipId = new Map<string, HTMLAudioElement>();

function getEffectiveVolume(clipVolume: number, masterVolume: number): number {
  return Math.max(0, Math.min(1, (clipVolume / 100) * (masterVolume / 100)));
}

function restartAudio(audio: HTMLAudioElement, volume: number): void {
  audio.pause();
  audio.volume = volume;
  audio.currentTime = 0;
  void audio.play().catch(() => {});
}

export function playClip(
  clipId: string,
  filePath: string,
  clipVolume: number,
  masterVolume: number,
): void {
  const volume = getEffectiveVolume(clipVolume, masterVolume);
  const existing = activeByClipId.get(clipId);

  if (existing) {
    restartAudio(existing, volume);
    return;
  }

  const audio = new Audio(convertFileSrc(filePath));
  audio.volume = volume;
  activeByClipId.set(clipId, audio);

  const cleanup = () => {
    if (activeByClipId.get(clipId) === audio) {
      activeByClipId.delete(clipId);
    }
  };

  audio.addEventListener("ended", cleanup, { once: true });
  audio.addEventListener("error", cleanup, { once: true });

  void audio.play().catch(cleanup);
}

export function stopAllAudio(): void {
  for (const audio of activeByClipId.values()) {
    audio.pause();
    audio.currentTime = 0;
  }
  activeByClipId.clear();
}

export function getActiveAudioCount(): number {
  return activeByClipId.size;
}
