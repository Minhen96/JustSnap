// JustSnap - OCR Loading State Component
// Shows loading spinner and progress indicator

interface OCRLoadingStateProps {
  progress: number;
}

export function OCRLoadingState({ progress }: OCRLoadingStateProps) {
  const getMessage = () => {
    if (progress < 33) return 'Analyzing text...';
    if (progress < 66) return 'Optimizing accuracy...';
    return 'Finalizing results...';
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">Processing Image...</p>
        <p className="text-xs text-gray-500 mt-1">{getMessage()}</p>
        <div className="mt-3 w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
