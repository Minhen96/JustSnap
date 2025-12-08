// JustSnap - Screenshot Feedback Component
// Displays toast notifications for user feedback

interface ScreenshotFeedbackProps {
  message: string | null;
}

export function ScreenshotFeedback({ message }: ScreenshotFeedbackProps) {
  if (!message) return null;

  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-black/80 text-white px-6 py-3 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
