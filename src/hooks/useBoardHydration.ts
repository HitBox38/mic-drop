import { useEffect } from "react";

import { useAudioRoutingStore } from "@/store/audio-routing";
import { useBoardStore } from "@/store/board";

export function useBoardHydration() {
  const hydrate = useBoardStore((state) => state.hydrate);
  const isHydrated = useBoardStore((state) => state.isHydrated);
  const hydrateAudioRouting = useAudioRoutingStore((state) => state.hydrate);
  const isAudioRoutingHydrated = useAudioRoutingStore((state) => state.isHydrated);

  useEffect(() => {
    void (async () => {
      await hydrate();
      await hydrateAudioRouting();
    })();
  }, [hydrate, hydrateAudioRouting]);

  return isHydrated && isAudioRoutingHydrated;
}
