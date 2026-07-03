import { useCallback, useState } from "react";

import { applyResizeDelta, canPlace, clampLayout, type LayoutPreview, type ResizeEdge } from "@/lib/grid";
import type { Clip, ClipLayout } from "@/lib/types";

interface UsePadResizeOptions {
  clip: Clip;
  clips: Clip[];
  gridColumns: number;
  columnStepPx: number;
  rowStepPx: number;
  onResize: (layout: ClipLayout) => void;
}

export function usePadResize({
  clip,
  clips,
  gridColumns,
  columnStepPx,
  rowStepPx,
  onResize,
}: UsePadResizeOptions) {
  const [preview, setPreview] = useState<LayoutPreview | null>(null);

  const handleResizeStart = useCallback(
    (edge: ResizeEdge, event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const startLayout = clip.layout;

      function handleMove(moveEvent: PointerEvent) {
        const deltaCols = Math.round((moveEvent.clientX - startX) / columnStepPx);
        const deltaRows = Math.round((moveEvent.clientY - startY) / rowStepPx);
        const layout = clampLayout(
          applyResizeDelta(startLayout, edge, deltaCols, deltaRows),
          gridColumns,
        );
        setPreview({ layout, valid: canPlace(layout, clips, gridColumns, clip.id) });
      }

      function handleUp() {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        setPreview((current) => {
          if (current?.valid) {
            onResize(current.layout);
          }
          return null;
        });
      }

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [clip, clips, gridColumns, columnStepPx, rowStepPx, onResize],
  );

  return { preview, handleResizeStart };
}
