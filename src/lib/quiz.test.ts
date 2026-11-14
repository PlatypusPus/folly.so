// Run with `npm test`
import { computeTotalQuizScore, computeScore } from './logic.ts'
import type { Block } from '../types.ts'

const testBlocks: Block[] = [
  {
    id: 'q1',
    type: 'multipleChoice',
    text: 'What is the capital of France?',
    options: [
      { id: 'o1', label: 'Paris', isCorrect: true, points: 1 },
      { id: 'o2', label: 'London', isCorrect: false, points: 0 },
      { id: 'o3', label: 'Berlin', isCorrect: false, points: 0 },
    ],
  },
  {
    id: 'q2',
    type: 'checkbox',
    text: 'Select all prime numbers',
    allowMultiple: true,
    options: [
      { id: 'o4', label: '2', isCorrect: true, points: 2 },
      { id: 'o5', label: '3', isCorrect: true, points: 2 },
      { id: 'o6', label: '4', isCorrect: false, points: 0 },
    ],
  },
]

// Case 1: All correct
const answers1 = { q1: 'Paris', q2: ['2', '3'] }
const res1 = computeTotalQuizScore(testBlocks, answers1)
if (res1.totalScore !== 5 || res1.maxScore !== 5 || !res1.hasQuiz) {
  throw new Error(`FAIL Case 1: expected 5/5, got ${res1.totalScore}/${res1.maxScore}`)
}

// Case 2: Partial correct
const answers2 = { q1: 'London', q2: ['2'] }
const res2 = computeTotalQuizScore(testBlocks, answers2)
if (res2.totalScore !== 2 || res2.maxScore !== 5) {
  throw new Error(`FAIL Case 2: expected 2/5, got ${res2.totalScore}/${res2.maxScore}`)
}

// Case 3: None correct
const answers3 = { q1: 'Berlin', q2: ['4'] }
const res3 = computeTotalQuizScore(testBlocks, answers3)
if (res3.totalScore !== 0 || res3.maxScore !== 5) {
  throw new Error(`FAIL Case 3: expected 0/5, got ${res3.totalScore}/${res3.maxScore}`)
}

console.log('Quiz scoring tests: all cases passed!')
