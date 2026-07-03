import type { Clip, ClipLayout } from "./types";

export const MIN_SPAN = 1;
export const MAX_SPAN = 4;
export const GRID_GAP_PX = 12;
export const GRID_ROW_HEIGHT_PX = 96;

export type ResizeEdge = "n" | "e" | "s" | "w";

interface GridCell {
  col: number;
  row: number;
}

export interface LayoutPreview {
  layout: ClipLayout;
  valid: boolean;
}

function layoutsOverlap(a: ClipLayout, b: ClipLayout): boolean {
  const aColEnd = a.col + a.colSpan - 1;
  const aRowEnd = a.row + a.rowSpan - 1;
  const bColEnd = b.col + b.colSpan - 1;
  const bRowEnd = b.row + b.rowSpan - 1;

  return a.col <= bColEnd && aColEnd >= b.col && a.row <= bRowEnd && aRowEnd >= b.row;
}

export function canPlace(
  layout: ClipLayout,
  clips: Clip[],
  gridColumns: number,
  excludeClipId?: string,
): boolean {
  if (layout.col < 1 || layout.row < 1) {
    return false;
  }
  if (layout.col + layout.colSpan - 1 > gridColumns) {
    return false;
  }

  return clips.every(
    (clip) => clip.id === excludeClipId || !layoutsOverlap(layout, clip.layout),
  );
}

export function clampLayout(layout: ClipLayout, gridColumns: number): ClipLayout {
  const colSpan = Math.min(Math.max(layout.colSpan, MIN_SPAN), Math.min(MAX_SPAN, gridColumns));
  const rowSpan = Math.min(Math.max(layout.rowSpan, MIN_SPAN), MAX_SPAN);
  const maxCol = Math.max(1, gridColumns - colSpan + 1);
  const col = Math.min(Math.max(layout.col, 1), maxCol);
  const row = Math.max(layout.row, 1);

  return { col, row, colSpan, rowSpan };
}

export function findFirstEmptyCell(
  clips: Clip[],
  gridColumns: number,
  colSpan = MIN_SPAN,
  rowSpan = MIN_SPAN,
): GridCell {
  const span = Math.min(Math.max(colSpan, MIN_SPAN), gridColumns);
  const maxCol = Math.max(1, gridColumns - span + 1);
  // Every clip can occupy at most MAX_SPAN rows, so scanning this many rows
  // is always enough to find a free cell for the given clip count.
  const maxRow = clips.length * MAX_SPAN + rowSpan + 1;

  for (let row = 1; row <= maxRow; row++) {
    for (let col = 1; col <= maxCol; col++) {
      if (canPlace({ col, row, colSpan: span, rowSpan }, clips, gridColumns)) {
        return { col, row };
      }
    }
  }

  return { col: 1, row: maxRow + 1 };
}

export function migrateLegacyClips(clips: Clip[], gridColumns: number): Clip[] {
  const migrated: Clip[] = [];

  for (const clip of clips) {
    if (clip.layout) {
      migrated.push(clip);
      continue;
    }

    const { col, row } = findFirstEmptyCell(migrated, gridColumns);
    migrated.push({ ...clip, layout: { col, row, colSpan: MIN_SPAN, rowSpan: MIN_SPAN } });
  }

  return migrated;
}

export function applyResizeDelta(
  layout: ClipLayout,
  edge: ResizeEdge,
  deltaCols: number,
  deltaRows: number,
): ClipLayout {
  switch (edge) {
    case "e":
      return { ...layout, colSpan: layout.colSpan + deltaCols };
    case "w":
      return { ...layout, col: layout.col + deltaCols, colSpan: layout.colSpan - deltaCols };
    case "s":
      return { ...layout, rowSpan: layout.rowSpan + deltaRows };
    case "n":
      return { ...layout, row: layout.row + deltaRows, rowSpan: layout.rowSpan - deltaRows };
  }
}
