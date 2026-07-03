import { useCallback, useRef, useState } from "react";

import { canPlace, clampLayout, type LayoutPreview } from "@/lib/grid";
import type { Clip } from "@/lib/types";

const DRAG_THRESHOLD_PX = 4;

interface UsePadGridDragOptions {
  clip: Clip;
  clips: Clip[];
  gridColumns: number;
  columnStepPx: number;
  rowStepPx: number;
  enabled: boolean;
  onMove: (col: number, row: number) => void;
}

export function usePadGridDrag({
  clip,
  clips,
  gridColumns,
  columnStepPx,
  rowStepPx,
  enabled,
  onMove,
}: UsePadGridDragOptions) {
  const [preview, setPreview] = useState<LayoutPreview | null>(null);
  const wasDraggingRef = useRef(false);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (!enabled || event.button !== 0) {
        return;
      }

      const startX = event.clientX;
      const startY = event.clientY;
      const startLayout = clip.layout;
      let dragging = false;

      function handleMove(moveEvent: PointerEvent) {
        const pixelDeltaX = moveEvent.clientX - startX;
        const pixelDeltaY = moveEvent.clientY - startY;

        if (!dragging) {
          const exceedsThreshold =
            Math.abs(pixelDeltaX) >= DRAG_THRESHOLD_PX || Math.abs(pixelDeltaY) >= DRAG_THRESHOLD_PX;
          if (!exceedsThreshold) {
            return;
          }
          dragging = true;
          wasDraggingRef.current = true;
        }

        const deltaCols = Math.round(pixelDeltaX / columnStepPx);
        const deltaRows = Math.round(pixelDeltaY / rowStepPx);
        const layout = clampLayout(
          { ...startLayout, col: startLayout.col + deltaCols, row: startLayout.row + deltaRows },
          gridColumns,
        );
        setPreview({ layout, valid: canPlace(layout, clips, gridColumns, clip.id) });
      }

      function handleUp() {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);

        setPreview((current) => {
          if (current?.valid) {
            onMove(current.layout.col, current.layout.row);
          }
          return null;
        });

        if (dragging) {
          // Defer so the click handler fired by this same pointer sequence
          // still sees wasDraggingRef as true and skips playback.
          requestAnimationFrame(() => {
            wasDraggingRef.current = false;
          });
        }
      }

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [enabled, clip, clips, gridColumns, columnStepPx, rowStepPx, onMove],
  );

  return { preview, wasDraggingRef, handlePointerDown };
}
