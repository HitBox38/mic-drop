import { useState, type CSSProperties } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { useDraggable } from "@dnd-kit/core";
import { m, useReducedMotion } from "motion/react";

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
import { motionInstant, padLayoutSpring, padLiftSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { DeleteClipDialog } from "./components/DeleteClipDialog";
import { ResizeHandles } from "./components/ResizeHandles";
import { PAD_FOREGROUND_CLASS, PAD_ICON_SCALE_CLASS, PAD_NAME_SCALE_CLASS } from "./constants";
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
  dragPreview,
  resizePreview,
  isDragging,
  suppressClick,
  dndDisabled,
  onPlay,
  onEdit,
  onDuplicate,
  onDelete,
  onLayoutChange,
  onResizePreviewChange,
}: Props) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: clip.id,
    disabled: dndDisabled,
  });

  const resize = usePadResize({
    clip,
    clips,
    gridColumns,
    columnStepPx,
    rowStepPx,
    onResize: onLayoutChange,
    onPreviewChange: onResizePreviewChange,
  });

  const preview = resize.preview;
  const layout = clip.layout;
  const isResizing = Boolean(resize.visual);
  const activePreview = preview ?? dragPreview ?? resizePreview;
  const isInvalidPreview = activePreview ? !activePreview.valid : false;
  const scaleKey = Math.min(layout.colSpan, layout.rowSpan);
  const foreground = PAD_FOREGROUND_CLASS[getContrastForeground(clip.color)];
  const padStyle = {
    gridColumn: `${layout.col} / span ${layout.colSpan}`,
    gridRow: `${layout.row} / span ${layout.rowSpan}`,
  } as CSSProperties;
  const shellStyle = {
    backgroundColor: clip.color,
    transformOrigin: resize.visual?.transformOrigin,
    "--pad-resize-scale": resize.visual?.scale ?? "1 1",
  } as CSSProperties;

  function handlePlay() {
    if (isDragging || suppressClick) {
      return;
    }
    onPlay(clip.id);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <m.div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handlePlay();
              }
            }}
            layout={!shouldReduceMotion && !isDragging && !isResizing}
            layoutDependency={[layout.col, layout.row, layout.colSpan, layout.rowSpan]}
            animate={isDragging || isResizing ? undefined : { scale: 1 }}
            transition={
              isDragging || isResizing
                ? undefined
                : {
                    layout: shouldReduceMotion ? motionInstant : padLayoutSpring,
                    scale: shouldReduceMotion ? motionInstant : padLiftSpring,
                  }
            }
          />
        }
        className={cn(
          "group relative flex flex-col justify-between rounded-xl p-3 text-left",
          "transition-[filter]",
          "touch-none hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          !isDragging && !isResizing && "active:scale-[0.98]",
          isSelected && "ring-2 ring-primary",
          !layoutLocked && "cursor-grab active:cursor-grabbing",
          (isResizing || isDragging) && "z-20",
          isDragging && "opacity-40",
          isInvalidPreview && "ring-2 ring-destructive",
        )}
        style={padStyle}
        onClick={handlePlay}
      >
        <div
          aria-hidden="true"
          data-pad-shell
          className={cn(
            "pointer-events-none absolute inset-0 rounded-xl border border-white/10 shadow-sm",
            isResizing && "scale-(--pad-resize-scale)",
          )}
          style={shellStyle}
        />
        <div className="relative z-10 flex items-start justify-between gap-2">
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
        <div className="relative z-10">
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
