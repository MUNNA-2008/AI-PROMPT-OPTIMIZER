export type TargetModel =
  | 'gemini-3.8-flash'
  | 'gemini-4-argon'
  | 'claude-3-7-sonnet'
  | 'gpt-4o'
  | 'deepseek-r1'
  | 'image-midjourney'
  | 'general-llm';

export type OptimizationStrategy =
  | 'crisp'
  | 'few-shot'
  | 'cot'
  | 'role-guardrails'
  | 'token-efficient'
  | 'multimodal';

export type Tone =
  | 'authoritative'
  | 'concise'
  | 'academic'
  | 'instructional'
  | 'creative';

export interface PromptRubricItem {
  score: number;
  feedback: string;
}

export interface PromptRubric {
  clarity: PromptRubricItem;
  specificity: PromptRubricItem;
  constraints: PromptRubricItem;
  predictability: PromptRubricItem;
}

export interface PromptCritique {
  summary: string;
  weaknesses: string[];
  improvementsMade: string[];
  rubric: PromptRubric;
}

export interface FewShotExample {
  input: string;
  output: string;
}

export interface PromptBreakdown {
  role: string;
  task: string;
  context: string;
  constraints: string[];
  outputFormat: string;
  fewShotExamples?: FewShotExample[];
}

export interface PromptVariation {
  id: string;
  label: string;
  prompt: string;
  description: string;
}

export interface RecommendedParams {
  temperature: number;
  topP: number;
  thinkingLevel?: string;
  notes: string;
}

export interface PromptOptimizationResult {
  optimizedPrompt: string;
  systemInstruction?: string;
  userPrompt?: string;
  critique: PromptCritique;
  breakdown: PromptBreakdown;
  negativeConstraints?: string[];
  variations: PromptVariation[];
  recommendedParams: RecommendedParams;
}

export interface SavedPrompt {
  id: string;
  title: string;
  timestamp: number;
  originalPrompt: string;
  targetModel: TargetModel;
  strategy: OptimizationStrategy;
  result: PromptOptimizationResult;
  starred?: boolean;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Coding' | 'Writing' | 'Analysis' | 'Data & JSON' | 'Business' | 'Reasoning';
  description: string;
  draftPrompt: string;
  targetModel: TargetModel;
  strategy: OptimizationStrategy;
  sampleInput?: string;
}

export interface TestExecutionResult {
  output: string;
  durationMs: number;
  tokenCount: number;
}
