// JustSnap - Screen Capture Module
// Handles screen capture functionality using xcap

use image::{ImageBuffer, Rgba, RgbaImage};
use std::io::Cursor;
use xcap::Monitor;

pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// Capture a specific region of the screen
pub async fn capture_region(region: CaptureRegion) -> Result<Vec<u8>, String> {
    // Get all monitors
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    // For now, use the primary monitor
    // TODO: Phase 3 - Add multi-monitor support to detect which monitor the region is on
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary())
        .ok_or_else(|| "No primary monitor found".to_string())?;

    // Capture the entire screen first
    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Convert to RgbaImage
    let full_image =
        ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(image.width(), image.height(), image.into_raw())
            .ok_or_else(|| "Failed to create image buffer".to_string())?;

    // Crop to the specified region
    let cropped = crop_image(&full_image, region)?;

    // Encode as BMP
    encode_as_bmp(&cropped)
}

/// Capture the full screen (primary monitor)
pub async fn capture_full_screen() -> Result<Vec<u8>, String> {
    let rgba_image = capture_full_screen_raw().await?;
    encode_as_bmp(&rgba_image)
}

/// Capture the full screen raw image (primary monitor)
pub async fn capture_full_screen_raw() -> Result<RgbaImage, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary())
        .ok_or_else(|| "No primary monitor found".to_string())?;

    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Convert to RgbaImage
    ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(image.width(), image.height(), image.into_raw())
        .ok_or_else(|| "Failed to create image buffer".to_string())
}

/// Capture a specific monitor
#[allow(dead_code)]
pub async fn capture_monitor(monitor_id: i32) -> Result<Vec<u8>, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    let monitor = monitors
        .into_iter()
        .nth(monitor_id as usize)
        .ok_or_else(|| format!("Monitor {} not found", monitor_id))?;

    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture monitor: {}", e))?;

    let rgba_image =
        ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(image.width(), image.height(), image.into_raw())
            .ok_or_else(|| "Failed to create image buffer".to_string())?;

    encode_as_bmp(&rgba_image)
}

/// Encode an image as BMP bytes (uncompressed, faster than PNG)
fn encode_as_bmp(image: &RgbaImage) -> Result<Vec<u8>, String> {
    use image::codecs::bmp::BmpEncoder;
    use image::ImageEncoder;

    let mut buffer = Cursor::new(Vec::new());

    // Use BMP encoder for zero compression overhead
    let encoder = BmpEncoder::new(&mut buffer);

    encoder
        .write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Failed to encode image as BMP: {}", e))?;

    Ok(buffer.into_inner())
}

/// Crop an image to a specific region
fn crop_image(image: &RgbaImage, region: CaptureRegion) -> Result<RgbaImage, String> {
    use image::imageops;

    let x = region.x.max(0) as u32;
    let y = region.y.max(0) as u32;
    let width = region.width.max(1) as u32;
    let height = region.height.max(1) as u32;

    // Ensure crop region is within image bounds
    let max_width = (image.width() - x).min(width);
    let max_height = (image.height() - y).min(height);

    if max_width == 0 || max_height == 0 {
        return Err("Invalid crop region: outside image bounds".to_string());
    }

    // Use imageops for optimized cropping
    let sub_image = imageops::crop_imm(image, x, y, max_width, max_height);
    Ok(sub_image.to_image())
}
