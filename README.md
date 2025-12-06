# JustSnap

**JustSnap** is an AI-powered desktop snipping tool built with Tauri, React, and Rust. It combines traditional screen capture with modern AI capabilities like OCR, translation, and UI code generation.

## Features

### Core Screenshot Capabilities
- **Global Hotkey**: Press `Ctrl+Shift+S` anywhere to start snipping.
- **Smart Region Selection**: Drag to select any area of your screen with live dimension display.
- **Instant Preview**: Immediately view your captured screenshot in the editor window.
- **System Tray Support**: Runs quietly in the background; access via the tray icon.
  - **Show**: Click to bring the welcome screen back.
  - **Quit**: Click to exit the application.
- **High Performance**: Built on Rust (Tauri) for minimal resource usage.
- **Modern UI**: Clean, transparent overlay interface with smooth transitions.
- **High-DPI Support**: Automatic device pixel ratio scaling for crisp captures.

### Annotation Tools
- **Pen Tool**: Free-hand drawing on screenshots
- **Highlighter**: Highlight important areas with transparency
- **Shapes**: Add rectangles, circles, and other shapes
- **Blur Tool**: Privacy-focused blurring for sensitive information
- **Color Picker**: Customizable colors for all annotation tools

### AI-Powered Features
- **OCR (Optical Character Recognition)**: Extract text from screenshots with confidence scores powered by Tesseract.js
- **Translation**: Translate extracted or selected text into multiple languages
- **UI Code Generation**: Convert UI screenshots into code for React, Vue, Flutter, HTML/Tailwind, and Next.js
- **AI Chat Panel**: Ask questions about your screenshots and get AI-powered insights

## Tech Stack

- **Backend**: Rust (Tauri)
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS + Radix UI
- **State Management**: Zustand
- **Canvas Rendering**: Konva + React-Konva
- **Code Editor**: Monaco Editor
- **AI Integration**: Google Generative AI (Gemini)
- **OCR Engine**: Tesseract.js

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

### Basic Screenshot Capture
1. **Launch**: The app starts with a welcome screen. It will also run in the background via the system tray.
2. **Capture**: Press `Ctrl+Shift+S` anywhere to open the snipping overlay.
3. **Select**: Click and drag to select a region. You'll see:
   - Live dimension display (width x height)
   - Dimmed area outside your selection
   - Blue dashed border around the selected region
4. **Preview**: Release the mouse to capture. The screenshot opens in the editor window.

### Annotation Tools
Once you've captured a screenshot, use the annotation toolbar to enhance your image:
- **Pen**: Draw free-hand annotations
- **Highlighter**: Highlight important sections with transparency
- **Shapes**: Add rectangles, circles, and other shapes
- **Blur**: Blur sensitive information for privacy
- **Color Picker**: Choose custom colors for all tools

### AI Features
After capturing a screenshot, access powerful AI features:
- **OCR**: Click the OCR button to extract text from your screenshot
  - View confidence scores for accuracy
  - Copy extracted text to clipboard
- **Translation**: Translate extracted text into multiple languages
- **Code Generation**: Convert UI screenshots into code
  - Select your target framework (React, Vue, Flutter, etc.)
  - View generated code in Monaco Editor
  - Copy or export the code
- **AI Chat**: Ask questions about your screenshot and get AI-powered insights

### System Tray
- **Show**: Brings the welcome screen back if closed
- **Quit**: Exits the application completely

## Development Status

### Completed Features ✅

#### Phase 1: Core Screenshot Functionality
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

#### Phase 2: Annotation Tools
- [x] **Pen Tool**: Free-hand drawing with customizable colors and stroke width
- [x] **Highlighter Tool**: Semi-transparent highlighting
- [x] **Shape Tool**: Rectangles, circles, and other geometric shapes
- [x] **Blur Tool**: Privacy-focused blurring with adjustable intensity
- [x] **Color Picker**: Radix UI-based color selection for all tools
- [x] **Canvas Integration**: Konva-based annotation layer

#### Phase 3: AI Features
- [x] **OCR Integration**: Tesseract.js-powered text extraction
  - Confidence scores for accuracy feedback
  - Copy-to-clipboard functionality
  - Progress indicators
- [x] **Translation Panel**: Multi-language translation support
  - Dedicated translation window
  - Integration with extracted text
- [x] **UI Code Generation**: AI-powered code generation
  - Support for React, Vue, Flutter, HTML/Tailwind, Next.js
  - Monaco Editor integration for code preview
  - Framework selection interface
- [x] **AI Chat Panel**: Interactive AI assistance for screenshots
  - Powered by Google Gemini
  - Context-aware screenshot analysis

### In Progress 🚧
- [ ] **Enhanced Code Generation**: Improving code quality and accuracy
- [ ] **Additional Export Formats**: Support for more image formats
- [ ] **Text Annotation Tool**: Add text directly to screenshots
- [ ] **Cloud Storage Integration**: Save screenshots to cloud services
- [ ] **History & Gallery**: Browse and manage past screenshots
- [ ] **Custom Hotkeys**: User-configurable keyboard shortcuts
- [ ] **Video Recording**: Capture screen recordings with annotations

## License

MIT
