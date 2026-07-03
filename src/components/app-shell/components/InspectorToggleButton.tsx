import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarRight01Icon, SidebarRightIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBoardStore } from "@/store/board";

/**
 * Toggles the edit inspector sidebar, pinned in the top bar next to the
 * nav rather than floating over the canvas, so it never moves or
 * disappears regardless of whether the panel itself is open or hidden.
 * Only renders while a pad is actually being edited.
 */
export function InspectorToggleButton() {
  const editingClipId = useBoardStore((state) => state.editingClipId);
  const inspectorOpen = useBoardStore((state) => state.inspectorOpen);
  const toggleInspector = useBoardStore((state) => state.toggleInspector);

  if (!editingClipId) {
    return null;
  }

  return (
    <>
      <Separator orientation="vertical" className="h-5" />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={inspectorOpen ? "Hide edit panel" : "Show edit panel"}
        aria-pressed={inspectorOpen}
        title={inspectorOpen ? "Hide edit panel" : "Show edit panel"}
        onClick={toggleInspector}
      >
        <HugeiconsIcon icon={inspectorOpen ? SidebarRight01Icon : SidebarRightIcon} strokeWidth={2} />
      </Button>
    </>
  );
}
