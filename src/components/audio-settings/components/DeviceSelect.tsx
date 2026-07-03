import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { NO_DEVICE_VALUE } from "../constants";
import type { DeviceSelectProps } from "../types";

interface Props extends DeviceSelectProps {}

export function DeviceSelect({
  id,
  label,
  description,
  value,
  devices,
  allowNone = false,
  noneLabel = "None",
  onChange,
}: Props) {
  return (
    <div className="space-y-2">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Select
        value={value ?? NO_DEVICE_VALUE}
        onValueChange={(nextValue) => {
          onChange(nextValue === NO_DEVICE_VALUE ? null : nextValue);
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!allowNone && !value ? (
            <SelectItem value={NO_DEVICE_VALUE}>Select a device</SelectItem>
          ) : null}
          {allowNone ? <SelectItem value={NO_DEVICE_VALUE}>{noneLabel}</SelectItem> : null}
          {devices.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              No devices found
            </SelectItem>
          ) : (
            devices.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                {device.label}
                {device.isDefault ? " (default)" : ""}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
