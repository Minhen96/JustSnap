// JustSnap - Screenshot Preview Component
// Displays screenshot with optional badge

interface ScreenshotPreviewProps {
  screenshot: string;
  badgeText?: string;
}

export function ScreenshotPreview({ screenshot, badgeText = 'Snip attached' }: ScreenshotPreviewProps) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
      <img
        src={screenshot}
        alt="Captured screenshot preview"
        className="w-full h-40 object-contain bg-white"
      />
      <div className="absolute bottom-2 right-2 text-[11px] bg-black/70 text-white px-2 py-1 rounded-full">
        {badgeText}
      </div>
    </div>
  );
}
