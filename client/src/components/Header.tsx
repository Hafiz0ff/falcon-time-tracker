import React from 'react';
import { Timer, UserPlus } from 'lucide-react';

interface HeaderProps {
  onOpenAddEmployee: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddEmployee }) => {
  return (
    <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
            <Timer className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            Falcon Time Tracker
          </span>
        </div>

        <button
          onClick={onOpenAddEmployee}
          type="button"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>New Employee</span>
        </button>
      </div>
    </header>
  );
};
