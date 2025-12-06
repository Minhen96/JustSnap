// JustSnap - Monaco Editor Wrapper
// For viewing and editing generated code

import { Editor } from '@monaco-editor/react';

interface MonacoEditorProps {
  code: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
}

export function MonacoEditor({ code, language, onChange, readOnly = false }: MonacoEditorProps) {
  return (
    <Editor
      height="400px"
      language={language}
      value={code}
      onChange={onChange}
      theme="vs-dark"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
