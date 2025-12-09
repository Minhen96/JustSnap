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

    Ok(())
}

#[command]
pub async fn hide_overlay(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;

    // Get the main window
    if let Some(window) = app.get_webview_window("main") {
        // Hide the window completely
        let _ = window.hide();

        // Re-enable cursor events just in case
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

// Note: save_text is currently unused but kept for future text export features
#[command]
pub async fn save_text(_content: String, file_name: String) -> Result<String, String> {
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

    // Inject window type and image src
    let init_script = format!(
        "window.__WINDOW_TYPE__ = 'sticky'; window.__STICKY_IMAGE_SRC__ = {:?};",
        image_src
    );

    let _win = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap Sticky")
        .decorations(false)
        .resizable(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .transparent(true)
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

    // Inject window type and data
    let init_script = format!(
        "window.__WINDOW_TYPE__ = 'ai_panel'; window.__AI_PANEL_DATA__ = {{ imageSrc: {:?}, framework: {:?} }};",
        image_src, framework
    );

    let _ = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap AI Code")
        .decorations(false) // Frameless for custom UI
        .resizable(true) // Start resizable for dragging
        .always_on_top(false) // Allow interaction with other windows
        .skip_taskbar(false) // Process should be visible
        .transparent(true) // Transparent to avoid white box issues
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

    // Inject window type and text
    let init_script = format!(
        "window.__WINDOW_TYPE__ = 'translation'; window.__TRANSLATION_TEXT__ = {:?};",
        text
    );

    let width = 400.0;
    let height = 600.0;

    let _ = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap Translate")
        .decorations(false) // Frameless
        .resizable(true)
        .always_on_top(false)
        .skip_taskbar(false)
        .transparent(true)
        .shadow(true)
        .inner_size(width, height)
        .position(x, y)
        .initialization_script(&init_script)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

// ============================================
// Window Enumeration for Smart Select
// ============================================

#[derive(serde::Serialize)]
pub struct WindowInfo {
    pub id: u32,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[command]
pub async fn get_windows() -> Result<Vec<WindowInfo>, String> {
    use xcap::Window;

    let windows = Window::all().map_err(|e| e.to_string())?;

    let mut window_infos = Vec::new();
    for window in windows {
        // Filter out minimized or invalid windows if possible
        // Removed !is_minimized() as it might be flaky for some apps or during focus changes
        if window.width() > 0 && window.height() > 0 {
            let title = window.title();
            // Filter out our own windows to prevent self-selection/overlay issues
            // We allow empty titles because many modern apps/dialogs have no title but are valid top-layer windows
            if !title.contains("JustSnap") && !title.contains("justsnap") {
                window_infos.push(WindowInfo {
                    id: window.id(),
                    title: title.to_string(),
                    x: window.x(),
                    y: window.y(),
                    width: window.width(),
                    height: window.height(),
                });
            }
        }
    }

    Ok(window_infos)
}
