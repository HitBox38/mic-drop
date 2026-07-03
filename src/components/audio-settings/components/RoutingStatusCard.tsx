import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { RoutingStatusProps } from "../types";

interface Props extends RoutingStatusProps {}

function statusBadge(installed: boolean, driverInstalled: boolean) {
  if (installed) {
    return { variant: "default" as const, label: "Detected" };
  }
  if (driverInstalled) {
    return { variant: "secondary" as const, label: "Restart required" };
  }
  return { variant: "destructive" as const, label: "Not detected" };
}

export function RoutingStatusCard({
  installed,
  driverInstalled,
  label,
  guidance,
  installUrl,
  onRefresh,
  isRefreshing,
}: Props) {
  const badge = statusBadge(installed, driverInstalled);

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-medium">Virtual cable</h3>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {installed && label ? `Using ${label}.` : guidance}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
        {!installed && !driverInstalled ? (
          <a
            href={installUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Install
          </a>
        ) : null}
      </div>
    </div>
  );
}
