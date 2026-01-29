// JustSnap - Screen Capture Module
// Handles screen capture functionality using xcap

use image::RgbaImage;
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
            id: monitor.id().unwrap_or(0),
            name: monitor.name().unwrap_or_default(),
            x: monitor.x().unwrap_or(0),
            y: monitor.y().unwrap_or(0),
            width: monitor.width().unwrap_or(0),
            height: monitor.height().unwrap_or(0),
            scale_factor: monitor.scale_factor().unwrap_or(1.0) as f64,
            is_primary: monitor.is_primary().unwrap_or(false),
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
            let x = m.x().unwrap_or(0);
            let y = m.y().unwrap_or(0);
            let width = m.width().unwrap_or(0);
            let height = m.height().unwrap_or(0);
            let m_right = x + width as i32;
            let m_bottom = y + height as i32;
            center_x >= x && center_x < m_right && center_y >= y && center_y < m_bottom
        })
        .or_else(|| monitors.iter().find(|m| m.is_primary().unwrap_or(false)))
        .ok_or_else(|| "No suitable monitor found".to_string())?;

    // Convert region coordinates to monitor-local space and scale by DPI factor

    // The region coordinates (from frontend) and monitor coordinates (from xcap) are likely
    // both in physical pixels (for xcap 0.8.1), so significant scaling is handled by the frontend/xcap consistency.
    // However, strictly speaking, we just want the offset.
    // Note: If xcap 0.8.1 returns physical coordinates, we do NOT multiply by scale_factor.
    let local_region = CaptureRegion {
        x: (region.x - monitor.x().unwrap_or(0)),
        y: (region.y - monitor.y().unwrap_or(0)),
        width: region.width,
        height: region.height,
    };

    // Capture from the detected monitor
    let full_image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Convert to RgbaImage (xcap 0.8.1 returns RgbaImage directly)
    // let full_image = ... (removed manual conversion)

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
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or_else(|| "No primary monitor found".to_string())?;

    monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))
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
            let mx = m.x().unwrap_or(0);
            let my = m.y().unwrap_or(0);
            let width = m.width().unwrap_or(0);
            let height = m.height().unwrap_or(0);
            let m_right = mx + width as i32;
            let m_bottom = my + height as i32;
            x >= mx && x < m_right && y >= my && y < m_bottom
        })
        .or_else(|| monitors.iter().find(|m| m.is_primary().unwrap_or(false)))
        .ok_or_else(|| "No suitable monitor found".to_string())?;

    if cfg!(debug_assertions) {
        eprintln!(
            "[capture_monitor_at_point] Point ({},{}) -> Monitor '{}' at ({},{}) {}x{}",
            x,
            y,
            monitor.name().unwrap_or_default(),
            monitor.x().unwrap_or(0),
            monitor.y().unwrap_or(0),
            monitor.width().unwrap_or(0),
            monitor.height().unwrap_or(0)
        );
    }

    let rgba_image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture monitor: {}", e))?;

    Ok((
        rgba_image,
        monitor.x().unwrap_or(0),
        monitor.y().unwrap_or(0),
        monitor.width().unwrap_or(0),
        monitor.height().unwrap_or(0),
        monitor.scale_factor().unwrap_or(1.0) as f64,
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

    let rgba_image = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture monitor: {}", e))?;

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
