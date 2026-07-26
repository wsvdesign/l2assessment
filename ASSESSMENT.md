## Week 8 Assessment: Relay AI Customer Inbox Triage

### Natalie Walker

### Top 3 Areas for Improvement
**1. Inverted urgency scoring (implemented this week).** The rule-based urgency scorer penalized exactly the signals that indicate real urgency: short messages lost 40 to 60 points, all-caps messages lost 50, questions lost 25, and messages sent on weekends or after business hours were scored lower. It contained no detection of urgent language at all. The result: the README's own example, "Our production server is down," scored Low urgency. For Relay AI's business, this is the highest-risk flaw, because a triage tool that buries outages destroys the customer trust the subscription depends on.

**2. Unstructured LLM integration.** The categorization prompt is a single unstructured line with no system prompt, no fixed category list, no JSON output format, and temperature 0.7 on a classification task. The category is then extracted by keyword-matching the model's free-prose reply, defaulting to Unknown. The customer message is interpolated raw into the prompt, leaving it open to prompt injection. When the API fails, the app silently falls back to a keyword mock without informing the user that no AI was involved. Proposed solution: a system prompt with an enumerated category list, JSON-only structured output, temperature 0, input delimiting to resist injection, and a visible indicator when fallback mode is active.

**3. Broken recommendation and escalation logic.** Feature Request maps to "Ask user to check billing portal," a copy-paste error. Recommendations accept an urgency parameter and ignore it, so a High urgency outage and a Low urgency question receive identical advice. The shouldEscalate function escalates purely on message length over 100 characters, meaning a long thank-you note escalates while "PRODUCTION DOWN" does not; the function is also never called anywhere in the app. Proposed solution: urgency-aware action templates per category and escalation driven by category plus urgency rather than character count.

### Implemented Improvement
Rewrote `src/utils/urgencyScorer.js` with signal-based scoring: critical signals (down, outage, production, urgent, security, data loss) add 30 points each, moderate signals (error, crash, payment, refund) add 15, exclamation marks add up to 15, and all-caps now raises urgency instead of lowering it. All penalties for brevity, politeness, questions, and time-of-day were removed, because customer urgency does not depend on when the triage tool happens to run.

### Test Results (Live App Verification)

- "Our production server is down" → High
- "I tried to update my payment method but the page keeps loading forever. Is this a known issue?" → Medium
- "I would love to see a dark mode option in the app." → Low
- "Hi there! I just wanted to say thank you for your amazing customer service." → Low
Before the fix, the first message scored Low. After the fix, it scores High.
