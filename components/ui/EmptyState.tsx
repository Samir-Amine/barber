import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-stone-900/40 border border-stone-800 my-4">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      {title && <h3 className="text-lg font-semibold text-stone-200 mb-1">{title}</h3>}
      <p className="text-stone-400 text-sm max-w-md">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-amber-500 text-stone-950 font-semibold rounded-lg hover:bg-amber-400 transition-all text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
