import { useRef } from "react";

import { Pad } from "@/components/pad";
import { GRID_GAP_PX, GRID_ROW_HEIGHT_PX } from "@/lib/grid";

import { useGridMetrics } from "../hooks/useGridMetrics";
import { EmptyState } from "./EmptyState";
import type { Props } from "../types";

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
    <div
      ref={containerRef}
      className="grid rounded-2xl"
      style={{
        gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
        gridAutoRows: `minmax(${GRID_ROW_HEIGHT_PX}px, auto)`,
        gap: GRID_GAP_PX,
        ...gridLineBackground,
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDeselect();
        }
      }}
    >
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
          onPlay={onPlay}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onLayoutChange={(layout) => onLayoutChange(clip.id, layout)}
          onMove={(col, row) => onMove(clip.id, col, row)}
        />
      ))}
    </div>
  );
}
