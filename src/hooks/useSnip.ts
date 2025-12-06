// JustSnap - Snipping State Management Hook

import { useState } from 'react';
import type { CaptureMode, Region, Screenshot } from '../types';

export function useSnip() {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<CaptureMode>('capture');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);

  const activateSnip = (newMode: CaptureMode = 'capture') => {
    setIsActive(true);
    setMode(newMode);
  };

  const deactivateSnip = () => {
    setIsActive(false);
    setSelectedRegion(null);
  };

  const selectRegion = (region: Region) => {
    setSelectedRegion(region);
  };

  const captureScreenshot = (imageData: string) => {
    if (!selectedRegion) return;

    const newScreenshot: Screenshot = {
      id: `screenshot-${Date.now()}`,
      imageData,
      region: selectedRegion,
      timestamp: Date.now(),
      mode,
    };

    setScreenshot(newScreenshot);
  };

  return {
    isActive,
    mode,
    selectedRegion,
    screenshot,
    activateSnip,
    deactivateSnip,
    selectRegion,
    captureScreenshot,
    setMode,
  };
}
