// JustSnap - Tauri Commands
// All IPC commands that can be invoked from the frontend

use tauri::command;

// ============================================
// Screen Capture Commands
// ============================================

#[command]
pub async fn capture_screen(x: i32, y: i32, width: i32, height: i32) -> Result<String, String> {
    use crate::screen_capture::{capture_region, CaptureRegion};
    use base64::{engine::general_purpose, Engine as _};

    let region = CaptureRegion {
        x,
        y,
        width,
        height,
    };

    let bytes = capture_region(region).await?;

    // Convert to Base64 to avoid JSON serialization overhead of byte arrays
    Ok(general_purpose::STANDARD.encode(&bytes))
}

#[command]
pub async fn capture_full_screen(app: tauri::AppHandle) -> Result<String, String> {
    use crate::screen_capture::capture_full_screen;
    use base64::{engine::general_purpose, Engine as _};
    use tauri::Manager;

    let window = app.get_webview_window("main");

    // Get the main window and hide it
    if let Some(ref win) = window {
        let _ = win.hide();
        let _ = win.set_ignore_cursor_events(false);
    }

    // Slight delay to allow window to hide
    std::thread::sleep(std::time::Duration::from_millis(100));

    let capture_result = capture_full_screen().await;

    // Show the window again immediately
    if let Some(ref win) = window {
        let _ = win.show();
        let _ = win.set_focus();
    }

    let bytes = capture_result?;
    Ok(general_purpose::STANDARD.encode(&bytes))
}

#[command]
pub async fn get_monitors() -> Result<Vec<crate::screen_capture::MonitorInfo>, String> {
    crate::screen_capture::get_all_monitors()
}

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
// #[command]
// pub async fn save_text(_content: String, file_name: String) -> Result<String, String> {
//     Ok(format!("C:\\Users\\Desktop\\{}.txt", file_name))
// }

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

    // Decode bytes to raw RGBA (auto-detect format, handles BMP/PNG)
    let img = image::load_from_memory(&image_data)
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
    image_src: String,        // Expects full data URL or src
    annotations_json: String, // JSON string of annotations
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    native_width: f64,  // New: Physical Width of the original image
    native_height: f64, // New: Physical Height of the original image
) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    let label = format!("sticky_{}", chrono::Utc::now().timestamp_micros());

    // Inject window type and image src, AND native dimensions
    let init_script = format!(
        "window.__WINDOW_TYPE__ = 'sticky'; 
         window.__STICKY_IMAGE_SRC__ = {:?}; 
         window.__STICKY_ANNOTATIONS__ = {:?};
         window.__STICKY_NATIVE_WIDTH__ = {};
         window.__STICKY_NATIVE_HEIGHT__ = {};",
        image_src, annotations_json, native_width, native_height
    );

    let _win = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap Sticky")
        .decorations(false)
        .resizable(true)
        .always_on_top(true)
        .skip_taskbar(true);

    #[cfg(any(target_os = "windows", target_os = "macos"))]
    let _win = _win.transparent(true);

    let _win = _win
        .shadow(true)
        .inner_size(width, height)
        .position(x, y)
        .initialization_script(&init_script)
        .build()
        .map_err(|e: tauri::Error| e.to_string())?;

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

    #[allow(unused_mut)]
    let mut builder = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap AI Code")
        .decorations(false) // Frameless for custom UI
        .resizable(true) // Start resizable for dragging
        .always_on_top(false) // Allow interaction with other windows
        .skip_taskbar(false); // Process should be visible

    #[cfg(any(target_os = "windows", target_os = "macos"))]
    {
        builder = builder.transparent(true); // Transparent to avoid white box issues
    }

    let _ = builder
        .shadow(true)
        .inner_size(width, height)
        .position(x, y)
        .initialization_script(&init_script)
        .build()
        .map_err(|e: tauri::Error| e.to_string())?;

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

    #[allow(unused_mut)]
    let mut builder = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("JustSnap Translate")
        .decorations(false) // Frameless
        .resizable(true)
        .always_on_top(false)
        .skip_taskbar(false);

    #[cfg(any(target_os = "windows", target_os = "macos"))]
    {
        builder = builder.transparent(true);
    }

    let _ = builder
        .shadow(true)
        .inner_size(width, height)
        .position(x, y)
        .initialization_script(&init_script)
        .build()
        .map_err(|e: tauri::Error| e.to_string())?;

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
    pub app_name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub z_order: i32, // Lower number = closer to user (top-most)
}

#[cfg(windows)]
fn get_window_z_order_map() -> std::collections::HashMap<u32, i32> {
    use std::collections::HashMap;
    use windows::Win32::Foundation::LPARAM;
    use windows::Win32::UI::WindowsAndMessaging::EnumWindows;

    let mut z_order_map: HashMap<u32, i32> = HashMap::new();

    // Create a tuple on the stack that will be passed to the callback
    // The callback will increment z_index as it enumerates windows
    let mut data = (0i32, &mut z_order_map);

    unsafe {
        // Enumerate all top-level windows in Z-order (top to bottom)
        let _ = EnumWindows(
            Some(enum_windows_proc),
            LPARAM(&mut data as *mut _ as isize),
        );
    }

    z_order_map
}

#[cfg(windows)]
unsafe extern "system" fn enum_windows_proc(
    hwnd: windows::Win32::Foundation::HWND,
    lparam: windows::Win32::Foundation::LPARAM,
) -> windows::Win32::Foundation::BOOL {
    use std::collections::HashMap;

    let data = lparam.0 as *mut (i32, *mut HashMap<u32, i32>);
    let (z_index, map_ptr) = &mut *data;
    let map = &mut **map_ptr;

    // Store the Z-order for this window handle
    let window_id = hwnd.0 as u32;
    map.insert(window_id, *z_index);
    *z_index += 1;

    windows::Win32::Foundation::BOOL::from(true) // Continue enumeration
}

#[cfg(not(windows))]
fn get_window_z_order_map() -> std::collections::HashMap<u32, i32> {
    // On non-Windows platforms, return empty map
    // The z_order will default to the xcap enumeration order
    std::collections::HashMap::new()
}

// Helper function to check if two rectangles intersect
#[allow(dead_code)]
fn rectangles_intersect(
    rect1: (i32, i32, i32, i32), // (x, y, width, height)
    rect2: (i32, i32, i32, i32),
) -> bool {
    let (x1, y1, w1, h1) = rect1;
    let (x2, y2, w2, h2) = rect2;

    // Calculate boundaries
    let left1 = x1;
    let right1 = x1 + w1;
    let top1 = y1;
    let bottom1 = y1 + h1;

    let left2 = x2;
    let right2 = x2 + w2;
    let top2 = y2;
    let bottom2 = y2 + h2;

    // Check if rectangles do NOT intersect, then negate
    !(right1 <= left2 || right2 <= left1 || bottom1 <= top2 || bottom2 <= top1)
}

// get_windows and get_cursor_position removed as they were unused by frontend

// Get window at specific screen coordinates (WYSIWYG - what you see is what you get)
#[command]
pub async fn get_window_at_point(x: i32, y: i32) -> Result<Option<WindowInfo>, String> {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::POINT;
        use windows::Win32::UI::WindowsAndMessaging::{
            GetAncestor, IsIconic, IsWindowVisible, WindowFromPoint, GA_ROOT,
        };
        use xcap::Window;

        unsafe {
            let point = POINT { x, y };

            // Get the top-most visible window at this point
            let mut hwnd = WindowFromPoint(point);

            if hwnd.is_invalid() {
                return Ok(None);
            }

            // Get the root window (not a child control)
            hwnd = GetAncestor(hwnd, GA_ROOT);

            if hwnd.is_invalid() {
                return Ok(None);
            }

            // Skip if not visible or minimized
            if !IsWindowVisible(hwnd).as_bool() || IsIconic(hwnd).as_bool() {
                return Ok(None);
            }

            let window_id = hwnd.0 as u32;

            // Try to find this window in xcap's window list to get full details
            let all_windows = Window::all().map_err(|e| e.to_string())?;

            // Get Z-order map to check if this window is covered by others
            let z_order_map = get_window_z_order_map();

            for window in &all_windows {
                if window.id().unwrap_or(0) == window_id {
                    // Skip minimized windows
                    if window.is_minimized().unwrap_or(false) {
                        return Ok(None);
                    }

                    // Skip windows with invalid dimensions
                    if window.width().unwrap_or(0) == 0 || window.height().unwrap_or(0) == 0 {
                        return Ok(None);
                    }

                    let title = window.title().unwrap_or_default();
                    let app_name = window.app_name().unwrap_or_default();

                    // Filter out system/overlay windows
                    let title_lower = title.to_lowercase();
                    let app_lower = app_name.to_lowercase();

                    if title_lower == "program manager"
                        || title_lower == "default ime"
                        || title_lower.contains("overlay")
                        || app_lower.contains("justsnap")
                        || title_lower.contains("justsnap")
                    {
                        return Ok(None);
                    }

                    // STRICT RULE: Check if this window is covered by any other window
                    // If any part is covered, reject it entirely
                    let current_z = z_order_map.get(&window_id).copied().unwrap_or(i32::MAX);
                    let current_rect = (
                        window.x().unwrap_or(0),
                        window.y().unwrap_or(0),
                        window.width().unwrap_or(0) as i32,
                        window.height().unwrap_or(0) as i32,
                    );

                    // Check all other windows
                    for other_window in &all_windows {
                        if other_window.id().unwrap_or(0) == window_id {
                            continue; // Skip self
                        }

                        // Skip minimized/invalid windows
                        if other_window.is_minimized().unwrap_or(false)
                            || other_window.width().unwrap_or(0) == 0
                            || other_window.height().unwrap_or(0) == 0
                        {
                            continue;
                        }

                        // Get other window's Z-order
                        let other_z = z_order_map
                            .get(&other_window.id().unwrap_or(0))
                            .copied()
                            .unwrap_or(i32::MAX);

                        // If other window is above us (lower z-order = higher in stack)
                        if other_z < current_z {
                            // Check if rectangles overlap
                            let other_rect = (
                                other_window.x().unwrap_or(0),
                                other_window.y().unwrap_or(0),
                                other_window.width().unwrap_or(0) as i32,
                                other_window.height().unwrap_or(0) as i32,
                            );

                            if rectangles_intersect(current_rect, other_rect) {
                                // This window is partially covered - reject it!
                                return Ok(None);
                            }
                        }
                    }

                    // Window is not covered by any other window - allow selection
                    return Ok(Some(WindowInfo {
                        id: window_id,
                        title: title.to_string(),
                        app_name: app_name.to_string(),
                        x: window.x().unwrap_or(0),
                        y: window.y().unwrap_or(0),
                        width: window.width().unwrap_or(0),
                        height: window.height().unwrap_or(0),
                        z_order: current_z,
                    }));
                }
            }

            // Window not found in xcap list
            Ok(None)
        }
    }

    #[cfg(not(windows))]
    {
        let _ = x;
        let _ = y;
        Ok(None)
    }
}
