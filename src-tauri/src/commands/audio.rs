use tauri::{AppHandle, Runtime, State};
use tauri_plugin_store::StoreExt;

use crate::audio::devices;
use crate::audio::engine::{
    decode_clip_for_engine, AudioEngineState, AudioRoutingConfig, MonitorMode,
};
use crate::audio::{AudioDevices, VirtualCableStatus};

const STORE_PATH: &str = "audio-routing.json";
const ROUTING_KEY: &str = "routing";

#[tauri::command]
pub async fn list_audio_devices() -> Result<AudioDevices, String> {
    devices::list_audio_devices()
}

#[tauri::command]
pub async fn detect_virtual_cable() -> Result<VirtualCableStatus, String> {
    devices::detect_virtual_cable()
}

#[tauri::command]
pub async fn load_audio_routing_config<R: Runtime>(
    app: AppHandle<R>,
) -> Result<AudioRoutingConfig, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let config = store
        .get(ROUTING_KEY)
        .and_then(|value| serde_json::from_value(value).ok())
        .unwrap_or_default();

    Ok(config)
}

#[tauri::command]
pub async fn save_audio_routing_config<R: Runtime>(
    app: AppHandle<R>,
    config: AudioRoutingConfig,
) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let value = serde_json::to_value(config).map_err(|e| e.to_string())?;

    store.set(ROUTING_KEY, value);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn start_audio_engine<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, AudioEngineState>,
    config: AudioRoutingConfig,
    master_volume: u8,
) -> Result<(), String> {
    state.start(app, config, master_volume)
}

#[tauri::command]
pub async fn stop_audio_engine(state: State<'_, AudioEngineState>) -> Result<(), String> {
    state.stop();
    Ok(())
}

#[tauri::command]
pub async fn play_clip_routed(
    state: State<'_, AudioEngineState>,
    clip_id: String,
    file_path: String,
    clip_volume: u8,
) -> Result<(), String> {
    let decoded = decode_clip_for_engine(file_path).await?;
    state.play_clip(clip_id, decoded, clip_volume)
}

#[tauri::command]
pub async fn stop_all_routed(state: State<'_, AudioEngineState>) -> Result<(), String> {
    state.stop_all();
    Ok(())
}

#[tauri::command]
pub async fn set_routing_volumes(
    state: State<'_, AudioEngineState>,
    master_volume: u8,
    mic_volume: u8,
    mic_muted: bool,
) -> Result<(), String> {
    state.set_volumes(master_volume, mic_volume, mic_muted);
    Ok(())
}

#[tauri::command]
pub async fn set_monitor_mode(
    state: State<'_, AudioEngineState>,
    monitor_mode: MonitorMode,
) -> Result<(), String> {
    state.set_monitor_mode(monitor_mode);
    Ok(())
}
