import React from 'react';
import type { CareerProfileMobileActionsProps } from '../../../types/dashboard';

const CareerProfileMobileActions: React.FC<CareerProfileMobileActionsProps> = ({
  saving,
  hasUnsavedChanges,
  onDiscard,
  onSave,
}) => (
  <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
    <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur p-2 shadow-xl flex items-center gap-2">
      <button
        onClick={onDiscard}
        className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 border border-gray-200"
      >
        Discard
      </button>
      <button
        onClick={onSave}
        disabled={saving || !hasUnsavedChanges}
        className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-white bg-black disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  </div>
);

export default CareerProfileMobileActions;
