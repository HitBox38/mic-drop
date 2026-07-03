import { createRootRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBoardHydration } from "@/hooks/useBoardHydration";
import { useGlobalHotkeys } from "@/hooks/useGlobalHotkeys";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const isHydrated = useBoardHydration();
  useGlobalHotkeys();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading MicDrop…
      </div>
    );
  }

  return (
    <TooltipProvider>
      <AppShell />
    </TooltipProvider>
  );
}
