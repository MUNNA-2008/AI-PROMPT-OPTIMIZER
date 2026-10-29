import { TestExecutionResult } from '../types';

export async function runPromptSimulation(
  originalPrompt: string,
  optimizedPrompt: string,
  sampleInput: string,
  temperature: number = 0.7
): Promise<{ original: TestExecutionResult; optimized: TestExecutionResult }> {
  // Simulate network latency (250ms - 450ms)
  await new Promise((resolve) => setTimeout(resolve, 350));

  const inputTrim = sampleInput.trim();
  const lowerOrig = originalPrompt.toLowerCase();

  // Determine realistic simulated outputs based on whether prompt was optimized
  let origOutput = '';
  let optOutput = '';

  if (lowerOrig.includes('sql') || lowerOrig.includes('query')) {
    origOutput = `Here is a query that might help you find the customers:\n\nSELECT * FROM customers WHERE id IN (SELECT customer_id FROM orders);\n\nYou can modify this depending on what columns you have in your database. Let me know if you need any adjustments or if you are using MySQL or PostgreSQL!`;

    optOutput = `-- Highly optimized PostgreSQL query
-- Enforces indexed scan, joins, and aggregations
SELECT 
  c.id AS customer_id,
  c.name AS customer_name,
  c.email,
  COUNT(o.id) AS total_orders,
  ROUND(SUM(oi.price * oi.quantity), 2) AS total_spent
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id
INNER JOIN order_items oi ON oi.order_id = o.id
WHERE 
  o.order_date >= NOW() - INTERVAL '90 days'
  AND o.status = 'completed'
  AND oi.category = 'electronics'
GROUP BY c.id, c.name, c.email
HAVING SUM(oi.price * oi.quantity) > 500
ORDER BY total_spent DESC
LIMIT 20;

-- Index Optimization Recommendations:
-- CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date) WHERE status = 'completed';
-- CREATE INDEX idx_order_items_order_cat ON order_items(order_id, category);`;
  } else if (lowerOrig.includes('json') || lowerOrig.includes('extract') || lowerOrig.includes('invoice')) {
    origOutput = `Sure! Here is the extracted information:\n\nInvoice Number: #INV-2026-081\nDate: October 14, 2026\nClient: Apex Logistics LLC\nAmount: $4,850.00 USD\n\nHope this helps! Let me know if you want it formatted differently.`;

    optOutput = `{
  "invoiceNumber": "INV-2026-081",
  "issueDate": "2026-10-14",
  "clientName": "Apex Logistics LLC",
  "totalAmount": 4850.00,
  "currency": "USD",
  "paymentTermsDays": 30,
  "status": "pending_payment"
}`;
  } else if (lowerOrig.includes('code') || lowerOrig.includes('typescript') || lowerOrig.includes('review')) {
    origOutput = `The code looks okay for basic testing, but in production you might want to handle errors if the fetch fails. Also make sure the userId is valid before calling the API.`;

    optOutput = `### Code Audit & Security Assessment

#### 1. Vulnerability Findings:
- **Critical (XSS):** Direct injection via \`dangerouslySetInnerHTML={{ __html: data?.bio }}\` allows reflected and stored cross-site scripting if \`bio\` is unsanitized.
- **Race Condition:** \`useEffect\` lacks an \`AbortController\`. If \`userId\` changes rapidly, stale responses will overwrite active state.
- **Missing Dependency:** \`userId\` is omitted from the dependency array \`[]\`, causing stale closure bugs.

#### 2. Hardened Production Implementation:
\`\`\`tsx
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

interface UserProfileProps {
  userId: string;
}

interface UserData {
  id: string;
  bio?: string;
}

export function UserProfile({ userId }: UserProfileProps): React.JSX.Element {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(\`/api/user?id=\${encodeURIComponent(userId)}\`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(\`HTTP error: \${res.status}\`);
        return res.json();
      })
      .then((payload: UserData) => {
        setData(payload);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [userId]);

  if (loading) return <div className="p-4 text-slate-400">Loading user profile...</div>;
  if (error) return <div className="p-4 text-rose-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(data?.bio || ''),
        }}
      />
    </div>
  );
}
\`\`\``;
  } else {
    origOutput = `Here are some thoughts on your request based on the provided input:\n\n${inputTrim || 'Input data received'}\n\n1. It is important to consider user needs and goals.\n2. You can implement this in several ways depending on your architecture.\n3. Make sure to test thoroughly.\n\nLet me know if you would like me to expand on any of these points!`;

    optOutput = `### Strategic Execution Deliverable

#### 1. Core Objective & Scope
Processed payload targeting: "${inputTrim || 'Standard query payload'}".

#### 2. Key Actionable Components
- **Deterministic Boundary:** Strict constraints prevent open-ended conversational deviation.
- **Verified Deliverable:** High-density structural clarity designed for automated ingestion or executive review.
- **Error Mitigation:** Injected positive specifications and negative boundaries ensure consistent output regardless of sampling variance.

#### 3. Recommended Implementation
Directly deploy the structured template with target model temperature set to ${temperature}.`;
  }

  const origTokens = Math.ceil(origOutput.length / 4);
  const optTokens = Math.ceil(optOutput.length / 4);

  return {
    original: {
      output: origOutput,
      durationMs: 412,
      tokenCount: origTokens,
    },
    optimized: {
      output: optOutput,
      durationMs: 388,
      tokenCount: optTokens,
    },
  };
}
