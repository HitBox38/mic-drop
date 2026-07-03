import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { getContrastForeground } from "@/lib/color";
import { formatHotkeyLabel } from "@/lib/hotkeys";
import { cn } from "@/lib/utils";

import { DeleteClipDialog } from "./components/DeleteClipDialog";
import { ResizeHandles } from "./components/ResizeHandles";
import { PAD_FOREGROUND_CLASS, PAD_ICON_SCALE_CLASS, PAD_NAME_SCALE_CLASS } from "./constants";
import { usePadGridDrag } from "./hooks/usePadGridDrag";
import { usePadResize } from "./hooks/usePadResize";
import type { Props } from "./types";

export function Pad({
  clip,
  clips,
  gridColumns,
  columnStepPx,
  rowStepPx,
  isSelected,
  layoutLocked,
  onPlay,
  onEdit,
  onDuplicate,
  onDelete,
  onLayoutChange,
  onMove,
}: Props) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const resize = usePadResize({
    clip,
    clips,
    gridColumns,
    columnStepPx,
    rowStepPx,
    onResize: onLayoutChange,
  });

  const drag = usePadGridDrag({
    clip,
    clips,
    gridColumns,
    columnStepPx,
    rowStepPx,
    enabled: !layoutLocked,
    onMove,
  });

  const preview = resize.preview ?? drag.preview;
  const layout = preview?.layout ?? clip.layout;
  const isInvalidPreview = preview ? !preview.valid : false;
  const scaleKey = Math.min(layout.colSpan, layout.rowSpan);
  const foreground = PAD_FOREGROUND_CLASS[getContrastForeground(clip.color)];

  function handlePlay() {
    if (drag.wasDraggingRef.current) {
      return;
    }
    onPlay(clip.id);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handlePlay();
              }
            }}
          />
        }
        className={cn(
          "group relative flex flex-col justify-between rounded-xl border border-white/10 p-3 text-left shadow-sm transition-[transform,filter]",
          "hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isSelected && "ring-2 ring-primary",
          !layoutLocked && "cursor-grab active:cursor-grabbing",
          preview && "z-20",
          isInvalidPreview && "ring-2 ring-destructive",
        )}
        style={{
          backgroundColor: clip.color,
          gridColumn: `${layout.col} / span ${layout.colSpan}`,
          gridRow: `${layout.row} / span ${layout.rowSpan}`,
        }}
        onPointerDown={drag.handlePointerDown}
        onClick={handlePlay}
      >
        <div className="flex items-start justify-between gap-2">
          <span className={cn("leading-none", PAD_ICON_SCALE_CLASS[scaleKey])}>
            {clip.icon ?? "🔊"}
          </span>
          <div className="flex items-center gap-1">
            {clip.hotkey ? (
              <Badge
                variant="secondary"
                className={cn("text-[10px] backdrop-blur-sm", foreground.overlay)}
              >
                {formatHotkeyLabel(clip.hotkey)}
              </Badge>
            ) : null}
            <button
              type="button"
              aria-label={`Edit ${clip.name}`}
              className={cn(
                "flex size-6 items-center justify-center rounded-full opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
                foreground.overlay,
              )}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onEdit(clip.id);
              }}
            >
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-3.5" />
            </button>
          </div>
        </div>
        <div>
          <p
            className={cn(
              "line-clamp-2 font-semibold",
              foreground.text,
              PAD_NAME_SCALE_CLASS[scaleKey],
            )}
          >
            {clip.name}
          </p>
        </div>

        {isSelected && !layoutLocked ? (
          <ResizeHandles onResizeStart={resize.handleResizeStart} />
        ) : null}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(clip.id)}>Edit</ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(clip.id)}>Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>

      <DeleteClipDialog
        clipName={clip.name}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => onDelete(clip.id)}
      />
    </ContextMenu>
  );
}
