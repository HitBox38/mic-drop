import type { AudioDeviceInfo, MonitorMode } from "@/lib/types";

export interface Props {
  className?: string;
}

export interface DeviceSelectProps {
  id: string;
  label: string;
  description: string;
  value: string | null;
  devices: AudioDeviceInfo[];
  allowNone?: boolean;
  noneLabel?: string;
  onChange: (deviceId: string | null) => void;
}

export interface RoutingStatusProps {
  installed: boolean;
  driverInstalled: boolean;
  label?: string;
  guidance: string;
  installUrl: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export interface MicControlsProps {
  micVolume: number;
  micMuted: boolean;
  onMicVolumeChange: (volume: number) => void;
  onMicMutedChange: (muted: boolean) => void;
}

export interface MonitorModeSelectProps {
  value: MonitorMode;
  onChange: (value: MonitorMode) => void;
}
