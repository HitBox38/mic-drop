import type { CSSProperties, ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Fixed, non-modal bottom panel for narrow viewports. It never grows past
 * ~55% of the viewport height, so the pad being edited stays visible (and
 * draggable/resizable) in the space above it.
 */
export function MobileInspectorPanel({ onClose, children }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex max-h-[55dvh] flex-col overflow-hidden rounded-t-2xl border-t bg-popover shadow-lg">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-base font-medium">Edit sound</h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
        style={{ "--inspector-surface": "var(--popover)" } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
