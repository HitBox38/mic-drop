import type { ResizeEdge } from "@/lib/grid";
import { cn } from "@/lib/utils";

interface Props {
  onResizeStart: (edge: ResizeEdge, event: React.PointerEvent) => void;
}

const HANDLES: Array<{ edge: ResizeEdge; hitAreaClassName: string; gripClassName: string }> = [
  {
    edge: "n",
    hitAreaClassName: "inset-x-0 top-0 h-3 cursor-ns-resize",
    gripClassName: "left-1/2 top-0 h-1 w-6 -translate-x-1/2",
  },
  {
    edge: "s",
    hitAreaClassName: "inset-x-0 bottom-0 h-3 cursor-ns-resize",
    gripClassName: "left-1/2 bottom-0 h-1 w-6 -translate-x-1/2",
  },
  {
    edge: "e",
    hitAreaClassName: "inset-y-0 right-0 w-3 cursor-ew-resize",
    gripClassName: "top-1/2 right-0 h-6 w-1 -translate-y-1/2",
  },
  {
    edge: "w",
    hitAreaClassName: "inset-y-0 left-0 w-3 cursor-ew-resize",
    gripClassName: "top-1/2 left-0 h-6 w-1 -translate-y-1/2",
  },
];

export function ResizeHandles({ onResizeStart }: Props) {
  return (
    <>
      {HANDLES.map(({ edge, hitAreaClassName, gripClassName }) => (
        <div
          key={edge}
          className={cn("absolute z-30 touch-none", hitAreaClassName)}
          onPointerDown={(event) => onResizeStart(edge, event)}
          onClick={(event) => event.stopPropagation()}
        >
          <span
            className={cn(
              "pointer-events-none absolute rounded-full bg-white/80 shadow-sm",
              gripClassName,
            )}
          />
        </div>
      ))}
    </>
  );
}
