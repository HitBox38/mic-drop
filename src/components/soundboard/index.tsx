import { useCallback, type CSSProperties } from "react";

import { PadInspector } from "@/components/pad-inspector";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { playClipById, stopAllPlayback } from "@/lib/playback";
import { pickAudioFiles } from "@/lib/tauri";
import { useAudioRoutingStore } from "@/store/audio-routing";
import { useBoardStore } from "@/store/board";

import { SoundboardGrid } from "./components/SoundboardGrid";
import { SoundboardToolbar } from "./components/SoundboardToolbar";

const INSPECTOR_WIDTH = "20rem";

export function Soundboard() {
  const clips = useBoardStore((state) => state.clips);
  const gridColumns = useBoardStore((state) => state.gridColumns);
  const masterVolume = useBoardStore((state) => state.masterVolume);
  const addClipsFromPaths = useBoardStore((state) => state.addClipsFromPaths);
  const removeClip = useBoardStore((state) => state.removeClip);
  const updateClip = useBoardStore((state) => state.updateClip);
  const updateClipLayout = useBoardStore((state) => state.updateClipLayout);
  const moveClip = useBoardStore((state) => state.moveClip);
  const duplicateClip = useBoardStore((state) => state.duplicateClip);
  const setGridColumns = useBoardStore((state) => state.setGridColumns);
  const setMasterVolume = useBoardStore((state) => state.setMasterVolume);
  const editingClipId = useBoardStore((state) => state.editingClipId);
  const inspectorOpen = useBoardStore((state) => state.inspectorOpen);
  const startEditingClip = useBoardStore((state) => state.startEditingClip);
  const stopEditingClip = useBoardStore((state) => state.stopEditingClip);
  const setInspectorOpen = useBoardStore((state) => state.setInspectorOpen);
  const layoutLocked = useBoardStore((state) => state.layoutLocked);
  const routingConfig = useAudioRoutingStore((state) => state.config);
  const routingRunning = useAudioRoutingStore((state) => state.isEngineRunning);
  const virtualCable = useAudioRoutingStore((state) => state.virtualCable);
  const syncRoutingVolumes = useAudioRoutingStore((state) => state.syncVolumesFromBoard);

  const editingClip = clips.find((clip) => clip.id === editingClipId) ?? null;
  const routingStatus = routingConfig.enabled
    ? {
        label: routingRunning
          ? `Routing to ${virtualCable?.label ?? "virtual mic"}`
          : "Routing needs attention",
        tone: routingRunning ? ("active" as const) : ("warning" as const),
      }
    : null;

  const handleAddSound = useCallback(async () => {
    const paths = await pickAudioFiles();
    if (paths.length > 0) {
      addClipsFromPaths(paths);
    }
  }, [addClipsFromPaths]);

  const handlePlay = useCallback((clipId: string) => {
    playClipById(clipId);
  }, []);

  const handleMasterVolumeChange = useCallback(
    (volume: number) => {
      setMasterVolume(volume);
      void syncRoutingVolumes(volume);
    },
    [setMasterVolume, syncRoutingVolumes],
  );

  return (
    <SidebarProvider
      open={inspectorOpen}
      onOpenChange={setInspectorOpen}
      style={{ "--sidebar-width": INSPECTOR_WIDTH } as CSSProperties}
      className="min-h-0 w-full overflow-x-clip"
    >
      <SidebarInset className="min-w-0 gap-4 bg-transparent">
        <SoundboardToolbar
          masterVolume={masterVolume}
          gridColumns={gridColumns}
          routingStatus={routingStatus}
          onAddSound={() => void handleAddSound()}
          onStopAll={stopAllPlayback}
          onMasterVolumeChange={handleMasterVolumeChange}
          onGridColumnsChange={setGridColumns}
        />

        <SoundboardGrid
          clips={clips}
          gridColumns={gridColumns}
          selectedClipId={editingClipId}
          layoutLocked={layoutLocked}
          onAddSound={() => void handleAddSound()}
          onPlay={handlePlay}
          onEdit={startEditingClip}
          onDeselect={stopEditingClip}
          onDuplicate={duplicateClip}
          onDelete={removeClip}
          onLayoutChange={updateClipLayout}
          onMove={moveClip}
        />
      </SidebarInset>

      <PadInspector
        clip={editingClip}
        open={editingClipId !== null}
        onClose={stopEditingClip}
        onSave={updateClip}
        existingClips={clips}
      />
    </SidebarProvider>
  );
}
