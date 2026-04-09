import React from 'react';

interface DevIndicatorProps {
  isDevelopment?: boolean;
  /** Built app + wrangler on localhost with BODEGACAT_ADMIN_LOCAL_BYPASS */
  localPreviewBypass?: boolean;
}

export const DevIndicator: React.FC<DevIndicatorProps> = ({
  isDevelopment,
  localPreviewBypass,
}) => {
  if (localPreviewBypass) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="rounded-full border border-amber-700 bg-amber-500 px-3 py-1 text-sm font-medium text-black shadow-lg">
          🔓 Local preview — admin bypass
        </div>
      </div>
    );
  }

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
