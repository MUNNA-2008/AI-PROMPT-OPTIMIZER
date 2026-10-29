import React, { useState } from 'react';
import {
  Search,
  Trash2,
  Copy,
  Check,
  Star,
  ExternalLink,
  Download,
  Terminal,
  Bookmark,
} from 'lucide-react';
import { SavedPrompt } from '../types';

interface HistoryViewProps {
  savedPrompts: SavedPrompt[];
  onDeletePrompt: (id: string) => void;
  onToggleStar: (id: string) => void;
  onLoadInStudio: (saved: SavedPrompt) => void;
  onLoadInTestBench: (saved: SavedPrompt) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  savedPrompts,
  onDeletePrompt,
  onToggleStar,
  onLoadInStudio,
  onLoadInTestBench,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPrompts = savedPrompts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originalPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.result.optimizedPrompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStar = !starredOnly || p.starred;
    return matchesSearch && matchesStar;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedPrompts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `promptcraft-history-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Saved Prompts & Revision Archive
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Access past engineered prompts, review scorecards, and load them back into the workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedPrompts.length > 0 && (
            <>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All (.json)</span>
              </button>

              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Archive</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved prompts..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => setStarredOnly(!starredOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
            starredOnly
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>Starred Only</span>
        </button>
      </div>

      {/* Prompts list */}
      {filteredPrompts.length === 0 ? (
        <div className="p-12 border border-slate-800/80 rounded-xl bg-slate-900/30 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto text-slate-500">
            <Bookmark className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">No saved prompts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {savedPrompts.length === 0
              ? 'Optimize a prompt in the Studio and click the "Save" button to keep it in your permanent library.'
              : 'Try clearing your search query or unchecking "Starred Only".'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrompts.map((p) => (
            <div
              key={p.id}
              className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4 hover:border-slate-700/80 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleStar(p.id)}
                    className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
                    title={p.starred ? 'Unstar' : 'Star'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        p.starred ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                  <h3 className="text-sm font-bold text-white">{p.title}</h3>
                </div>

                {/* Clean unboxed metadata */}
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                  <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                  <span aria-hidden="true">·</span>
                  <span>{p.targetModel}</span>
                  <span aria-hidden="true">·</span>
                  <span>~{Math.ceil(p.result.optimizedPrompt.length / 4)} tokens</span>
                </div>
              </div>

              {/* Snippet preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-lg">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">Original Draft:</div>
                  <div className="text-xs font-mono-code text-slate-400 line-clamp-3">
                    {p.originalPrompt}
                  </div>
                </div>

                <div className="p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-lg">
                  <div className="text-[11px] font-semibold text-indigo-300 mb-1">Optimized Output:</div>
                  <div className="text-xs font-mono-code text-slate-200 line-clamp-3">
                    {p.result.optimizedPrompt}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleCopy(p.id, p.result.optimizedPrompt)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadInTestBench(p)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-400 hover:bg-emerald-950/30 rounded border border-emerald-900/40 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Test Bench</span>
                  </button>

                  <button
                    onClick={() => onLoadInStudio(p)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-indigo-400 hover:bg-indigo-950/30 rounded border border-indigo-900/40 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in Studio</span>
                  </button>

                  <button
                    onClick={() => onDeletePrompt(p.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Delete prompt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
