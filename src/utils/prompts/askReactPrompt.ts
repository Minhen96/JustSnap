// JustSnap - Ask React Prompt Templates
// Reference: feature.md (Ask React flow), use_case.md SC-13, tech_stack.md (React + Tailwind)

const askReactJsonSchema = `{
  "name": "ComponentName",
  "description": "What the component renders and key UX details",
  "code": "React + TypeScript component code (use Tailwind classes if styling is needed)",
  "props": {
    "propName": "Describe purpose/type (e.g., string: CTA label)"
  },
  "styles": "Optional additional styles if not inline with Tailwind"
}`;

/**
 * Stage 1: Ask LLM to describe the snip and produce a concise, code-ready prompt.
 */
export function buildAskReactAnalysisPrompt(userPrompt?: string): string {
  return `You are an expert React front-end engineer helping to generate UI code from a screenshot.
Analyze the attached image and produce a concise, actionable prompt for code generation.
Focus on layout, hierarchy, components, copy, spacing, and interactions.
If the user provided extra guidance, merge it respectfully.

Respond with ONLY the prompt text (no JSON).

User guidance (optional):
${userPrompt || 'None provided.'}`;
}

/**
 * Stage 2: Generate React component code JSON from the image and the derived prompt.
 */
export function buildAskReactCodePrompt(): string {
  return `You are generating a React component from a screenshot and a prepared prompt.
- Use React + TypeScript with Tailwind CSS utilities when styling is needed.
- Make layout responsive; prefer flex/grid with sensible gaps.
- Keep code clean, composable, and ready to paste into a project.

Return ONLY JSON that matches this minimal schema:
${askReactJsonSchema}

Rules:
- Populate "name", "description", and "code" at minimum.
- Keep "props" keys concise; omit if none.
- Keep "styles" concise; omit if not needed.
- Do not wrap JSON in markdown fences.`;
}
