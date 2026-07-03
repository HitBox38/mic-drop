import { useCallback, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { LayoutGroup } from "motion/react";

import { Pad } from "@/components/pad";
import { PadDragOverlay } from "@/components/pad/components/PadDragOverlay";
import { canPlace, clampLayout, GRID_GAP_PX, GRID_ROW_HEIGHT_PX, type LayoutPreview } from "@/lib/grid";
import type { ClipLayout } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useGridMetrics } from "../hooks/useGridMetrics";
import { EmptyState } from "./EmptyState";
import type { Props } from "../types";

interface ActivePadDrag {
  clipId: string;
  startLayout: ClipLayout;
  preview: LayoutPreview;
}

interface ActivePadResize {
  clipId: string;
  preview: LayoutPreview;
}

export function SoundboardGrid({
  clips,
  gridColumns,
  selectedClipId,
  layoutLocked,
  onAddSound,
  onPlay,
  onEdit,
  onDeselect,
  onDuplicate,
  onDelete,
  onLayoutChange,
  onMove,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { columnStepPx, rowStepPx } = useGridMetrics(containerRef, gridColumns);
  const activeDragRef = useRef<ActivePadDrag | null>(null);
  const [activeDrag, setActiveDragState] = useState<ActivePadDrag | null>(null);
  const [activeResize, setActiveResize] = useState<ActivePadResize | null>(null);
  const [suppressedClickClipId, setSuppressedClickClipId] = useState<string | null>(null);
  const activeClip = activeDrag ? clips.find((clip) => clip.id === activeDrag.clipId) : null;
  const activeLayoutPreview = activeDrag ?? activeResize;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const setActiveDrag = useCallback((next: ActivePadDrag | null) => {
    activeDragRef.current = next;
    setActiveDragState(next);
  }, []);

  const getLayoutPreview = useCallback(
    (clipId: string, startLayout: ClipLayout, delta: { x: number; y: number }): LayoutPreview => {
      const deltaCols = columnStepPx > 0 ? Math.round(delta.x / columnStepPx) : 0;
      const deltaRows = rowStepPx > 0 ? Math.round(delta.y / rowStepPx) : 0;
      const layout = clampLayout(
        { ...startLayout, col: startLayout.col + deltaCols, row: startLayout.row + deltaRows },
        gridColumns,
      );

      return { layout, valid: canPlace(layout, clips, gridColumns, clipId) };
    },
    [clips, gridColumns, columnStepPx, rowStepPx],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const clipId = String(event.active.id);
      const clip = clips.find((item) => item.id === clipId);
      if (!clip) {
        return;
      }

      setActiveDrag({
        clipId,
        startLayout: clip.layout,
        preview: { layout: clip.layout, valid: true },
      });
    },
    [clips, setActiveDrag],
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const current = activeDragRef.current;
      if (!current || current.clipId !== String(event.active.id)) {
        return;
      }

      const preview = getLayoutPreview(current.clipId, current.startLayout, event.delta);
      const currentLayout = current.preview.layout;
      if (
        currentLayout.col === preview.layout.col &&
        currentLayout.row === preview.layout.row &&
        current.preview.valid === preview.valid
      ) {
        return;
      }

      setActiveDrag({ ...current, preview });
    },
    [getLayoutPreview, setActiveDrag],
  );

  const clearSuppressedClick = useCallback(() => {
    requestAnimationFrame(() => setSuppressedClickClipId(null));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const current = activeDragRef.current;
      if (!current || current.clipId !== String(event.active.id)) {
        setActiveDrag(null);
        return;
      }

      const preview = getLayoutPreview(current.clipId, current.startLayout, event.delta);
      if (preview.valid) {
        onMove(current.clipId, preview.layout.col, preview.layout.row);
      }

      setSuppressedClickClipId(current.clipId);
      clearSuppressedClick();
      setActiveDrag(null);
    },
    [clearSuppressedClick, getLayoutPreview, onMove, setActiveDrag],
  );

  const handleDragCancel = useCallback(
    (event: DragCancelEvent) => {
      const current = activeDragRef.current;
      if (current && current.clipId === String(event.active.id)) {
        setSuppressedClickClipId(current.clipId);
        clearSuppressedClick();
      }
      setActiveDrag(null);
    },
    [clearSuppressedClick, setActiveDrag],
  );

  const handleResizePreviewChange = useCallback((clipId: string, preview: LayoutPreview | null) => {
    setActiveResize((current) => {
      if (preview) {
        return { clipId, preview };
      }
      return current?.clipId === clipId ? null : current;
    });
  }, []);

  if (clips.length === 0) {
    return <EmptyState onAddSound={onAddSound} />;
  }

  // Faint grid-line background so the board reads as a modular grid you can
  // rearrange things in, even before anything is selected or dragged.
  const gridLineBackground =
    columnStepPx > 0
      ? {
          backgroundImage: [
            "linear-gradient(to right, var(--border) 1px, transparent 1px)",
            "linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: `${columnStepPx}px ${rowStepPx}px`,
          backgroundPosition: `-${GRID_GAP_PX / 2}px -${GRID_GAP_PX / 2}px`,
        }
      : undefined;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        ref={containerRef}
        className="grid rounded-2xl"
        style={{
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          gridAutoRows: `minmax(${GRID_ROW_HEIGHT_PX}px, auto)`,
          gap: GRID_GAP_PX,
          ...gridLineBackground,
        }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            onDeselect();
          }
        }}
      >
        <LayoutGroup id="soundboard-grid">
          {activeLayoutPreview ? (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none rounded-xl border-2 border-dashed",
                activeLayoutPreview.preview.valid
                  ? "border-primary/60 bg-primary/10"
                  : "border-destructive/70 bg-destructive/10",
              )}
              style={{
                gridColumn: `${activeLayoutPreview.preview.layout.col} / span ${activeLayoutPreview.preview.layout.colSpan}`,
                gridRow: `${activeLayoutPreview.preview.layout.row} / span ${activeLayoutPreview.preview.layout.rowSpan}`,
              }}
            />
          ) : null}
          {clips.map((clip) => (
            <Pad
              key={clip.id}
              clip={clip}
              clips={clips}
              gridColumns={gridColumns}
              columnStepPx={columnStepPx}
              rowStepPx={rowStepPx}
              isSelected={clip.id === selectedClipId}
              layoutLocked={layoutLocked}
              dragPreview={activeDrag?.clipId === clip.id ? activeDrag.preview : null}
              resizePreview={activeResize?.clipId === clip.id ? activeResize.preview : null}
              isDragging={activeDrag?.clipId === clip.id}
              suppressClick={suppressedClickClipId === clip.id}
              dndDisabled={layoutLocked || columnStepPx <= 0 || Boolean(activeResize)}
              onPlay={onPlay}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onLayoutChange={(layout) => onLayoutChange(clip.id, layout)}
              onResizePreviewChange={(preview) => handleResizePreviewChange(clip.id, preview)}
            />
          ))}
        </LayoutGroup>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeClip ? <PadDragOverlay clip={activeClip} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
