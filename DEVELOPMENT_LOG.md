# JustSnap Development Log

**Project**: AI-Powered Snipping Tool
**Started**: December 5, 2024
**Status**: In Development

---

## Table of Contents
- [Project Overview](#project-overview)
- [Development Phases](#development-phases)
- [Phase 1: Project Foundation](#phase-1-project-foundation)
- [Phase 2: Core UX Flow (MVP)](#phase-2-core-ux-flow-mvp)
- [Phase 3: First Complete Mode](#phase-3-first-complete-mode)
- [Future Phases](#future-phases)
- [Key Decisions](#key-decisions)
- [Challenges & Solutions](#challenges--solutions)

---

## Project Overview

### Vision
JustSnap is an AI-powered desktop snipping tool that combines:
- Screen capture with smart region detection
- Rich annotation capabilities
- OCR and translation
- AI-powered analysis and summarization
- **Signature Feature**: Screenshot-to-UI-Code generation

### Tech Stack
- **Runtime**: Tauri (Rust backend)
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + ShadCN UI
- **Canvas**: Konva.js
- **Code Editor**: Monaco Editor
- **OCR**: Tesseract.js
- **AI**: OpenAI API
- **State**: Zustand (planned)

### Reference Documentation
- `reference/use_case.md` - UX flows and feature specifications
- `reference/tech_stack.md` - Technology choices and justifications
- `reference/feature_list.md` - Complete feature list and project structure
- `reference/ai_agent_guidelines.md` - Development workflow for AI agents

---

## Development Phases

### Phase 1: Project Foundation ✅ COMPLETED
**Goal**: Set up project structure and verify basic functionality

**Tasks**:
- [x] Fix Tauri configuration file
- [x] Create complete folder structure
- [x] Set up IPC service layer
- [x] Implement basic Tauri commands
- [x] Verify app runs successfully

**Completed**: December 5, 2024
**Complexity**: Low
**Files Created**: 33 new files (28 frontend + 5 backend)
**Lines of Code**: ~2000+ lines across TypeScript and Rust

---

### Phase 2: Core UX Flow (MVP) ✅ COMPLETED
**Goal**: Implement the basic snipping workflow

**Tasks**:
- [x] Global hotkey system (Ctrl+Shift+S)
- [x] Fullscreen overlay with transparent background
- [x] Region selection (drag-to-select)
- [x] Screen capture Tauri command
- [x] High-DPI support with pixel ratio scaling
- [ ] Mode selector bar (4 modes) - Deferred to Phase 3
- [ ] Multi-monitor support - Deferred to Phase 3

**Reference**: `use_case.md` lines 16-55

**Completed**: December 6, 2024
**Complexity**: Medium

---

### Phase 3: First Complete Mode 📋 Planned
**Goal**: Complete Screen Capture mode with annotations

**Tasks**:
- [ ] Konva canvas integration
- [ ] Annotation toolbar
- [ ] Pen tool
- [ ] Highlighter tool
- [ ] Shapes (rectangle, circle, arrow)
- [ ] Blur/Mosaic tool
- [ ] Text/Sticky notes
- [ ] Color picker
- [ ] Copy to clipboard
- [ ] Save as image
- [ ] Exit overlay

**Reference**: `use_case.md` lines 64-93

**Estimated Complexity**: Medium-High

---

## Future Phases

### Phase 4: AI Integration
- OCR (Tesseract.js)
- Translation
- AI Chat
- AI Summarize
- **Signature Feature**: UI Code Generation

### Phase 5: Additional Modes
- Scrolling Screenshot
- Screen Recording
- Live Snip (PiP)

### Phase 6: Polish & Optimization
- Error handling
- Loading states
- Performance optimization
- User preferences
- System tray integration

---

## Phase 1: Project Foundation & Core Flow ✅ COMPLETED

### Started: December 5, 2024
### Completed: December 6, 2024

---

#### Step 1.1 - 1.5: Foundation Setup ✅ COMPLETED
(See previous entries for details)

---

#### Step 1.6: Core Functionality Implementation ✅ COMPLETED
**Date**: December 6, 2024
**Task**: Implement the complete capture lifecycle

**What was done**:
- **Global Hotkey**: Implemented `Ctrl+Shift+S` using `tauri-plugin-global-shortcut`.
- **Overlay Window**: Created a transparent, fullscreen, always-on-top window.
- **Region Selection**: Built a drag-to-select component with SVG masking for the "dimmed" effect.
- **Screen Capture**: Implemented backend Rust command using `xcap` crate.
- **DPI Scaling**: Fixed high-DPI monitor issues by handling `devicePixelRatio`.
- **Screenshot Editor**: Created a preview window to show the captured image.
- **Toolbar**: Added a floating toolbar (UI only for now) with Close/Copy/Save actions.
- **System Tray**: Added tray icon with Show/Quit options for background management.
- **Background Startup**: Configured app to launch hidden, acting as a true utility.

**Key Fixes**:
- **Zombie Processes**: Fixed issue where hotkeys stopped working by ensuring clean process termination.
- **Window Interaction**: Fixed "click-through" bugs by correctly managing `set_ignore_cursor_events`.
- **Infinite Loops**: Optimized React `useEffect` and Zustand selectors to prevent render loops.
- **Window State**: Ensured window correctly minimizes/hides after closing the editor.

**Status**: ✅ Complete

---

#### Step 2.1: Region Selection Enhancement ✅ COMPLETED
**Date**: December 6, 2024
**Task**: Implement advanced region selection features

**What was done**:
- **Drag-to-Select**: Implemented smooth mouse-based region selection.
- **Live Dimensions Tooltip**: Shows real-time width x height during selection.
- **SVG Overlay with Hole Effect**:
  - Dimmed background (rgba(0,0,0,0.4))
  - Clear "hole" showing the selected region
  - Used SVG path with `fill-rule="evenodd"` for proper masking
- **Visual Feedback**:
  - Blue dashed border (`#3b82f6`) around selection
  - Crosshair cursor for precision
  - Minimum size validation (10x10 pixels) to avoid accidental clicks
- **Bi-directional Selection**: Supports dragging in any direction (handles negative width/height)
- **DPI Scaling**: Properly scales coordinates using `window.devicePixelRatio` for accurate capture on high-DPI monitors

**Technical Details**:
- Component: `src/components/snipping/RegionSelector.tsx`
- Uses React hooks (`useState`, `useRef`) for state management
- Zustand store integration for global state
- Dynamic SVG path generation for overlay effect

**Status**: ✅ Complete

---

#### Step 2.2: System Tray & Welcome Screen ✅ COMPLETED
**Date**: December 6, 2024
**Task**: Improve system tray and welcome screen UX

**What was done**:
- **System Tray Menu**:
  - **Show**: Brings back the welcome screen when clicked
    - Calls `window.show()`, `window.set_focus()`, `window.unminimize()`
    - Enables mouse interaction with `set_ignore_cursor_events(false)`
  - **Quit**: Exits the application with `app.exit(0)`
  - Menu appears on left-click for quick access
- **Welcome Screen**:
  - Shows when app starts (not just in background)
  - Displays hotkey status indicator (green = ready, yellow = initializing)
  - Feature showcase with checkmarks
  - Development phase progress indicator
  - Test button for manual overlay trigger (dev only)
  - Automatically hides when:
    - Overlay is active (`isOverlayActive`)
    - A screenshot is captured (`currentScreenshot`)
- **Window State Management**:
  - Proper handling of show/hide states
  - Prevents "zombie" windows
  - Clean transitions between states

**Technical Details**:
- Backend: `src-tauri/src/lib.rs` (tray setup)
- Frontend: `src/App.tsx` (welcome screen logic)
- Conditional rendering based on Zustand store state

**Status**: ✅ Complete

---

## Progress Summary

### Completed ✅
- **Project Structure**: Full Tauri + React setup with modular architecture.
- **Core Snipping Loop**:
  - Hotkey (`Ctrl+Shift+S`) → Overlay → Region Selection → Capture → Preview
- **Region Selection**:
  - Drag-to-select with live dimension display
  - SVG-based dimming with transparent selection area
  - Visual feedback (border, tooltip, cursor)
  - Minimum size validation
- **Screen Capture**:
  - High-DPI support with automatic scaling
  - Rust backend using `xcap` crate
  - PNG format with proper encoding
- **System Integration**:
  - System tray with Show/Quit options
  - Background mode with proper window state management
  - Global hotkey registration on startup
- **Welcome Screen**:
  - Feature showcase and status indicators
  - Conditional visibility based on app state
  - Debug panel for development
- **UI/UX**:
  - Smooth transitions and animations
  - Transparent overlay with proper layering
  - Clean, modern design with TailwindCSS

### Up Next 📋
- **Phase 3: Annotation Tools**
  - Integrate Konva.js for canvas-based drawing
  - Implement Pen, Highlighter, Shapes tools
  - Add Text annotations and Blur/Mosaic tool
  - Build annotation toolbar with tool selection
  - Add color picker and stroke width controls

---

**Last Updated**: December 6, 2024
**Current Phase**: Phase 2 ✅ COMPLETED
**Next Milestone**: Phase 3 - Annotation Tools

