import { useEffect } from "react";

/**
 * Closes the inspector on Escape. Callers must pass `active: false` while a
 * hotkey recording is in progress so Escape can cancel that recording
 * instead of closing the whole panel out from under it.
 */
export function useCloseOnEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onClose]);
}
