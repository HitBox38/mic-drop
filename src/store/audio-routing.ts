import { create } from "zustand";

import {
  DEFAULT_AUDIO_ROUTING_CONFIG,
  detectVirtualCable,
  listAudioDevices,
  loadAudioRoutingConfig,
  onAudioEngineError,
  saveAudioRoutingConfig,
  setMonitorMode,
  setRoutingVolumes,
  startAudioEngine,
  stopAudioEngine,
} from "@/lib/audio-routing";
import type { AudioDevices, AudioRoutingConfig, VirtualCableStatus } from "@/lib/types";
import { useBoardStore } from "@/store/board";

interface AudioRoutingState {
  config: AudioRoutingConfig;
  devices: AudioDevices;
  virtualCable: VirtualCableStatus | null;
  isHydrated: boolean;
  isLoadingDevices: boolean;
  isEngineRunning: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  updateConfig: (updates: Partial<AudioRoutingConfig>) => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  syncVolumesFromBoard: (masterVolume: number) => Promise<void>;
  clearError: () => void;
}

const EMPTY_DEVICES: AudioDevices = {
  inputs: [],
  outputs: [],
};

let errorListenerReady = false;

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeConfig(config: AudioRoutingConfig): AudioRoutingConfig {
  return {
    ...DEFAULT_AUDIO_ROUTING_CONFIG,
    ...config,
    micVolume: clampPercent(config.micVolume),
  };
}

async function persistAndMaybeRestart(
  config: AudioRoutingConfig,
  set: (state: Partial<AudioRoutingState>) => void,
) {
  if (!config.enabled) {
    await stopAudioEngine();
    set({ isEngineRunning: false });
    await saveAudioRoutingConfig(config);
    return;
  }

  if (!config.virtualOutputDeviceId) {
    throw new Error("Choose a virtual output device before enabling call routing.");
  }

  await saveAudioRoutingConfig(config);
  await startAudioEngine(config, useBoardStore.getState().masterVolume);
  set({ isEngineRunning: true });
}

export const useAudioRoutingStore = create<AudioRoutingState>((set, get) => ({
  config: DEFAULT_AUDIO_ROUTING_CONFIG,
  devices: EMPTY_DEVICES,
  virtualCable: null,
  isHydrated: false,
  isLoadingDevices: false,
  isEngineRunning: false,
  error: null,

  hydrate: async () => {
    if (!errorListenerReady) {
      errorListenerReady = true;
      void onAudioEngineError((event) => {
        set({ error: event.message, isEngineRunning: false });
      });
    }

    const config = normalizeConfig(await loadAudioRoutingConfig());
    set({ config, isHydrated: true });

    if (!config.enabled) {
      await get().refreshDevices();
      return;
    }

    await get().refreshDevices();
    const routedConfig = normalizeConfig({
      ...config,
      virtualOutputDeviceId: config.virtualOutputDeviceId ?? get().virtualCable?.deviceId ?? null,
    });

    if (!routedConfig.virtualOutputDeviceId) {
      const disabled = { ...routedConfig, enabled: false };
      await saveAudioRoutingConfig(disabled);
      set({
        config: disabled,
        isEngineRunning: false,
        error: "Choose a virtual output device before enabling call routing.",
      });
      return;
    }

    set({ config: routedConfig });

    try {
      await startAudioEngine(routedConfig, useBoardStore.getState().masterVolume);
      set({ isEngineRunning: true, error: null });
    } catch (error) {
      const disabled = { ...routedConfig, enabled: false };
      await saveAudioRoutingConfig(disabled);
      set({
        config: disabled,
        isEngineRunning: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  refreshDevices: async () => {
    set({ isLoadingDevices: true });
    try {
      const [devices, virtualCable] = await Promise.all([
        listAudioDevices(),
        detectVirtualCable(),
      ]);
      set({ devices, virtualCable, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ isLoadingDevices: false });
    }
  },

  updateConfig: async (updates) => {
    const config = normalizeConfig({ ...get().config, ...updates });
    set({ config, error: null });
    try {
      await persistAndMaybeRestart(config, set);
      if (updates.monitorMode) {
        await setMonitorMode(updates.monitorMode);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  setEnabled: async (enabled) => {
    const current = get();
    const config = normalizeConfig({
      ...current.config,
      enabled,
      virtualOutputDeviceId:
        current.config.virtualOutputDeviceId ?? current.virtualCable?.deviceId ?? null,
    });
    set({ config, error: null });
    try {
      await persistAndMaybeRestart(config, set);
    } catch (error) {
      const disabled = { ...config, enabled: false };
      await saveAudioRoutingConfig(disabled);
      set({
        config: disabled,
        isEngineRunning: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  syncVolumesFromBoard: async (masterVolume) => {
    const { config, isEngineRunning } = get();
    if (!config.enabled || !isEngineRunning) {
      return;
    }

    try {
      await setRoutingVolumes(masterVolume, config.micVolume, config.micMuted);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
