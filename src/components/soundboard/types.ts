import type { Clip, ClipLayout } from "@/lib/types";

export interface Props {
  clips: Clip[];
  gridColumns: number;
  selectedClipId: string | null;
  layoutLocked: boolean;
  onAddSound: () => void;
  onPlay: (clipId: string) => void;
  onEdit: (clipId: string) => void;
  onDeselect: () => void;
  onDuplicate: (clipId: string) => void;
  onDelete: (clipId: string) => void;
  onLayoutChange: (clipId: string, layout: ClipLayout) => void;
  onMove: (clipId: string, col: number, row: number) => void;
}
