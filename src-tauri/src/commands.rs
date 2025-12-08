// JustSnap - Tauri Commands
// All IPC commands that can be invoked from the frontend

use tauri::command;

// ============================================
// Screen Capture Commands
// ============================================

#[command]
pub async fn capture_screen(x: i32, y: i32, width: i32, height: i32) -> Result<Vec<u8>, String> {
    use crate::screen_capture::{capture_region, CaptureRegion};

    let region = CaptureRegion {
        x,
        y,
        width,
        height,
    };

    capture_region(region).await
}

#[command]
pub async fn capture_full_screen() -> Result<Vec<u8>, String> {
    use crate::screen_capture::capture_full_screen;

    capture_full_screen().await
}

// ============================================
// Hotkey Commands
// ============================================

#[derive(serde::Deserialize)]
pub struct HotkeyConfig {
    pub key: String,
    pub modifiers: Vec<String>,
}

#[command]
pub async fn register_hotkey(app: tauri::AppHandle, config: HotkeyConfig) -> Result<(), String> {
    use crate::hotkeys::{register_global_hotkey, Hotkey};

    let hotkey = Hotkey {
        key: config.key,
        modifiers: config.modifiers,
    };

    register_global_hotkey(&app, hotkey)
}

#[command]
pub async fn unregister_hotkey(app: tauri::AppHandle) -> Result<(), String> {
    use crate::hotkeys::unregister_global_hotkey;

    unregister_global_hotkey(&app)
}

// ============================================
// Overlay Commands
// ============================================

#[command]
pub async fn show_overlay(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;

    // Get the main window
    if let Some(window) = app.get_webview_window("main") {
        // Ensure we can interact with the window
        let _ = window.set_ignore_cursor_events(false);
    }

    println!("Showing overlay");
    Ok(())
}

#[command]
pub async fn hide_overlay(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;

    println!("Hiding overlay");

    // Get the main window
    if let Some(window) = app.get_webview_window("main") {
        // Hide the window completely
        let _ = window.hide();

        // Restore window state (optional, but good for next time)
        let _ = window.set_fullscreen(false);
        let _ = window.set_always_on_top(false);
        let _ = window.set_skip_taskbar(true); // Keep skipped from taskbar
        let _ = window.set_shadow(false);
        let _ = window.set_decorations(false);

        // Re-enable cursor events
        let _ = window.set_ignore_cursor_events(false);
    }

    Ok(())
}

// ============================================
// File System Commands
// ============================================

#[command]

pub async fn save_image(path: String, image_data: Vec<u8>) -> Result<(), String> {
    use std::fs::File;
    use std::io::Write;

    let mut file = File::create(&path).map_err(|e| e.to_string())?;
    file.write_all(&image_data).map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn save_text(_content: String, file_name: String) -> Result<String, String> {
    // TODO: Save text to file system
    println!("Saving text: {}", file_name);
    Ok(format!("C:\\Users\\Desktop\\{}.txt", file_name))
}

#[command]

pub async fn open_save_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("Image", &["png"])
        .blocking_save_file();

    Ok(file_path.map(|p| p.to_string()))
}

// ============================================
// Clipboard Commands
// ============================================

#[command]
pub async fn copy_image_to_clipboard(image_data: Vec<u8>) -> Result<(), String> {
    use arboard::{Clipboard, ImageData};
    use image::ImageFormat;
    use std::io::Cursor;

    // Decode PNG bytes to raw RGBA
    let img = image::load(Cursor::new(&image_data), ImageFormat::Png)
        .map_err(|e| format!("Failed to decode image: {}", e))?
        .to_rgba8();

    let width = img.width() as usize;
    let height = img.height() as usize;
    let rgba_data = img.into_raw();

    // Create clipboard image data
    let img_data = ImageData {
        width,
        height,
        bytes: rgba_data.into(),
    };

    // Copy to clipboard
    let mut clipboard =
        Clipboard::new().map_err(|e| format!("Failed to access clipboard: {}", e))?;
    clipboard
        .set_image(img_data)
        .map_err(|e| format!("Failed to copy image to clipboard: {}", e))?;

    Ok(())
}

#[command]
pub async fn copy_text_to_clipboard(text: String) -> Result<(), String> {
    use arboard::Clipboard;

    let mut clipboard =
        Clipboard::new().map_err(|e| format!("Failed to access clipboard: {}", e))?;
    clipboard
        .set_text(text)
        .map_err(|e| format!("Failed to copy text to clipboard: {}", e))?;

    Ok(())
}

// ============================================
// Window Detection Commands
// ============================================

#[derive(serde::Serialize)]
pub struct WindowInfo {
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[command]
pub async fn get_window_at_position(x: i32, y: i32) -> Result<Option<WindowInfo>, String> {
    // TODO: Detect window at mouse position
    println!("Getting window at: {}, {}", x, y);
    Ok(None)
}

#[command]
pub async fn get_all_windows() -> Result<Vec<WindowInfo>, String> {
    // TODO: Get all open windows
    println!("Getting all windows");
    Ok(vec![])
}

// ============================================
// Monitor Commands
// ============================================
// MonitorInfo is now defined in screen_capture.rs

#[command]
pub async fn get_all_monitors() -> Result<Vec<crate::screen_capture::MonitorInfo>, String> {
    use crate::screen_capture::get_all_monitors;

    get_all_monitors()
}

// ============================================
// Settings Commands
// ============================================

#[command]
pub async fn get_settings() -> Result<serde_json::Value, String> {
    // TODO: Load settings from file
    println!("Getting settings");
    Ok(serde_json::json!({}))
}

#[command]
pub async fn save_settings(settings: serde_json::Value) -> Result<(), String> {
    // TODO: Save settings to file
    println!("Saving settings: {:?}", settings);
    Ok(())
}

// ============================================
// System Tray Commands (Future)
// ============================================

#[command]
pub async fn stick_window(
    app: tauri::AppHandle,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    use tauri::{LogicalPosition, LogicalSize, Manager};

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unmaximize();
        let _ = window.set_fullscreen(false);
        // Enable decorations so user can move/resize natively
        let _ = window.set_decorations(true);
        let _ = window.set_resizable(true);
        let _ = window.set_shadow(true); // Add shadow back for visibility

        // Critical: Set size THEN position
        let _ = window.set_size(LogicalSize::new(width, height));
        let _ = window.set_position(LogicalPosition::new(x, y));

        let _ = window.set_always_on_top(true);
        let _ = window.set_ignore_cursor_events(false);
    }
    Ok(())
}

#[command]
pub async fn restore_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::{LogicalPosition, Manager};

    // Logic to restore to "Fullscreen Overlay" mode
    if let Some(window) = app.get_webview_window("main") {
        if let Some(monitor) = window.current_monitor().ok().flatten() {
            let size = monitor.size();
            let scale_factor = monitor.scale_factor();
            let logical_width = size.width as f64 / scale_factor;
            let logical_height = size.height as f64 / scale_factor;

            // Disable decorations for overlay
            let _ = window.set_decorations(false);
            let _ = window.set_shadow(false);

            let _ = window.set_position(LogicalPosition::new(0.0, 0.0));
            // Explicitly setting size is often more reliable than set_fullscreen for overlays that need to be transparent/clickable
            let _ = window.set_size(tauri::LogicalSize::new(logical_width, logical_height));
            let _ = window.set_resizable(true); // Keep resizable for future
            let _ = window.set_always_on_top(true);
        }
    }
    Ok(())
}

#[command]
pub async fn show_in_tray() -> Result<(), String> {
    // TODO: Show app in system tray
    println!("Showing in tray");
    Ok(())
}

#[command]
pub async fn hide_from_tray() -> Result<(), String> {
    // TODO: Hide from system tray
    println!("Hiding from tray");
    Ok(())
}

#[command]
pub async fn save_temp_image(image_data: Vec<u8>) -> Result<String, String> {
    use std::io::Write;
    let mut temp_path = std::env::temp_dir();
    let file_name = format!(
        "justsnap_sticky_{}.png",
        chrono::Utc::now().timestamp_millis()
    );
    temp_path.push(file_name);

    let path_str = temp_path.to_string_lossy().to_string();
    let mut file = std::fs::File::create(&temp_path).map_err(|e| e.to_string())?;
    file.write_all(&image_data).map_err(|e| e.to_string())?;

    Ok(path_str)
}

#[command]
pub async fn create_sticky_window(
    app: tauri::AppHandle,
    image_src: String, // Expects full data URL or src
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    let label = format!("sticky_{}", chrono::Utc::now().timestamp_micros());

    // Inject src directly
    let init_script = format!("window.__STICKY_IMAGE_SRC__ = {:?};", image_src);

    let win = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap Sticky")
        .decorations(true)
        .resizable(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .transparent(false)
        .shadow(true)
        .inner_size(width, height)
        .position(x, y)
        .initialization_script(&init_script)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn create_ai_panel_window(
    app: tauri::AppHandle,
    image_src: String,
    framework: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    let label = format!("ai_panel_{}", chrono::Utc::now().timestamp_micros());

    // Inject data directly
    // JSON stringify the framework to be safe
    let init_script = format!(
        "window.__AI_PANEL_DATA__ = {{ imageSrc: {:?}, framework: {:?} }};",
        image_src, framework
    );

    let _ = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap AI Code")
        .decorations(false) // Frameless for custom UI
        .resizable(true) // Start resizable for dragging
        .always_on_top(false) // Allow interaction with other windows
        .skip_taskbar(false) // Process should be visible
        .transparent(false) // White background
        .shadow(true)
        .inner_size(width, height)
        .position(x, y)
        .initialization_script(&init_script)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn create_translation_window(
    app: tauri::AppHandle,
    text: String,
    x: f64,
    y: f64,
) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    let label = format!("translation_{}", chrono::Utc::now().timestamp_micros());

    // Inject text directly
    let init_script = format!("window.__TRANSLATION_TEXT__ = {:?};", text);

    let width = 400.0;
    let height = 600.0;

    let _ = WebviewWindowBuilder::new(
        &app,
        &label,
        WebviewUrl::App("index.html".into()),
    )
    .title("JustSnap Translate")
    .decorations(false) // Frameless
    .resizable(true)
    .always_on_top(false)
    .skip_taskbar(false)
    .transparent(false)
    .shadow(true)
    .inner_size(width, height)
    .position(x, y)
    .initialization_script(&init_script)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}
