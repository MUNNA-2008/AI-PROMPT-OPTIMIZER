import React, { useState } from 'react';
import { Search, ArrowRight, Copy, Check } from 'lucide-react';
import { PROMPT_TEMPLATES } from '../data/templates';
import { PromptTemplate } from '../types';

interface TemplatesViewProps {
  onSelectTemplate: (template: PromptTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Coding', 'Data & JSON', 'Writing', 'Business', 'Reasoning'];

  const filteredTemplates = PROMPT_TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'All' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.draftPrompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (tpl: PromptTemplate) => {
    navigator.clipboard.writeText(tpl.draftPrompt);
    setCopiedId(tpl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Curated Prompt Engineering Patterns & Blueprints
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pre-configured starting prompts engineered for precision and reliability across technical and creative domains.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg border border-slate-800/80 w-fit overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between transition-colors group space-y-4"
          >
            <div>
              {/* Clean unboxed category + model metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span>{tpl.category}</span>
                <span aria-hidden="true">·</span>
                <span>{tpl.targetModel}</span>
                <span aria-hidden="true">·</span>
                <span className="uppercase">{tpl.strategy}</span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                {tpl.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {tpl.description}
              </p>

              <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800/60 rounded-lg font-mono-code text-[11px] text-slate-300 line-clamp-3">
                "{tpl.draftPrompt}"
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
              <button
                onClick={() => handleCopy(tpl)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedId === tpl.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onSelectTemplate(tpl)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <span>Load in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
