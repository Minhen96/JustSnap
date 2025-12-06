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

            // Get the main window
            if let Some(window) = app_handle.get_webview_window("main") {
                // Make it fullscreen and always on top
                let _ = window.set_fullscreen(true);
                let _ = window.set_always_on_top(true);
                let _ = window.set_focus();
                let _ = window.unminimize();
                let _ = window.show();

                // CRITICAL: Enable mouse interaction!
                let _ = window.set_ignore_cursor_events(false);
            }

            // Emit event to frontend
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
