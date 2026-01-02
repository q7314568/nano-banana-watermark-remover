mod embedded_assets;
mod watermark_engine;

use std::path::PathBuf;
use watermark_engine::WatermarkEngine;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn remove_watermark(file_path: String) -> Result<String, String> {
    let mut img = image::open(&file_path).map_err(|e| format!("Failed to open image: {}", e))?;

    let engine = WatermarkEngine::new();
    engine.remove_watermark(&mut img);

    // Save to new path with _clean suffix
    let path = PathBuf::from(&file_path);
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("image");
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("png");
    let new_filename = format!("{}_clean.{}", stem, ext);
    let new_path = path.with_file_name(&new_filename);

    img.save(&new_path)
        .map_err(|e| format!("Failed to save image: {}", e))?;

    Ok(new_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("Backend: Rust main process starting...");
    println!("Backend: Initializing Tauri Builder...");

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, remove_watermark])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
