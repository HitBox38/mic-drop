import { HugeiconsIcon } from "@hugeicons/react";
import { MusicNote03Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";

interface Props {
  onAddSound: () => void;
}

export function EmptyState({ onAddSound }: Props) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <HugeiconsIcon icon={MusicNote03Icon} className="size-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Your soundboard is empty</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add a sound to place your first pad, then resize and arrange pads to build
          your board.
        </p>
      </div>
      <Button onClick={onAddSound}>Add your first sound</Button>
    </div>
  );
}
