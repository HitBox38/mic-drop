import type { Clip, ClipLayout } from "@/lib/types";

export interface Props {
  clip: Clip;
  clips: Clip[];
  gridColumns: number;
  columnStepPx: number;
  rowStepPx: number;
  isSelected: boolean;
  layoutLocked: boolean;
  onPlay: (clipId: string) => void;
  onEdit: (clipId: string) => void;
  onDuplicate: (clipId: string) => void;
  onDelete: (clipId: string) => void;
  onLayoutChange: (layout: ClipLayout) => void;
  onMove: (col: number, row: number) => void;
}
