import Groq from 'groq-sdk';

/**
 * LLM Helper for categorizing customer support messages
 * Using Groq API for AI-powered categorization
 */

// Initialize Groq client lazily so the app still boots without an API key.
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
const groq = groqApiKey
  ? new Groq({
      apiKey: groqApiKey,
      dangerouslyAllowBrowser: true // Required for browser-based calls (not recommended for production!)
    })
  : null;

const categoryLabels = {
  billing: 'Billing Issue',
  technical: 'Technical Problem',
  feature: 'Feature Request',
  inquiry: 'General Inquiry'
};

const billingKeywords = ['bill', 'payment', 'charge', 'invoice', 'credit card', 'subscription', 'refund', 'cancel'];
const technicalKeywords = ['bug', 'error', 'broken', 'not working', 'crash', 'down', 'server', 'loading', 'slow', 'issue', 'problem', 'cannot access', 'cannot log in', "can't log in", 'login', 'log in', 'failing', 'failed', 'outage', 'deploy', 'production', 'unable to'];
const featureKeywords = ['feature', 'add', 'improve', 'would like to see', 'suggestion', 'wish', 'enhancement', 'roadmap'];
const inquiryKeywords = ['how', 'what', 'when', 'where', 'can i', 'is there', '?', 'hours', 'pricing', 'thank', 'thanks', 'appreciate', 'love', 'great'];

function detectSecondaryCategory(primaryCategory, scores) {
  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const secondaryKey = ranked.find((key) => categoryLabels[key] !== primaryCategory && scores[key] > 0);
  return secondaryKey ? categoryLabels[secondaryKey] : null;
}

function extractJsonObject(rawContent) {
  const trimmed = rawContent.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const firstBraceIndex = trimmed.indexOf('{');
  const lastBraceIndex = trimmed.lastIndexOf('}');
  if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
    return trimmed.slice(firstBraceIndex, lastBraceIndex + 1);
  }

  throw new Error('No JSON object found in model response.');
}

function normalizeCategory(rawValue = '') {
  const value = rawValue.toLowerCase();

  if (value.includes('billing')) return 'Billing Issue';
  if (value.includes('technical') || value.includes('bug')) return 'Technical Problem';
  if (value.includes('feature')) return 'Feature Request';
  if (value.includes('inquiry') || value.includes('question')) return 'General Inquiry';
  return 'Unknown';
}

/**
 * Categorize a customer support message using Groq AI
 * 
 * @param {string} message - The customer support message
 * @returns {Promise<{category: string, reasoning: string}>}
 */
export async function categorizeMessage(message) {
  if (!groq) {
    return getMockCategorization(message);
  }

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: 'system',
          content: 'You are a customer support triage classifier. Return strictly valid JSON only.'
        },
        {
          role: "user",
          content: `Classify this customer support message and return a JSON object with exactly these keys: primary_category, secondary_category, confidence, rationale.\n\nAllowed categories: Billing Issue, Technical Problem, Feature Request, General Inquiry, Unknown.\nUse null for secondary_category if none.\nconfidence must be a number between 0 and 1.\n\nMessage: ${message}`
        }
      ],
      temperature: 0.1,
    });

    const content = response.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(extractJsonObject(content));
    let category = normalizeCategory(parsed.primary_category);
    let secondaryCategory = parsed.secondary_category
      ? normalizeCategory(parsed.secondary_category)
      : null;
    let confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    // Safety net: if model returns Unknown, fall back to deterministic keyword scoring.
    if (category === 'Unknown') {
      const fallback = getMockCategorization(message);
      category = fallback.category;
      if (!secondaryCategory || secondaryCategory === 'Unknown') {
        secondaryCategory = fallback.secondaryCategory;
      }
      confidence = Math.max(confidence, fallback.confidence);
    }

    if (secondaryCategory === category || secondaryCategory === 'Unknown') {
      secondaryCategory = null;
    }

    return {
      category,
      secondaryCategory,
      confidence,
      reasoning: parsed.rationale || content
    };
  } catch (error) {
    console.warn('Groq API failed, using mock response:', error.message);
    return getMockCategorization(message);
  }
}

/**
 * Mock categorization for when API is unavailable
 */
function getMockCategorization(message) {
  const lowerMessage = message.toLowerCase();

  const scores = {
    billing: 0,
    technical: 0,
    feature: 0,
    inquiry: 0
  };

  billingKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) scores.billing += 1;
  });

  technicalKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) scores.technical += 1;
  });

  featureKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) scores.feature += 1;
  });

  inquiryKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) scores.inquiry += 1;
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primaryKey, primaryScore] = ranked[0];
  const category = primaryScore > 0 ? categoryLabels[primaryKey] : 'Unknown';
  const secondaryCategory = detectSecondaryCategory(category, scores);
  const totalMatches = Object.values(scores).reduce((total, value) => total + value, 0);
  const confidence = totalMatches > 0 ? Math.min(0.95, primaryScore / totalMatches + 0.2) : 0.3;

  let reasoning = 'Message does not include enough specific support signals, so manual review is recommended.';

  if (category === 'Billing Issue') {
    reasoning = 'Detected billing language such as payment, subscription, refund, or charge-related terms.';
  } else if (category === 'Technical Problem') {
    reasoning = 'Detected technical failure language such as crash, down, error, broken, or access problems.';
  } else if (category === 'Feature Request') {
    reasoning = 'Detected product enhancement language such as add, improve, feature, or suggestion terms.';
  } else if (category === 'General Inquiry') {
    reasoning = 'Detected informational question patterns without clear billing or technical failure indicators.';
  }

  if (secondaryCategory) {
    reasoning += ` Secondary signal detected: ${secondaryCategory}.`;
  }

  return {
    category,
    secondaryCategory,
    confidence,
    reasoning
  };
}
