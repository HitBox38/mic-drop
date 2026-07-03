import { Badge } from "@/components/ui/badge";
import { getContrastForeground } from "@/lib/color";
import { formatHotkeyLabel } from "@/lib/hotkeys";
import type { Clip } from "@/lib/types";
import { cn } from "@/lib/utils";

import { PAD_FOREGROUND_CLASS, PAD_ICON_SCALE_CLASS, PAD_NAME_SCALE_CLASS } from "../constants";

interface Props {
  clip: Clip;
}

export function PadDragOverlay({ clip }: Props) {
  const scaleKey = Math.min(clip.layout.colSpan, clip.layout.rowSpan);
  const foreground = PAD_FOREGROUND_CLASS[getContrastForeground(clip.color)];

  return (
    <div
      data-pad-drag-overlay
      className="flex h-full w-full flex-col justify-between rounded-xl border border-white/10 p-3 text-left shadow-lg ring-2 ring-primary"
      style={{ backgroundColor: clip.color }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("leading-none", PAD_ICON_SCALE_CLASS[scaleKey])}>
          {clip.icon ?? "🔊"}
        </span>
        {clip.hotkey ? (
          <Badge variant="secondary" className={cn("text-[10px] backdrop-blur-sm", foreground.overlay)}>
            {formatHotkeyLabel(clip.hotkey)}
          </Badge>
        ) : null}
      </div>
      <p className={cn("line-clamp-2 font-semibold", foreground.text, PAD_NAME_SCALE_CLASS[scaleKey])}>
        {clip.name}
      </p>
    </div>
  );
}
