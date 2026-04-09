import React from 'react';

interface DevIndicatorProps {
  isDevelopment?: boolean;
}

export const DevIndicator: React.FC<DevIndicatorProps> = ({ isDevelopment }) => {
  if (!isDevelopment) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium shadow-lg border border-yellow-600">
        🔓 Development Mode
      </div>
    </div>
  );
};
