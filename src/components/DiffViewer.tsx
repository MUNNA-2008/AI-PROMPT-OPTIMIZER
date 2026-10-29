import React from 'react';
import { ArrowRight, Copy, Check } from 'lucide-react';

interface DiffViewerProps {
  original: string;
  optimized: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, optimized }) => {
  const [copiedOrig, setCopiedOrig] = React.useState(false);
  const [copiedOpt, setCopiedOpt] = React.useState(false);

  const origTokens = Math.ceil(original.length / 4);
  const optTokens = Math.ceil(optimized.length / 4);
  const origWords = original.trim().split(/\s+/).filter(Boolean).length;
  const optWords = optimized.trim().split(/\s+/).filter(Boolean).length;

  const copyOrig = () => {
    navigator.clipboard.writeText(original);
    setCopiedOrig(true);
    setTimeout(() => setCopiedOrig(false), 2000);
  };

  const copyOpt = () => {
    navigator.clipboard.writeText(optimized);
    setCopiedOpt(true);
    setTimeout(() => setCopiedOpt(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Metrics bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500">Original Measure:</span>{' '}
            <span className="font-mono tabular-nums text-slate-300 font-medium">
              {origWords} words · ~{origTokens} tokens
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
          <div>
            <span className="text-slate-500">Optimized Measure:</span>{' '}
            <span className="font-mono tabular-nums text-emerald-400 font-medium">
              {optWords} words · ~{optTokens} tokens
            </span>
          </div>
        </div>
        <div className="text-slate-500">
          Structure expansion ratio:{' '}
          <span className="font-mono tabular-nums text-slate-300">
            {origTokens > 0 ? (optTokens / origTokens).toFixed(1) : 1}x precision depth
          </span>
        </div>
      </div>

      {/* Side by side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Original Draft */}
        <div className="flex flex-col border border-slate-800 rounded-lg bg-slate-900/40 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-medium text-slate-300">Original Raw Prompt</span>
            <button
              onClick={copyOrig}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {copiedOrig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedOrig ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 flex-1">
            <pre className="font-mono-code text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text font-normal">
              {original || '(No original prompt entered)'}
            </pre>
          </div>
        </div>

        {/* Optimized Prompt */}
        <div className="flex flex-col border border-indigo-900/40 rounded-lg bg-indigo-950/10 overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-indigo-950/30 border-b border-indigo-900/30 text-xs text-indigo-300">
            <span className="font-medium text-indigo-200">Production Optimized Prompt</span>
            <button
              onClick={copyOpt}
              className="flex items-center gap-1 text-indigo-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedOpt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedOpt ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-4 flex-1">
            <pre className="font-mono-code text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed select-text font-normal">
              {optimized}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
