import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Optimization endpoint
app.post('/api/optimize', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      targetModel = 'gemini-3.8-flash',
      strategy = 'crisp',
      tone = 'authoritative',
      customInstructions = '',
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt input is required' });
    }

    const systemPrompt = `You are an elite AI Prompt Engineer and LLM Architect specializing in prompt optimization for state-of-the-art language models.
Your task is to take a raw, imperfect, or draft prompt and transform it into a world-class, production-ready prompt optimized for the specified model and strategy.

Parameters provided:
- Target Model: ${targetModel}
- Optimization Strategy: ${strategy} (Options: crisp = Context/Role/Instruction/Schema/Parameters, few-shot = concrete input-output examples, cot = Chain-of-Thought / explicit reasoning steps, role-guardrails = persona + strict negative constraints, token-efficient = maximum brevity without losing intent, multimodal = structured for vision/multimodal)
- Tone: ${tone}
- Additional User Directives: ${customInstructions || 'None'}

You MUST respond strictly with a valid JSON object matching this schema:
{
  "optimizedPrompt": "Full, complete production-ready optimized prompt with clear delimiters and sections.",
  "systemInstruction": "Clear system instruction defining role, persona, and core constraints.",
  "userPrompt": "The user prompt portion, containing placeholders like {{input}} or {{query}} if applicable.",
  "critique": {
    "summary": "Brief 2-sentence critique of the original prompt's flaws and how it was enhanced.",
    "weaknesses": ["list of 2-4 concrete flaws in original prompt"],
    "improvementsMade": ["list of 3-5 specific improvements implemented"],
    "rubric": {
      "clarity": { "score": 8, "feedback": "Explanation of clarity score" },
      "specificity": { "score": 9, "feedback": "Explanation of specificity score" },
      "constraints": { "score": 9, "feedback": "Explanation of constraints score" },
      "predictability": { "score": 9, "feedback": "Explanation of predictability score" }
    }
  },
  "breakdown": {
    "role": "Defined role/persona",
    "task": "Explicit primary task",
    "context": "Context or domain frame provided",
    "constraints": ["Array of positive requirements"],
    "outputFormat": "Specific output formatting instruction (e.g. JSON, markdown table, bullet points)",
    "fewShotExamples": [
      { "input": "Sample user query/input", "output": "Ideal model response" }
    ]
  },
  "negativeConstraints": [
    "Explicit statement of what the model MUST NOT do (e.g., Do not output conversational preamble)"
  ],
  "variations": [
    {
      "id": "concise",
      "label": "Concise & Fast (Batch / High Throughput)",
      "prompt": "Shorter token-efficient variation",
      "description": "Optimized for minimal latency and lower API costs while preserving output accuracy."
    },
    {
      "id": "structured",
      "label": "Strict Structured (JSON / Machine-Readable)",
      "prompt": "Variation enforcing schema and zero Markdown wrapper around JSON",
      "description": "Ideal for software backends, tool calls, and automated pipelines."
    },
    {
      "id": "cot",
      "label": "Deep Reasoning / Chain-of-Thought",
      "prompt": "Variation that forces step-by-step thinking before final answer",
      "description": "Best for complex logic, math, analysis, and multi-step decisions."
    }
  ],
  "recommendedParams": {
    "temperature": 0.2,
    "topP": 0.95,
    "thinkingLevel": "LOW",
    "notes": "Advice on sampling parameters and temperature for this prompt type"
  }
}

Do not include markdown code block ticks (\`\`\`json) outside the JSON. Return valid JSON only.`;

    const userContent = `Original Draft Prompt:\n"""\n${prompt.trim()}\n"""\n\nGenerate the complete prompt optimization JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userContent,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      // Clean possible wrapper if any
      const cleaned = responseText.replace(/```(?:json)?\n?/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error optimizing prompt:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to optimize prompt. Please check your prompt and try again.',
    });
  }
});

// Live test single prompt endpoint
app.post('/api/test-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt, systemInstruction, sampleInput, temperature = 0.7 } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let finalPrompt = prompt;
    if (sampleInput && typeof sampleInput === 'string' && sampleInput.trim()) {
      if (finalPrompt.includes('{{input}}')) {
        finalPrompt = finalPrompt.replace(/\{\{input\}\}/g, sampleInput.trim());
      } else if (finalPrompt.includes('{{query}}')) {
        finalPrompt = finalPrompt.replace(/\{\{query\}\}/g, sampleInput.trim());
      } else {
        finalPrompt = `${finalPrompt}\n\n[Input Data / Query]:\n${sampleInput.trim()}`;
      }
    }

    const startTime = Date.now();
    const config: any = {
      temperature: Number(temperature) || 0.7,
    };
    if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
      config.systemInstruction = systemInstruction.trim();
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: finalPrompt,
      config,
    });

    const durationMs = Date.now() - startTime;
    const outputText = response.text || '';
    // Estimate tokens (roughly 4 chars per token)
    const tokenCount = Math.ceil(outputText.length / 4);

    return res.json({
      output: outputText,
      durationMs,
      tokenCount,
    });
  } catch (error: any) {
    console.error('Error testing prompt:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to execute prompt with model.',
    });
  }
});

// Side-by-side comparison test endpoint
app.post('/api/compare-test', async (req: Request, res: Response) => {
  try {
    const { originalPrompt, optimizedPrompt, systemInstruction, sampleInput } = req.body;

    if (!originalPrompt || !optimizedPrompt) {
      return res.status(400).json({ error: 'Both original and optimized prompts are required.' });
    }

    let origFinal = originalPrompt;
    let optFinal = optimizedPrompt;

    if (sampleInput && typeof sampleInput === 'string' && sampleInput.trim()) {
      origFinal = origFinal.includes('{{input}}')
        ? origFinal.replace(/\{\{input\}\}/g, sampleInput.trim())
        : `${origFinal}\n\n[Input]:\n${sampleInput.trim()}`;

      optFinal = optFinal.includes('{{input}}')
        ? optFinal.replace(/\{\{input\}\}/g, sampleInput.trim())
        : `${optFinal}\n\n[Input]:\n${sampleInput.trim()}`;
    }

    const startOrig = Date.now();
    const origPromise = ai.models
      .generateContent({
        model: 'gemini-3.8-flash',
        contents: origFinal,
        config: { temperature: 0.7 },
      })
      .then((r) => ({
        output: r.text || '',
        durationMs: Date.now() - startOrig,
        tokenCount: Math.ceil((r.text || '').length / 4),
      }))
      .catch((err) => ({
        output: `Error executing original prompt: ${err.message}`,
        durationMs: Date.now() - startOrig,
        tokenCount: 0,
      }));

    const startOpt = Date.now();
    const optConfig: any = { temperature: 0.7 };
    if (systemInstruction) {
      optConfig.systemInstruction = systemInstruction;
    }

    const optPromise = ai.models
      .generateContent({
        model: 'gemini-3.8-flash',
        contents: optFinal,
        config: optConfig,
      })
      .then((r) => ({
        output: r.text || '',
        durationMs: Date.now() - startOpt,
        tokenCount: Math.ceil((r.text || '').length / 4),
      }))
      .catch((err) => ({
        output: `Error executing optimized prompt: ${err.message}`,
        durationMs: Date.now() - startOpt,
        tokenCount: 0,
      }));

    const [originalResult, optimizedResult] = await Promise.all([origPromise, optPromise]);

    return res.json({
      original: originalResult,
      optimized: optimizedResult,
    });
  } catch (error: any) {
    console.error('Error comparing prompts:', error);
    return res.status(500).json({
      error: error?.message || 'Comparison failed.',
    });
  }
});

// Quick clarify suggestions for minimal prompts
app.post('/api/clarify-prompt', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `The user gave this short or underspecified prompt: "${prompt}".
Identify 3 key clarifying directions or specifications that could make this prompt vastly more effective.
Return a JSON array of 3 objects with { "aspect": "e.g. Target Audience", "suggestion": "e.g. For junior developers vs executive leadership" }.`,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const suggestions = JSON.parse(response.text || '[]');
    return res.json({ suggestions });
  } catch (err: any) {
    return res.json({ suggestions: [] });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PromptCraft AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
