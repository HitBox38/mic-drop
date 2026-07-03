import type { Clip } from "@/lib/types";

export interface Props {
  clip: Clip | null;
  open: boolean;
  onClose: () => void;
  onSave: (clipId: string, updates: Partial<Clip>) => void;
  existingClips: Clip[];
}
