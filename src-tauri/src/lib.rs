mod audio;
mod commands;

use audio::AudioEngineState;
use commands::shortcuts::HotkeyState;
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::ShortcutState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .manage(HotkeyState::new())
        .manage(AudioEngineState::new())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }

                    let state = app.state::<HotkeyState>();
                    let mappings = state.clip_by_shortcut_id.lock().unwrap();

                    if let Some(clip_id) = mappings.get(&shortcut.id()) {
                        let _ = app.emit("clip-hotkey", clip_id.clone());
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_opener::init());

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(tauri_plugin_mcp_bridge::init());
    }

    builder
        .invoke_handler(tauri::generate_handler![
            commands::dialog::pick_audio_files,
            commands::audio::list_audio_devices,
            commands::audio::detect_virtual_cable,
            commands::audio::load_audio_routing_config,
            commands::audio::save_audio_routing_config,
            commands::audio::start_audio_engine,
            commands::audio::stop_audio_engine,
            commands::audio::play_clip_routed,
            commands::audio::stop_all_routed,
            commands::audio::set_routing_volumes,
            commands::audio::set_monitor_mode,
            commands::store::load_board_config,
            commands::store::save_board_config,
            commands::shortcuts::sync_hotkeys,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
