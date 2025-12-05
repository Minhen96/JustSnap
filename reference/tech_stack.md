
AI Snipping Tool — Tech Stack (MVP)
"Capture, annotate, summarize, translate, and export — all in one tool."

---
1. Desktop Runtime (Core Platform)
✔ Tauri (Recommended)
Why Tauri:
- Lightweight (5–10 MB build)
- Extremely fast startup
- Secure (Rust backend)
- Easy to integrate with React
- System APIs available

You will use Tauri for:
System-Level Features
- Screen capture (full screen, multi-monitor)
- Region cropping (using raw pixel buffer)
- Floating overlay window (for snip area selector)
- Always-on-top PiP window
- Global hotkeys (Ctrl + Shift + S)
- File read/write (save images/videos/code)
- Clipboard access
- App tray icon (optional)
- Auto-launch on startup (optional)
This is the backbone of your snipping tool.

---
2. Frontend (UI / Snip / Annotation)
Frontend runs inside Tauri (React SPA inside a native shell).
✔ React
The main UI framework.
✔ TailwindCSS
For styling.
✔ ShadCN UI
For ready components like:
- Dialogs
- Menus
- Sidebar
- Toolbars
- Dropdowns
- Tabs
- Input fields
✔ Konva.js
For annotation canvas:
- Drawing (pen)
- Highlighter
- Shapes (rect, circle, arrow)
- Blur
- Image layers
- Drag & resize elements
✔ Custom HTML Canvas / Overlay
For area selection UI:
- Draw a dimmed fullscreen overlay
- User drags to select snip rectangle
- Snip region returned to Rust
✔ Monaco Editor (VS Code Editor)
For:
- Viewing generated React/Vue/Flutter code
- Syntax highlighting
- Inline editing
✔ JSZip
For exporting:
- Code component file(s)
- Styles
- Metadata
- Assets
 as a downloadable ZIP.

---
3. Screen Capture, Video, Hotkeys
(Handled by Tauri + modern browser APIs inside the app)
✔ Tauri Screen Capture Plugin / Custom Rust Plugin
For:
- Capture full-screen image buffer
- Multi-monitor support
- Fast bitmap extraction
✔ MediaRecorder API (Optional)
Used in your React/Tauri frontend:
- Record screen section
- Export WebM/MP4
- Works fine inside Tauri
✔ Tauri Global Hotkeys
For:
- Trigger snipping anywhere on desktop
- Snapshot shortcut
- PiP activation
- Paste/Copy shortcuts

---
4. AI / OCR / Code Generation
✔ OpenAI API (GPT-5 family)
Use for:
- AI summary of screenshot
- AI explanation mode (step-by-step reasoning)
- AI translate EN ↔ CN ↔ Malay
- UI code generation:
  - HTML + Tailwind
  - React component
  - Vue component
  - Flutter Widget
  - Next.js component
✔ Tesseract.js (Client-side OCR)
Use for:
- Text detection from screenshot
- Language auto-detection
- Extracted text for summary/translation
No backend needed.

---
5. Export Features
✔ Image Export
- PNG
- JPG
- Annotated screenshot
✔ Text Export
- TXT
- Markdown (AI summary + OCR text)
- JSON (structure)
✔ Video Export
- MP4
- WebM
✔ Code Export
- Monaco Editor → user review → export ZIP (via JSZip)

---
6. Optional / Future Enhancements
(Not needed for MVP but good later)
Optional Cloud & Sync
- Supabase / Firebase / Cloudflare R2
- User login
- Save snips + history
Optional Collaboration
- Live shared annotation
- Team workspace
Optional Plugins
- VS Code extension integration
- Browser extension companion
Optional Advanced AI
- Multi-state component detection (hover/active/error)
- Design token extraction
- Responsive layout generation

---
7. Future Enhancements
- State Management: Zustand / Redux (for multi-component shared state)
- File Storage / Cloud Sync: S3 / Supabase / Cloudflare R2
- Team Collaboration / Multi-device access
- Advanced OCR / handwriting / formula recognition
- AI plugin integration / extended translation  (Notion, Slack, VS Code)