import React from 'react';
import { Sparkles, Terminal, BookOpen, History, Plus } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'testbench' | 'templates' | 'history';
  onTabChange: (tab: 'studio' | 'testbench' | 'templates' | 'history') => void;
  onNewOptimization: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onNewOptimization,
  savedCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <button
          onClick={() => onTabChange('studio')}
          className="text-lg font-bold tracking-tight text-white hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
        >
          PromptCraft AI
        </button>
      </div>

      {/* Zone 2: 4 clean single-line navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => onTabChange('studio')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'studio'
              ? 'text-indigo-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>

        <button
          onClick={() => onTabChange('testbench')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'testbench'
              ? 'text-indigo-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Live Test Bench</span>
        </button>

        <button
          onClick={() => onTabChange('templates')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'templates'
              ? 'text-indigo-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'history'
              ? 'text-indigo-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
          {savedCount > 0 && (
            <span className="text-xs font-mono tabular-nums text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
              {savedCount}
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNewOptimization}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-indigo-900/30 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Prompt</span>
        </button>
      </div>
    </header>
  );
};
