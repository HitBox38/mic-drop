import { MAX_GRID_COLUMNS, MIN_GRID_COLUMNS } from "@/lib/board";

export const GRID_COLUMN_OPTIONS = Array.from(
  { length: MAX_GRID_COLUMNS - MIN_GRID_COLUMNS + 1 },
  (_, index) => index + MIN_GRID_COLUMNS,
);
