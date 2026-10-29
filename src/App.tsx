import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudioView } from './components/StudioView';
import { TestBenchView } from './components/TestBenchView';
import { TemplatesView } from './components/TemplatesView';
import { HistoryView } from './components/HistoryView';
import { SavedPrompt, PromptTemplate, TargetModel, OptimizationStrategy } from './types';

const INITIAL_SAVED_PROMPTS: SavedPrompt[] = [
  {
    id: 'seed-sql-opt',
    title: 'PostgreSQL Top Spenders Query',
    timestamp: Date.now() - 3600000 * 24,
    originalPrompt: 'Write a SQL query to get top spending customers who bought electronics in the last 90 days from my tables.',
    targetModel: 'gemini-3.8-flash',
    strategy: 'crisp',
    starred: true,
    result: {
      optimizedPrompt: `You are a Principal Database Architect specializing in PostgreSQL 16 performance engineering.

Task:
Write a highly optimized, parameterized PostgreSQL query to retrieve the top 20 spending customers who purchased items from the 'electronics' category within the last 90 days.

Expected Schema Assumptions:
- customers: id (UUID), name (TEXT), email (TEXT)
- orders: id (UUID), customer_id (UUID FK), order_date (TIMESTAMPTZ), status (TEXT)
- order_items: id (UUID), order_id (UUID FK), category (TEXT), price (NUMERIC), quantity (INT)

Required Query Structure:
1. Filter only completed/paid orders (status = 'completed').
2. Use an indexed date filter: order_date >= NOW() - INTERVAL '90 days'.
3. Filter order_items.category = 'electronics'.
4. Calculate total customer spend as SUM(order_items.price * order_items.quantity).
5. Sort descending by total spend, LIMIT 20.
6. Provide EXPLAIN ANALYZE index recommendations for optimal execution.

Negative Constraints:
- Do not use correlated subqueries where JOINs with aggregation can be applied.
- Do not output conversational introductory filler. Return SQL first, followed by index recommendations.`,
      systemInstruction: 'You are a Principal Database Architect specializing in PostgreSQL query optimization.',
      userPrompt: 'Write an optimized query for top electronics spenders in the past 90 days.',
      critique: {
        summary: 'Original prompt lacked table schema definitions, order status filters, indexing recommendations, and output limits.',
        weaknesses: [
          'No schema or table definitions specified',
          'Did not handle order status (e.g. cancelled vs completed)',
          'No limit or pagination specified, leading to unbounded result sets',
        ],
        improvementsMade: [
          'Injected explicit schema assumptions with data types',
          'Added time-window indexing and paid order status filter',
          'Enforced parameterized syntax and index advice',
        ],
        rubric: {
          clarity: { score: 9, feedback: 'Explicit role, schema, and calculations.' },
          specificity: { score: 9, feedback: 'Concrete field names and limits.' },
          constraints: { score: 9, feedback: 'No correlated subqueries; strict ordering.' },
          predictability: { score: 10, feedback: 'Repeatable, deterministic SQL output.' },
        },
      },
      breakdown: {
        role: 'Principal Database Architect',
        task: 'Write parameterized PostgreSQL query for top 20 electronics customers.',
        context: 'PostgreSQL 16 e-commerce database with orders and order_items.',
        constraints: [
          'Status = completed',
          'Within last 90 days',
          'SUM(price * quantity)',
          'LIMIT 20',
        ],
        outputFormat: 'Clean SQL block followed by CREATE INDEX recommendations.',
      },
      negativeConstraints: [
        'Do not use SELECT *',
        'Do not omit column qualifiers',
        'Do not include conversational preamble',
      ],
      variations: [
        {
          id: 'concise',
          label: 'Concise Query Only',
          prompt: 'Write a PostgreSQL query for top 20 spending customers for category = "electronics" in last 90 days. Group by customer, sum spend, order desc.',
          description: 'Minimal token usage for direct SQL copilot.',
        },
        {
          id: 'structured',
          label: 'JSON Schema Output',
          prompt: 'Generate the query encapsulated within a JSON schema with explanation and index advice keys.',
          description: 'Best for automated agent pipelines.',
        },
        {
          id: 'cot',
          label: 'Index Plan Reasoning',
          prompt: 'Explain the query plan step-by-step, discuss sequential vs index scans, and then output the query.',
          description: 'Deep optimization for large scale tables.',
        },
      ],
      recommendedParams: {
        temperature: 0.1,
        topP: 0.9,
        notes: 'Low temperature ensures deterministic and syntactically correct SQL.',
      },
    },
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'testbench' | 'templates' | 'history'>('studio');

  // Saved Prompts stored in localStorage
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    try {
      const stored = localStorage.getItem('promptcraft_saved_prompts');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_SAVED_PROMPTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('promptcraft_saved_prompts', JSON.stringify(savedPrompts));
    } catch {
      // ignore
    }
  }, [savedPrompts]);

  // Test bench state transferred from Studio or History
  const [testBenchPrompts, setTestBenchPrompts] = useState<{
    original: string;
    optimized: string;
    systemInstruction?: string;
  }>({
    original: '',
    optimized: '',
  });

  // External draft to load into Studio
  const [studioDraft, setStudioDraft] = useState<{
    prompt: string;
    model?: TargetModel;
    strategy?: OptimizationStrategy;
  } | null>(null);

  const handleSavePrompt = (newPrompt: SavedPrompt) => {
    setSavedPrompts((prev) => {
      const existingIdx = prev.findIndex(
        (p) => p.originalPrompt.trim() === newPrompt.originalPrompt.trim()
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newPrompt;
        return updated;
      }
      return [newPrompt, ...prev];
    });
  };

  const handleDeletePrompt = (id: string) => {
    setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleStar = (id: string) => {
    setSavedPrompts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))
    );
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your saved prompts archive?')) {
      setSavedPrompts([]);
    }
  };

  const handleSendToTestBench = (
    original: string,
    optimized: string,
    systemInstruction?: string
  ) => {
    setTestBenchPrompts({
      original,
      optimized,
      systemInstruction,
    });
    setActiveTab('testbench');
  };

  const handleSelectTemplate = (tpl: PromptTemplate) => {
    setStudioDraft({
      prompt: tpl.draftPrompt,
      model: tpl.targetModel,
      strategy: tpl.strategy,
    });
    setActiveTab('studio');
  };

  const handleLoadInStudio = (saved: SavedPrompt) => {
    setStudioDraft({
      prompt: saved.originalPrompt,
      model: saved.targetModel,
      strategy: saved.strategy,
    });
    setActiveTab('studio');
  };

  const handleLoadInTestBench = (saved: SavedPrompt) => {
    setTestBenchPrompts({
      original: saved.originalPrompt,
      optimized: saved.result.optimizedPrompt,
      systemInstruction: saved.result.systemInstruction,
    });
    setActiveTab('testbench');
  };

  const handleNewOptimization = () => {
    setStudioDraft({
      prompt: '',
      model: 'gemini-3.8-flash',
      strategy: 'crisp',
    });
    setActiveTab('studio');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewOptimization={handleNewOptimization}
        savedCount={savedPrompts.length}
      />

      <main className="flex-1 flex flex-col">
        {activeTab === 'studio' && (
          <StudioView
            onSendToTestBench={handleSendToTestBench}
            onSavePrompt={handleSavePrompt}
            savedPrompts={savedPrompts}
            externalDraft={studioDraft}
          />
        )}

        {activeTab === 'testbench' && (
          <TestBenchView
            initialOriginalPrompt={testBenchPrompts.original}
            initialOptimizedPrompt={testBenchPrompts.optimized}
            initialSystemInstruction={testBenchPrompts.systemInstruction}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesView onSelectTemplate={handleSelectTemplate} />
        )}

        {activeTab === 'history' && (
          <HistoryView
            savedPrompts={savedPrompts}
            onDeletePrompt={handleDeletePrompt}
            onToggleStar={handleToggleStar}
            onLoadInStudio={handleLoadInStudio}
            onLoadInTestBench={handleLoadInTestBench}
            onClearAll={handleClearAll}
          />
        )}
      </main>
    </div>
  );
}
