import React from 'react';

const SnippingToolUI = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Al-Powered Snipping Tool</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
        <div className="flex items-center text-green-500 mb-2">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          <span>Hotkey Ready!</span>
        </div>
        <p className="mb-2">Press <kbd className="bg-gray-100 px-2 py-1 rounded text-sm">Ctrl+Shift+S</kbd> to start snipping</p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Test Overlay (Dev Only)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <ul>
          <li className="flex items-center mb-2"><span className="text-blue-500 mr-2">✓</span>Screen Capture with Annotations</li>
          <li className="flex items-center mb-2"><span className="text-blue-500 mr-2">✓</span>AI-Powered OCR & Translation</li>
          <li className="flex items-center mb-2"><span className="text-blue-500 mr-2">✓</span>Screenshot to UI Code</li>
          <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span>Screen Recording & Live Snip</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-lg font-semibold mb-2">Test: SearchInput component</h2>
        <div className="relative">
          <input type="text" placeholder="Search" className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 pl-10 pr-10" />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span role="img" aria-label="Pear">🍐</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>Phase 1: Complete <span className="text-green-500">✓</span></div>
        <div>Phase 2: In Progress <span role="img" aria-label="Loading">🚧</span></div>
      </div>
    </div>
  );
};

export default SnippingToolUI;
