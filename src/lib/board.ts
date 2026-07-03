export const PAD_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
] as const;

export const DEFAULT_GRID_COLUMNS = 4;
export const DEFAULT_MASTER_VOLUME = 100;
export const DEFAULT_CLIP_VOLUME = 100;
export const MIN_GRID_COLUMNS = 2;
export const MAX_GRID_COLUMNS = 8;

export function getDefaultClipColor(index: number): string {
  return PAD_COLORS[index % PAD_COLORS.length];
}

export function createClipName(filePath: string): string {
  const fileName = filePath.split(/[/\\]/).pop() ?? "Sound";
  return fileName.replace(/\.[^.]+$/, "");
}

export function createId(): string {
  return crypto.randomUUID();
}
