const MODIFIER_MAP: Record<string, string> = {
  Mod: "CommandOrControl",
  Meta: "CommandOrControl",
  Control: "Control",
  Ctrl: "Control",
  Alt: "Alt",
  Shift: "Shift",
  Command: "Command",
  Cmd: "Command",
};

export function toTauriHotkey(hotkey: string): string {
  return hotkey
    .split("+")
    .map((part) => MODIFIER_MAP[part] ?? part)
    .join("+");
}

export function formatHotkeyLabel(hotkey: string): string {
  const isMac = navigator.platform.toLowerCase().includes("mac");

  return hotkey
    .split("+")
    .map((part) => {
      if (part === "Mod" || part === "CommandOrControl" || part === "CmdOrCtrl") {
        return isMac ? "⌘" : "Ctrl";
      }
      if (part === "Control" || part === "Ctrl") {
        return isMac ? "⌃" : "Ctrl";
      }
      if (part === "Alt" || part === "Option") {
        return isMac ? "⌥" : "Alt";
      }
      if (part === "Shift") {
        return isMac ? "⇧" : "Shift";
      }
      if (part === "Meta" || part === "Command" || part === "Cmd") {
        return "⌘";
      }
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join(isMac ? "" : "+");
}

export function hotkeysConflict(
  hotkey: string | undefined,
  clipId: string,
  clips: Array<{ id: string; hotkey?: string }>,
): boolean {
  if (!hotkey) {
    return false;
  }

  const normalized = toTauriHotkey(hotkey);
  return clips.some(
    (clip) => clip.id !== clipId && clip.hotkey && toTauriHotkey(clip.hotkey) === normalized,
  );
}
