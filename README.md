# JustSnap

**JustSnap** is an AI-powered desktop snipping tool built with Tauri, React, and Rust. It combines traditional screen capture with modern AI capabilities like OCR, translation, and UI code generation.

## Features

- **Global Hotkey**: Press `Ctrl+Shift+S` anywhere to start snipping.
- **Smart Region Selection**: Drag to select any area of your screen with live dimension display.
- **Instant Preview**: Immediately view your captured screenshot in the editor window.
- **System Tray Support**: Runs quietly in the background; access via the tray icon.
  - **Show**: Click to bring the welcome screen back.
  - **Quit**: Click to exit the application.
- **High Performance**: Built on Rust (Tauri) for minimal resource usage.
- **Modern UI**: Clean, transparent overlay interface with smooth transitions.
- **High-DPI Support**: Automatic device pixel ratio scaling for crisp captures.

## Tech Stack

- **Backend**: Rust (Tauri)
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Rust** (latest stable)
- **System Dependencies**: Follow the [Tauri Prerequisites Guide](https://tauri.app/v1/guides/getting-started/prerequisites) for your OS (Visual Studio Build Tools for Windows, etc.).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/justsnap.git
   cd justsnap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

   This will install:
   - Frontend dependencies (React, TypeScript, Vite, TailwindCSS, etc.)
   - Tauri CLI (automatically included in `devDependencies`)

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

### Developer Commands

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run tauri dev

# Build for production
npm run tauri build

# Run frontend only (for UI development)
npm run dev

# Lint code
npm run lint

# Tauri CLI commands (via npx)
npx tauri dev        # Start dev server
npx tauri build      # Build production app
npx tauri info       # Show environment info
```

**Note**: The Tauri CLI is included in the project's `devDependencies`, so you don't need to install it globally. All Tauri commands can be run via `npm run tauri` or `npx tauri`.

## Usage

1. **Launch**: The app starts with a welcome screen. It will also run in the background via the system tray.
2. **Capture**: Press `Ctrl+Shift+S` anywhere to open the snipping overlay.
3. **Select**: Click and drag to select a region. You'll see:
   - Live dimension display (width x height)
   - Dimmed area outside your selection
   - Blue dashed border around the selected region
4. **Preview**: Release the mouse to capture. The screenshot opens in the preview window.
5. **System Tray**:
   - **Show**: Brings the welcome screen back if closed.
   - **Quit**: Exits the application completely.

## Development Status

### Completed Features ✅
- [x] **Global Hotkey System**: `Ctrl+Shift+S` registered on app startup
- [x] **Fullscreen Overlay**: Transparent, always-on-top overlay window
- [x] **Region Selection**:
  - Drag-to-select with live dimension tooltip
  - SVG-based dimming effect with "hole" for selected region
  - Blue dashed border for visual feedback
  - Minimum size validation (10x10 pixels)
- [x] **Screen Capture**:
  - High-DPI support with automatic pixel ratio scaling
  - Rust-based capture using `xcap` crate
  - PNG format output
- [x] **Screenshot Preview**: Dedicated window for viewing captures
- [x] **System Tray Integration**:
  - Background mode
  - Show/Quit menu options
  - Proper window state management
- [x] **Welcome Screen**:
  - Feature showcase
  - Hotkey status indicator
  - System tray controls

### In Progress 🚧
- [ ] **Phase 2: Annotation Tools**
  - Drawing (Pen, Shapes)
  - Text annotations
  - Blur/Mosaic tool

### Planned 📋
- [ ] **Phase 3: AI Features**
  - OCR (Optical Character Recognition)
  - Text translation
  - AI-powered UI code generation

## License

MIT
