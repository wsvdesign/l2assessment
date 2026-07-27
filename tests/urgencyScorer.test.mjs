// Regression tests for the urgency scorer.
// Run with: node --test tests/urgencyScorer.test.mjs
// Uses Node's built-in test runner; no framework or install required.

import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateUrgency } from '../src/utils/urgencyScorer.js'

test('production outage scores High', () => {
  assert.equal(calculateUrgency('Our production server is down'), 'High')
})

test('payment page loading forever scores Medium', () => {
  assert.equal(
    calculateUrgency('I tried to update my payment method but the page keeps loading forever. Is this a known issue?'),
    'Medium'
  )
})

test('feature request scores Low', () => {
  assert.equal(calculateUrgency('I would love to see a dark mode option in the app.'), 'Low')
})

test('thank-you message scores Low', () => {
  assert.equal(
    calculateUrgency('Hi there! I just wanted to say thank you for your amazing customer service.'),
    'Low'
  )
})

test('courtesy dampening softens a borderline complaint', () => {
  assert.equal(calculateUrgency('This is broken, but thanks for your patience!'), 'Low')
})

test('guard rail: courtesy cannot mask an outage', () => {
  // Critical signals present, so the dampening gate must block the reduction.
  assert.equal(calculateUrgency('Production is down, but thanks for your patience!'), 'High')
})
