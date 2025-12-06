// JustSnap - AI Chat Panel
// Reference: use_case.md SC-11

interface AIChatPanelProps {
  screenshot: string; // base64 image
  onClose: () => void;
}

export function AIChatPanel({ screenshot, onClose }: AIChatPanelProps) {
  // TODO: Implement AI chat interface
  // TODO: Send screenshot + user question to OpenAI
  // TODO: Display conversation history

  return (
    <div className="fixed right-4 top-20 w-96 bg-white rounded-lg shadow-xl p-4">
      <h3 className="font-semibold mb-4">AI Chat</h3>
      {/* Chat interface will go here */}
      <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
        Close
      </button>
    </div>
  );
}
