import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { formatHotkeyLabel } from "@/lib/hotkeys";
import { cn } from "@/lib/utils";

import { COLOR_OPTIONS, EMOJI_OPTIONS } from "../constants";
import type { useClipEditForm } from "../hooks/useClipEditForm";

type ClipEditForm = ReturnType<typeof useClipEditForm>;

export interface Props {
  form: ClipEditForm["form"];
  recorder: ClipEditForm["recorder"];
  hotkeyError: ClipEditForm["hotkeyError"];
  setHotkeyError: ClipEditForm["setHotkeyError"];
  onCancel: () => void;
}

export function InspectorForm({ form, recorder, hotkeyError, setHotkeyError, onCancel }: Props) {
  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor="clip-name">Name</Label>
            <Input
              id="clip-name"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="icon">
        {(field) => (
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={field.state.value === emoji}
                  aria-label={`Icon ${emoji}`}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg border text-lg",
                    field.state.value === emoji && "border-primary ring-2 ring-primary/30",
                  )}
                  onClick={() => field.handleChange(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="color">
        {(field) => (
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-pressed={field.state.value === color}
                  aria-label={`Color ${color}`}
                  className={cn(
                    "size-8 rounded-full border-2 border-transparent",
                    field.state.value === color && "border-foreground",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => field.handleChange(color)}
                />
              ))}
            </div>
          </div>
        )}
      </form.Field>

      <form.Field name="volume">
        {(field) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Volume</Label>
              <span className="text-xs text-muted-foreground">{field.state.value}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              value={[field.state.value]}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value;
                field.handleChange(next ?? 0);
              }}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="hotkey">
        {(field) => (
          <div className="space-y-2">
            <Label>Global hotkey</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={
                  field.state.value ? formatHotkeyLabel(field.state.value) : "No hotkey assigned"
                }
              />
              <Button type="button" variant="outline" onClick={recorder.startRecording}>
                {recorder.isRecording ? "Press keys…" : "Record"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  field.handleChange("");
                  setHotkeyError(null);
                }}
              >
                Clear
              </Button>
            </div>
            {hotkeyError ? <p className="text-xs text-destructive">{hotkeyError}</p> : null}
          </div>
        )}
      </form.Field>

      <Separator />

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 bg-[var(--inspector-surface)] px-4 pt-1 pb-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
