import { describe, expect, it } from "vitest";

import {
  applyResizeDelta,
  canPlace,
  clampLayout,
  findFirstEmptyCell,
  MAX_SPAN,
  migrateLegacyClips,
} from "./grid";
import type { Clip, ClipLayout } from "./types";

function makeClip(id: string, layout: ClipLayout): Clip {
  return {
    id,
    name: id,
    filePath: `/${id}.mp3`,
    color: "#000000",
    volume: 100,
    layout,
  };
}

describe("canPlace", () => {
  it("allows a layout that fits within bounds and does not overlap", () => {
    const clips = [makeClip("a", { col: 1, row: 1, colSpan: 1, rowSpan: 1 })];
    expect(canPlace({ col: 2, row: 1, colSpan: 1, rowSpan: 1 }, clips, 4)).toBe(true);
  });

  it("rejects a layout that overflows the grid width", () => {
    const clips: Clip[] = [];
    expect(canPlace({ col: 4, row: 1, colSpan: 2, rowSpan: 1 }, clips, 4)).toBe(false);
  });

  it("rejects a layout that overlaps another clip", () => {
    const clips = [makeClip("a", { col: 1, row: 1, colSpan: 2, rowSpan: 2 })];
    expect(canPlace({ col: 2, row: 2, colSpan: 1, rowSpan: 1 }, clips, 4)).toBe(false);
  });

  it("ignores the excluded clip when checking overlap", () => {
    const clips = [makeClip("a", { col: 1, row: 1, colSpan: 2, rowSpan: 2 })];
    expect(canPlace({ col: 1, row: 1, colSpan: 2, rowSpan: 2 }, clips, 4, "a")).toBe(true);
  });
});

describe("clampLayout", () => {
  it("clamps spans to MAX_SPAN and the grid width", () => {
    const clamped = clampLayout({ col: 1, row: 1, colSpan: 10, rowSpan: 10 }, 3);
    expect(clamped.colSpan).toBe(3);
    expect(clamped.rowSpan).toBe(MAX_SPAN);
  });

  it("pulls the column start back so the span still fits", () => {
    const clamped = clampLayout({ col: 4, row: 1, colSpan: 2, rowSpan: 1 }, 4);
    expect(clamped.col).toBe(3);
  });

  it("never lets col or row drop below 1", () => {
    const clamped = clampLayout({ col: -2, row: -5, colSpan: 1, rowSpan: 1 }, 4);
    expect(clamped.col).toBe(1);
    expect(clamped.row).toBe(1);
  });
});

describe("findFirstEmptyCell", () => {
  it("returns the top-left cell on an empty board", () => {
    expect(findFirstEmptyCell([], 4)).toEqual({ col: 1, row: 1 });
  });

  it("skips occupied cells before landing on a free one", () => {
    const clips = [makeClip("a", { col: 1, row: 1, colSpan: 1, rowSpan: 1 })];
    expect(findFirstEmptyCell(clips, 4)).toEqual({ col: 2, row: 1 });
  });

  it("wraps to the next row once the current row is full", () => {
    const clips = [
      makeClip("a", { col: 1, row: 1, colSpan: 1, rowSpan: 1 }),
      makeClip("b", { col: 2, row: 1, colSpan: 1, rowSpan: 1 }),
    ];
    expect(findFirstEmptyCell(clips, 2)).toEqual({ col: 1, row: 2 });
  });
});

describe("migrateLegacyClips", () => {
  it("leaves clips that already have a layout untouched", () => {
    const layout: ClipLayout = { col: 2, row: 3, colSpan: 1, rowSpan: 1 };
    const [migrated] = migrateLegacyClips([makeClip("a", layout)], 4);
    expect(migrated.layout).toEqual(layout);
  });

  it("assigns sequential 1x1 positions to clips missing a layout", () => {
    const legacyClips = [
      { ...makeClip("a", { col: 0, row: 0, colSpan: 0, rowSpan: 0 }), layout: undefined },
      { ...makeClip("b", { col: 0, row: 0, colSpan: 0, rowSpan: 0 }), layout: undefined },
    ] as unknown as Clip[];

    const migrated = migrateLegacyClips(legacyClips, 4);

    expect(migrated[0].layout).toEqual({ col: 1, row: 1, colSpan: 1, rowSpan: 1 });
    expect(migrated[1].layout).toEqual({ col: 2, row: 1, colSpan: 1, rowSpan: 1 });
  });
});

describe("applyResizeDelta", () => {
  const layout: ClipLayout = { col: 2, row: 2, colSpan: 2, rowSpan: 2 };

  it("grows east by extending colSpan", () => {
    expect(applyResizeDelta(layout, "e", 1, 0)).toEqual({ ...layout, colSpan: 3 });
  });

  it("grows west by moving col back and extending colSpan", () => {
    expect(applyResizeDelta(layout, "w", -1, 0)).toEqual({ ...layout, col: 1, colSpan: 3 });
  });

  it("grows south by extending rowSpan", () => {
    expect(applyResizeDelta(layout, "s", 0, 1)).toEqual({ ...layout, rowSpan: 3 });
  });

  it("grows north by moving row back and extending rowSpan", () => {
    expect(applyResizeDelta(layout, "n", 0, -1)).toEqual({ ...layout, row: 1, rowSpan: 3 });
  });
});
