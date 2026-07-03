import { useMediaQuery } from "@/hooks/useMediaQuery";

import { EditInspectorSidebar } from "./components/EditInspectorSidebar";
import { InspectorForm } from "./components/InspectorForm";
import { MobileInspectorPanel } from "./components/MobileInspectorPanel";
import { useClipEditForm } from "./hooks/useClipEditForm";
import { useCloseOnEscape } from "./hooks/useCloseOnEscape";
import type { Props } from "./types";

/**
 * Non-modal, docked properties panel for the selected pad — deliberately
 * not a dialog. A modal sheet here would `inert` the rest of the page while
 * open, which blocked both dragging/resizing the pad being edited and
 * navigating away via the header. This panel never traps focus or blocks
 * pointer input on the grid, so direct manipulation and field editing can
 * happen at the same time.
 *
 * On wide viewports, "hidden" and "edit mode" are separate: hiding the
 * sidebar (via the toggle in the top bar) frees the full grid width for
 * resizing but keeps the pad selected.
 */
export function PadInspector({ clip, open, onClose, onSave, existingClips }: Props) {
  const isWideViewport = useMediaQuery("(min-width: 1024px)");
  const { form, recorder, hotkeyError, setHotkeyError } = useClipEditForm(
    clip,
    existingClips,
    onSave,
    onClose,
  );

  const isOpen = open && clip !== null;
  useCloseOnEscape(isOpen && !recorder.isRecording, onClose);

  if (!isOpen) {
    return null;
  }

  const formNode = (
    <InspectorForm
      form={form}
      recorder={recorder}
      hotkeyError={hotkeyError}
      setHotkeyError={setHotkeyError}
      onCancel={onClose}
    />
  );

  if (isWideViewport) {
    return (
      <EditInspectorSidebar clip={clip} onClose={onClose}>
        {formNode}
      </EditInspectorSidebar>
    );
  }

  return <MobileInspectorPanel onClose={onClose}>{formNode}</MobileInspectorPanel>;
}
