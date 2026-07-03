use std::collections::HashMap;
use std::sync::Mutex;

use serde::Deserialize;
use tauri::{AppHandle, Runtime, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

pub struct HotkeyState {
    pub clip_by_shortcut_id: Mutex<HashMap<u32, String>>,
}

impl HotkeyState {
    pub fn new() -> Self {
        Self {
            clip_by_shortcut_id: Mutex::new(HashMap::new()),
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HotkeyBinding {
    pub clip_id: String,
    pub hotkey: Option<String>,
}

#[tauri::command]
pub async fn sync_hotkeys<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, HotkeyState>,
    bindings: Vec<HotkeyBinding>,
) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| e.to_string())?;

    let mut clip_by_shortcut_id = HashMap::new();

    for binding in bindings {
        let Some(hotkey) = binding.hotkey else {
            continue;
        };

        if hotkey.trim().is_empty() {
            continue;
        }

        let shortcut = hotkey.parse::<Shortcut>().map_err(|e| e.to_string())?;
        let shortcut_id = shortcut.id();

        clip_by_shortcut_id.insert(shortcut_id, binding.clip_id);

        app.global_shortcut()
            .register(shortcut)
            .map_err(|e| e.to_string())?;
    }

    *state.clip_by_shortcut_id.lock().unwrap() = clip_by_shortcut_id;

    Ok(())
}
