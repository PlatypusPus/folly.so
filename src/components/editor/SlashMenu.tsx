import { useEffect, useRef } from 'react'
import { GROUPS, Icon, searchBlocks } from '../../blockCatalog'
import type { BlockType } from '../../types'

export function SlashMenu({
  query,
  onSelect,
  onClose,
  anchorRect,
}: {
  query: string
  onSelect: (type: BlockType) => void
  onClose: () => void
  anchorRect: DOMRect | null
}) {
  const ref = useRef<HTMLDivElement>(null)
  const results = searchBlocks(query)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [query, results.length])

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onMouse)
    return () => document.removeEventListener('mousedown', onMouse)
  }, [onClose])

  const top = anchorRect ? Math.min(anchorRect.bottom + 4, window.innerHeight - 380) : 120
  const left = anchorRect ? Math.max(12, Math.min(anchorRect.left, window.innerWidth - 360)) : 24

  return (
    <div
      ref={ref}
      className="animate-pop fixed z-50 w-[340px] overflow-hidden rounded-xl border border-ink/10 bg-white shadow-pop"
      style={{ top, left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2 border-b border-ink/[0.06] px-3 py-2 text-[12px] text-ink/40">
        <span className="flex h-4 w-4 items-center justify-center rounded bg-ink/[0.06] font-mono text-[10px] font-bold text-ink/60">
          /
        </span>
        {query ? (
          <span>
            <span className="font-medium text-ink/70">‘{query}’</span>
            — no results? try another block
          </span>
        ) : (
          <span>Insert block</span>
        )}
      </div>
      <div className="max-h-[320px] overflow-y-auto p-1.5">
        {results.length === 0 && (
          <div className="px-3 py-6 text-center text-[13px] text-ink/40">Nothing matches “{query}”.</div>
        )}
        {GROUPS.map((group) => {
          const items = results.filter((b) => b.group === group)
          if (items.length === 0) return null
          return (
            <div key={group}>
              <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink/35">{group}</div>
              {items.map((b) => (
                <button
                  key={b.type}
                  ref={b.type === results[0]?.type ? activeRef : undefined}
                  onMouseEnter={(e) => {
                    // visual hover handled by CSS
                  }}
                  onClick={() => onSelect(b.type)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-ink/[0.05]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.04] text-ink/70">
                    <Icon name={b.type} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14px] font-semibold text-ink">{b.label}</span>
                    <span className="block text-[12px] text-ink/45">{b.hint}</span>
                  </span>
                  {b.shortcut && <kbd className="rounded bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-ink/40">{b.shortcut}</kbd>}
                </button>
              ))}
            </div>
          )
        })}
      </div>
      <div className="border-t border-ink/[0.06] px-3 py-2 text-[11px] text-ink/35">
        <kbd className="rounded bg-ink/[0.05] px-1 py-0.5 font-mono">↵</kbd> to insert · <kbd className="rounded bg-ink/[0.05] px-1 py-0.5 font-mono">esc</kbd> to close
      </div>
    </div>
  )
}