/**
 * Recommendation Templates - Maps categories to recommended actions
 */

const actionTemplates = {
  'Billing Issue': {
    High: 'Escalate to billing specialist immediately and verify account/payment status.',
    Medium: 'Guide the user through billing portal checks and confirm payment method details.',
    Low: 'Share billing FAQ and billing portal instructions.'
  },
  'Technical Problem': {
    High: 'Escalate to on-call engineering and open an incident ticket with user impact details.',
    Medium: 'Provide troubleshooting steps and collect logs/screenshots if issue persists.',
    Low: 'Share self-service troubleshooting guide and monitor for recurrence.'
  },
  'Feature Request': {
    High: 'Acknowledge request and route to product team with business impact notes.',
    Medium: 'Log feature request in product backlog and share expected review process.',
    Low: 'Thank the user and record the feature request for roadmap review.'
  },
  'General Inquiry': {
    High: 'Provide direct support follow-up quickly and confirm if there is operational impact.',
    Medium: 'Respond with relevant documentation and offer follow-up support.',
    Low: 'Respond with FAQ link.'
  },
  'Billing + Technical': {
    High: 'Escalate to both billing and technical teams; prioritize restoring access first.',
    Medium: 'Triage billing and technical checks in parallel, then update user with next steps.',
    Low: 'Start with billing verification and provide technical troubleshooting fallback.'
  },
  Unknown: {
    High: 'Escalate for manual review due to unclear but potentially high-impact message.',
    Medium: 'Route to support queue for manual triage.',
    Low: 'Review manually.'
  }
}

const billingSignals = ['payment', 'billing', 'charge', 'invoice', 'refund', 'subscription', 'credit card']
const technicalSignals = ['crash', 'error', 'bug', 'down', 'broken', 'not working', 'cannot access', 'login']

function isHybridBillingTechnical(category, message = '') {
  if (category === 'Billing + Technical') {
    return true
  }

  const normalizedMessage = message.toLowerCase()
  const hasBillingSignal = billingSignals.some((word) => normalizedMessage.includes(word))
  const hasTechnicalSignal = technicalSignals.some((word) => normalizedMessage.includes(word))

  return hasBillingSignal && hasTechnicalSignal
}

/**
 * Get recommended action for a given category
 * 
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @param {string} message - The original message
 * @returns {string} - Recommended next step
 */
export function getRecommendedAction(category, urgency = 'Medium', message = '') {
  const customTemplates = JSON.parse(localStorage.getItem('customTemplates') || '{}')
  const key = `${category}|${urgency}`

  if (customTemplates[key]) {
    return customTemplates[key]
  }

  const resolvedCategory = isHybridBillingTechnical(category, message)
    ? 'Billing + Technical'
    : category

  const template = actionTemplates[resolvedCategory] || actionTemplates.Unknown
  return template[urgency] || template.Medium
}

/**
 * Get all available categories
 * 
 * @returns {string[]} - List of categories
 */
export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

/**
 * Determines if message should be escalated
 * 
 * @param {string} category - The message category
 * @param {string} urgency - The urgency level
 * @param {string} message - The original message
 * @returns {boolean} - Whether to escalate
 */
export function shouldEscalate(category, urgency, message) {
  return urgency === 'High' || isHybridBillingTechnical(category, message)
}
