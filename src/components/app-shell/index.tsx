import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { InspectorToggleButton } from "./components/InspectorToggleButton";
import { LayoutLockButton } from "./components/LayoutLockButton";

const NAV_ITEMS = [
  { to: "/", label: "Soundboard", icon: Home01Icon },
  { to: "/settings", label: "Settings", icon: Settings01Icon },
] as const;

export function AppShell() {
  const { pathname } = useLocation();
  const isCanvasRoute = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              MD
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">MicDrop</p>
              <p className="text-xs text-muted-foreground">Desktop soundboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link key={item.to} to={item.to}>
                  {({ isActive }) => (
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn("gap-1.5", isActive && "shadow-sm")}
                    >
                      <HugeiconsIcon icon={item.icon} className="size-4" />
                      {item.label}
                    </Button>
                  )}
                </Link>
              ))}
            </nav>

            {isCanvasRoute ? (
              <>
                <LayoutLockButton />
                <InspectorToggleButton />
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main
        className={cn(
          "flex-1",
          isCanvasRoute ? "px-4 py-6" : "mx-auto w-full max-w-6xl px-4 py-6",
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
