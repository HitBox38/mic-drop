import type { Clip, ClipLayout } from "@/lib/types";
import type { LayoutPreview } from "@/lib/grid";

export interface Props {
  clip: Clip;
  clips: Clip[];
  gridColumns: number;
  columnStepPx: number;
  rowStepPx: number;
  isSelected: boolean;
  layoutLocked: boolean;
  dragPreview: LayoutPreview | null;
  resizePreview: LayoutPreview | null;
  isDragging: boolean;
  suppressClick: boolean;
  dndDisabled: boolean;
  onPlay: (clipId: string) => void;
  onEdit: (clipId: string) => void;
  onDuplicate: (clipId: string) => void;
  onDelete: (clipId: string) => void;
  onLayoutChange: (layout: ClipLayout) => void;
  onResizePreviewChange: (preview: LayoutPreview | null) => void;
}
