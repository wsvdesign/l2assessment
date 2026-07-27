/**
 * Urgency Scorer - additive signal model.
 * Starts at 0 and adds weight for critical/moderate distress signals,
 * punctuation intensity, and all-caps shouting. Returns High/Medium/Low.
 */

export function calculateUrgency(message) {
  const text = String(message || '').trim()
  const lower = text.toLowerCase()
  let urgencyScore = 0

  const criticalSignals = [
    'down',
    'outage',
    'urgent',
    'asap',
    'critical',
    'emergency',
    'production',
    'cannot access',
    "can't log in",
    'cannot log in',
    'data loss',
    'security',
    'breach',
    'all customers'
  ]

  const moderateSignals = [
    'error',
    'broken',
    'not working',
    'crash',
    'failed',
    'failing',
    'timeout',
    'timing out',
    'loading forever',
    'payment',
    'charged twice',
    'refund'
  ]

  criticalSignals.forEach(signal => {
    if (lower.includes(signal)) urgencyScore += 30
  })

  moderateSignals.forEach(signal => {
    if (lower.includes(signal)) urgencyScore += 15
  })

  const exclamationCount = (text.match(/!/g) || []).length
  urgencyScore += Math.min(exclamationCount * 5, 15)

  if (text.length > 10 && text === text.toUpperCase()) {
    urgencyScore += 10
  }

  // Courteous language softens borderline urgency, but never overrides critical signals.
  const mildWords = ['thank', 'thanks', 'appreciate', 'love', 'great']
  const hasMildWord = mildWords.some(word => lower.includes(word))
  const hasCriticalSignal = criticalSignals.some(s => lower.includes(s))
  if (hasMildWord && !hasCriticalSignal) {
    urgencyScore = Math.max(0, urgencyScore - 10)
  }

  if (urgencyScore >= 60) return "High"
  if (urgencyScore >= 25) return "Medium"
  return "Low"
}

