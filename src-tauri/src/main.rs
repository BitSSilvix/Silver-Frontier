// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    AppHandle, LogicalPosition, LogicalSize, Manager, Position, Size, WebviewBuilder, WebviewUrl,
};

#[tauri::command]
fn update_webview_bounds(app: AppHandle, x: f64, y: f64, width: f64, height: f64) {
    if let Some(webview) = app.get_webview("content_view") {
        let _ = webview.set_bounds(tauri::Rect {
            position: Position::Logical(LogicalPosition::new(x, y)),
            size: Size::Logical(LogicalSize::new(width, height)),
        });
    }
}

#[tauri::command]
async fn create_web_view(
    app: AppHandle,
    url: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;

    if let Some(existing_view) = app.get_webview("content_view") {
        existing_view
            .navigate(url.parse().map_err(|e| format!("{e}"))?)
            .map_err(|e| e.to_string())?;
        return Ok(());
    }

    let webview_builder = WebviewBuilder::new(
        "content_view",
        WebviewUrl::External(url.parse().map_err(|e| format!("{e}"))?),
    );

    window
        .add_child(
            webview_builder,
            LogicalPosition::new(x, y),
            LogicalSize::new(width, height),
        )
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn win_minimize(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
}

#[tauri::command]
fn win_toggle_maximize(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_maximized().unwrap_or(false) {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
}

#[tauri::command]
fn win_close(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.close();
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(main_window) = app.get_webview_window("main") {
                let _ = main_window.set_decorations(false);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_web_view,
            update_webview_bounds,
            win_minimize,
            win_toggle_maximize,
            win_close
        ])
        .run(tauri::generate_context!())
        .expect("error while running Silver Fr0ntier");
}
