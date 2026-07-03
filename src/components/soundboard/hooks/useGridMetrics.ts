import { useEffect, useState, type RefObject } from "react";

import { GRID_GAP_PX, GRID_ROW_HEIGHT_PX } from "@/lib/grid";

interface GridMetrics {
  columnStepPx: number;
  rowStepPx: number;
}

/** Ignore sub-pixel churn that would otherwise re-render every pad each frame. */
const COLUMN_STEP_EPSILON_PX = 0.5;

export function useGridMetrics(
  containerRef: RefObject<HTMLElement | null>,
  gridColumns: number,
): GridMetrics {
  const [columnStepPx, setColumnStepPx] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateColumnStep = () => {
      const width = element.getBoundingClientRect().width;
      const next = (width + GRID_GAP_PX) / gridColumns;
      setColumnStepPx((previous) =>
        Math.abs(previous - next) < COLUMN_STEP_EPSILON_PX ? previous : next,
      );
    };

    updateColumnStep();

    const observer = new ResizeObserver(updateColumnStep);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, gridColumns]);

  return { columnStepPx, rowStepPx: GRID_ROW_HEIGHT_PX + GRID_GAP_PX };
}
