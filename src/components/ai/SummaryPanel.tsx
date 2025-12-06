// JustSnap - AI Summary Panel
// Reference: use_case.md SC-12

import type { AISummary } from '../../types/index';

interface SummaryPanelProps {
  summary: AISummary | null;
  isLoading: boolean;
  onClose: () => void;
}

export function SummaryPanel({ summary, isLoading, onClose }: SummaryPanelProps) {
  return (
    <div className="fixed right-4 top-20 w-96 bg-white rounded-lg shadow-xl p-4">
      <h3 className="font-semibold mb-4">AI Summary</h3>

      {isLoading && <div>Generating summary...</div>}

      {summary && (
        <div>
          <p className="mb-4">{summary.summary}</p>
          <h4 className="font-medium mb-2">Key Points:</h4>
          <ul className="list-disc pl-5">
            {summary.keyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
        Close
      </button>
    </div>
  );
}
