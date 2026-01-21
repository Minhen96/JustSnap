// JustSnap - Screen Capture Module
// Handles screen capture functionality using xcap

use image::{ImageBuffer, Rgba, RgbaImage};
use std::io::Cursor;
use xcap::Monitor;

/// Information about a display monitor
#[derive(serde::Serialize, Clone, Debug)]
pub struct MonitorInfo {
    pub id: u32,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
    pub is_primary: bool,
}

/// Get information about all connected monitors
pub fn get_all_monitors() -> Result<Vec<MonitorInfo>, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    let mut result = Vec::new();
    for monitor in monitors {
        result.push(MonitorInfo {
            id: monitor.id(),
            name: monitor.name().to_string(),
            x: monitor.x(),
            y: monitor.y(),
            width: monitor.width(),
            height: monitor.height(),
            scale_factor: monitor.scale_factor() as f64,
            is_primary: monitor.is_primary(),
        });
    }

    Ok(result)
}

pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

/// Capture a specific region of the screen (multi-monitor aware)
/// Coordinates are in virtual desktop space (can be negative for left-of-primary monitors)
pub async fn capture_region(region: CaptureRegion) -> Result<Vec<u8>, String> {
    // Get all monitors
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    // Find the monitor containing the center of the region
    let center_x = region.x + region.width / 2;
    let center_y = region.y + region.height / 2;

    let monitor = monitors
        .iter()
        .find(|m| {
            let m_right = m.x() + m.width() as i32;
            let m_bottom = m.y() + m.height() as i32;
            center_x >= m.x() && center_x < m_right && center_y >= m.y() && center_y < m_bottom
        })
        .or_else(|| monitors.iter().find(|m| m.is_primary()))
        .ok_or_else(|| "No suitable monitor found".to_string())?;

    // Convert region coordinates to monitor-local space
    let local_region = CaptureRegion {
        x: region.x - monitor.x(),
        y: region.y - monitor.y(),
        width: region.width,
        height: region.height,
    };

    if cfg!(debug_assertions) {
        eprintln!(
            "[capture_region] Virtual ({},{}) -> Monitor '{}' local ({},{})",
            region.x,
            region.y,
            monitor.name(),
            local_region.x,
            local_region.y
        );
    }

    // Capture from the detected monitor
    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Convert to RgbaImage
    let full_image =
        ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(image.width(), image.height(), image.into_raw())
            .ok_or_else(|| "Failed to create image buffer".to_string())?;

    // Crop to the specified region (in local coordinates)
    let cropped = crop_image(&full_image, local_region)?;

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

/// Capture the monitor containing the given point (cursor position)
/// Returns (image, monitor_x, monitor_y, monitor_width, monitor_height, scale_factor)
pub fn capture_monitor_at_point_raw(
    x: i32,
    y: i32,
) -> Result<(RgbaImage, i32, i32, u32, u32, f64), String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;

    // Find monitor containing the point
    let monitor = monitors
        .iter()
        .find(|m| {
            let m_right = m.x() + m.width() as i32;
            let m_bottom = m.y() + m.height() as i32;
            x >= m.x() && x < m_right && y >= m.y() && y < m_bottom
        })
        .or_else(|| monitors.iter().find(|m| m.is_primary()))
        .ok_or_else(|| "No suitable monitor found".to_string())?;

    if cfg!(debug_assertions) {
        eprintln!(
            "[capture_monitor_at_point] Point ({},{}) -> Monitor '{}' at ({},{}) {}x{}",
            x,
            y,
            monitor.name(),
            monitor.x(),
            monitor.y(),
            monitor.width(),
            monitor.height()
        );
    }

    let image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture monitor: {}", e))?;

    let rgba_image =
        ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(image.width(), image.height(), image.into_raw())
            .ok_or_else(|| "Failed to create image buffer".to_string())?;

    Ok((
        rgba_image,
        monitor.x(),
        monitor.y(),
        monitor.width(),
        monitor.height(),
        monitor.scale_factor() as f64,
    ))
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
