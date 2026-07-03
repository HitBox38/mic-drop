use tauri::{AppHandle, Runtime};
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn pick_audio_files<R: Runtime>(app: AppHandle<R>) -> Result<Vec<String>, String> {
    let paths = tauri::async_runtime::spawn_blocking(move || {
        app.dialog()
            .file()
            .add_filter("Audio", &["mp3", "wav", "ogg"])
            .set_title("Add Sound")
            .blocking_pick_files()
    })
    .await
    .map_err(|e| e.to_string())?
    .map(|paths| {
        paths
            .iter()
            .map(|path| path.to_string())
            .collect::<Vec<_>>()
    })
    .unwrap_or_default();

    Ok(paths)
}
