import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Block, BlockType, ChoiceOption } from '../types'
import { makeBlock, uid } from '../types'
import { useForms } from '../store'
import { BLOCKS, Icon } from '../blockCatalog'
import { SlashMenu } from '../components/editor/SlashMenu'
import { SettingsPopover } from '../components/editor/SettingsPopover'
import { ShareDrawer, ThemeDrawer } from '../components/editor/Drawers'

type Anchor = 'end' | 'start'

function placeCaret(el: HTMLElement, at: Anchor) {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(at === 'end')
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function atEdge(el: HTMLElement, edge: Anchor): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  const node = el.firstChild ?? el
  if (edge === 'start') return range.collapsed && range.startContainer === node && range.startOffset === 0
  const len = node instanceof Text ? (node.data?.length ?? 0) : 0
  return range.collapsed && range.endContainer === node && range.endOffset === len
}

function normalizeText(t: string): string {
  return t
    .replace(/[\u200B-\u200F\u2060]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trimEnd()
}

const TEXT_EDITABLE: BlockType[] = ['heading', 'paragraph', 'shortText', 'longText', 'email', 'phone', 'number', 'date', 'fileUpload']
const CHOICE_TYPES: BlockType[] = ['multipleChoice', 'checkbox', 'dropdown']

function starterOptions(): ChoiceOption[] {
  return ['Option 1', 'Option 2', 'Option 3'].map((label) => ({ id: uid(), label }))
}

export default function Editor() {
  const { formId = '' } = useParams()
  const navigate = useNavigate()
  const form = useForms((s) => s.forms.find((f) => f.id === formId))
  const createForm = useForms((s) => s.createForm)
  const updateBlock = useForms((s) => s.updateBlock)
  const addBlock = useForms((s) => s.addBlock)
  const removeBlock = useForms((s) => s.removeBlock)
  const moveBlock = useForms((s) => s.moveBlock)
  const updateSettings = useForms((s) => s.updateSettings)
  const submissions = useForms((s) => s.submissions)

  const [ready, setReady] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const focusTick = useRef<Record<string, number>>({})
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [slash, setSlash] = useState<{ blockId: string; query: string; textBefore: string; rect: DOMRect | null } | null>(null)
  const [settingsFor, setSettingsFor] = useState<string | null>(null)
  const [themeOpen, setThemeOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!ready && formId === 'new') {
      const f = createForm()
      navigate(`/editor/${f.id}`, { replace: true })
    }
    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId])

  const doFocus = useCallback((id: string, at: Anchor) => {
    focusTick.current[id] = (focusTick.current[id] ?? 0) + 1
    setActiveId(id)
    requestAnimationFrame(() => {
      const el = rowRefs.current.get(id)
      if (el) {
        el.focus()
        placeCaret(el, at)
      }
    })
  }, [])

  const insertNewBlock = (index: number, type: BlockType, text = '') => {
    if (!form) return
    const block = makeBlock({
      ...(CHOICE_TYPES.includes(type) ? { options: starterOptions() } : {}),
      type,
      text,
    })
    addBlock(form.id, block, index + 1)
    doFocus(block.id, 'end')
  }

  const convertBlock = (block: Block, type: BlockType, text: string) => {
    if (!form) return
    const patch: Partial<Block> = { type, text }
    if (CHOICE_TYPES.includes(type)) patch.options = starterOptions()
    updateBlock(form.id, block.id, patch)
    requestAnimationFrame(() => {
      const el = rowRefs.current.get(block.id)
      if (el) {
        el.textContent = text
        el.focus()
        placeCaret(el, 'end')
      }
    })
  }

  const onEnterInBlock = (block: Block, index: number) => {
    if (slash && slash.blockId === block.id) {
      const q = slash.query.trim().toLowerCase()
      const hit = BLOCKS.find(
        (b) => (b.shortcut?.toLowerCase() ?? '') === q || b.label.toLowerCase().includes(q),
      )
      convertBlock(block, hit?.type ?? 'shortText', slash.textBefore)
      setSlash(null)
      return
    }
    const preferred = TEXT_EDITABLE.includes(block.type) ? block.type : 'shortText'
    insertNewBlock(index, block.type === 'heading' ? 'paragraph' : preferred)
  }

  const onRemoveAt = (index: number) => {
    if (!form) return
    const cur = form.blocks[index]
    const prev = form.blocks[index - 1]
    const next = form.blocks[index + 1]
    rowRefs.current.delete(cur.id)
    removeBlock(form.id, cur.id)
    if (prev) doFocus(prev.id, 'end')
    else if (next) doFocus(next.id, 'start')
    else setActiveId(null)
  }

  const onBlockKeyDown = (e: KeyboardEvent<HTMLDivElement>, block: Block, index: number) => {
    const el = e.currentTarget
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onEnterInBlock(block, index)
      return
    }
    if (e.key === 'Backspace' && (el.textContent ?? '').trim() === '' && atEdge(el, 'start')) {
      e.preventDefault()
      onRemoveAt(index)
      return
    }
    if (e.key === 'ArrowUp' && atEdge(el, 'start')) {
      const prev = form?.blocks[index - 1]
      if (prev) {
        e.preventDefault()
        doFocus(prev.id, 'end')
      }
      return
    }
    if (e.key === 'ArrowDown' && atEdge(el, 'end')) {
      const next = form?.blocks[index + 1]
      if (next) {
        e.preventDefault()
        doFocus(next.id, 'start')
      }
      return
    }
    if (e.key === 'Escape') {
      setSlash(null)
      setSettingsFor(null)
      el.blur()
      setActiveId(null)
    }
  }

  const onQuestionInput = (blockId: string, text: string, el: HTMLElement) => {
    updateBlock(form?.id ?? '', blockId, { text: normalizeText(text) })
    const lastSlash = text.lastIndexOf('/')
    if (lastSlash === -1) {
      if (slash && slash.blockId === blockId) setSlash(null)
      return
    }
    setSlash({ blockId, query: text.slice(lastSlash + 1), textBefore: text.slice(0, lastSlash).trimEnd(), rect: el.getBoundingClientRect() })
  }

  const moveFromDrag = (targetIndex: number) => {
    if (!form || !dragId) return
    const fromIndex = form.blocks.findIndex((b) => b.id === dragId)
    if (fromIndex === -1 || fromIndex === targetIndex) return
    moveBlock(form.id, fromIndex, targetIndex)
  }

  if (!ready || !form) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/40">Loading…</div>
  }

  const responseCount = submissions.filter((s) => s.formId === form.id).length

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafb]">
      <TopBar
        form={form}
        responseCount={responseCount}
        onOpenTheme={() => setThemeOpen(true)}
        onOpenShare={() => setShareOpen(true)}
      />

      <main className="editor-canvas flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-5 pt-10 sm:px-8">
          <TitleEditor title={form.settings.title} onChange={(t) => updateSettings(form.id, { title: t })} />

          <div className="mt-8 space-y-1 pb-40">
            {form.blocks.map((block, index) => (
              <BlockRow
                key={block.id}
                formId={form.id}
                block={block}
                index={index}
                active={activeId === block.id}
                focusTick={focusTick.current[block.id] ?? 0}
                onRegister={(el) => {
                  if (el) rowRefs.current.set(block.id, el)
                  else rowRefs.current.delete(block.id)
                }}
                onText={(t) => updateBlock(form.id, block.id, { text: normalizeText(t) })}
                onInput={(text, el) => onQuestionInput(block.id, text, el)}
                onKeyDown={onBlockKeyDown}
                onFocusBlock={() => {
                  setActiveId(block.id)
                  if (slash) setSlash(null)
                }}
                onOpenSettings={() => setSettingsFor(block.id)}
                onDragStart={() => setDragId(block.id)}
                onDragEnd={() => {
                  setDragId(null)
                  setOverIndex(null)
                }}
                onDragOver={(e, i) => {
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  setOverIndex(i)
                }}
                onDrop={(e, i) => {
                  e.preventDefault()
                  moveFromDrag(i)
                  setOverIndex(null)
                }}
                overIndex={overIndex === index}
              />
            ))}

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertNewBlock(form.blocks.length, 'shortText')}
              className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] text-ink/40 transition hover:bg-ink/[0.04] hover:text-ink/70"
            >
              <Icon name="plus" />
              Add a question or type <span className="rounded bg-ink/[0.06] px-1.5 font-mono text-[12px] font-bold">/</span>
            </button>
          </div>
        </div>
      </main>

      {slash && (
        <SlashMenu
          query={slash.query}
          anchorRect={slash.rect}
          onClose={() => setSlash(null)}
          onSelect={(type) => {
            const block = form.blocks.find((b) => b.id === slash.blockId)
            if (block) {
              convertBlock(block, type, slash.textBefore)
              setSlash(null)
            }
          }}
        />
      )}

      {settingsFor && (
        <SettingsPopover
          form={form}
          blockId={settingsFor}
          index={form.blocks.findIndex((b) => b.id === settingsFor)}
          count={form.blocks.length}
          anchorRect={rowRefs.current.get(settingsFor)?.getBoundingClientRect() ?? null}
          onClose={() => setSettingsFor(null)}
        />
      )}

      {themeOpen && <ThemeDrawer form={form} onClose={() => setThemeOpen(false)} />}
      {shareOpen && <ShareDrawer form={form} onClose={() => setShareOpen(false)} />}
    </div>
  )
}

function TopBar({
  form,
  responseCount,
  onOpenTheme,
  onOpenShare,
}: {
  form: { id: string; settings: { title: string } }
  responseCount: number
  onOpenTheme: () => void
  onOpenShare: () => void
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink/[0.06] bg-white/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to="/forms"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink/50 transition hover:bg-ink/[0.05] hover:text-ink"
          title="Back to forms"
        >
          <Icon name="back" />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-500 font-black text-white"
            style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
          >
            f
          </span>
          <span className="truncate text-[14px] font-semibold text-ink/90">{form.settings.title || 'Untitled form'}</span>
          <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 sm:inline">
            Draft
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          to={`/forms/${form.id}/submissions`}
          className="hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink/60 transition hover:bg-ink/[0.05] hover:text-ink sm:flex"
        >
          Responses
          {responseCount > 0 && (
            <span className="rounded-full bg-ink/[0.07] px-1.5 py-0.5 text-[11px] font-bold text-ink/60">{responseCount}</span>
          )}
        </Link>
        <button
          onClick={onOpenTheme}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold text-ink/60 transition hover:bg-ink/[0.05] hover:text-ink"
        >
          <Icon name="theme" />
          <span className="hidden sm:inline">Design</span>
        </button>
        <button
          onClick={onOpenShare}
          className="rounded-full bg-brand-500 px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-brand-600"
        >
          Share
        </button>
      </div>
    </header>
  )
}

function TitleEditor({ title, onChange }: { title: string; onChange: (t: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.textContent !== title) {
      el.textContent = title
    }
  }, [title])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={() => onChange((ref.current?.textContent ?? '').replace(/\n/g, ' ').trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).blur()
        }
        if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur()
      }}
      data-placeholder="Untitled form"
      className="empty-placeholder font-form-serif w-full cursor-text text-[38px] font-semibold leading-[1.15] tracking-tight text-ink outline-none sm:text-[44px]"
    />
  )
}

function InsertLine() {
  return <div className="absolute -top-[3px] left-0 right-0 z-10 h-[3px] rounded-full bg-brand-500" />
}

function Rail({
  onOpenSettings,
  onDragStart,
  onDragEnd,
}: {
  onOpenSettings: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  return (
    <div className="absolute -left-11 top-2 flex-col items-center gap-0.5 opacity-0 transition group-hover:opacity-100 hidden lg:flex">
      <span
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          onDragStart()
        }}
        onDragEnd={onDragEnd}
        className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-ink/35 transition hover:bg-ink/[0.08] hover:text-ink/70 active:cursor-grabbing"
        title="Drag to reorder"
      >
        <Icon name="dots" />
      </span>
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onOpenSettings()
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink/35 transition hover:bg-ink/[0.08] hover:text-ink/70"
        title="Block settings"
      >
        <Icon name="gear" />
      </button>
    </div>
  )
}

function BlockRow({
  formId,
  block,
  index,
  active,
  focusTick,
  onRegister,
  onText,
  onInput,
  onKeyDown,
  onFocusBlock,
  onOpenSettings,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  overIndex,
}: {
  formId: string
  block: Block
  index: number
  active: boolean
  focusTick: number
  onRegister: (el: HTMLElement | null) => void
  onText: (t: string) => void
  onInput: (t: string, el: HTMLElement) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, block: Block, index: number) => void
  onFocusBlock: () => void
  onOpenSettings: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDrop: (e: React.DragEvent, i: number) => void
  overIndex: boolean
}) {
  const questionRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Map<string, HTMLSpanElement>>(new Map())
  const updateBlock = useForms((s) => s.updateBlock)

  useEffect(() => {
    onRegister(questionRef.current)
    return () => onRegister(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id])

  useEffect(() => {
    const el = questionRef.current
    if (el && el !== document.activeElement && el.textContent !== block.text) {
      el.textContent = block.text
    }
  }, [block.text])

  useEffect(() => {
    const el = questionRef.current
    if (el && el === document.activeElement && focusTick > 0) {
      placeCaret(el, 'end')
    }
  }, [focusTick])

  // keep options in the DOM in sync with the store, unless being edited
  useEffect(() => {
    for (const o of block.options ?? []) {
      const el = optionRefs.current.get(o.id)
      if (el && el !== document.activeElement && el.textContent !== o.label) {
        el.textContent = o.label
      }
    }
  }, [block.options])

  const isChoice = CHOICE_TYPES.includes(block.type)

  const handleQuestionInput = () => {
    const el = questionRef.current
    if (!el) return
    const raw = el.textContent ?? ''
    onText(raw)
    onInput(raw, el)
  }

  const updateOption = (id: string, label: string) => {
    const options = (block.options ?? []).map((o) => (o.id === id ? { ...o, label } : o))
    updateBlock(formId, block.id, { options })
  }

  const removeOption = (id: string) => {
    const options = (block.options ?? []).filter((o) => o.id !== id)
    if (options.length === 0) return
    optionRefs.current.delete(id)
    updateBlock(formId, block.id, { options })
  }

  const addOption = (afterId?: string) => {
    const newOpt = { id: uid(), label: '' }
    const options = [...(block.options ?? [])]
    const insertAt = afterId ? options.findIndex((o) => o.id === afterId) : options.length - 1
    options.splice(insertAt + 1, 0, newOpt)
    updateBlock(formId, block.id, { options })
    requestAnimationFrame(() => {
      const el = optionRefs.current.get(newOpt.id)
      if (el) {
        el.focus()
        placeCaret(el, 'end')
      }
    })
  }

  const onOptionKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>, id: string, oi: number) => {
    const el = e.currentTarget
    const options = block.options ?? []
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addOption(id)
      return
    }
    if (e.key === 'Backspace' && (el.textContent ?? '').trim() === '' && atEdge(el, 'start')) {
      e.preventDefault()
      if (oi === 0) {
        if (questionRef.current) {
          questionRef.current.focus()
          placeCaret(questionRef.current, 'end')
        }
        return
      }
      const prev = options[oi - 1]
      removeOption(id)
      requestAnimationFrame(() => {
        const pel = optionRefs.current.get(prev.id)
        if (pel) {
          pel.textContent = prev.label
          pel.focus()
          placeCaret(pel, 'end')
        }
      })
    }
  }

  const wrapperCls = `group relative rounded-xl transition ${
    active ? 'bg-ink/[0.035] ring-1 ring-ink/[0.04]' : 'hover:bg-ink/[0.02]'
  }`

  if (block.type === 'heading') {
    return (
      <div
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={`${wrapperCls} px-1 py-2`}
      >
        {overIndex && <InsertLine />}
        <Rail onOpenSettings={onOpenSettings} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        <div
          ref={questionRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Heading"
          onInput={handleQuestionInput}
          onKeyDown={(e) => onKeyDown(e, block, index)}
          onFocus={onFocusBlock}
          className="empty-placeholder w-full cursor-text font-form-serif text-[30px] font-semibold leading-snug text-ink outline-none"
        />
      </div>
    )
  }

  if (block.type === 'paragraph') {
    return (
      <div
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={`${wrapperCls} px-1 py-1.5`}
      >
        {overIndex && <InsertLine />}
        <Rail onOpenSettings={onOpenSettings} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        <div
          ref={questionRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Paragraph text"
          onInput={handleQuestionInput}
          onKeyDown={(e) => onKeyDown(e, block, index)}
          onFocus={onFocusBlock}
          className="empty-placeholder w-full cursor-text font-form-serif text-[17px] leading-relaxed text-ink/75 outline-none"
        />
      </div>
    )
  }

  if (block.type === 'pageBreak') {
    return (
      <div
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={`${wrapperCls} px-1 py-1`}
      >
        {overIndex && <InsertLine />}
        <Rail onOpenSettings={onOpenSettings} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        <div className="flex items-center gap-3 py-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/[0.04] text-ink/40">
            <Icon name="pageBreak" />
          </span>
          <div className="flex-1 text-[14px] font-semibold text-ink/45">New page starts here</div>
          <span className="rounded-full bg-ink/[0.05] px-2 py-0.5 text-[11px] font-semibold text-ink/40">Page break</span>
        </div>
      </div>
    )
  }

  if (block.type === 'thankYou') {
    return (
      <div
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={`${wrapperCls} px-1 py-1`}
      >
        {overIndex && <InsertLine />}
        <Rail onOpenSettings={onOpenSettings} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Icon name="thankYou" />
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-bold text-emerald-800">Thank you page</div>
            <div className="text-[12px] text-emerald-600/70">Respondents arrive here after submitting</div>
          </div>
        </div>
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <div
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={`${wrapperCls} px-1 py-1.5`}
      >
        {overIndex && <InsertLine />}
        <Rail onOpenSettings={onOpenSettings} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        {block.imageUrl ? (
          <img src={block.imageUrl} alt={block.text} className="max-h-[320px] w-fit rounded-2xl border border-black/5" />
        ) : (
          <div className="flex h-36 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-ink/25 bg-white/70 text-[14px] text-ink/40 transition hover:border-ink/50 hover:text-ink/70">
            Open block settings (<span className="mx-1 font-semibold">⋮⋮</span>) to paste an image URL
          </div>
        )}
      </div>
    )
  }

  if (isChoice) {
    const multiple = block.allowMultiple
    return (
      <div
        onDragOver={(e) => onDragOver(e, index)}
        onDrop={(e) => onDrop(e, index)}
        className={`${wrapperCls} px-1 py-1.5`}
      >
        {overIndex && <InsertLine />}
        <Rail onOpenSettings={onOpenSettings} onDragStart={onDragStart} onDragEnd={onDragEnd} />
        <div
          ref={questionRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Your question"
          onInput={handleQuestionInput}
          onKeyDown={(e) => onKeyDown(e, block, index)}
          onFocus={onFocusBlock}
          className="empty-placeholder w-full cursor-text text-[18px] font-medium leading-snug text-ink outline-none"
        />

        <div className="mt-3 space-y-2 pl-1">
          {(block.options ?? []).map((o, oi) => (
            <div key={o.id} className="group/opt flex w-fit items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border border-ink/30 transition group-hover/opt:border-ink/50 ${
                  multiple ? 'rounded-md' : 'rounded-full'
                }`}
              >
                <span className={multiple ? 'h-2 w-2 rounded-[3px] bg-ink/30' : 'h-2 w-2 rounded-full bg-ink/30'} />
              </span>
              <span
                ref={(el) => {
                  if (el) optionRefs.current.set(o.id, el)
                  else optionRefs.current.delete(o.id)
                }}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Option"
                onInput={() => {
                  const el = optionRefs.current.get(o.id)
                  if (el) updateOption(o.id, normalizeText(el.textContent ?? ''))
                }}
                onKeyDown={(e) => onOptionKeyDown(e, o.id, oi)}
                className="empty-placeholder min-w-[80px] cursor-text rounded-md px-1.5 py-0.5 text-[15px] text-ink outline-none transition hover:bg-white"
              >
                {o.label}
              </span>
              <span
                onMouseDown={(e) => e.preventDefault()}
                className="hidden shrink-0 text-ink/30 transition group-hover/opt:opacity-100 lg:block lg:opacity-0"
              >
                <button
                  onClick={() => removeOption(o.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-brand-50 hover:text-brand-600"
                  title="Remove option"
                >
                  ✕
                </button>
              </span>
            </div>
          ))}

          {block.allowOther && (
            <div className="flex w-fit items-center gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center border border-ink/30 ${multiple ? 'rounded-md' : 'rounded-full'}`}
              />
              <span className="select-none text-[15px] text-ink/40">Other…</span>
            </div>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addOption()}
              className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-[13px] font-medium text-ink/40 transition hover:bg-white hover:text-ink/70"
            >
              + Add option
            </button>
            {(block.type === 'multipleChoice' || block.type === 'checkbox') && (
              <label className="flex cursor-pointer select-none items-center gap-1.5 text-[12px] text-ink/40 transition hover:text-ink/70">
                <input
                  type="checkbox"
                  checked={!!multiple}
                  onChange={() => updateBlock(formId, block.id, { allowMultiple: !multiple })}
                  className="h-3.5 w-3.5 accent-ink"
                />
                Allow multiple answers
              </label>
            )}
          </div>
        </div>
      </div>
    )
  }

  // question blocks with an inline preview below the editable label
  return (
    <div
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      className={`${wrapperCls} px-1 py-1.5`}
    >
      {overIndex && <InsertLine />}
      <Rail onOpenSettings={onOpenSettings} onDragStart={onDragStart} onDragEnd={onDragEnd} />
      <div
        ref={questionRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Your question"
        onInput={handleQuestionInput}
        onKeyDown={(e) => onKeyDown(e, block, index)}
        onFocus={onFocusBlock}
        className="empty-placeholder w-full cursor-text font-form-serif text-[19px] font-medium leading-snug text-ink outline-none"
      />
      <div className="pointer-events-none mt-2.5 pl-1">
        {block.type === 'shortText' || block.type === 'number' || block.type === 'email' || block.type === 'phone' || block.type === 'date' ? (
          <PreviewBox
            content={
              block.type === 'shortText'
                ? block.placeholder?.trim()
                  ? block.placeholder
                  : 'your answer…'
                : block.type === 'email'
                  ? 'you@example.com'
                  : block.type === 'phone'
                    ? 'Phone number'
                    : block.type === 'number'
                      ? '0'
                      : 'Pick a date'
            }
          />
        ) : block.type === 'longText' ? (
          <div className="w-full max-w-xl rounded-2xl border border-ink/15 bg-white px-4 py-3.5">
            <div className="h-3.5 w-44 rounded-md bg-ink/[0.07]" />
            <div className="mt-2.5 h-3.5 w-28 rounded-md bg-ink/[0.07]" />
          </div>
        ) : block.type === 'fileUpload' ? (
          <div className="flex w-fit items-center gap-2 rounded-2xl border-2 border-dashed border-ink/15 px-5 py-3 text-[14px] text-ink/35">
            <Icon name="fileUpload" /> Upload a file
          </div>
        ) : block.type === 'rating' ? (
          <div className="flex gap-1 text-[22px] text-amber-400">
            {Array.from({ length: block.ratingMax ?? 5 }).map((_, i) => (
              <span key={i}>★</span>
            ))}
          </div>
        ) : block.type === 'nps' ? (
          <div className="flex gap-1">
            {Array.from({ length: 11 }).map((_, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center rounded-md bg-ink/[0.06] text-[11px] font-semibold text-ink/50">
                {i}
              </span>
            ))}
          </div>
        ) : block.type === 'linear' ? (
          <div className="flex gap-1">
            {Array.from({ length: block.linearMax ?? 5 }).map((_, i) => (
              <span key={i} className="flex h-7 w-7 items-center justify-center rounded-md bg-ink/[0.06] text-[11px] font-semibold text-ink/50">
                {i + 1}
              </span>
            ))}
          </div>
        ) : (
          <PreviewBox content="Your answer" />
        )}
      </div>
    </div>
  )
}

function PreviewBox({ content }: { content: string }) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-ink/15 bg-white px-4 py-3 text-[15px] text-ink/35">
      {content}
    </div>
  )
}