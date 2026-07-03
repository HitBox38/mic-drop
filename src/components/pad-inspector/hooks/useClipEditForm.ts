import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useHotkeyRecorder } from "@tanstack/react-hotkeys";

import { hotkeysConflict } from "@/lib/hotkeys";
import type { Clip } from "@/lib/types";

interface FormValues {
  name: string;
  color: string;
  icon: string;
  volume: number;
  hotkey: string;
}

function toFormValues(clip: Clip): FormValues {
  return {
    name: clip.name,
    color: clip.color,
    icon: clip.icon ?? "🔊",
    volume: clip.volume,
    hotkey: clip.hotkey ?? "",
  };
}

export function useClipEditForm(
  clip: Clip | null,
  existingClips: Clip[],
  onSave: (clipId: string, updates: Partial<Clip>) => void,
  onClose: () => void,
) {
  const [hotkeyError, setHotkeyError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: toFormValues(
      clip ?? {
        id: "",
        name: "",
        filePath: "",
        color: "#6366f1",
        volume: 100,
        layout: { col: 1, row: 1, colSpan: 1, rowSpan: 1 },
      },
    ),
    onSubmit: ({ value }) => {
      if (!clip) {
        return;
      }

      const nextHotkey = value.hotkey.trim() || undefined;
      if (hotkeysConflict(nextHotkey, clip.id, existingClips)) {
        setHotkeyError("That hotkey is already assigned to another pad.");
        return;
      }

      onSave(clip.id, {
        name: value.name.trim() || clip.name,
        color: value.color,
        icon: value.icon,
        volume: value.volume,
        hotkey: nextHotkey,
      });
      onClose();
    },
  });

  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => {
      form.setFieldValue("hotkey", hotkey);
      setHotkeyError(null);
    },
  });

  useEffect(() => {
    if (!clip) {
      return;
    }
    form.reset(toFormValues(clip));
    setHotkeyError(null);
    // Reset only when switching clips, not when the form controller identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clip.id
  }, [clip?.id]);

  return { form, recorder, hotkeyError, setHotkeyError };
}
