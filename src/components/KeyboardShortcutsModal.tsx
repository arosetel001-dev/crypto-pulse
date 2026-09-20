import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'C', desc: 'Open 24/7 Global Chat Room' },
    { key: 'N', desc: 'Compose new crypto post or signal' },
    { key: 'J / K', desc: 'Navigate down / up through market feed posts' },
    { key: 'L', desc: 'Like currently focused post' },
    { key: 'T', desc: 'Tip current post author in crypto' },
    { key: 'V', desc: 'View major price volatility & whale alerts' },
    { key: 'M', desc: 'Toggle Dark / Light high-contrast mode' },
    { key: '/', desc: 'Focus global cashtag & topic search' },
    { key: 'Esc', desc: 'Close any active modal dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1017] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Keyboard Navigation Shortcuts</h3>
              <p className="text-[11px] text-slate-400 font-mono">Terminal Speed Browsing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of shortcuts */}
        <div className="p-4 space-y-2 overflow-y-auto max-h-[70vh] no-scrollbar">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300 font-medium">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono font-bold text-cyan-400 text-[11px] shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950 text-center">
          <p className="text-[11px] text-slate-400">
            Press <kbd className="font-mono text-cyan-400">?</kbd> anywhere to open this menu.
          </p>
        </div>
      </div>
    </div>
  );
};
