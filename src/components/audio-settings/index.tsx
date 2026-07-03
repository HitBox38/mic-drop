import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { DeviceSelect } from "./components/DeviceSelect";
import { MicControls } from "./components/MicControls";
import { MonitorModeSelect } from "./components/MonitorModeSelect";
import { RoutingStatusCard } from "./components/RoutingStatusCard";
import { SetupGuide } from "./components/SetupGuide";
import type { Props } from "./types";
import { useAudioSettings } from "./hooks/useAudioSettings";

const FALLBACK_INSTALL_URL = "https://existential.audio/blackhole/";

export function AudioSettings({ className }: Props) {
  const audio = useAudioSettings();
  const status = audio.virtualCable ?? {
    installed: false,
    driverInstalled: false,
    guidance: "Checking for a supported virtual audio cable.",
    installUrl: FALLBACK_INSTALL_URL,
    platform: "unknown",
  };
  const routingAvailable = status.installed;

  return (
    <section className={cn("space-y-4 rounded-2xl border bg-card/60 p-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-medium">Call routing</h2>
          <p className="text-sm text-muted-foreground">
            Mix your microphone with pads and send the combined stream to a virtual mic.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="call-routing">Enabled</Label>
          <Switch
            id="call-routing"
            checked={audio.config.enabled && audio.isEngineRunning}
            disabled={!routingAvailable}
            onCheckedChange={audio.setEnabled}
          />
        </div>
      </div>

      <RoutingStatusCard
        installed={status.installed}
        driverInstalled={status.driverInstalled}
        label={status.label}
        guidance={status.guidance}
        installUrl={status.installUrl}
        onRefresh={audio.refreshDevices}
        isRefreshing={audio.isLoadingDevices}
      />

      {audio.error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <p>{audio.error}</p>
          <Button size="sm" variant="outline" onClick={audio.clearError}>
            Dismiss
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DeviceSelect
          id="input-device"
          label="Input microphone"
          description="Your real microphone. Leave as default unless you use a dedicated mic."
          value={audio.config.inputDeviceId}
          devices={audio.devices.inputs}
          allowNone
          noneLabel="System default microphone"
          onChange={audio.setInputDevice}
        />
        <DeviceSelect
          id="virtual-output-device"
          label="Virtual output"
          description="Choose BlackHole 2ch or another supported virtual cable."
          value={audio.config.virtualOutputDeviceId}
          devices={audio.virtualOutputs}
          onChange={audio.setVirtualOutputDevice}
        />
        <DeviceSelect
          id="monitor-output-device"
          label="Monitor output"
          description="Optional headphones or speakers for local monitoring."
          value={audio.config.monitorOutputDeviceId}
          devices={audio.devices.outputs}
          allowNone
          noneLabel="No monitor"
          onChange={audio.setMonitorOutputDevice}
        />
        <MonitorModeSelect value={audio.config.monitorMode} onChange={audio.setMonitorMode} />
      </div>

      <MicControls
        micVolume={audio.config.micVolume}
        micMuted={audio.config.micMuted}
        onMicVolumeChange={audio.setMicVolume}
        onMicMutedChange={audio.setMicMuted}
      />

      <SetupGuide />
    </section>
  );
}
