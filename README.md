# JustSnap

**JustSnap** is an AI-powered desktop snipping tool built with Tauri, React, and Rust. It combines traditional screen capture with modern AI capabilities and a seamless, high-performance experience.

<div align="center">
  <img src="https://github.com/user-attachments/assets/01d47519-64da-4ad4-8099-72be3e08f724" alt="Welcome Screen" width="800" />
</div>

## ✨ Features

### 📸 Core Capture
**Global Hotkey**: `Ctrl+Shift+S` (Customizable) to snap instantly.

<div align="center">
  <img src="https://github.com/user-attachments/assets/3363536b-8bb7-42b7-8481-ac6563c60267" alt="Snipping Overlay" width="600" />
</div>

- **Region Selection**: Drag to select, with live dimensions.
- **High-DPI Support**: Crystal clear captures on any monitor.
- **Sticky Windows**: "Pin" captures to your screen as always-on-top references.
- **Clipboard Integration**: Copy as image, or save directly to disk.
- **System Tray**: Quick access to history and settings.

<div align="center">
  <img src="https://github.com/user-attachments/assets/a981b3b7-cf88-4a0e-907b-5ecf7bf6bf17" alt="System Tray" width="400" />
</div>

### 🎨 Annotation & Editing
**Professional Tools**: Pen, Highlighter, Arrow, Rectangle, Circle, and Text.

<div align="center">
  <img src="https://github.com/user-attachments/assets/e4e4213c-a542-49ec-b6a4-775f65b94bb9" alt="Toolbar" width="800" />
</div>

- **Blur Tool**: Securely redact sensitive info.
- **Customizable**: Adjustable stroke widths, colors, and opacity.
- **History**: Full Undo/Redo support.

### 🤖 AI Powers (Gemini Integration)
- **Ask React**: Ask questions about your screenshot ("What is this error?", "How do I center this?").
- **Code Generation**: Convert UI screenshots into React/Tailwind, Vue, Flutter, etc.
- **OCR & Translation**: Extract text and translate instantly.

### ⚙️ Customization
**Toolbar Config**: Enable/Disable specific tools, customize shortcuts, and more.

<div align="center">
  <img src="https://github.com/user-attachments/assets/a73844a0-6306-4afb-b6a1-0abed5a393cb" alt="Settings Page" width="800" />
</div>

- **Behavior Settings**: Auto-close after copy/save, customizable hotkeys.
- **Theme**: Dark/Light mode support.

## 🛠️ Tech Stack

- **Core**: [Rust](https://www.rust-lang.org/) + [Tauri v2](https://tauri.app/)
- **Frontend**: React 19 + TypeScript + Vite
- **UI**: TailwindCSS + Radix UI + Lucide Icons
- **State**: Zustand (with Persist)
- **AI**: Google Gemini Flash 1.5

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Rust (latest stable)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) (Build Tools for C++ on Windows)

### Development
1. **Clone & Install**
   ```bash
   git clone https://github.com/yourusername/justsnap.git
   cd justsnap
   npm install
   ```

2. **Run Dev Environment**
   ```bash
   npm run tauri dev
   ```

### Building & Releasing

#### Local Build
To create an installer (`.exe`) on your machine:
```bash
npm run tauri build
```
The installer will be in `src-tauri/target/release/bundle/nsis/`.

#### Automatic GitHub Release
This repo is configured with **GitHub Actions** to build automatically when you tag a release.

1. Commit your changes.
2. Create and push a tag (e.g., `v1.0.0`):
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will build the app and upload the installer to the **Releases** page of your repository.

**Note on Secrets**: 
The workflow uses `GITHUB_TOKEN` which is provided automatically by GitHub. You do **not** need to set any manual secrets for the basic release workflow to work.
