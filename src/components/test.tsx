import React, { useState } from 'react';

interface JustSnapContainerProps {
  status: string;
  onTestOverlayClick: () => void;
}

const JustSnapContainer: React.FC<JustSnapContainerProps> = ({ status, onTestOverlayClick }) => {
  const [screenCapture, setScreenCapture] = useState(true);
  const [ocrTranslation, setOcrTranslation] = useState(true);
  const [screenshotToCode, setScreenshotToCode] = useState(true);
  const [screenRecording, setScreenRecording] = useState(true);

  return (
    <div className="border-2 border-dashed border-sky-500 p-4 rounded">
      <h1 className="text-3xl font-bold text-gray-800">JustSnap</h1>
      <h2 className="text-xl text-gray-800">AI-Powered Snipping Tool</h2>
      <p className="text-sm text-gray-800">Status: {status}</p>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
        onClick={onTestOverlayClick} // TODO: Implement test overlay functionality
      >
        Test Overlay
      </button>
      <ul>
        <ListItem label="Screen Capture with Annotations" checked={screenCapture} onChange={() => setScreenCapture(!screenCapture)} />
        <ListItem label="AI-Powered OCR & Translation" checked={ocrTranslation} onChange={() => setOcrTranslation(!ocrTranslation)} />
        <ListItem label="Screenshot to UI Code" checked={screenshotToCode} onChange={() => setScreenshotToCode(!screenshotToCode)} />
        <ListItem label="Screen Recording & Live Snip" checked={screenRecording} onChange={() => setScreenRecording(!screenRecording)} />
      </ul>
    </div>
  );
};

interface ListItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const ListItem: React.FC<ListItemProps> = ({ label, checked, onChange }) => (
  <li className="flex items-center">
    <label className="inline-flex items-center">
      <input type="checkbox" className="form-checkbox h-5 w-5 text-blue-600" checked={checked} onChange={onChange} />
      <span className="ml-2 text-gray-700">{label}</span>
    </label>
  </li>
);

export default JustSnapContainer;
