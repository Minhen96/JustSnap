
AI Snipping Tool — Full Feature List (Simplified)
"Capture, annotate, summarize, translate, and export — all in one tool."
Welcome to **JustSnap!**, your AI-powered snipping tool that makes coding feel like floating in space:  

- Snap any part of your screen or app window  
- Annotate with pen, highlighter, shapes, blur/mosaic, text, and sticky notes  
- Extract text via OCR and translate it on-the-fly  
- Chat with AI about your screenshot or recording  
- Generate **React, Vue, or Flutter UI code** instantly  
- Record your screen or live sessions with optional AI summaries  

All without ever leaving your orbit 🌌.


project-root/
│── src-tauri/                    # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── commands.rs           # Capture, hotkeys, overlay, FS ops
│   │   ├── screen_capture.rs     # Custom screen capture logic
│   │   ├── overlays.rs           # Floating window & snip overlay
│   │   ├── hotkeys.rs            # Global shortcuts
│   │   └── utils.rs
│   ├── tauri.conf.json
│   └── Cargo.toml
│
│── src/                          # React frontend
│   ├── app/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── routes/               # (optional)
│   │
│   ├── components/
│   │   ├── ui/                   # ShadCN UI components
│   │   ├── annotation/           # Konva annotation tools
│   │   │   ├── CanvasStage.tsx
│   │   │   ├── tools/
│   │   │   │   ├── PenTool.tsx
│   │   │   │   ├── ShapeTool.tsx
│   │   │   │   ├── BlurTool.tsx
│   │   │   │   └── HighlighterTool.tsx
│   │   ├── snipping/
│   │   │   ├── SnipOverlay.tsx   # Selection overlay window
│   │   │   ├── RegionSelector.tsx
│   │   │   └── ScreenshotPreview.tsx
│   │   ├── ai/
│   │   │   ├── AIChatPanel.tsx
│   │   │   ├── SummaryPanel.tsx
│   │   │   └── CodeGeneratorPanel.tsx
│   │   └── editor/
│   │       ├── MonacoEditor.tsx
│   │       └── CodePreview.tsx
│   │
│   ├── services/
│   │   ├── ai.service.ts         # OpenAI API
│   │   ├── ocr.service.ts        # Tesseract.js
│   │   ├── codegen.service.ts    # Prompt builder for HTML/React/Flutter
│   │   └── ipc.service.ts        # Tauri commands to Rust
│   │
│   ├── hooks/
│   │   ├── useSnip.ts            # Activate snipping
│   │   ├── useAnnotation.ts
│   │   └── useAI.ts
│   │
│   ├── utils/
│   │   ├── image.ts              # Convert buffers, crop, etc.
│   │   ├── file.ts               # Export PNG/TXT/ZIP
│   │   └── prompts/              # Prompt templates
│   │       ├── summaryPrompt.ts
│   │       ├── translationPrompt.ts
│   │       └── uiCodePrompt.ts
│   │
│   ├── assets/
│   └── index.css
│
├── package.json
└── README.md

---
1. Screen Capture / Screenshot
- Capture types: full screen, selected area, specific window, scrolling page
- Stick-on-screen: resize and drag anywhere
- Annotation & editing: pen/pencil, highlighter, shapes (rectangle, circle, arrow), blur, crop/resize, color picker, add text/notes, sticky labels
- OCR & layout detection: detect text, preserve paragraphs, tables, bullets; editable/selectable text
- AI-powered features: instant summary, key points, step-by-step explanation
- AI translation: multi-language support (EN ↔ CN ↔ Malay)
- Export: image (PNG/JPG), OCR text (TXT/MD), AI summary (MD/PDF)

---
2. Screen Recording
- Record full screen, selected region, or specific window
- Stick-on-screen: floating, resizable PiP while recording
- AI-powered features: summary, key timestamps, main actions, transcript, tutorial steps
- Annotation & editing: apply overlays, draw/highlight while paused or on frame capture
- AI translation: translate detected text in video frames
- Export: video (MP4/WebM), OCR text, AI summary (MD/PDF)

---
3. Live Snip / Picture-in-Picture
- Snap a selected live area and float on screen (drag & resize)
- Real-time AI explanation: continuously read & summarize content
- Annotation & editing: live drawing, sticky notes, highlight, blur
- OCR & layout detection: live text recognition, editable output
- AI translation: real-time translation of text in live window
- Export: snapshot of PiP, OCR text, AI summary

---
4. Signature Feature — Snapshot → UI Code Builder
- Snap webpage → AI detects layout, components, and styles
- Multi-state detection (normal/hover/disabled/error)
- Design token extraction (colors, spacing, fonts)
- Responsive layout generation
- Export ZIP folder of full code
- Generate code: HTML + CSS, TailwindCSS, React + JSX, Vue, Next.js component, Flutter (optional)

---
5. Interactive Editing UI
- Live preview
- Editable text, colors, size, spacing
- Auto-regenerate code instantly
- Built-in code editor

---
6. Global Features Across All Capture Types
- Stick-on-screen / drag & resize for all screenshots, recordings, and live PiP
- AI summarization & explanation
- Multi-language translation
- Annotation & editing (pen, highlighter, shapes, blur, text, sticky notes)
- OCR & layout detection
- Export (image, video, OCR text, AI summary, code for UI snaps)

---
7. Future Implementation / Enhancements
- Cloud Sync & Storage: save captures, recordings, and AI outputs to cloud for multi-device access
- Collaboration: share snapshots, annotations, or recordings with team members in real-time
- Advanced OCR: handwriting recognition, formulas, diagrams
- AI Chat / Interaction: talk to the screenshot or video to query content, rewrite, or extract code
- Real-time Video Analysis: live transcription, translation, or action recognition for recorded/streaming video
- Customizable AI Modes: E.g., explain like a teacher, developer, or student; content summarization style presets
- Version History: track previous annotations, AI outputs, and edits
- Plugin / Integration: connect with Notion, Slack, VS Code, or other productivity tools
- Advanced Export Options: PDF reports, AI-generated tutorials, or presentation slides
- Cross-platform Desktop App: Windows, Mac, Linux with native performance

---
