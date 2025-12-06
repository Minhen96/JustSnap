// JustSnap - Global Hotkey Management
// Handles registering and listening for global keyboard shortcuts

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

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

    println!("Registering global hotkey: {}", shortcut_str);

    // Parse the shortcut
    let shortcut: Shortcut = shortcut_str
        .parse()
        .map_err(|e| format!("Invalid shortcut format: {}", e))?;

    // Clone app handle for the closure
    let app_handle = app.clone();

    // Register the shortcut
    app.global_shortcut()
        .on_shortcut(shortcut, move |_app, _shortcut, _event| {
            println!("Global hotkey triggered!");

            // 1. Hide window to capture clean screen
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.hide();
            }

            // Give the OS a moment to repaint the background
            std::thread::sleep(std::time::Duration::from_millis(100));

            println!("Starting screen capture...");
            let capture_result = tauri::async_runtime::block_on(async {
                crate::screen_capture::capture_full_screen().await
            });

            match capture_result {
                Ok(image_data) => {
                    println!("Screen captured successfully. Bytes: {}", image_data.len());

                    // Emit a small debug event first to verify channel
                    let _ = app_handle.emit("capture-debug", "Capture success! Sending data...");

                    // Emit the image data
                    if let Err(e) = app_handle.emit("screen-capture-ready", image_data) {
                        eprintln!("Failed to emit screen capture event: {}", e);
                    } else {
                        println!("Screen capture event emitted!");
                    }
                }
                Err(e) => {
                    eprintln!("Failed to capture screen: {}", e);
                    let _ = app_handle.emit("capture-debug", format!("Capture failed: {}", e));
                }
            }

            // 2. Get the main window and show it
            if let Some(window) = app_handle.get_webview_window("main") {
                println!("Setting window to overlay mode...");

                // Basic window setup
                // We use an opaque window (transparent: false) but with no decorations
                let _ = window.set_decorations(false);
                let _ = window.set_always_on_top(true);
                let _ = window.set_skip_taskbar(true);
                let _ = window.set_shadow(false);
                let _ = window.set_resizable(true); // Ensure resizable so we can set size

                // Robust reset: Manually set to monitor size instead of just fullscreen
                // This fixes issues where previous "Stick" mode geometry persists
                if let Some(monitor) = window.current_monitor().ok().flatten() {
                    let size = monitor.size();
                    let scale_factor = monitor.scale_factor();
                    let logical_width = size.width as f64 / scale_factor;
                    let logical_height = size.height as f64 / scale_factor;

                    let _ = window.set_position(tauri::LogicalPosition::new(0.0, 0.0));
                    let _ = window.set_size(tauri::LogicalSize::new(logical_width, logical_height));
                }

                // Also set fullscreen as backup/enforcement
                if let Err(e) = window.set_fullscreen(true) {
                    eprintln!("Failed to set fullscreen: {}", e);
                    // Legacy fallback
                    let _ = window.maximize();
                }

                // Ensure window is visible and focused
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.unminimize();

                // Enable mouse interaction
                let _ = window.set_ignore_cursor_events(false);

                println!(
                    "Window setup complete. Visible: {:?}, Focused: {:?}",
                    window.is_visible(),
                    window.is_focused()
                );
            }

            // Emit event to frontend to trigger UI state change
            if let Err(e) = app_handle.emit("hotkey-triggered", ()) {
                eprintln!("Failed to emit hotkey event: {}", e);
            }
        })
        .map_err(|e| format!("Failed to register global shortcut: {}", e))?;

    Ok(())
}

/// Unregister all global hotkeys
pub fn unregister_global_hotkey(app: &AppHandle) -> Result<(), String> {
    println!("Unregistering all global hotkeys");

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
