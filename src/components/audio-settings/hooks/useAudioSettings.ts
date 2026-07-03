import { useEffect, useMemo } from "react";

import type { MonitorMode } from "@/lib/types";
import { useAudioRoutingStore } from "@/store/audio-routing";

export function useAudioSettings() {
  const config = useAudioRoutingStore((state) => state.config);
  const devices = useAudioRoutingStore((state) => state.devices);
  const virtualCable = useAudioRoutingStore((state) => state.virtualCable);
  const isLoadingDevices = useAudioRoutingStore((state) => state.isLoadingDevices);
  const isEngineRunning = useAudioRoutingStore((state) => state.isEngineRunning);
  const error = useAudioRoutingStore((state) => state.error);
  const refreshDevices = useAudioRoutingStore((state) => state.refreshDevices);
  const updateConfig = useAudioRoutingStore((state) => state.updateConfig);
  const setEnabled = useAudioRoutingStore((state) => state.setEnabled);
  const clearError = useAudioRoutingStore((state) => state.clearError);

  const virtualOutputs = useMemo(() => {
    const detected = devices.outputs.filter((device) => device.isVirtual);
    return detected.length > 0 ? detected : devices.outputs;
  }, [devices.outputs]);

  useEffect(() => {
    void refreshDevices();
  }, [refreshDevices]);

  return {
    config,
    devices,
    virtualCable,
    virtualOutputs,
    isLoadingDevices,
    isEngineRunning,
    error,
    refreshDevices: () => void refreshDevices(),
    clearError,
    setEnabled: (enabled: boolean) => void setEnabled(enabled),
    setInputDevice: (inputDeviceId: string | null) => void updateConfig({ inputDeviceId }),
    setVirtualOutputDevice: (virtualOutputDeviceId: string | null) =>
      void updateConfig({ virtualOutputDeviceId }),
    setMonitorOutputDevice: (monitorOutputDeviceId: string | null) =>
      void updateConfig({ monitorOutputDeviceId }),
    setMonitorMode: (monitorMode: MonitorMode) => void updateConfig({ monitorMode }),
    setMicVolume: (micVolume: number) => void updateConfig({ micVolume }),
    setMicMuted: (micMuted: boolean) => void updateConfig({ micMuted }),
  };
}
