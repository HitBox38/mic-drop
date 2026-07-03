import { useEffect } from "react";

import { initClipHotkeyListener } from "@/lib/playback";

export function useGlobalHotkeys() {
  useEffect(() => {
    initClipHotkeyListener();
  }, []);
}
