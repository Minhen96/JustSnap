# AI Agent Development Guidelines for JustSnap

## Purpose
This document provides clear instructions for AI coding agents (like Claude Code, Cursor, v0, etc.) working on the JustSnap project. Follow these guidelines to ensure consistent development aligned with project vision.

---

## Core Principle: Always Explain Before Implementing

**CRITICAL RULE**: Before implementing any feature or making architectural decisions that haven't been explicitly discussed with the user:

1. **STOP and EXPLAIN** your intended approach
2. **REFERENCE** the relevant sections from `/reference` folder docs
3. **PROPOSE** your implementation plan with rationale
4. **SUGGEST IMPROVEMENTS** (if applicable) - See section below
5. **WAIT** for user approval before proceeding

### When to Explain First
- Starting a new major feature (e.g., "Now I'll implement screen capture")
- Choosing between multiple implementation approaches
- Adding new dependencies or libraries
- Making architectural decisions (state management, folder structure, API design)
- Implementing AI/OCR integration patterns
- Setting up Tauri commands and IPC communication
- Designing component hierarchies

### When You Can Proceed Directly
- Fixing obvious bugs
- Following an already-approved implementation plan
- Making minor style/formatting adjustments
- Adding types that are clearly needed
- Writing tests for existing features

---

## Agent Suggestions: Improving UX, Performance, and Architecture

**YOU ARE ENCOURAGED** to suggest improvements when you spot opportunities for:
- Better user experience
- Performance optimizations
- More maintainable architecture
- Security enhancements
- Accessibility improvements
- Error handling strategies

### How to Propose Suggestions

When you identify an improvement opportunity, use this format:

```markdown
## 💡 Suggestion: [Improvement Title]

### Current Approach (from reference docs)
- Reference: [doc name] lines [X-Y]
- Current specification: [brief summary]

### Suggested Enhancement
[Describe your proposed improvement]

### Benefits
- **UX**: [How it improves user experience]
- **Performance**: [How it optimizes speed/memory/resources]
- **Architecture**: [How it improves code maintainability/scalability]
- **Security**: [How it enhances security]

### Trade-offs
- [Any downsides or additional complexity]
- [Increased development time]
- [Additional dependencies]

### Implementation Impact
- Files affected: [list]
- Estimated complexity: [Low/Medium/High]
- Breaking changes: [Yes/No]

Would you like me to implement this enhancement, or proceed with the original specification?
```

### Example Suggestions

**Example 1: UX Enhancement**
```markdown
## 💡 Suggestion: Add Keyboard Shortcuts to Annotation Tools

### Current Approach
- Reference: use_case.md lines 68-78
- Users must click toolbar buttons to switch between pen, highlighter, shapes, etc.

### Suggested Enhancement
Add keyboard shortcuts for quick tool switching:
- P = Pen
- H = Highlighter
- R = Rectangle
- C = Circle
- T = Text
- B = Blur
- Esc = Exit tool

### Benefits
- **UX**: Power users can annotate 3-5x faster without mouse movement
- **UX**: Matches industry standards (Photoshop, Figma behavior)
- **UX**: Reduces cognitive load for frequent users

### Trade-offs
- Need to add keyboard event listeners
- Need to show shortcuts in UI tooltips
- Slightly more testing required

### Implementation Impact
- Files affected: AnnotationToolbar.tsx, useAnnotation.ts
- Estimated complexity: Low
- Breaking changes: No
```

**Example 2: Performance Optimization**
```markdown
## 💡 Suggestion: Lazy Load AI Services

### Current Approach
- All AI services (OCR, translation, code generation) loaded on app startup
- Increases initial bundle size and startup time

### Suggested Enhancement
Use React.lazy() and dynamic imports to load AI services only when user clicks AI features:
- Load Tesseract.js only when OCR button clicked
- Load OpenAI client only when AI Chat/Summary clicked
- Load Monaco Editor only when code generation used

### Benefits
- **Performance**: Reduces initial bundle size by ~40% (estimated 2-3 MB)
- **Performance**: Faster app startup (200-500ms improvement)
- **Architecture**: Better code splitting and modularity

### Trade-offs
- Slight delay (1-2 seconds) on first use of AI features
- More complex loading states to manage

### Implementation Impact
- Files affected: ai.service.ts, ocr.service.ts, AIChatPanel.tsx, CodeGeneratorPanel.tsx
- Estimated complexity: Medium
- Breaking changes: No
```

**Example 3: Backend Architecture**
```markdown
## 💡 Suggestion: Cache Captured Screenshots in Tauri

### Current Approach
- Screenshot captured → immediately sent to React frontend
- Large images (4K+ displays) may cause IPC bottleneck

### Suggested Enhancement
Implement a Tauri-side image cache:
- Store captured screenshot in Rust memory/temp file
- Send only image metadata + file path to frontend
- Frontend requests image data only when needed (annotation, export)
- Clear cache after 5 minutes or on exit

### Benefits
- **Performance**: Reduces IPC payload size by 90%+
- **Performance**: Faster region selection response
- **Architecture**: Better separation of concerns
- **Memory**: Can implement smart compression in Rust

### Trade-offs
- More complex state management between Rust and React
- Need to handle cache cleanup edge cases

### Implementation Impact
- Files affected: src-tauri/src/commands.rs, src-tauri/src/cache.rs, ipc.service.ts
- Estimated complexity: Medium-High
- Breaking changes: Yes (changes IPC contract)
```

### Guidelines for Suggestions

**DO suggest when:**
- You identify a common UX pattern that improves usability
- You spot performance bottlenecks (large bundles, memory leaks, slow renders)
- You see opportunities for better error handling
- You notice security vulnerabilities
- You find more maintainable architectural patterns
- Industry best practices could improve the implementation

**DON'T suggest when:**
- It's just a personal preference without clear benefit
- It contradicts the core vision/UX flow in reference docs
- It adds significant complexity for marginal gains
- It requires changing the entire tech stack
- The user has already rejected similar suggestions

### Suggestion Etiquette

1. **Frame as options, not requirements**: "I suggest... Would you like me to implement this?"
2. **Always provide the baseline implementation first**: Suggest improvements after the MVP works
3. **Be honest about trade-offs**: Don't oversell complexity or time costs
4. **Respect "no"**: If user declines, implement the original spec without complaint
5. **Bundle related suggestions**: Don't overwhelm with 10 small suggestions; group them logically

---

## Required Reading: Reference Folder

Before starting ANY implementation, you MUST familiarize yourself with:

### 1. `/reference/use_case.md`
Contains:
- Complete UX flow (how the tool should behave)
- All 4 modes: Screen Capture, Scrolling Screenshot, Screen Recording, Live Snip
- Detailed use cases (UC-01 to LS-07)
- Edge cases and special scenarios
- Toolbar specifications for each mode

**Key Sections to Reference:**
- Lines 16-55: Core UX flow and mode switching
- Lines 64-93: Screen Capture toolbar items (your most common reference)
- Lines 94-106: Scrolling Screenshot workflow
- Lines 107-132: Screen Recording workflow
- Lines 133-142: Live Snip (PiP) features

### 2. `/reference/tech_stack.md`
Contains:
- Approved technology choices and WHY they were chosen
- What each library/tool is responsible for
- System architecture (Tauri + React)

**Key Sections to Reference:**
- Lines 7-26: Tauri responsibilities (MUST use Tauri for system features)
- Lines 29-68: Frontend stack (React, TailwindCSS, ShadCN, Konva, Monaco)
- Lines 91-109: AI/OCR implementation (OpenAI + Tesseract.js)

### 3. `/reference/feature_list.md`
Contains:
- Complete feature breakdown
- Project structure (lines 16-78)
- Feature specifications for all modes

**Key Sections to Reference:**
- Lines 16-78: Exact folder structure to follow
- Lines 81-88: Screen Capture features
- Lines 91-97: Screen Recording features
- Lines 100-106: Live Snip features
- Lines 109-115: UI Code Builder (signature feature)

---

## Development Workflow

### Phase 1: Planning
When user requests a feature:

1. **Read Reference Docs**
   ```
   Example: User says "Add screen capture"
   → Read use_case.md lines 64-93 (Screen Capture toolbar)
   → Read tech_stack.md lines 71-77 (Tauri Screen Capture)
   → Read feature_list.md lines 81-88 (Screen Capture features)
   ```

2. **Explain Your Plan**
   ```markdown
   I'll implement screen capture based on reference docs:

   From use_case.md (SC-01 to SC-18):
   - User presses Ctrl+Shift+S → fullscreen overlay appears
   - Mouse becomes crosshair cursor
   - User drags to select region
   - Toolbar appears with: [pen, highlight, shapes, blur, OCR, AI, export]

   From tech_stack.md:
   - Using Tauri Screen Capture Plugin (lines 73-77)
   - React overlay with HTML Canvas (lines 52-56)
   - Konva.js for annotations (lines 44-51)

   Implementation steps:
   1. Create Tauri command for screen capture
   2. Build fullscreen overlay component (SnipOverlay.tsx)
   3. Add RegionSelector with drag selection
   4. Create annotation toolbar with Konva canvas

   Does this approach align with your vision?
   ```

3. **Wait for Approval** before writing code

### Phase 2: Implementation

Follow the approved tech stack:

#### File Organization
```
src/
├── components/
│   ├── ui/              # ShadCN UI components only
│   ├── annotation/      # Konva-based tools
│   ├── snipping/        # Screen capture overlay & selector
│   ├── ai/              # AI panels (chat, summary, codegen)
│   └── editor/          # Monaco editor for code
├── services/
│   ├── ai.service.ts       # OpenAI API calls
│   ├── ocr.service.ts      # Tesseract.js
│   ├── codegen.service.ts  # UI code generation
│   └── ipc.service.ts      # Tauri IPC
├── hooks/
│   ├── useSnip.ts
│   ├── useAnnotation.ts
│   └── useAI.ts
├── utils/
│   ├── image.ts
│   ├── file.ts
│   └── prompts/         # AI prompt templates
```

#### Technology Rules

**MUST USE:**
- Tauri for ALL system-level features (hotkeys, screen capture, file system, clipboard)
- React + TypeScript for frontend
- TailwindCSS + ShadCN UI for styling
- Konva.js for canvas annotation
- Monaco Editor for code preview
- Tesseract.js for OCR
- OpenAI API for AI features
- JSZip for export bundles

**NEVER USE:**
- Electron (use Tauri instead)
- Vanilla canvas for annotations (use Konva)
- Other UI libraries besides ShadCN
- Other code editors besides Monaco

### Phase 3: Feature Implementation Pattern

For each major feature, follow this sequence:

#### Example: Implementing Screen Capture Mode

1. **Backend (Tauri)**
   ```
   src-tauri/src/commands.rs
   - Add capture_screen command
   - Return image buffer to frontend
   ```

2. **Frontend Components**
   ```
   src/components/snipping/SnipOverlay.tsx
   - Fullscreen transparent overlay
   - Custom cursor
   - Mode selector bar at top
   ```

3. **Region Selection**
   ```
   src/components/snipping/RegionSelector.tsx
   - Drag to select rectangle
   - Auto-detect windows on hover (use_case.md lines 42-52)
   - Return coordinates to Tauri
   ```

4. **Annotation Layer**
   ```
   src/components/annotation/CanvasStage.tsx
   - Load captured image
   - Konva stage for overlays
   - Toolbar with tools (use_case.md lines 68-90)
   ```

5. **AI Integration**
   ```
   src/services/ai.service.ts
   - OCR extraction
   - Translation
   - Summary generation
   - Code generation (signature feature)
   ```

---

## Key Feature Specifications

### 1. Screen Capture Toolbar
Reference: `use_case.md lines 68-90`

Must include (in order):
1. **Annotation Tools**: Pen, Highlighter, Shapes, Blur, Color picker, Text, Sticky label, Watermark
2. **AI Tools**: OCR, Translate, AI Chat, AI Summarize, AI Explain, Generate UI Code
3. **Actions**: Stick-on-screen, Copy, Save, Export MD, Exit

### 2. Mode Switching
Reference: `use_case.md lines 28-36`

Top bar must show:
```
[ Capture ]  [ Scrolling ]  [ Record ]  [ Live ]
```
- Default: Capture mode auto-enabled
- Clicking changes active mode
- Each mode has different toolbar (see use_case.md lines 64-142)

### 3. Auto-Detect Windows
Reference: `use_case.md lines 42-52`

On hover:
- Detect window boundaries
- Highlight entire app window
- Click to auto-select region
- Works across multi-monitor

### 4. AI Code Generation (Signature Feature)
Reference: `feature_list.md lines 109-123`

Flow:
1. User selects UI region
2. Click "Generate UI Code" in toolbar
3. AI detects layout, components, styles
4. Generate code for: HTML+CSS, React, Vue, Flutter, Next.js
5. Show in Monaco Editor
6. Export as ZIP with JSZip

---

## Common Implementation Patterns

### Pattern 1: Tauri Command
```rust
// src-tauri/src/commands.rs
#[tauri::command]
async fn capture_screen(x: i32, y: i32, width: i32, height: i32) -> Result<Vec<u8>, String> {
    // Implementation
}
```

```typescript
// src/services/ipc.service.ts
import { invoke } from '@tauri-apps/api/tauri'

export async function captureScreen(region: Region): Promise<Uint8Array> {
  return await invoke('capture_screen', {
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height
  })
}
```

### Pattern 2: Konva Annotation Tool
```typescript
// src/components/annotation/tools/PenTool.tsx
import { Line } from 'react-konva'

export function PenTool({ isActive, color, strokeWidth }) {
  const [lines, setLines] = useState([])

  // Follow use_case.md SC-03 specification
  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          stroke={color}
          strokeWidth={strokeWidth}
          tension={0.5}
          lineCap="round"
        />
      ))}
    </>
  )
}
```

### Pattern 3: AI Service Call
```typescript
// src/services/ai.service.ts
export async function generateCodeFromScreenshot(
  imageBase64: string,
  framework: 'react' | 'vue' | 'flutter'
): Promise<string> {
  const prompt = buildCodeGenPrompt(framework) // from utils/prompts/

  const response = await openai.chat.completions.create({
    model: 'gpt-4-vision-preview',
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Generate UI code for this screenshot' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` }}
        ]
      }
    ]
  })

  return response.choices[0].message.content
}
```

---

## Validation Checklist

Before submitting ANY implementation, verify:

- [ ] Feature matches specification in `use_case.md`
- [ ] Technology choices align with `tech_stack.md`
- [ ] File structure follows `feature_list.md` lines 16-78
- [ ] Tauri used for system features (not web APIs)
- [ ] ShadCN UI used for all UI components
- [ ] Konva.js used for canvas annotations
- [ ] TypeScript types are complete
- [ ] No console.log statements left in production code
- [ ] Error handling is implemented
- [ ] Multi-monitor support considered (if relevant)

---

## Communication Template

When starting a new feature, use this format:

```markdown
## Feature: [Feature Name]

### Reference Docs
- use_case.md: [line numbers] - [brief summary]
- tech_stack.md: [line numbers] - [brief summary]
- feature_list.md: [line numbers] - [brief summary]

### Implementation Plan
1. [Step 1 with justification]
2. [Step 2 with justification]
3. [Step 3 with justification]

### Files to Create/Modify
- `src-tauri/src/[file]` - [purpose]
- `src/components/[file]` - [purpose]
- `src/services/[file]` - [purpose]

### Technology Choices
- [Library/Tool]: [Why, based on tech_stack.md]

### 💡 Optional Suggestions
[If you spotted improvements, briefly mention them here or say "None at this time"]
- **UX**: [Brief suggestion]
- **Performance**: [Brief suggestion]
- **Architecture**: [Brief suggestion]

### Questions/Clarifications
- [Any ambiguities or choices needed]

Does this approach align with your vision? Should I proceed with the baseline implementation?
```

---

## Edge Cases to Handle

Reference: `use_case.md lines 430-458`

Always consider:
- **EC-01**: Multi-monitor support (overlay on all screens)
- **EC-02**: ESC key cancels any overlay
- **EC-03**: Show error if file save fails
- **EC-04**: Undo annotation actions
- **EC-05**: Hotkey conflict warnings
- **EC-06**: Large region handling (memory management)
- **EC-07**: Auto-detect scrollable regions

---

## Signature Feature Priority

The **Screenshot-to-UI-Code** generator is the signature feature. When implementing:

1. Reference `feature_list.md lines 109-123`
2. Support multiple frameworks: React, Vue, Flutter, Next.js, HTML+Tailwind
3. Use Monaco Editor for code preview
4. Export as ZIP with proper file structure
5. This is what makes JustSnap unique — prioritize polish here

---

## Final Reminders

1. **Always read reference docs first** before making assumptions
2. **Explain your approach** before implementing anything new
3. **Suggest improvements** when you spot opportunities for better UX, performance, or architecture
4. **Reference specific line numbers** from docs in your explanations
5. **Use approved tech stack** — no substitutions without discussion
6. **Follow the UX flow exactly** as described in use_case.md
7. **Ask questions** if anything is ambiguous or multiple valid approaches exist

---

## Quick Reference Links

- **UX Flow**: `reference/use_case.md` lines 16-55
- **Screen Capture Toolbar**: `reference/use_case.md` lines 68-90
- **Tech Stack Decisions**: `reference/tech_stack.md` all
- **Project Structure**: `reference/feature_list.md` lines 16-78
- **Signature Feature**: `feature_list.md` lines 109-123

---

**Remember**: This project has a clear vision. Your role is to implement that vision faithfully, not to redesign it. When in doubt, reference the docs and ask the user.
