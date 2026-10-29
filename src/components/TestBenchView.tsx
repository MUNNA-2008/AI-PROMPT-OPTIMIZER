import React, { useState } from 'react';
import { Play, RotateCcw, Clock, Hash, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { TestExecutionResult } from '../types';

interface TestBenchViewProps {
  initialOriginalPrompt: string;
  initialOptimizedPrompt: string;
  initialSystemInstruction?: string;
}

export const TestBenchView: React.FC<TestBenchViewProps> = ({
  initialOriginalPrompt,
  initialOptimizedPrompt,
  initialSystemInstruction,
}) => {
  const [originalPrompt, setOriginalPrompt] = useState(
    initialOriginalPrompt ||
      'Extract all names, invoice totals, and dates from this email and output json.'
  );
  const [optimizedPrompt, setOptimizedPrompt] = useState(
    initialOptimizedPrompt ||
      `You are an enterprise data extraction agent. Extract structured financial data from the input text into valid RFC-8259 JSON format.

JSON Schema:
{
  "invoiceNumber": string | null,
  "issueDate": "YYYY-MM-DD" | null,
  "clientName": string,
  "totalAmount": number,
  "currency": string
}

Strict Constraints:
1. Return ONLY the raw JSON object. Do not include markdown code ticks (\`\`\`json) or conversational preamble.
2. If any field is missing or ambiguous, set its value to null.
3. Verify totalAmount is a valid floating point number.`
  );
  const [systemInstruction, setSystemInstruction] = useState(initialSystemInstruction || '');
  const [sampleInput, setSampleInput] = useState(
    'Hi team, please find attached Invoice #INV-2026-081 for Apex Logistics LLC dated October 14, 2026. The total due is $4,850.00 USD payable within 30 days.'
  );

  const [temperature, setTemperature] = useState<number>(0.7);

  // Execution states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [originalResult, setOriginalResult] = useState<TestExecutionResult | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<TestExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Copy states
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [copiedOpt, setCopiedOpt] = useState(false);

  const handleRunComparison = async () => {
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/compare-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt,
          optimizedPrompt,
          systemInstruction,
          sampleInput,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      setOriginalResult(data.original);
      setOptimizedResult(data.optimized);
    } catch (err: any) {
      setError(err?.message || 'Failed to execute model comparison.');
    } finally {
      setIsRunning(false);
    }
  };

  const copyResult = (text: string, isOpt: boolean) => {
    navigator.clipboard.writeText(text);
    if (isOpt) {
      setCopiedOpt(true);
      setTimeout(() => setCopiedOpt(false), 2000);
    } else {
      setCopiedOrig(true);
      setTimeout(() => setCopiedOrig(false), 2000);
    }
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Live LLM Test Bench & Execution Arena
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute the original draft prompt and the optimized prompt concurrently against Gemini 3.8 Flash to directly verify output quality, structure, and adherence.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span>Sampling Temp:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono tabular-nums text-indigo-300 font-semibold w-6">
              {temperature}
            </span>
          </div>

          <button
            onClick={handleRunComparison}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/60 rounded-lg transition-colors shadow-lg shadow-indigo-950/40 cursor-pointer"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Gemini 3.8 Flash...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Concurrent Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inputs Configuration Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Prompt 1: Original */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 uppercase tracking-wider">
              Draft Prompt A (Original)
            </label>
            <span className="text-slate-500 font-mono tabular-nums">
              ~{Math.ceil(originalPrompt.length / 4)} tokens
            </span>
          </div>
          <textarea
            value={originalPrompt}
            onChange={(e) => setOriginalPrompt(e.target.value)}
            rows={5}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Prompt 2: Optimized */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-indigo-300 uppercase tracking-wider">
              Engineered Prompt B (Optimized)
            </label>
            <span className="text-slate-500 font-mono tabular-nums">
              ~{Math.ceil(optimizedPrompt.length / 4)} tokens
            </span>
          </div>
          <textarea
            value={optimizedPrompt}
            onChange={(e) => setOptimizedPrompt(e.target.value)}
            rows={5}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Runtime Test Variable Input */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-emerald-400 uppercase tracking-wider">
              Test Sample Input Payload
            </label>
            <span className="text-slate-500 text-[11px]">Replaces `&#123;&#123;input&#125;&#125;`</span>
          </div>
          <textarea
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            rows={5}
            placeholder="Type sample user data, query, code snippet, or article to test..."
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono-code text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Live Results Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Original Result */}
        <div className="flex flex-col border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden min-h-[380px]">
          <div className="p-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-300">Original Prompt Response</div>
              <div className="text-[11px] text-slate-500">Unoptimized default execution</div>
            </div>
            {originalResult && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono tabular-nums">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{originalResult.durationMs}ms</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-mono tabular-nums">
                  <Hash className="w-3 h-3 text-slate-500" />
                  <span>~{originalResult.tokenCount} tokens</span>
                </div>
                <button
                  onClick={() => copyResult(originalResult.output, false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy output"
                >
                  {copiedOrig ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {isRunning ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                Executing model...
              </div>
            ) : originalResult ? (
              <pre className="font-mono-code text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text font-normal">
                {originalResult.output}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-600 text-center p-6">
                Click "Run Concurrent Comparison" above to test both prompts with live Gemini 3.8 Flash model inference.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Optimized Result */}
        <div className="flex flex-col border border-indigo-900/40 rounded-xl bg-indigo-950/10 overflow-hidden min-h-[380px]">
          <div className="p-3.5 bg-indigo-950/30 border-b border-indigo-900/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Optimized Prompt Response</span>
              </div>
              <div className="text-[11px] text-slate-400">Enforced schema, guardrails & role</div>
            </div>
            {optimizedResult && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono tabular-nums">
                  <Clock className="w-3 h-3" />
                  <span>{optimizedResult.durationMs}ms</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400 font-mono tabular-nums">
                  <Hash className="w-3 h-3" />
                  <span>~{optimizedResult.tokenCount} tokens</span>
                </div>
                <button
                  onClick={() => copyResult(optimizedResult.output, true)}
                  className="p-1 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy output"
                >
                  {copiedOpt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {isRunning ? (
              <div className="h-full flex items-center justify-center text-xs text-indigo-400">
                <RotateCcw className="w-4 h-4 animate-spin mr-2" />
                Executing model...
              </div>
            ) : optimizedResult ? (
              <pre className="font-mono-code text-xs text-emerald-200/90 whitespace-pre-wrap leading-relaxed select-text font-normal">
                {optimizedResult.output}
              </pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-600 text-center p-6">
                Click "Run Concurrent Comparison" above to observe the precision improvements from structural prompt framing.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
