import { useCallback, useState } from "react";

import { applyResizeDelta, canPlace, clampLayout, type LayoutPreview, type ResizeEdge } from "@/lib/grid";
import type { Clip, ClipLayout } from "@/lib/types";

const MIN_RESIZE_VISUAL_SIZE_PX = 32;

export interface ResizeVisual {
  scale: string;
  transformOrigin: string;
}

interface UsePadResizeOptions {
  clip: Clip;
  clips: Clip[];
  gridColumns: number;
  columnStepPx: number;
  rowStepPx: number;
  onResize: (layout: ClipLayout) => void;
  onPreviewChange: (preview: LayoutPreview | null) => void;
}

export function usePadResize({
  clip,
  clips,
  gridColumns,
  columnStepPx,
  rowStepPx,
  onResize,
  onPreviewChange,
}: UsePadResizeOptions) {
  const [preview, setPreview] = useState<LayoutPreview | null>(null);
  const [visual, setVisual] = useState<ResizeVisual | null>(null);

  const handleResizeStart = useCallback(
    (edge: ResizeEdge, event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startY = event.clientY;
      const startLayout = clip.layout;
      const padElement = event.currentTarget.parentElement;
      const startRect = padElement?.getBoundingClientRect();
      let latestPreview: LayoutPreview | null = null;

      function getVisualTransform(deltaX: number, deltaY: number): ResizeVisual | null {
        if (!startRect) {
          return null;
        }

        switch (edge) {
          case "e": {
            const width = Math.max(MIN_RESIZE_VISUAL_SIZE_PX, startRect.width + deltaX);
            return {
              scale: `${width / startRect.width} 1`,
              transformOrigin: "left center",
            };
          }
          case "w": {
            const width = Math.max(MIN_RESIZE_VISUAL_SIZE_PX, startRect.width - deltaX);
            return {
              scale: `${width / startRect.width} 1`,
              transformOrigin: "right center",
            };
          }
          case "s": {
            const height = Math.max(MIN_RESIZE_VISUAL_SIZE_PX, startRect.height + deltaY);
            return {
              scale: `1 ${height / startRect.height}`,
              transformOrigin: "center top",
            };
          }
          case "n": {
            const height = Math.max(MIN_RESIZE_VISUAL_SIZE_PX, startRect.height - deltaY);
            return {
              scale: `1 ${height / startRect.height}`,
              transformOrigin: "center bottom",
            };
          }
          default: {
            const exhaustiveCheck: never = edge;
            return exhaustiveCheck;
          }
        }
      }

      function handleMove(moveEvent: PointerEvent) {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        const deltaCols = columnStepPx > 0 ? Math.round(deltaX / columnStepPx) : 0;
        const deltaRows = rowStepPx > 0 ? Math.round(deltaY / rowStepPx) : 0;
        const layout = clampLayout(
          applyResizeDelta(startLayout, edge, deltaCols, deltaRows),
          gridColumns,
        );
        const nextPreview = { layout, valid: canPlace(layout, clips, gridColumns, clip.id) };
        latestPreview = nextPreview;
        setPreview(nextPreview);
        setVisual(getVisualTransform(deltaX, deltaY));
        onPreviewChange(nextPreview);
      }

      function handleUp() {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);

        if (latestPreview?.valid) {
          onResize(latestPreview.layout);
        }

        setPreview(null);
        setVisual(null);
        onPreviewChange(null);
      }

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [clip, clips, gridColumns, columnStepPx, rowStepPx, onResize, onPreviewChange],
  );

  return { preview, visual, handleResizeStart };
}
