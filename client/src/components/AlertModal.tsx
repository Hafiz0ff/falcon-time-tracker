import React from 'react';
import { X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/30 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-lg border border-zinc-200">
        <div className="flex items-start justify-between pb-2">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-600 my-3 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Understood
          </button>
          {onConfirm && confirmText && (
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
