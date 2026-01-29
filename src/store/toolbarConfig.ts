// JustSnap - Toolbar Configuration Types

/**
 * All available toolbar item IDs
 */
export type ToolbarItemId =
    // Annotation tools
    | 'rectangle'
    | 'circle'
    | 'arrow'
    | 'pen'
    | 'highlighter'
    | 'text'
    | 'blur'
    // Style tools
    | 'colorPicker'
    | 'strokeWidth'
    // History
    | 'undo'
    | 'redo'
    // AI Tools
    | 'ocr'
    | 'translation'
    | 'generateCode'
    // Actions
    | 'pin'
    | 'copy'
    | 'save'
    | 'close';

/**
 * Configuration for a single toolbar item
 */
export interface ToolbarItemConfig {
    id: ToolbarItemId;
    enabled: boolean;
}

/**
 * Groups of toolbar items for organization
 */
export type ToolbarGroupId =
    | 'annotationTools'
    | 'styleTools'
    | 'historyTools'
    | 'aiTools'
    | 'actionTools';

/**
 * Configuration for a toolbar group
 */
export interface ToolbarGroupConfig {
    id: ToolbarGroupId;
    label: string;
    items: ToolbarItemConfig[];
}

/**
 * Full toolbar configuration
 */
export interface ToolbarConfig {
    groups: ToolbarGroupConfig[];
}

/**
 * Default toolbar configuration
 */
export const DEFAULT_TOOLBAR_CONFIG: ToolbarConfig = {
    groups: [
        {
            id: 'annotationTools',
            label: 'Annotation Tools',
            items: [
                { id: 'rectangle', enabled: true },
                { id: 'circle', enabled: true },
                { id: 'arrow', enabled: true },
                { id: 'pen', enabled: true },
                { id: 'highlighter', enabled: true },
                { id: 'text', enabled: true },
                { id: 'blur', enabled: true },
            ],
        },
        {
            id: 'styleTools',
            label: 'Style',
            items: [
                { id: 'colorPicker', enabled: true },
                { id: 'strokeWidth', enabled: true },
            ],
        },
        {
            id: 'historyTools',
            label: 'History',
            items: [
                { id: 'undo', enabled: true },
                { id: 'redo', enabled: true },
            ],
        },
        {
            id: 'aiTools',
            label: 'AI Tools',
            items: [
                { id: 'ocr', enabled: true },
                { id: 'translation', enabled: true },
                { id: 'generateCode', enabled: true },
            ],
        },
        {
            id: 'actionTools',
            label: 'Actions',
            items: [
                { id: 'pin', enabled: true },
                { id: 'copy', enabled: true },
                { id: 'save', enabled: true },
                { id: 'close', enabled: true },
            ],
        },
    ],
};

/**
 * Metadata for each toolbar item (for display in settings)
 */
export const TOOLBAR_ITEM_METADATA: Record<ToolbarItemId, { label: string; description: string }> = {
    rectangle: { label: 'Rectangle', description: 'Draw rectangles' },
    circle: { label: 'Circle', description: 'Draw circles' },
    arrow: { label: 'Arrow', description: 'Draw arrows' },
    pen: { label: 'Pen', description: 'Freehand drawing' },
    highlighter: { label: 'Highlighter', description: 'Highlight areas' },
    text: { label: 'Text', description: 'Add text annotations' },
    blur: { label: 'Blur', description: 'Blur sensitive areas' },
    colorPicker: { label: 'Color Picker', description: 'Change annotation color' },
    strokeWidth: { label: 'Stroke Width', description: 'Adjust line thickness' },
    undo: { label: 'Undo', description: 'Undo last action' },
    redo: { label: 'Redo', description: 'Redo last action' },
    ocr: { label: 'OCR', description: 'Extract text from image' },
    translation: { label: 'Translation', description: 'Translate extracted text' },
    generateCode: { label: 'Generate Code', description: 'Generate UI code from screenshot' },
    pin: { label: 'Pin', description: 'Pin screenshot on screen' },
    copy: { label: 'Copy', description: 'Copy to clipboard' },
    save: { label: 'Save', description: 'Save to file' },
    close: { label: 'Close', description: 'Close editor' },
};
