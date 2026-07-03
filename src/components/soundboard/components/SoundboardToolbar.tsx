import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

import { GRID_COLUMN_OPTIONS } from "../constants";

interface Props {
  masterVolume: number;
  gridColumns: number;
  routingStatus: { label: string; tone: "active" | "warning" } | null;
  onAddSound: () => void;
  onStopAll: () => void;
  onMasterVolumeChange: (value: number) => void;
  onGridColumnsChange: (value: number) => void;
}

export function SoundboardToolbar({
  masterVolume,
  gridColumns,
  routingStatus,
  onAddSound,
  onStopAll,
  onMasterVolumeChange,
  onGridColumnsChange,
}: Props) {
  return (
    <div className="sticky top-[4.5rem] z-30 mb-4 flex flex-wrap items-center gap-3 rounded-full border bg-background/80 px-3 py-2 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAddSound}>
          Add Sound
        </Button>
        <Button size="sm" variant="outline" onClick={onStopAll}>
          Stop All
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {routingStatus ? (
        <>
          <span className="inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs text-muted-foreground">
            <span
              className={
                routingStatus.tone === "active"
                  ? "size-2 rounded-full bg-emerald-500"
                  : "size-2 rounded-full bg-amber-500"
              }
            />
            {routingStatus.label}
          </span>
          <Separator orientation="vertical" className="h-6" />
        </>
      ) : null}

      <div className="flex min-w-40 flex-1 items-center gap-2">
        <Label className="whitespace-nowrap text-xs text-muted-foreground">Volume</Label>
        <Slider
          min={0}
          max={100}
          value={[masterVolume]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            onMasterVolumeChange(next ?? 0);
          }}
        />
        <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">
          {masterVolume}%
        </span>
      </div>

      <Select
        value={String(gridColumns)}
        onValueChange={(value) => onGridColumnsChange(Number(value))}
      >
        <SelectTrigger size="sm" className="w-[8.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GRID_COLUMN_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} columns
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
