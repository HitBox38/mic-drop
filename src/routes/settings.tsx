import { createFileRoute } from "@tanstack/react-router";

import { AudioSettings } from "@/components/audio-settings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBoardStore } from "@/store/board";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const theme = useBoardStore((state) => state.theme);
  const setTheme = useBoardStore((state) => state.setTheme);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure appearance, call routing, and microphone mixing.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border bg-card/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="dark-mode">Dark mode</Label>
            <p className="text-sm text-muted-foreground">
              Toggle between dark and light themes.
            </p>
          </div>
          <Switch
            id="dark-mode"
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>
      </section>

      <AudioSettings />
    </div>
  );
}
