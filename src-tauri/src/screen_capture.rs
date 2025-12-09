// JustSnap - Screen Capture Module
// Handles screen capture functionality using xcap

use image::{ImageBuffer, ImageFormat, Rgba, RgbaImage};
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

    // Encode as PNG
    encode_as_png(&cropped)
}

/// Capture the full screen (primary monitor)
pub async fn capture_full_screen() -> Result<Vec<u8>, String> {
    let rgba_image = capture_full_screen_raw().await?;
    encode_as_png(&rgba_image)
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

    encode_as_png(&rgba_image)
}

/// Crop an image to a specific region
fn crop_image(image: &RgbaImage, region: CaptureRegion) -> Result<RgbaImage, String> {
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

    // Create a new image with the cropped region
    let mut cropped = RgbaImage::new(max_width, max_height);

    for cy in 0..max_height {
        for cx in 0..max_width {
            let pixel = image.get_pixel(x + cx, y + cy);
            cropped.put_pixel(cx, cy, *pixel);
        }
    }

    Ok(cropped)
}

/// Encode an image as PNG bytes with optimal compression
fn encode_as_png(image: &RgbaImage) -> Result<Vec<u8>, String> {
    use image::codecs::png::{PngEncoder, CompressionType, FilterType};
    use image::ImageEncoder;

    let mut buffer = Cursor::new(Vec::new());

    // Use PNG encoder with best quality settings:
    // - CompressionType::Best: Highest compression quality (slower but better quality)
    // - FilterType::Sub: Good filter for photographic images
    let encoder = PngEncoder::new_with_quality(
        &mut buffer,
        CompressionType::Best,
        FilterType::Sub,
    );

    encoder
        .write_image(
            image.as_raw(),
            image.width(),
            image.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Failed to encode image as PNG: {}", e))?;

    Ok(buffer.into_inner())
}
