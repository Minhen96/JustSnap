// JustSnap - Utility Functions
// Shared utility functions for the Rust backend

use std::path::PathBuf;

/// Get the default save directory for screenshots
#[allow(dead_code)]
pub fn get_default_save_path() -> PathBuf {
    // TODO: Get user's Pictures directory or appropriate default
    #[cfg(target_os = "windows")]
    {
        dirs::picture_dir().unwrap_or_else(|| PathBuf::from("C:\\Users\\Public\\Pictures"))
    }

    #[cfg(not(target_os = "windows"))]
    {
        dirs::picture_dir().unwrap_or_else(|| PathBuf::from("/tmp"))
    }
}

/// Generate a unique filename with timestamp
#[allow(dead_code)]
pub fn generate_filename(prefix: &str) -> String {
    let now = chrono::Local::now();
    format!("{}_{}", prefix, now.format("%Y%m%d_%H%M%S"))
}

/// Encode image data as PNG
#[allow(dead_code)]
pub fn encode_as_png(_data: &[u8], _width: u32, _height: u32) -> Result<Vec<u8>, String> {
    // TODO: Use image crate to encode raw pixel data as PNG
    Err("PNG encoding not implemented yet".to_string())
}
