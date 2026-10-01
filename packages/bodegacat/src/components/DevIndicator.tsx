import React from "react";

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
      <div className="rounded-full border border-yellow-600 bg-yellow-500 px-3 py-1 text-sm font-medium text-black shadow-lg">
        🔓 Development Mode
      </div>
    </div>
  );
};
