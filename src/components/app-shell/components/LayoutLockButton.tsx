import { HugeiconsIcon } from "@hugeicons/react";
import { SquareLock02Icon, SquareUnlock02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBoardStore } from "@/store/board";

/**
 * Toggles whether pads on the soundboard grid can be repositioned.
 * Pinned in the top bar next to the edit-inspector toggle.
 */
export function LayoutLockButton() {
  const layoutLocked = useBoardStore((state) => state.layoutLocked);
  const toggleLayoutLock = useBoardStore((state) => state.toggleLayoutLock);

  return (
    <>
      <Separator orientation="vertical" className="h-5" />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={layoutLocked ? "Unlock layout to reposition pads" : "Lock layout"}
        aria-pressed={layoutLocked}
        title={layoutLocked ? "Unlock layout to reposition pads" : "Lock layout"}
        onClick={toggleLayoutLock}
      >
        <HugeiconsIcon
          icon={layoutLocked ? SquareLock02Icon : SquareUnlock02Icon}
          strokeWidth={2}
        />
      </Button>
    </>
  );
}
