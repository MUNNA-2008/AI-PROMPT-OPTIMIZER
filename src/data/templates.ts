import { PromptTemplate } from '../types';

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'sql-generator',
    title: 'SQL Query & Performance Optimizer',
    category: 'Coding',
    description: 'Converts English business questions into performant, parameterized PostgreSQL queries with index recommendations.',
    draftPrompt: 'Write a SQL query to get top spending customers who bought electronics in the last 90 days from my tables.',
    targetModel: 'gemini-3.8-flash',
    strategy: 'crisp',
    sampleInput: 'Tables: customers (id, name, email, created_at), orders (id, customer_id, total_amount, order_date), order_items (id, order_id, category, price). Filter for electronics, min spend $500.',
  },
  {
    id: 'json-extractor',
    title: 'Unstructured Text to Strict JSON Extractor',
    category: 'Data & JSON',
    description: 'Pulls structured fields from messy emails, resumes, or medical notes with null-safety and strict typing.',
    draftPrompt: 'Extract name, company, date, and invoice totals from this messy invoice text and give me json.',
    targetModel: 'gemini-3.8-flash',
    strategy: 'role-guardrails',
    sampleInput: 'Invoice #99482 from Acme Corp issued on Oct 14, 2026. Billed to Dr. John Doe. Subtotal: $1,240.50, Tax: $124.05. Total due: $1,364.55 by Nov 1.',
  },
  {
    id: 'code-review',
    title: 'TypeScript Security & Code Review Auditor',
    category: 'Coding',
    description: 'Performs static analysis, vulnerability detection (OWASP Top 10), and readability enhancements on PR diffs.',
    draftPrompt: 'Review this typescript react code for bugs and bad practices.',
    targetModel: 'gemini-4-argon',
    strategy: 'crisp',
    sampleInput: `export function UserProfile({ userId }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/user?id=' + userId)
      .then(res => res.json())
      .then(d => setData(d));
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: data?.bio }} />;
}`,
  },
  {
    id: 'executive-memo',
    title: 'Executive Decision Memo & Strategic Brief',
    category: 'Business',
    description: 'Synthesizes complex operational proposals into a 1-page C-suite decision framework with ROI, risks, and alternatives.',
    draftPrompt: 'Summarize our migration to microservices for our executive board so they approve the budget.',
    targetModel: 'gemini-3.8-flash',
    strategy: 'crisp',
    sampleInput: 'Proposal: Migrate legacy monolith (12 years old, 45 minute CI/CD deploy times, 3 outages this quarter) to Kubernetes microservices over 9 months. Cost: $420k capital expenditure. Projected benefit: 99.99% uptime, 4x faster feature velocity, 20% cloud compute savings after year 1.',
  },
  {
    id: 'chain-of-thought-math',
    title: 'Chain-of-Thought Analytical Problem Solver',
    category: 'Reasoning',
    description: 'Enforces explicit step-by-step mathematical reasoning, boundary verification, and sanity checks.',
    draftPrompt: 'Solve this probability puzzle and tell me the answer.',
    targetModel: 'deepseek-r1',
    strategy: 'cot',
    sampleInput: 'A bag contains 5 red balls, 4 green balls, and 3 blue balls. If two balls are drawn at random without replacement, what is the exact probability that both balls are of different colors?',
  },
  {
    id: 'cold-outreach',
    title: 'High-Converting B2B Cold Email',
    category: 'Writing',
    description: 'Crafts concise, pain-point driven outreach emails under 120 words with low-friction calls to action.',
    draftPrompt: 'Write a cold email to VP of Engineering selling our automated API testing platform.',
    targetModel: 'claude-3-7-sonnet',
    strategy: 'role-guardrails',
    sampleInput: 'Product: TestPulse AI (reduces regression test flakiness by 80% without manual test writing). Target: VP Engineering at Series B SaaS companies. Value prop: Deploy with confidence on Friday afternoons without QA bottlenecks.',
  },
];
