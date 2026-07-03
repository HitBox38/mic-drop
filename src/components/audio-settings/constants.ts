import type { MonitorMode } from "@/lib/types";

export const NO_DEVICE_VALUE = "__none__";

export const MONITOR_MODE_LABELS: Record<MonitorMode, string> = {
  clipsOnly: "Clips only",
  fullMix: "Full mix",
  off: "Off",
};

export const SETUP_STEPS = [
  "Install BlackHole 2ch if MicDrop does not detect a virtual cable.",
  "If MicDrop shows Restart required, quit and reopen MicDrop or log out and sign back in.",
  "Select your real microphone as the input device.",
  "Select BlackHole 2ch as the virtual output device.",
  "In Discord, Teams, or Slack, choose BlackHole 2ch as the microphone input.",
];
