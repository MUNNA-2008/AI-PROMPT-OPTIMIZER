import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Play,
  Bookmark,
  BookmarkCheck,
  Sliders,
  ShieldAlert,
  RotateCcw,
  Cpu,
  Brain,
  Zap,
} from 'lucide-react';
import {
  TargetModel,
  OptimizationStrategy,
  Tone,
  PromptOptimizationResult,
  SavedPrompt,
} from '../types';
import { PROMPT_TEMPLATES } from '../data/templates';
import { DiffViewer } from './DiffViewer';
import { optimizePromptLocally } from '../services/promptOptimizer';

interface StudioViewProps {
  onSendToTestBench: (original: string, optimized: string, systemInstruction?: string) => void;
  onSavePrompt: (prompt: SavedPrompt) => void;
  savedPrompts: SavedPrompt[];
  externalDraft?: {
    prompt: string;
    model?: TargetModel;
    strategy?: OptimizationStrategy;
  } | null;
}

export const StudioView: React.FC<StudioViewProps> = ({
  onSendToTestBench,
  onSavePrompt,
  savedPrompts,
  externalDraft,
}) => {
  const [draftPrompt, setDraftPrompt] = useState<string>('');
  const [targetModel, setTargetModel] = useState<TargetModel>('gemini-3.8-flash');
  const [strategy, setStrategy] = useState<OptimizationStrategy>('crisp');
  const [tone, setTone] = useState<Tone>('authoritative');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Optimization state
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PromptOptimizationResult | null>(null);

  // Active view tab on right
  const [activeOutputTab, setActiveOutputTab] = useState<
    'optimized' | 'split' | 'variations' | 'critique' | 'breakdown' | 'diff'
  >('optimized');

  // Copy states
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedSystem, setCopiedSystem] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedVariationId, setCopiedVariationId] = useState<string | null>(null);

  // Apply external draft if provided
  useEffect(() => {
    if (externalDraft) {
      setDraftPrompt(externalDraft.prompt);
      if (externalDraft.model) setTargetModel(externalDraft.model);
      if (externalDraft.strategy) setStrategy(externalDraft.strategy);
    }
  }, [externalDraft]);

  // Quick contextual clarifying suggestions for brief prompts
  const getQuickSuggestions = (prompt: string) => {
    const p = prompt.toLowerCase();
    if (p.includes('sql') || p.includes('query')) {
      return ['Filter for last 90 days', 'Include index advice', 'Limit to top 20'];
    }
    if (p.includes('json') || p.includes('extract')) {
      return ['Output RFC-8259 JSON only', 'Handle null fields', 'Validate amounts as float'];
    }
    if (p.includes('code') || p.includes('react') || p.includes('function')) {
      return ['Include strict TypeScript types', 'Add error handling', 'OWASP XSS security check'];
    }
    if (p.includes('email') || p.includes('outreach')) {
      return ['Under 120 words', 'Focus on single CTA', 'Highlight quantifiable outcome'];
    }
    return ['Target executive audience', 'Specify JSON output format', 'Include negative constraints'];
  };

  const handleOptimize = async () => {
    if (!draftPrompt.trim()) {
      setError('Please enter a draft prompt or pick a starter template.');
      return;
    }

    setIsOptimizing(true);
    setError(null);

    // Realistic processing animation settling within 300ms
    setTimeout(() => {
      try {
        const optimized = optimizePromptLocally(
          draftPrompt,
          targetModel,
          strategy,
          tone,
          customInstructions
        );
        setResult(optimized);
        setActiveOutputTab('optimized');
      } catch (err: any) {
        setError(err?.message || 'Failed to optimize prompt.');
      } finally {
        setIsOptimizing(false);
      }
    }, 280);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleOptimize();
    }
  };

  const copyText = (text: string, type: 'main' | 'system' | 'user' | string) => {
    navigator.clipboard.writeText(text);
    if (type === 'main') {
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 2000);
    } else if (type === 'system') {
      setCopiedSystem(true);
      setTimeout(() => setCopiedSystem(false), 2000);
    } else if (type === 'user') {
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    } else {
      setCopiedVariationId(type);
      setTimeout(() => setCopiedVariationId(null), 2000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!result) return;
    const content = `# Optimized Prompt Specification
Target Model: ${targetModel}
Strategy: ${strategy}
Date: ${new Date().toISOString()}

## Optimized Prompt
\`\`\`
${result.optimizedPrompt}
\`\`\`

## System Instruction
\`\`\`
${result.systemInstruction || 'N/A'}
\`\`\`

## User Prompt Template
\`\`\`
${result.userPrompt || 'N/A'}
\`\`\`

## Critique & Improvements
${result.critique.summary}

### Improvements Made:
${result.critique.improvementsMade.map((imp) => `- ${imp}`).join('\n')}

### Recommended Parameters:
- Temperature: ${result.recommendedParams.temperature}
- Top-P: ${result.recommendedParams.topP}
- Notes: ${result.recommendedParams.notes}
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimized-prompt-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isSaved = result
    ? savedPrompts.some((p) => p.originalPrompt.trim() === draftPrompt.trim())
    : false;

  const handleSave = () => {
    if (!result) return;
    const firstLine = draftPrompt.trim().split('\n')[0].slice(0, 40);
    const title = firstLine.length < draftPrompt.trim().length ? `${firstLine}...` : firstLine;
    const newSaved: SavedPrompt = {
      id: `prompt-${Date.now()}`,
      title: title || 'Optimized Prompt',
      timestamp: Date.now(),
      originalPrompt: draftPrompt,
      targetModel,
      strategy,
      result,
      starred: true,
    };
    onSavePrompt(newSaved);
  };

  const draftTokenEstimate = Math.ceil(draftPrompt.length / 4);
  const suggestions = draftPrompt.trim().length > 3 && draftPrompt.trim().length < 80 ? getQuickSuggestions(draftPrompt) : [];

  return (
    <div className="flex-1 flex flex-col xl:flex-row min-h-[calc(100vh-61px)]">
      {/* LEFT COLUMN: Input & Prompt Engineering Controls */}
      <div className="w-full xl:w-[480px] 2xl:w-[520px] p-6 border-b xl:border-b-0 xl:border-r border-slate-800 bg-slate-900/30 flex flex-col shrink-0 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Draft or Raw Prompt
            </label>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {draftPrompt.length} chars · ~{draftTokenEstimate} tokens
            </div>
          </div>

          <div className="relative">
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste any rough prompt, objective, or instruction here... (e.g. 'Extract all names and addresses from this email and output JSON')"
              rows={8}
              className="w-full p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono-code resize-y leading-relaxed"
            />
            {draftPrompt && (
              <button
                onClick={() => setDraftPrompt('')}
                className="absolute top-2.5 right-2.5 text-xs text-slate-500 hover:text-slate-300 transition-colors bg-slate-900/80 px-2 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick contextual chips */}
          {suggestions.length > 0 && (
            <div className="mt-2.5 p-2.5 bg-indigo-950/30 border border-indigo-900/40 rounded-lg">
              <div className="text-xs text-indigo-300 mb-1.5 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Quick clarifications (click to append):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setDraftPrompt((prev) => `${prev.trim()}. ${sug}.`)
                    }
                    className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-indigo-900/60 border border-slate-700/60 px-2.5 py-1 rounded transition-colors text-left cursor-pointer"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick starter templates */}
        <div>
          <div className="text-xs text-slate-500 mb-2 font-medium">Quick Starters:</div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_TEMPLATES.slice(0, 4).map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setDraftPrompt(tpl.draftPrompt);
                  setTargetModel(tpl.targetModel);
                  setStrategy(tpl.strategy);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded transition-colors cursor-pointer"
              >
                {tpl.title.split(' ')[0]} {tpl.title.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Optimization Controls */}
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          {/* Target Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Model Architecture
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setTargetModel('gemini-3.8-flash')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  targetModel === 'gemini-3.8-flash'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  Gemini 3.8 Flash
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Fast, low latency, all-purpose</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetModel('gemini-4-argon')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  targetModel === 'gemini-4-argon'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  Gemini 4 Argon
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">STEM, deep logic & math</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetModel('claude-3-7-sonnet')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  targetModel === 'claude-3-7-sonnet'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">Claude 3.7 Sonnet</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Nuanced prose & style</div>
              </button>

              <button
                type="button"
                onClick={() => setTargetModel('gpt-4o')}
                className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  targetModel === 'gpt-4o'
                    ? 'border-indigo-500 bg-indigo-950/40 text-white'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200">GPT-4o</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Versatile instructions</div>
              </button>
            </div>
          </div>

          {/* Framework / Strategy */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Optimization Framework
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                {
                  id: 'crisp' as OptimizationStrategy,
                  title: 'CRISP / CO-STAR Structured',
                  desc: 'Context, Role, Instruction, Schema, Positive & Negative Constraints',
                },
                {
                  id: 'few-shot' as OptimizationStrategy,
                  title: 'Few-Shot Exemplars',
                  desc: 'Includes input-to-output demonstration pairs for exact pattern matching',
                },
                {
                  id: 'cot' as OptimizationStrategy,
                  title: 'Chain-of-Thought (Deep Reasoning)',
                  desc: 'Forces explicit step-by-step thinking & self-verification before answer',
                },
                {
                  id: 'role-guardrails' as OptimizationStrategy,
                  title: 'Role & Strict Negative Guardrails',
                  desc: 'High-persona framing with explicit "what NOT to do" boundaries',
                },
                {
                  id: 'token-efficient' as OptimizationStrategy,
                  title: 'Token-Efficient API Mode',
                  desc: 'Compact, zero-fluff directives for high-throughput batch pipelines',
                },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStrategy(s.id)}
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                    strategy === s.id
                      ? 'border-indigo-500/80 bg-indigo-950/30 text-white'
                      : 'border-slate-800/80 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="mt-0.5 w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center shrink-0">
                    {strategy === s.id && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{s.title}</div>
                    <div className="text-[11px] text-slate-500">{s.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone & Advanced Toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Persona Tone
              </label>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <Sliders className="w-3 h-3" />
                <span>{showAdvanced ? 'Hide Directives' : 'Custom Directives'}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['authoritative', 'concise', 'academic', 'instructional', 'creative'] as Tone[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-1.5 px-2 text-xs rounded border capitalize transition-colors text-center cursor-pointer ${
                      tone === t
                        ? 'border-indigo-500 bg-indigo-950/40 text-white font-medium'
                        : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
          </div>

          {showAdvanced && (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
              <label className="block text-xs text-slate-400">
                Additional Constraints or Output Directives (Optional)
              </label>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., Must return valid RFC-8259 JSON, max 100 words"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Submit Optimize Button */}
          <button
            type="button"
            disabled={isOptimizing}
            onClick={handleOptimize}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 cursor-pointer"
          >
            {isOptimizing ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Architecting Optimized Prompt...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Optimize Prompt (⌘ + Enter)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Optimization Spec, Variations, Critique & Diff */}
      <div className="flex-1 flex flex-col bg-slate-950/60 overflow-y-auto">
        {!result && !isOptimizing ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/40 border border-indigo-900/50 flex items-center justify-center text-indigo-400 mb-4">
              <Brain className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Engineered Prompt Architecture
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Enter any raw prompt or idea on the left. PromptCraft AI decomposes your intent, eliminates ambiguity, injects boundary constraints, and formats it for maximum LLM performance.
            </p>
            <div className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-left">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                What PromptCraft AI Adds Automatically:
              </div>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Explicit Role & Frame:</strong> Prevents generalized conversational rambling.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Negative Guardrails:</strong> Strictly instructs the model on what NOT to output.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">System/User Split:</strong> Generates ready-to-use API parameters.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">3 Specialized Variations:</strong> High-throughput concise, strict JSON, and deep CoT.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ) : isOptimizing ? (
          /* Loading skeleton */
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-xl bg-indigo-900/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 animate-spin">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-200 mb-1">
              Analyzing prompt semantics & constraints...
            </h4>
            <p className="text-xs text-slate-500 max-w-sm">
              Applying {strategy.toUpperCase()} framework with target architecture {targetModel}.
            </p>
          </div>
        ) : (
          /* Result View */
          result && (
            <div className="flex-1 flex flex-col">
              {/* Output Header Bar */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
                {/* Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto">
                  <button
                    onClick={() => setActiveOutputTab('optimized')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeOutputTab === 'optimized'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Optimized Prompt
                  </button>
                  <button
                    onClick={() => setActiveOutputTab('split')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeOutputTab === 'split'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    System / User Split
                  </button>
                  <button
                    onClick={() => setActiveOutputTab('variations')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeOutputTab === 'variations'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Variations ({result.variations.length})
                  </button>
                  <button
                    onClick={() => setActiveOutputTab('critique')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeOutputTab === 'critique'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Critique & Rubric
                  </button>
                  <button
                    onClick={() => setActiveOutputTab('breakdown')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeOutputTab === 'breakdown'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Breakdown
                  </button>
                  <button
                    onClick={() => setActiveOutputTab('diff')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      activeOutputTab === 'diff'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Diff & Measure
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      onSendToTestBench(
                        draftPrompt,
                        result.optimizedPrompt,
                        result.systemInstruction
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 hover:bg-emerald-900/50 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run in Test Bench</span>
                  </button>

                  <button
                    onClick={handleDownloadMarkdown}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export .md</span>
                  </button>

                  <button
                    onClick={() => copyText(result.optimizedPrompt, 'main')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    {copiedMain ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6 flex-1 space-y-6">
                {/* TAB 1: OPTIMIZED PROMPT */}
                {activeOutputTab === 'optimized' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl relative group">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-200">
                            Production-Ready Prompt
                          </span>
                          <span className="text-slate-500 font-mono tabular-nums">
                            ~{Math.ceil(result.optimizedPrompt.length / 4)} tokens
                          </span>
                        </div>
                        <button
                          onClick={() => copyText(result.optimizedPrompt, 'main')}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedMain ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedMain ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <pre className="font-mono-code text-xs md:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text font-normal">
                        {result.optimizedPrompt}
                      </pre>
                    </div>

                    {/* Negative Guardrails Callout */}
                    {result.negativeConstraints && result.negativeConstraints.length > 0 && (
                      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl">
                        <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 mb-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          <span>Strict Negative Guardrails Enforced:</span>
                        </div>
                        <ul className="text-xs text-rose-200/80 space-y-1 list-disc list-inside">
                          {result.negativeConstraints.map((ng, i) => (
                            <li key={i}>{ng}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SYSTEM / USER SPLIT */}
                {activeOutputTab === 'split' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      Top-tier LLMs like Gemini 3.8 and Claude perform best when permanent persona constraints are kept in the System Instruction, while dynamic runtime queries use the User Template.
                    </p>

                    {/* System Instruction */}
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800/80 pb-2">
                        <span className="font-semibold text-indigo-300">
                          System Instruction (Persona & Boundaries)
                        </span>
                        <button
                          onClick={() => copyText(result.systemInstruction || '', 'system')}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedSystem ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedSystem ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="font-mono-code text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {result.systemInstruction || 'No separate system instruction recommended.'}
                      </pre>
                    </div>

                    {/* User Prompt */}
                    <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2 border-b border-slate-800/80 pb-2">
                        <span className="font-semibold text-emerald-300">
                          User Prompt Template (Dynamic query payload)
                        </span>
                        <button
                          onClick={() => copyText(result.userPrompt || '', 'user')}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedUser ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUser ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="font-mono-code text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {result.userPrompt || result.optimizedPrompt}
                      </pre>
                    </div>
                  </div>
                )}

                {/* TAB 3: VARIATIONS */}
                {activeOutputTab === 'variations' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      Different production workloads have different constraints. Choose the variation that fits your exact architecture:
                    </p>

                    <div className="space-y-4">
                      {result.variations.map((v) => (
                        <div
                          key={v.id}
                          className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-200">{v.label}</h4>
                              <p className="text-xs text-slate-400">{v.description}</p>
                            </div>
                            <button
                              onClick={() => copyText(v.prompt, v.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors cursor-pointer"
                            >
                              {copiedVariationId === v.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg font-mono-code text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {v.prompt}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: CRITIQUE & RUBRIC */}
                {activeOutputTab === 'critique' && (
                  <div className="space-y-6">
                    {/* Summary Critique */}
                    <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
                      <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                        Executive Analysis
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {result.critique.summary}
                      </p>
                    </div>

                    {/* Rubric Grid */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Prompt Engineering Scorecard
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(result.critique.rubric).map(([key, item]) => (
                          <div
                            key={key}
                            className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold capitalize text-slate-200">{key}</span>
                              <span className="font-mono tabular-nums text-emerald-400 font-bold">
                                {item.score}/10
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full transition-all"
                                style={{ width: `${item.score * 10}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 pt-1 leading-normal">
                              {item.feedback}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weaknesses vs Fixes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                        <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2.5">
                          Identified Flaws in Draft
                        </div>
                        <ul className="text-xs text-slate-300 space-y-2">
                          {result.critique.weaknesses.map((w, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-rose-400 font-bold">✕</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2.5">
                          Architectural Enhancements Made
                        </div>
                        <ul className="text-xs text-slate-300 space-y-2">
                          {result.critique.improvementsMade.map((imp, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: BREAKDOWN */}
                {activeOutputTab === 'breakdown' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                        <div className="text-slate-500 font-semibold uppercase">Assigned Persona & Role</div>
                        <div className="text-slate-200 font-medium">{result.breakdown.role}</div>
                      </div>

                      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                        <div className="text-slate-500 font-semibold uppercase">Primary Objective / Task</div>
                        <div className="text-slate-200 font-medium">{result.breakdown.task}</div>
                      </div>

                      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1 md:col-span-2">
                        <div className="text-slate-500 font-semibold uppercase">Context & Grounding</div>
                        <div className="text-slate-200">{result.breakdown.context}</div>
                      </div>

                      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1.5 md:col-span-2">
                        <div className="text-slate-500 font-semibold uppercase">Enforced Positive Constraints</div>
                        <ul className="list-disc list-inside space-y-1 text-slate-300">
                          {result.breakdown.constraints.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1 md:col-span-2">
                        <div className="text-slate-500 font-semibold uppercase">Output Format Specification</div>
                        <div className="text-slate-200 font-mono-code bg-slate-950/60 p-2 rounded">
                          {result.breakdown.outputFormat}
                        </div>
                      </div>

                      {result.breakdown.fewShotExamples && result.breakdown.fewShotExamples.length > 0 && (
                        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2 md:col-span-2">
                          <div className="text-slate-500 font-semibold uppercase">Few-Shot Exemplars Injected</div>
                          {result.breakdown.fewShotExamples.map((ex, i) => (
                            <div key={i} className="p-2.5 bg-slate-950/80 rounded border border-slate-800 text-xs space-y-1">
                              <div>
                                <span className="text-slate-400 font-semibold">Input:</span>{' '}
                                <span className="text-slate-200">{ex.input}</span>
                              </div>
                              <div>
                                <span className="text-emerald-400 font-semibold">Output:</span>{' '}
                                <span className="text-emerald-200 font-mono-code">{ex.output}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 6: DIFF & MEASURE */}
                {activeOutputTab === 'diff' && (
                  <DiffViewer original={draftPrompt} optimized={result.optimizedPrompt} />
                )}

                {/* Recommended Model Parameters Footer */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-medium">Recommended Inference Params:</span>
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono tabular-nums">
                      temperature: {result.recommendedParams.temperature}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono tabular-nums">
                      topP: {result.recommendedParams.topP}
                    </span>
                    {result.recommendedParams.thinkingLevel && (
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono">
                        thinking: {result.recommendedParams.thinkingLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 italic max-w-md text-right">
                    {result.recommendedParams.notes}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
