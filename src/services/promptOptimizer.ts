import {
  TargetModel,
  OptimizationStrategy,
  Tone,
  PromptOptimizationResult,
  PromptRubric,
} from '../types';

interface DetectedDomain {
  type: 'coding' | 'database' | 'json' | 'business' | 'writing' | 'reasoning' | 'creative' | 'general';
  role: string;
  context: string;
  defaultFormat: string;
  sampleExemplar: { input: string; output: string };
  negativeRules: string[];
}

function detectDomain(prompt: string): DetectedDomain {
  const p = prompt.toLowerCase();

  if (p.includes('sql') || p.includes('query') || p.includes('database') || p.includes('postgres') || p.includes('table') || p.includes('schema')) {
    return {
      type: 'database',
      role: 'Principal Database Architect and Query Optimization Specialist',
      context: 'High-concurrency relational database environment requiring performant, indexed, and parameterized operations.',
      defaultFormat: 'Valid SQL query formatted with uppercase keywords, inline execution notes, and CREATE INDEX recommendations.',
      sampleExemplar: {
        input: 'Find top customers by total order spend in the last 30 days.',
        output: 'SELECT c.id, c.name, SUM(o.total) AS total_spent FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.created_at >= NOW() - INTERVAL \'30 days\' GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 20;'
      },
      negativeRules: [
        'Never use SELECT * or unbounded queries without LIMIT.',
        'Never use string concatenation for dynamic variables; mandate parameterized syntax.',
        'Do not output conversational preamble. Provide SQL directly.',
      ],
    };
  }

  if (p.includes('code') || p.includes('typescript') || p.includes('python') || p.includes('react') || p.includes('function') || p.includes('bug') || p.includes('api') || p.includes('refactor') || p.includes('component')) {
    return {
      type: 'coding',
      role: 'Staff Software Engineer and Systems Architect',
      context: 'Production-grade software codebase demanding type safety, performance, clean architecture, and OWASP security compliance.',
      defaultFormat: 'Clean, fully-typed code snippet with docstrings, edge-case handling, and 2-3 bullet point architectural explanations.',
      sampleExemplar: {
        input: 'Function to debounce input in TypeScript.',
        output: 'export function debounce<T extends (...args: any[]) => void>(fn: T, delayMs: number): (...args: Parameters<T>) => void {\n  let timeoutId: ReturnType<typeof setTimeout> | undefined;\n  return (...args: Parameters<T>) => {\n    if (timeoutId) clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => fn(...args), delayMs);\n  };\n}'
      },
      negativeRules: [
        'Do not use any or loose typing when strict types can be applied.',
        'Never suggest unhandled Promise rejections or empty catch blocks.',
        'Avoid deprecated APIs or insecure innerHTML evaluations.',
      ],
    };
  }

  if (p.includes('json') || p.includes('extract') || p.includes('parse') || p.includes('schema') || p.includes('invoice') || p.includes('resume') || p.includes('data')) {
    return {
      type: 'json',
      role: 'Enterprise Data Extraction Specialist and Schema Validator',
      context: 'Automated ingestion pipeline parsing unstructured text into machine-readable, RFC-8259 compliant JSON payloads.',
      defaultFormat: 'Pure, valid JSON object matching the defined schema with zero markdown wrapper or conversational comments.',
      sampleExemplar: {
        input: 'Acme Corp invoice #492 on 2026-04-10 total $500.00 for John.',
        output: '{\n  "invoiceId": "492",\n  "date": "2026-04-10",\n  "vendor": "Acme Corp",\n  "client": "John",\n  "amount": 500.00,\n  "currency": "USD"\n}'
      },
      negativeRules: [
        'Do not wrap JSON with markdown code blocks (```json) unless explicitly instructed.',
        'Never invent missing data; use null for ambiguous or omitted fields.',
        'Do not output conversational explanations before or after the JSON payload.',
      ],
    };
  }

  if (p.includes('email') || p.includes('sales') || p.includes('outreach') || p.includes('marketing') || p.includes('pitch') || p.includes('customer')) {
    return {
      type: 'writing',
      role: 'B2B Strategic Communications Consultant & Conversion Copywriter',
      context: 'Executive decision-maker inbox where attention is scarce and clarity drives action.',
      defaultFormat: 'High-impact copy with compelling subject line, 3-sentence value proposition, proof point, and low-friction call-to-action.',
      sampleExemplar: {
        input: 'Cold pitch to VP of Engineering for automated test suite.',
        output: 'Subject: Eliminating Friday deploy anxiety at [Company]\n\nHi [Name],\n\nMost engineering teams lose 4+ hours per sprint tracking down flaky CI tests. We helped [Peer Company] cut test flakiness by 78% within two weeks.\n\nOpen to a 5-minute walkthrough of how our test prober works on your GitHub PRs?'
      },
      negativeRules: [
        'Avoid corporate clichés ("synergy", "game-changer", "I hope this finds you well").',
        'Keep overall length under 125 words.',
        'Never use aggressive or desperate closing language.',
      ],
    };
  }

  if (p.includes('memo') || p.includes('strategy') || p.includes('executive') || p.includes('decision') || p.includes('board') || p.includes('proposal')) {
    return {
      type: 'business',
      role: 'Chief of Staff and Strategic Advisor to Executive Leadership',
      context: 'C-suite decision meeting requiring data-backed synthesis, risk analysis, and explicit decision forks.',
      defaultFormat: 'One-page executive briefing structured as: Context, Problem Statement, Strategic Options with ROI/Risks, and Recommended Action.',
      sampleExemplar: {
        input: 'Proposal to migrate monolith to microservices.',
        output: '### Executive Decision Brief: Core Architecture Migration\n**Problem:** Current 12-year monolithic pipeline creates 45m CI wait times and caused 3 Sev-1 incidents in Q3.\n**Recommendation:** Phased strangler-fig migration to services over 9 months ($380k CapEx, +18% feature velocity).\n**Risks & Mitigation:** Transition complexity mitigated via dual-write database adapters.'
      },
      negativeRules: [
        'Avoid technical minutiae that does not inform ROI or risk.',
        'Do not present recommendations without quantifiable trade-offs.',
        'Do not exceed 1 page or 400 words.',
      ],
    };
  }

  if (p.includes('solve') || p.includes('math') || p.includes('puzzle') || p.includes('logic') || p.includes('calculate') || p.includes('probability')) {
    return {
      type: 'reasoning',
      role: 'Senior Applied Mathematician and Analytical Problem Solver',
      context: 'Rigorous analytical puzzle or mathematical derivation requiring absolute precision and boundary verification.',
      defaultFormat: 'Step-by-step derivation with mathematical definitions, explicit intermediate steps, sanity check, and final boxed answer.',
      sampleExemplar: {
        input: 'Probability of rolling sum of 7 with two fair 6-sided dice.',
        output: '1. Total outcomes = 6 * 6 = 36.\n2. Favorable pairs for sum = 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) -> 6 pairs.\n3. Probability = 6 / 36 = 1/6 (~16.67%).\n4. Verification: All dice values between 1 and 6 inclusive.'
      },
      negativeRules: [
        'Never jump directly to a conclusion without stating intermediate derivations.',
        'Avoid unsupported assumptions regarding probability distributions.',
        'Always verify boundary constraints.',
      ],
    };
  }

  // General default
  return {
    type: 'general',
    role: 'Senior Domain Subject Matter Expert & Knowledge Synthesizer',
    context: 'Complex real-world problem requiring nuanced domain knowledge, structured synthesis, and actionable clarity.',
    defaultFormat: 'Structured markdown with clear semantic headings, concise bulleted analysis, and explicit summary recommendations.',
    sampleExemplar: {
      input: 'Explain how vector embeddings work.',
      output: 'Vector embeddings map unstructured data (text, images) into high-dimensional numerical coordinates where semantic similarity corresponds to mathematical proximity (e.g., cosine distance).'
    },
    negativeRules: [
      'Do not output superficial generalizations or generic filler statements.',
      'Do not repeat the user\'s prompt in the opening sentence.',
      'Avoid vague adjectives without concrete explanations or examples.',
    ],
  };
}

export function optimizePromptLocally(
  draft: string,
  model: TargetModel = 'gemini-3.8-flash',
  strategy: OptimizationStrategy = 'crisp',
  tone: Tone = 'authoritative',
  customInstructions: string = ''
): PromptOptimizationResult {
  const cleanDraft = draft.trim();
  const domain = detectDomain(cleanDraft);

  // Model specific nuances
  let modelNotes = '';
  let recommendedTemp = 0.3;
  let recommendedTopP = 0.95;
  let thinkingLevel: string | undefined = undefined;

  if (model === 'gemini-4-argon' || model === 'deepseek-r1') {
    modelNotes = 'Configured for high-reasoning tasks. Temperature kept low (0.1–0.2) to prevent logical hallucination.';
    recommendedTemp = 0.15;
    thinkingLevel = 'HIGH';
  } else if (model === 'claude-3-7-sonnet') {
    modelNotes = 'Leverages Sonnet\'s nuanced prose styling and strong instruction-following capabilities.';
    recommendedTemp = 0.4;
  } else if (model === 'gemini-3.8-flash') {
    modelNotes = 'Balanced speed and precision. Optimized for low-latency production pipelines.';
    recommendedTemp = 0.3;
    thinkingLevel = 'LOW';
  } else {
    modelNotes = 'General LLM sampling configuration balancing accuracy with conversational clarity.';
    recommendedTemp = 0.5;
  }

  // Build the optimized prompt based on Strategy
  let optimizedPrompt = '';
  let systemInstruction = '';
  let userPrompt = '';

  const toneAdjective =
    tone === 'concise'
      ? 'strictly concise, direct, and zero-fluff'
      : tone === 'academic'
      ? 'rigorous, scholarly, and peer-reviewed grade'
      : tone === 'instructional'
      ? 'pedagogical, clear, and actionable'
      : tone === 'creative'
      ? 'vivid, compelling, and stylistically distinct'
      : 'authoritative, professional, and decisive';

  // Strategy Framing
  if (strategy === 'few-shot') {
    systemInstruction = `You are an elite ${domain.role}. You execute tasks following exact input-to-output pattern exemplars.\nTone: ${toneAdjective}.`;
    userPrompt = `Task: ${cleanDraft}\n\n[Input Data / Query]:\n{{input}}`;

    optimizedPrompt = `# System Persona
You are an elite ${domain.role} operating within a ${domain.context}
Your output must be ${toneAdjective}.

# Task Objective
${cleanDraft}

# Few-Shot Demonstrations
### Example 1:
Input:
${domain.sampleExemplar.input}

Output:
${domain.sampleExemplar.output}

# Input Payload
[Input Data / Query]:
{{input}}

# Output Requirements
1. Structure output according to: ${domain.defaultFormat}
${customInstructions ? `2. Additional rule: ${customInstructions}` : ''}

# Negative Constraints
${domain.negativeRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  } else if (strategy === 'cot') {
    systemInstruction = `You are a ${domain.role}. You must reason thoroughly through problems step-by-step before delivering the final answer.\nTone: ${toneAdjective}.`;
    userPrompt = `Objective: ${cleanDraft}\n\n[Input Data / Context]:\n{{input}}`;

    optimizedPrompt = `# Role & Objective
You are an expert ${domain.role}. Your objective is:
${cleanDraft}

# Reasoning Protocol (Chain-of-Thought)
Before generating the final response, you MUST complete these analytical steps in a <thinking> block:
1. Deconstruct the problem statement and identify all explicit and implicit constraints.
2. Outline potential edge cases, boundary conditions, and pitfalls.
3. Formulate the solution step-by-step, verifying each calculation or logic transition.
4. Perform a self-audit against all constraints.

# Final Deliverable
After the <thinking> block, present the verified solution formatted as:
${domain.defaultFormat}
${customInstructions ? `Special Directive: ${customInstructions}` : ''}

# Boundary Constraints
${domain.negativeRules.map((r) => `- ${r}`).join('\n')}`;
  } else if (strategy === 'role-guardrails') {
    systemInstruction = `You are a ${domain.role}. You adhere strictly to operational boundaries and negative constraints.\nTone: ${toneAdjective}.`;
    userPrompt = `Instructions: ${cleanDraft}\n\nTarget Input:\n{{input}}`;

    optimizedPrompt = `# Persona Assignment
You are functioning as a ${domain.role}.
Operational Context: ${domain.context}
Tone: ${toneAdjective}.

# Primary Directive
${cleanDraft}

# Positive Execution Rules
1. Deliver comprehensive, high-fidelity answers directly addressing the core objective.
2. Output format: ${domain.defaultFormat}
${customInstructions ? `3. Mandatory directive: ${customInstructions}` : ''}

# Strict Negative Guardrails (WHAT NOT TO DO)
${domain.negativeRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}
${domain.negativeRules.length + 1}. Do not make unverified claims or hallucinate unspecified data.
${domain.negativeRules.length + 2}. Do not provide conversational filler ("Sure, here is your answer").`;
  } else if (strategy === 'token-efficient') {
    systemInstruction = `Role: ${domain.role}. Output: ${domain.defaultFormat}. Zero fluff.`;
    userPrompt = `${cleanDraft}: {{input}}`;

    optimizedPrompt = `[ROLE]: ${domain.role}
[GOAL]: ${cleanDraft}
[FORMAT]: ${domain.defaultFormat}
[RULES]:
- No conversational preamble or postscript.
- Output directly.
${customInstructions ? `- ${customInstructions}` : ''}
${domain.negativeRules.map((r) => `- ${r}`).join('\n')}

[INPUT]:
{{input}}`;
  } else {
    // CRISP / CO-STAR default
    systemInstruction = `You are a ${domain.role} operating within ${domain.context}\nTone: ${toneAdjective}.`;
    userPrompt = `Task: ${cleanDraft}\n\nTarget Data / Query:\n{{input}}`;

    optimizedPrompt = `# Context & Role
You are an elite ${domain.role}.
Context: ${domain.context}

# Core Objective
${cleanDraft}

# Instructions & Execution Steps
1. Carefully parse the provided input data and verify all parameters.
2. Apply industry best practices for ${domain.type} workflows.
3. Ensure formatting strictly conforms to: ${domain.defaultFormat}
${customInstructions ? `4. Specific constraint: ${customInstructions}` : ''}

# Negative Constraints
${domain.negativeRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

# Input Payload
[Input Data / Query]:
{{input}}`;
  }

  // Generate 3 specialized variations
  const variations = [
    {
      id: 'concise',
      label: 'Concise & Fast (High Throughput / Batch)',
      prompt: `[ROLE]: ${domain.role}\n[GOAL]: ${cleanDraft}\n[FORMAT]: ${domain.defaultFormat}\n[CONSTRAINTS]: Direct output only. No conversational wrapper.\n[INPUT]: {{input}}`,
      description: 'Optimized for high-volume API calls with minimal token overhead and fast response times.',
    },
    {
      id: 'structured',
      label: 'Strict Structured (RFC-8259 JSON)',
      prompt: `You are an automated extraction agent. Process the following input and return ONLY a valid RFC-8259 JSON payload matching this objective: "${cleanDraft}".\n\nRules:\n1. Output valid JSON only with zero markdown ticks (\`\`\`json).\n2. Set any missing values to null.\n\nInput: {{input}}`,
      description: 'Ideal for machine-to-machine integrations, microservices, and tool call pipelines.',
    },
    {
      id: 'cot',
      label: 'Chain-of-Thought (Deep Reasoning)',
      prompt: `You are a ${domain.role}.\nObjective: ${cleanDraft}\n\nInstructions:\n1. In a <reasoning> block, systematically evaluate all requirements, assumptions, and edge cases.\n2. In a <solution> block, output the final answer formatted as: ${domain.defaultFormat}.\n\nInput: {{input}}`,
      description: 'Forces multi-step reasoning before answering, eliminating premature assumptions.',
    },
  ];

  // Rubric Scoring based on draft characteristics
  const isTooShort = cleanDraft.length < 35;
  const lacksFormat = !cleanDraft.toLowerCase().includes('format') && !cleanDraft.toLowerCase().includes('json') && !cleanDraft.toLowerCase().includes('sql');
  const lacksRole = !cleanDraft.toLowerCase().includes('act as') && !cleanDraft.toLowerCase().includes('you are');

  const rubric: PromptRubric = {
    clarity: {
      score: isTooShort ? 5 : 8,
      feedback: isTooShort
        ? 'Draft was brief and ambiguous; injected explicit objective scope and domain context.'
        : 'Core intent was identifiable; expanded with standardized step-by-step instructions.',
    },
    specificity: {
      score: isTooShort ? 4 : 8,
      feedback: 'Replaced vague guidance with concrete technical deliverables and payload delimiters.',
    },
    constraints: {
      score: lacksFormat ? 4 : 9,
      feedback: 'Injected explicit negative guardrails instructing the LLM on what NOT to output.',
    },
    predictability: {
      score: lacksRole ? 5 : 9,
      feedback: 'Assigned senior persona and enforced exact output structure to prevent variance across runs.',
    },
  };

  const weaknesses = [];
  if (isTooShort) weaknesses.push('Draft is underspecified with high risk of generic AI filler.');
  if (lacksRole) weaknesses.push('Lacked persona framing, causing model to default to generalized conversational tone.');
  if (lacksFormat) weaknesses.push('Did not specify output formatting, schema, or length limits.');
  if (weaknesses.length === 0) weaknesses.push('Lacked explicit negative constraints and boundary guards.');

  const improvementsMade = [
    `Assigned authoritative persona: "${domain.role}".`,
    'Injected explicit negative guardrails to prohibit conversational preamble.',
    `Defined target output format (${domain.defaultFormat}).`,
    'Added runtime variable placeholders ({{input}}) for clean template reuse.',
  ];

  return {
    optimizedPrompt,
    systemInstruction,
    userPrompt,
    critique: {
      summary: `The raw prompt was transformed from an unconstrained query into an engineered ${strategy.toUpperCase()} framework with explicit role framing, boundary conditions, and deterministic formatting.`,
      weaknesses,
      improvementsMade,
      rubric,
    },
    breakdown: {
      role: domain.role,
      task: cleanDraft,
      context: domain.context,
      constraints: [
        'Deliver deterministic output',
        `Adhere to: ${domain.defaultFormat}`,
        ...domain.negativeRules,
      ],
      outputFormat: domain.defaultFormat,
      fewShotExamples: [domain.sampleExemplar],
    },
    negativeConstraints: domain.negativeRules,
    variations,
    recommendedParams: {
      temperature: recommendedTemp,
      topP: recommendedTopP,
      thinkingLevel,
      notes: modelNotes,
    },
  };
}
