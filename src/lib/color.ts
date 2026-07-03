/**
 * Picks a readable foreground color for text/icons placed on an arbitrary
 * background color, per WCAG's relative luminance formula. Needed because
 * pad colors are assigned round-robin (`getDefaultClipColor`) and range from
 * near-black indigo to bright yellow, so a single hardcoded `text-white`
 * fails contrast on the lighter end of the palette.
 */

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function expandShorthandHex(hex: string): string {
  if (hex.length !== 4) {
    return hex;
  }
  const [, r, g, b] = hex;
  return `#${r}${r}${g}${g}${b}${b}`;
}

function hexToRgb(hex: string): [number, number, number] | null {
  if (!HEX_COLOR_PATTERN.test(hex)) {
    return null;
  }
  const normalized = expandShorthandHex(hex);
  const value = Number.parseInt(normalized.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function toLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Returns "light" or "dark" foreground role for the given background hex,
 * choosing whichever gives the higher WCAG contrast ratio.
 */
export function getContrastForeground(backgroundHex: string): "light" | "dark" {
  const rgb = hexToRgb(backgroundHex);
  if (!rgb) {
    return "light";
  }

  const backgroundLuminance = relativeLuminance(rgb);
  const contrastWithWhite = 1.05 / (backgroundLuminance + 0.05);
  const contrastWithBlack = (backgroundLuminance + 0.05) / 0.05;

  return contrastWithWhite >= contrastWithBlack ? "light" : "dark";
}
