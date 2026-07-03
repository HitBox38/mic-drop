import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import type {
  AudioDevices,
  AudioEngineErrorEvent,
  AudioRoutingConfig,
  MonitorMode,
  VirtualCableStatus,
} from "@/lib/types";

export const DEFAULT_AUDIO_ROUTING_CONFIG: AudioRoutingConfig = {
  enabled: false,
  inputDeviceId: null,
  virtualOutputDeviceId: null,
  monitorOutputDeviceId: null,
  monitorMode: "clipsOnly",
  micVolume: 100,
  micMuted: false,
};

export async function listAudioDevices(): Promise<AudioDevices> {
  return invoke<AudioDevices>("list_audio_devices");
}

export async function detectVirtualCable(): Promise<VirtualCableStatus> {
  return invoke<VirtualCableStatus>("detect_virtual_cable");
}

export async function loadAudioRoutingConfig(): Promise<AudioRoutingConfig> {
  return invoke<AudioRoutingConfig>("load_audio_routing_config");
}

export async function saveAudioRoutingConfig(config: AudioRoutingConfig): Promise<void> {
  await invoke("save_audio_routing_config", { config });
}

export async function startAudioEngine(
  config: AudioRoutingConfig,
  masterVolume: number,
): Promise<void> {
  await invoke("start_audio_engine", {
    config,
    masterVolume,
  });
}

export async function stopAudioEngine(): Promise<void> {
  await invoke("stop_audio_engine");
}

export async function playClipRouted(
  clipId: string,
  filePath: string,
  clipVolume: number,
): Promise<void> {
  await invoke("play_clip_routed", {
    clipId,
    filePath,
    clipVolume,
  });
}

export async function stopAllRouted(): Promise<void> {
  await invoke("stop_all_routed");
}

export async function setRoutingVolumes(
  masterVolume: number,
  micVolume: number,
  micMuted: boolean,
): Promise<void> {
  await invoke("set_routing_volumes", {
    masterVolume,
    micVolume,
    micMuted,
  });
}

export async function setMonitorMode(monitorMode: MonitorMode): Promise<void> {
  await invoke("set_monitor_mode", { monitorMode });
}

export function onAudioEngineError(callback: (event: AudioEngineErrorEvent) => void) {
  return listen<AudioEngineErrorEvent>("audio-engine-error", (event) => {
    callback(event.payload);
  });
}
