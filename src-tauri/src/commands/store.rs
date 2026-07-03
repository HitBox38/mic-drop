use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};
use tauri_plugin_store::StoreExt;

const STORE_PATH: &str = "board.json";
const BOARD_KEY: &str = "board";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipLayoutConfig {
    pub col: u16,
    pub row: u16,
    pub col_span: u16,
    pub row_span: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipConfig {
    pub id: String,
    pub name: String,
    pub file_path: String,
    pub color: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
    pub volume: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hotkey: Option<String>,
    // Optional so boards saved before the modular grid existed still load;
    // the frontend migrates clips missing a layout on hydrate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub layout: Option<ClipLayoutConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoardConfig {
    pub clips: Vec<ClipConfig>,
    pub grid_columns: u8,
    pub master_volume: u8,
    pub theme: String,
}

#[tauri::command]
pub async fn load_board_config<R: Runtime>(
    app: AppHandle<R>,
) -> Result<Option<BoardConfig>, String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;

    let config = store
        .get(BOARD_KEY)
        .and_then(|value| serde_json::from_value(value).ok());

    Ok(config)
}

#[tauri::command]
pub async fn save_board_config<R: Runtime>(
    app: AppHandle<R>,
    config: BoardConfig,
) -> Result<(), String> {
    let store = app.store(STORE_PATH).map_err(|e| e.to_string())?;
    let value = serde_json::to_value(config).map_err(|e| e.to_string())?;

    store.set(BOARD_KEY, value);
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}
