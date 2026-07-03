// Keyed by min(colSpan, rowSpan) so a pad only scales up once it grows in
// both directions, not just because it's a wide 1-row strip.
export const PAD_ICON_SCALE_CLASS: Record<number, string> = {
  1: "text-2xl",
  2: "text-4xl",
  3: "text-5xl",
  4: "text-6xl",
};

export const PAD_NAME_SCALE_CLASS: Record<number, string> = {
  1: "text-sm",
  2: "text-base",
  3: "text-lg",
  4: "text-xl",
};

// Foreground treatment per contrast role (see lib/color.ts). Pad colors are
// assigned round-robin and range from near-black indigo to bright yellow, so
// text/icon/overlay colors can't be hardcoded to a single shade.
export const PAD_FOREGROUND_CLASS: Record<"light" | "dark", { text: string; overlay: string }> = {
  light: {
    text: "text-white drop-shadow-sm",
    overlay: "bg-black/25 text-white hover:bg-black/40",
  },
  dark: {
    text: "text-neutral-900",
    overlay: "bg-white/40 text-neutral-900 hover:bg-white/60",
  },
};
