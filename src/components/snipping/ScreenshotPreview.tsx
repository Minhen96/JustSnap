// JustSnap - Screenshot Preview Component

import type { Screenshot } from '../../types';

interface ScreenshotPreviewProps {
  screenshot: Screenshot;
}

export function ScreenshotPreview({ screenshot }: ScreenshotPreviewProps) {
  return (
    <div className="relative">
      <img
        src={screenshot.imageData}
        alt="Screenshot preview"
        className="max-w-full max-h-full"
      />
    </div>
  );
}
