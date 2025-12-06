// JustSnap - Tauri Backend Library

// Module declarations
mod commands;
mod hotkeys;
mod overlays;
mod screen_capture;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // System Tray Setup
            use tauri::menu::{Menu, MenuItem};
            use tauri::tray::TrayIconBuilder;
            use tauri::Manager;

            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        println!("Tray: Quit requested");
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            println!("Tray: Showing window");
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.unminimize();
                            let _ = window.set_ignore_cursor_events(false);
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = window.unminimize();
                                let _ = window.set_ignore_cursor_events(false);
                            }
                        }
                    }
                })
                .build(app)?;

            // Register default hotkey (Ctrl+Shift+S) on startup
            if let Err(e) = hotkeys::register_default_hotkey(&app.handle()) {
                eprintln!("Failed to register default hotkey: {}", e);
            } else {
                println!("✓ Global hotkey (Ctrl+Shift+S) registered successfully!");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Screen Capture
            commands::capture_screen,
            commands::capture_full_screen,
            // Hotkeys
            commands::register_hotkey,
            commands::unregister_hotkey,
            // Overlay
            commands::show_overlay,
            commands::hide_overlay,
            // File System
            commands::save_image,
            commands::save_text,
            commands::open_save_dialog,
            // Clipboard
            commands::copy_image_to_clipboard,
            commands::copy_text_to_clipboard,
            // Window Detection
            commands::get_window_at_position,
            commands::get_all_windows,
            // Monitors
            commands::get_all_monitors,
            // Settings
            commands::get_settings,
            commands::save_settings,
            // System Tray
            commands::show_in_tray,
            commands::hide_from_tray,
            commands::stick_window,
            commands::restore_window,
            commands::save_temp_image,
            commands::create_sticky_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
