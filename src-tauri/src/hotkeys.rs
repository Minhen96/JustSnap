// JustSnap - Global Hotkey Management
// Handles registering and listening for global keyboard shortcuts

use base64::prelude::*;
// use image::EncodableLayout; // Use simple bytes for now
use std::io::Cursor;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

pub struct Hotkey {
    pub key: String,
    pub modifiers: Vec<String>,
}

/// Register global hotkey (Ctrl+Shift+S by default)
pub fn register_global_hotkey(app: &AppHandle, hotkey: Hotkey) -> Result<(), String> {
    // Build shortcut string (e.g., "Ctrl+Shift+S")
    let mut shortcut_str = String::new();

    for modifier in &hotkey.modifiers {
        shortcut_str.push_str(modifier);
        shortcut_str.push('+');
    }
    shortcut_str.push_str(&hotkey.key);

    if cfg!(debug_assertions) {
        println!("[Hotkey] Registering: {}", shortcut_str);
    }

    // Parse the shortcut
    let shortcut: Shortcut = shortcut_str
        .parse()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;

    // Clone app handle for the closure
    let app_handle = app.clone();

    // Register the shortcut
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                // 1. Hide window to capture clean screen
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.hide();
                }

                // Give the OS a moment to repaint the background
                std::thread::sleep(std::time::Duration::from_millis(10));

                // Captured raw image (fast)
                let capture_result = tauri::async_runtime::block_on(async {
                    crate::screen_capture::capture_full_screen_raw().await
                });

                match capture_result {
                    Ok(raw_image) => {
                        // 2. SHOW WINDOW IMMEDIATELY (Optimistic)
                        if let Some(window) = app_handle.get_webview_window("main") {

                            // Basic window setup
                            let _ = window.set_decorations(false);
                            let _ = window.set_always_on_top(true);
                            let _ = window.set_skip_taskbar(true);
                            let _ = window.set_shadow(false);
                            let _ = window.set_resizable(true);

                            // Robust reset: Manually set to monitor size
                            if let Some(monitor) = window.current_monitor().ok().flatten() {
                                let size = monitor.size();
                                let scale_factor = monitor.scale_factor();
                                let logical_width = size.width as f64 / scale_factor;
                                let logical_height = size.height as f64 / scale_factor;

                                let _ = window.set_position(tauri::LogicalPosition::new(0.0, 0.0));
                                let _ = window.set_size(tauri::LogicalSize::new(
                                    logical_width,
                                    logical_height,
                                ));
                            }

                            // Ensure window is visible and focused
                            let _ = window.set_fullscreen(true);
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.unminimize();
                            let _ = window.set_ignore_cursor_events(false);

                            // Trigger UI to show crosshair/overlay
                            let _ = app_handle.emit("hotkey-triggered", ());
                        }

                        // 3. ENCODE & SEND IMAGE (BACKGROUND)
                        // Using JPEG for speed to minimize the "Jump" delay
                        let app_handle_clone = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            let mut buffer = Cursor::new(Vec::new());

                            // Convert RGBA to RGB (JPEG doesn't support Alpha)
                            // This is fast enough to do in background
                            use image::buffer::ConvertBuffer;
                            let rgb_image: image::RgbImage = raw_image.convert();

                            // Use JPEG format with decent quality (80) for speed/quality balance
                            let mut jpeg_encoder =
                                image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, 80);

                            if let Err(e) = jpeg_encoder.encode(
                                &rgb_image, // Pass the converted RGB buffer
                                rgb_image.width(),
                                rgb_image.height(),
                                image::ColorType::Rgb8.into(),
                            ) {
                                eprintln!("Failed to encode image: {}", e);
                                return;
                            }

                            let image_data = buffer.into_inner();

                            // Encode to Base64
                            let base64_image = BASE64_STANDARD.encode(&image_data);

                            if let Err(e) =
                                app_handle_clone.emit("screen-capture-ready", base64_image)
                            {
                                eprintln!("[Error] Failed to emit screen capture event: {}", e);
                            }
                        });
                    }
                    Err(e) => {
                        eprintln!("[Error] Failed to capture screen: {}", e);
                        // If capture failed, we should probably still show window or show error
                        let _ = app_handle.emit("capture-debug", format!("Capture failed: {}", e));
                    }
                }
            }
        })
        .map_err(|e| format!("Failed to register global shortcut: {}", e))?;

    Ok(())
}

/// Unregister all global hotkeys
pub fn unregister_global_hotkey(app: &AppHandle) -> Result<(), String> {
    if cfg!(debug_assertions) {
        println!("[Hotkey] Unregistering all global hotkeys");
    }

    app.global_shortcut()
        .unregister_all()
        .map_err(|e| format!("Failed to unregister shortcuts: {}", e))?;

    Ok(())
}

/// Register default hotkey (Ctrl+Shift+S) on app startup
pub fn register_default_hotkey(app: &AppHandle) -> Result<(), String> {
    let hotkey = Hotkey {
        key: "S".to_string(),
        modifiers: vec!["Ctrl".to_string(), "Shift".to_string()],
    };

    register_global_hotkey(app, hotkey)
}
