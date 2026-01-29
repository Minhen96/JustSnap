// JustSnap - Global Hotkey Management
// Handles registering and listening for global keyboard shortcuts

// use image::EncodableLayout; // Use simple bytes for now
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
                // 1. Get cursor position to determine which monitor to capture
                #[cfg(windows)]
                let cursor_pos: Option<(i32, i32)> = {
                    use windows::Win32::Foundation::POINT;
                    use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
                    unsafe {
                        let mut point = POINT::default();
                        if GetCursorPos(&mut point).is_ok() {
                            Some((point.x, point.y))
                        } else {
                            None
                        }
                    }
                };
                #[cfg(not(windows))]
                let cursor_pos: Option<(i32, i32)> = None;

                // 2. Hide window to capture clean screen
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.hide();
                }

                // Give the OS a moment to repaint the background
                std::thread::sleep(std::time::Duration::from_millis(10));

                // 3. Capture monitor at cursor position (or primary if cursor detection failed)
                let capture_result = if let Some((cx, cy)) = cursor_pos {
                    crate::screen_capture::capture_monitor_at_point_raw(cx, cy)
                } else {
                    // Fallback: capture primary monitor
                    tauri::async_runtime::block_on(async {
                        crate::screen_capture::capture_full_screen_raw().await
                    })
                    .map(|img| (img, 0, 0, 1920, 1080, 1.0)) // Dummy values for primary
                };

                match capture_result {
                    Ok((raw_image, mon_x, mon_y, mon_width, mon_height, scale_factor)) => {
                        if cfg!(debug_assertions) {
                            eprintln!(
                                "[Hotkey] Captured monitor at ({},{}) size {}x{} scale {}",
                                mon_x, mon_y, mon_width, mon_height, scale_factor
                            );
                        }

                        // 4. SHOW WINDOW ON THE CAPTURED MONITOR
                        if let Some(window) = app_handle.get_webview_window("main") {
                            // Basic window setup
                            let _ = window.set_decorations(false);
                            let _ = window.set_always_on_top(true);
                            let _ = window.set_skip_taskbar(true);
                            let _ = window.set_shadow(false);
                            let _ = window.set_resizable(true);

                            // Position window on the detected monitor
                            // xcap returns physical pixel coordinates, so use PhysicalPosition/Size
                            let _ = window.set_position(tauri::PhysicalPosition::new(mon_x, mon_y));
                            let _ =
                                window.set_size(tauri::PhysicalSize::new(mon_width, mon_height));

                            // Ensure window is visible and focused
                            let _ = window.set_fullscreen(true);
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.unminimize();
                            let _ = window.set_ignore_cursor_events(false);

                            // Trigger UI to show crosshair/overlay with monitor info for coordinate translation
                            #[derive(serde::Serialize, Clone)]
                            struct MonitorOffset {
                                x: i32,
                                y: i32,
                                width: u32,
                                height: u32,
                                scale_factor: f64,
                            }
                            let _ = app_handle.emit(
                                "hotkey-triggered",
                                MonitorOffset {
                                    x: mon_x,
                                    y: mon_y,
                                    width: mon_width,
                                    height: mon_height,
                                    scale_factor,
                                },
                            );
                        }

                        // 3. ENCODE & SEND IMAGE (BACKGROUND)
                        // Using JPEG for speed to minimize the "Jump" delay
                        let app_handle_clone = app_handle.clone();
                        tauri::async_runtime::spawn(async move {
                            // 4. SAVE TO TEMP FILE
                            // Using file-based transfer is more robust than large Base64 IPC payloads
                            let temp_dir = std::env::temp_dir();
                            let file_path = temp_dir.join("justsnap_capture.png"); // Use PNG for lossless quality

                            if cfg!(debug_assertions) {
                                eprintln!("[Hotkey] Saving capture to: {:?}", file_path);
                            }

                            // Save as PNG directly (supports RGBA)
                            if let Err(e) =
                                raw_image.save_with_format(&file_path, image::ImageFormat::Png)
                            {
                                eprintln!("[Error] Failed to save temp image: {}", e);
                                return;
                            }

                            // Emit the FILE PATH
                            let path_string = file_path.to_string_lossy().to_string();
                            if cfg!(debug_assertions) {
                                eprintln!("[Hotkey] Emitting path: {}", path_string);
                            }

                            if let Err(e) =
                                app_handle_clone.emit("screen-capture-ready", path_string)
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
