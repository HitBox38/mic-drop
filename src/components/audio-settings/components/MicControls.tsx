import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

import type { MicControlsProps } from "../types";

interface Props extends MicControlsProps {}

export function MicControls({
  micVolume,
  micMuted,
  onMicVolumeChange,
  onMicMutedChange,
}: Props) {
  return (
    <div className="space-y-4 rounded-xl border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="mic-muted">Mute microphone</Label>
          <p className="text-sm text-muted-foreground">
            Send clips only while keeping call routing active.
          </p>
        </div>
        <Switch id="mic-muted" checked={micMuted} onCheckedChange={onMicMutedChange} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label>Microphone volume</Label>
          <span className="text-xs text-muted-foreground">{micVolume}%</span>
        </div>
        <Slider
          min={0}
          max={100}
          value={[micVolume]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            onMicVolumeChange(next ?? 0);
          }}
        />
      </div>
    </div>
  );
}
