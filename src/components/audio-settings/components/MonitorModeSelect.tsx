import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MonitorMode } from "@/lib/types";

import { MONITOR_MODE_LABELS } from "../constants";
import type { MonitorModeSelectProps } from "../types";

interface Props extends MonitorModeSelectProps {}

const MONITOR_MODES: MonitorMode[] = ["clipsOnly", "fullMix", "off"];

export function MonitorModeSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor="monitor-mode" className="text-sm font-medium">
          Monitor mode
        </label>
        <p className="text-sm text-muted-foreground">
          Choose what you hear locally while routing audio to calls.
        </p>
      </div>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as MonitorMode)}>
        <SelectTrigger id="monitor-mode" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MONITOR_MODES.map((mode) => (
            <SelectItem key={mode} value={mode}>
              {MONITOR_MODE_LABELS[mode]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
