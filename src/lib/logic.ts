import type { AnswerValue, Block, BlockType, Form } from '../types'

export function getQuestionLabel(block: Block): string {
  const t = block.text.trim()
  return t.length > 0 ? t : 'Untitled question'
}

const ANSWER_TYPES: BlockType[] = [
  'shortText',
  'longText',
  'number',
  'email',
  'phone',
  'date',
  'rating',
  'nps',
  'linear',
  'multipleChoice',
  'checkbox',
  'dropdown',
  'fileUpload',
]

export function isAnswerBlock(type: BlockType): boolean {
  return ANSWER_TYPES.includes(type)
}

export function canHaveLogic(block: Block): boolean {
  return isAnswerBlock(block.type) || block.type === 'image' || block.type === 'paragraph'
}

function answerMatches(
  answer: AnswerValue,
  value: string,
  op: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan',
): boolean {
  if (Array.isArray(answer)) {
    const stringAnswers = answer.map((a) => String(a).toLowerCase())
    const target = value.toLowerCase()

    if (op === 'equals') return stringAnswers.includes(target)
    if (op === 'notEquals') return !stringAnswers.includes(target)
    if (op === 'contains') return stringAnswers.some((a) => a.includes(target))
    if (op === 'notContains') return !stringAnswers.some((a) => a.includes(target))

    const numVal = Number(value)
    if (!isNaN(numVal)) {
      const numericAnswers = answer.map((a) => Number(a)).filter((n) => !isNaN(n))
      if (numericAnswers.length > 0) {
        if (op === 'greaterThan') return numericAnswers.some((n) => n > numVal)
        if (op === 'lessThan') return numericAnswers.some((n) => n < numVal)
      }
    }
    return false
  }

  const normalized = answer === undefined || answer === null ? '' : String(answer)
  const normLower = normalized.toLowerCase()
  const targetLower = value.toLowerCase()

  if (op === 'equals') return normLower === targetLower
  if (op === 'notEquals') return normLower !== targetLower
  if (op === 'contains') return normLower.includes(targetLower)
  if (op === 'notContains') return !normLower.includes(targetLower)

  const answerNum = Number(normalized)
  const targetNum = Number(value)
  if (!isNaN(answerNum) && !isNaN(targetNum)) {
    if (op === 'greaterThan') return answerNum > targetNum
    if (op === 'lessThan') return answerNum < targetNum
  }
  return false
}

export function blockVisible(block: Block, answers: Record<string, AnswerValue>): boolean {
  if (!block.showIf || block.showIf.length === 0) return true
  return block.showIf.every((c) => {
    const answer = answers[c.fieldId]
    if (c.op === 'equals' && (answer === undefined || answer === null || answer === '')) return false
    return answerMatches(answer, c.value, c.op)
  })
}

export function visibleBlocks(form: Form, answers: Record<string, AnswerValue>): Block[] {
  return form.blocks.filter((b) => blockVisible(b, answers))
}

export function splitIntoPages(blocks: Block[], answers: Record<string, AnswerValue>): Block[][] {
  const pages: Block[][] = []
  let current: Block[] = []
  for (const block of blocks) {
    if (!blockVisible(block, answers)) continue
    if (block.type === 'pageBreak') {
      pages.push(current)
      current = []
    } else {
      current.push(block)
    }
  }
  pages.push(current)
  return pages.filter((p) => p.length > 0)
}

export function questionOptions(form: Form): Array<{ id: string; label: string }> {
  return form.blocks
    .filter((b) => isAnswerBlock(b.type))
    .map((b) => ({ id: b.id, label: getQuestionLabel(b) }))
}

export function answerOptionsFor(block: Block): string[] {
  return (block.options ?? []).filter((o) => o.label.trim()).map((o) => o.label.trim())
}

export function formatAnswer(value: AnswerValue): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object' && 'name' in value) {
    const f = value as { name: string; size: number }
    return `${f.name} (${(f.size / 1024).toFixed(1)} KB)`
  }
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function formatWhen(ts: number): string {
  const d = new Date(ts)
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}