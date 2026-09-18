import type { Block } from '../types'

export interface ColumnRow {
  key: string
  id: string
  blocks: Block[]
}

export function rowLayout(blocks: Block[]): ColumnRow[] {
  const rows: ColumnRow[] = []
  for (const b of blocks) {
    const last = rows[rows.length - 1]
    if (b.colId && last && last.blocks.length > 0 && last.blocks[0].colId === b.colId) {
      last.blocks.push(b)
    } else {
      rows.push({ key: `${b.colId || 'col'}-${b.id}`, id: b.colId || '', blocks: [b] })
    }
  }
  return rows
}

export function columnCount(blocks: Block[]): number {
  return blocks.length || 1
}