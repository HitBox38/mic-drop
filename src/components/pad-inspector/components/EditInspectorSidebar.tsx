import type { CSSProperties, ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { Clip } from "@/lib/types";

interface Props {
  clip: Clip;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Docked, non-modal inspector rail built on shadcn's Sidebar primitive. It
 * collapses fully off-canvas (rather than to an icon rail) so hiding it
 * hands the whole width back to the grid for resizing, while edit mode
 * itself stays active until Close/Cancel/Save/Escape. Visibility is toggled
 * from the persistent `InspectorToggleButton` in the top bar, not from a
 * control inside the panel itself.
 */
export function EditInspectorSidebar({ clip, onClose, children }: Props) {
  return (
    <Sidebar side="right" collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="flex-row items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: clip.color }}
            aria-hidden="true"
          />
          <h2 className="truncate text-sm font-medium">{clip.name}</h2>
        </div>

        <Button variant="ghost" size="icon-sm" className="shrink-0" onClick={onClose}>
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          <span className="sr-only">Close edit panel</span>
        </Button>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent
        className="overflow-y-auto overscroll-contain px-4 py-4"
        style={{ "--inspector-surface": "var(--sidebar)" } as CSSProperties}
      >
        {children}
      </SidebarContent>
    </Sidebar>
  );
}
