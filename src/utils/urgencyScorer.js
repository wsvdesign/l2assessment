/**
 * Urgency Scorer - Rule-based urgency calculation
 */

export function calculateUrgency(message) {
  const normalizedMessage = message.toLowerCase()
  let urgencyScore = 20

  const criticalSignals = [
    'urgent',
    'asap',
    'outage',
    'down',
    'cannot',
    "can't",
    'failed',
    'failure',
    'failing',
    'production',
    'deploy',
    'all customers',
    'crash',
    'broken',
    'not working',
    'login failed',
    'cannot log in',
    "can't log in",
    'blocked'
  ]

  const moderateSignals = [
    'error',
    'issue',
    'problem',
    'slow',
    'bug',
    'payment failed',
    'refund'
  ]

  const lowPrioritySignals = [
    'thank you',
    'thanks',
    'appreciate',
    'love',
    'great work',
    'feature request',
    'could you add',
    'business hours'
  ]

  criticalSignals.forEach((signal) => {
    if (normalizedMessage.includes(signal)) urgencyScore += 20
  })

  moderateSignals.forEach((signal) => {
    if (normalizedMessage.includes(signal)) urgencyScore += 10
  })

  lowPrioritySignals.forEach((signal) => {
    if (normalizedMessage.includes(signal)) urgencyScore -= 10
  })

  const exclamationCount = (message.match(/!/g) || []).length
  urgencyScore += Math.min(exclamationCount, 3) * 5

  if (message.includes('?') && urgencyScore < 55) {
    urgencyScore -= 5
  }

  urgencyScore = Math.max(0, Math.min(100, urgencyScore))

  if (urgencyScore >= 70) return 'High'
  if (urgencyScore <= 30) return 'Low'
  return "Medium"
}
