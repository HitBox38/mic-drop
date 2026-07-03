export type Theme = "dark" | "light";

export interface ClipLayout {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface Clip {
  id: string;
  name: string;
  filePath: string;
  color: string;
  icon?: string;
  volume: number;
  hotkey?: string;
  layout: ClipLayout;
}

export interface BoardConfig {
  clips: Clip[];
  gridColumns: number;
  masterVolume: number;
  theme: Theme;
}

export interface HotkeyBinding {
  clipId: string;
  hotkey?: string;
}

export interface AudioDeviceInfo {
  id: string;
  label: string;
  isDefault: boolean;
  isVirtual: boolean;
}

export interface AudioDevices {
  inputs: AudioDeviceInfo[];
  outputs: AudioDeviceInfo[];
}

export interface VirtualCableStatus {
  installed: boolean;
  driverInstalled: boolean;
  deviceId?: string;
  label?: string;
  installUrl: string;
  platform: string;
  guidance: string;
}

export type MonitorMode = "clipsOnly" | "fullMix" | "off";

export interface AudioRoutingConfig {
  enabled: boolean;
  inputDeviceId: string | null;
  virtualOutputDeviceId: string | null;
  monitorOutputDeviceId: string | null;
  monitorMode: MonitorMode;
  micVolume: number;
  micMuted: boolean;
}

export interface AudioEngineErrorEvent {
  message: string;
}
