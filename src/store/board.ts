import { create } from "zustand";

import {
  createClipName,
  createId,
  DEFAULT_CLIP_VOLUME,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_MASTER_VOLUME,
  getDefaultClipColor,
} from "@/lib/board";
import { canPlace, clampLayout, findFirstEmptyCell, MIN_SPAN, migrateLegacyClips } from "@/lib/grid";
import { toTauriHotkey } from "@/lib/hotkeys";
import { loadBoardConfig, saveBoardConfig, syncHotkeys } from "@/lib/tauri";
import type { BoardConfig, Clip, ClipLayout, Theme } from "@/lib/types";

interface BoardState {
  clips: Clip[];
  gridColumns: number;
  masterVolume: number;
  theme: Theme;
  isHydrated: boolean;
  isSaving: boolean;
  /** Clip currently open in the edit inspector. Ephemeral UI state, never persisted. */
  editingClipId: string | null;
  /** Whether the edit inspector sidebar is expanded (vs. hidden off-canvas). */
  inspectorOpen: boolean;
  /** When true, pads cannot be dragged or resized on the grid. Ephemeral UI state. */
  layoutLocked: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  startEditingClip: (clipId: string) => void;
  stopEditingClip: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  toggleLayoutLock: () => void;
  addClipsFromPaths: (filePaths: string[]) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  updateClipLayout: (clipId: string, layout: ClipLayout) => void;
  moveClip: (clipId: string, col: number, row: number) => void;
  duplicateClip: (clipId: string) => void;
  setGridColumns: (columns: number) => void;
  setMasterVolume: (volume: number) => void;
  setTheme: (theme: Theme) => void;
  getConfig: () => BoardConfig;
}

function normalizeClip(clip: Clip): Clip {
  return {
    ...clip,
    hotkey: clip.hotkey ? toTauriHotkey(clip.hotkey) : undefined,
  };
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

async function syncRegisteredHotkeys(clips: Clip[]) {
  await syncHotkeys(
    clips.map((clip) => ({
      clipId: clip.id,
      hotkey: clip.hotkey,
    })),
  );
}

export const useBoardStore = create<BoardState>((set, get) => ({
  clips: [],
  gridColumns: DEFAULT_GRID_COLUMNS,
  masterVolume: DEFAULT_MASTER_VOLUME,
  theme: "dark",
  isHydrated: false,
  isSaving: false,
  editingClipId: null,
  inspectorOpen: true,
  layoutLocked: true,

  getConfig: () => {
    const state = get();
    return {
      clips: state.clips,
      gridColumns: state.gridColumns,
      masterVolume: state.masterVolume,
      theme: state.theme,
    };
  },

  hydrate: async () => {
    const config = await loadBoardConfig();

    if (config) {
      const clips = migrateLegacyClips(config.clips, config.gridColumns).map(normalizeClip);
      set({
        clips,
        gridColumns: config.gridColumns,
        masterVolume: config.masterVolume,
        theme: config.theme,
        isHydrated: true,
      });
      applyTheme(config.theme);
      await syncRegisteredHotkeys(clips);
      return;
    }

    applyTheme("dark");
    set({ isHydrated: true });
  },

  persist: async () => {
    set({ isSaving: true });
    try {
      const config = get().getConfig();
      await saveBoardConfig(config);
      await syncRegisteredHotkeys(config.clips);
    } finally {
      set({ isSaving: false });
    }
  },

  addClipsFromPaths: (filePaths) => {
    const { clips, gridColumns } = get();
    const placed = [...clips];
    const newClips: Clip[] = [];

    filePaths.forEach((filePath, index) => {
      const { col, row } = findFirstEmptyCell(placed, gridColumns);
      const clip: Clip = {
        id: createId(),
        name: createClipName(filePath),
        filePath,
        color: getDefaultClipColor(clips.length + index),
        volume: DEFAULT_CLIP_VOLUME,
        layout: { col, row, colSpan: MIN_SPAN, rowSpan: MIN_SPAN },
      };
      placed.push(clip);
      newClips.push(clip);
    });

    set({ clips: [...clips, ...newClips] });
    void get().persist();
  },

  removeClip: (clipId) => {
    set({ clips: get().clips.filter((clip) => clip.id !== clipId) });
    void get().persist();
  },

  updateClip: (clipId, updates) => {
    const nextUpdates = { ...updates };
    if (nextUpdates.hotkey) {
      nextUpdates.hotkey = toTauriHotkey(nextUpdates.hotkey);
    }

    set({
      clips: get().clips.map((clip) =>
        clip.id === clipId ? { ...clip, ...nextUpdates } : clip,
      ),
    });
    void get().persist();
  },

  updateClipLayout: (clipId, layout) => {
    const { clips, gridColumns } = get();
    const clamped = clampLayout(layout, gridColumns);
    if (!canPlace(clamped, clips, gridColumns, clipId)) {
      return;
    }

    set({
      clips: clips.map((clip) => (clip.id === clipId ? { ...clip, layout: clamped } : clip)),
    });
    void get().persist();
  },

  moveClip: (clipId, col, row) => {
    const clip = get().clips.find((item) => item.id === clipId);
    if (!clip) {
      return;
    }
    get().updateClipLayout(clipId, { ...clip.layout, col, row });
  },

  duplicateClip: (clipId) => {
    const { clips, gridColumns } = get();
    const clip = clips.find((item) => item.id === clipId);
    if (!clip) {
      return;
    }

    const { col, row } = findFirstEmptyCell(clips, gridColumns);
    const duplicate: Clip = {
      ...clip,
      id: createId(),
      name: `${clip.name} Copy`,
      hotkey: undefined,
      layout: { col, row, colSpan: MIN_SPAN, rowSpan: MIN_SPAN },
    };

    set({ clips: [...clips, duplicate] });
    void get().persist();
  },

  setGridColumns: (columns) => {
    const clips = get().clips.map((clip) => ({
      ...clip,
      layout: clampLayout(clip.layout, columns),
    }));
    set({ gridColumns: columns, clips });
    void get().persist();
  },

  setMasterVolume: (volume) => {
    set({ masterVolume: volume });
    void get().persist();
  },

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
    void get().persist();
  },

  startEditingClip: (clipId) => {
    set({ editingClipId: clipId, inspectorOpen: true });
  },

  stopEditingClip: () => {
    set({ editingClipId: null, inspectorOpen: true });
  },

  setInspectorOpen: (open) => {
    set({ inspectorOpen: open });
  },

  toggleInspector: () => {
    set((state) => ({ inspectorOpen: !state.inspectorOpen }));
  },

  toggleLayoutLock: () => {
    set((state) => ({ layoutLocked: !state.layoutLocked }));
  },
}));
