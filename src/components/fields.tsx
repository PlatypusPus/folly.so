import { useId, useRef, useState } from 'react'
import type { AnswerValue, Block, FilePayload } from '../types'

export function getDefaultValue(block: Block): AnswerValue {
  switch (block.type) {
    case 'checkbox':
      return []
    case 'rating':
    case 'nps':
    case 'linear':
    case 'fileUpload':
    case 'dropdown':
      return null
    default:
      return ''
  }
}

export function isFilled(value: AnswerValue): boolean {
  if (value === undefined || value === null) return false
  if (Array.isArray(value)) return value.length > 0
  return String(value).trim().length > 0
}

function RatingIcon({ kind, filled }: { kind: Block['ratingIcon']; filled: boolean }) {
  const cls = `h-9 w-9 sm:h-10 sm:w-10 transition ${filled ? '' : 'opacity-45 hover:opacity-80'}`
  if (kind === 'heart')
    return (
      <svg viewBox="0 0 24 24" className={cls} fill={filled ? '#ff5470' : 'none'} stroke="#0b0f19" strokeWidth={1.6}>
        <path d="M12 20.5 4.2 12.7a5 5 0 0 1 7.1-7.1l.7.7.7-.7a5 5 0 0 1 7.1 7.1L12 20.5Z" />
      </svg>
    )
  if (kind === 'thumbs')
    return (
      <svg viewBox="0 0 24 24" className={cls} fill={filled ? '#ff5470' : 'none'} stroke="#0b0f19" strokeWidth={1.6}>
        <path d="M7 11 11 3a2.3 2.3 0 0 1 2.4 2.6L13 8h5.2a1.8 1.8 0 0 1 1.8 2.3l-1.8 7.2a2 2 0 0 1-2 1.5H7M7 11v9M4 11h3" transform="translate(1 -1)" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className={cls} fill={filled ? '#ffb400' : 'none'} stroke="#0b0f19" strokeWidth={1.5}>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3.5Z" />
    </svg>
  )
}

function RatingControl({ block, value, onChange }: { block: Block; value: number | null; onChange: (v: number) => void }) {
  const max = block.ratingMax ?? 5
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="rounded-full p-1 transition hover:scale-110"
          aria-label={`${n} of ${max}`}
        >
          <RatingIcon kind={block.ratingIcon} filled={value !== null && n <= value} />
        </button>
      ))}
    </div>
  )
}

function NpsControl({ block, value, onChange }: { block: Block; value: number | null; onChange: (v: number) => void }) {
  const nums = Array.from({ length: 11 }, (_, i) => i)
  return (
    <div>
      <div className="grid grid-cols-11 gap-1 sm:gap-1.5">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`rounded-lg py-2.5 text-[13px] font-semibold transition ${
              value === n ? 'bg-ink text-white shadow-md' : 'bg-ink/[0.05] text-ink/70 hover:bg-ink/10'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-ink/45">
        <span>{block.npsMinLabel || 'Not at all likely'}</span>
        <span>{block.npsMaxLabel || 'Extremely likely'}</span>
      </div>
      {(block.npsMinLabel || block.npsMaxLabel) && (
        <div className="flex justify-between text-[12px] font-semibold text-ink/65 sm:hidden">
          <span>{block.npsMinLabel}</span>
          <span>{block.npsMaxLabel}</span>
        </div>
      )}
    </div>
  )
}

function LinearControl({ block, value, onChange }: { block: Block; value: number | null; onChange: (v: number) => void }) {
  const max = block.linearMax ?? 5
  const nums = Array.from({ length: max }, (_, i) => i + 1)
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <div className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(28px,1fr))] gap-1.5">
          {nums.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`aspect-square rounded-lg text-[13px] font-semibold transition ${
                value === n ? 'bg-ink text-white shadow-md' : 'bg-ink/[0.05] text-ink/70 hover:bg-ink/10'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {(block.linearMinLabel || block.linearMaxLabel) && (
        <div className="mt-2 flex justify-between text-[12px] text-ink/45">
          <span>{block.linearMinLabel}</span>
          <span>{block.linearMaxLabel}</span>
        </div>
      )}
    </div>
  )
}

function ChoiceControl({
  block,
  value,
  onChange,
  preview,
}: {
  block: Block
  value: string | string[]
  onChange: (v: string | string[]) => void
  preview?: boolean
}) {
  const options = block.options ?? []
  const multiple = block.type === 'checkbox' || block.allowMultiple

  const toggle = (label: string) => {
    if (multiple) {
      const arr = (Array.isArray(value) ? value : []) as string[]
      const next = arr.includes(label) ? arr.filter((x) => x !== label) : [...arr, label]
      onChange(next)
    } else {
      onChange(label)
    }
  }

  const isChecked = (label: string) =>
    multiple ? (Array.isArray(value) ? (value as string[]).includes(label) : false) : value === label

  const otherIndex = options.findIndex((o) => o.label === '__other__')
  const list = otherIndex >= 0 ? options.filter((_, i) => i !== otherIndex) : options
  const otherActive = Array.isArray(value) ? false : value === '__other__'

  return (
    <div className="space-y-2">
      {list.map((o) =>
        multiple ? (
          <label
            key={o.id}
            className={`flex w-fit cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
              isChecked(o.label) ? 'border-ink/50 bg-ink/[0.03]' : 'border-ink/15 hover:border-ink/30'
            }`}
            onClick={(e) => {
              if (preview) e.preventDefault()
            }}
          >
            <input
              type="checkbox"
              className="h-[18px] w-[18px] rounded accent-ink"
              checked={isChecked(o.label)}
              onChange={() => toggle(o.label)}
              disabled={preview}
            />
            <span className="text-[15px] text-ink/85">{o.label}</span>
          </label>
        ) : (
          <label
            key={o.id}
            className={`flex w-fit cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
              isChecked(o.label) ? 'border-ink/50 bg-ink/[0.03]' : 'border-ink/15 hover:border-ink/30'
            }`}
            onClick={(e) => {
              if (preview) e.preventDefault()
            }}
          >
            <input
              type="radio"
              name={block.id}
              className="h-[18px] w-[18px] accent-ink"
              checked={isChecked(o.label)}
              onChange={() => onChange(o.label)}
              disabled={preview}
            />
            <span className="text-[15px] text-ink/85">{o.label}</span>
          </label>
        ),
      )}
      {block.allowOther && (
        <div className="flex items-center gap-3">
          {multiple ? (
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-ink/15 px-4 py-2 transition hover:border-ink/30">
              <input type="checkbox" className="h-[18px] w-[18px] accent-ink" disabled={preview} onChange={() => {}} />
              <input
                className="bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/35"
                placeholder="Other…"
                onChange={(e) => {
                  if (multiple) onChange([...(Array.isArray(value) ? value : []), e.target.value].filter(Boolean))
                }}
                disabled={preview}
              />
            </div>
          ) : (
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-ink/15 px-4 py-2 transition hover:border-ink/30">
              <input type="radio" className="h-[18px] w-[18px] accent-ink" checked={otherActive} disabled={preview} onChange={() => {}} />
              <input
                className="bg-transparent text-[15px] text-ink outline-none placeholder:text-ink/35"
                placeholder="Other…"
                onChange={(e) => onChange(e.target.value)}
                disabled={preview}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DropdownControl({
  block,
  value,
  onChange,
}: {
  block: Block
  value: string | null
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="relative w-fit min-w-[240px]">
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none rounded-2xl border border-ink/20 bg-white px-4 py-3 pr-10 text-[15px] text-ink outline-none transition hover:border-ink/40 focus:border-ink"
      >
        <option value="" disabled>
          Select an option…
        </option>
        {(block.options ?? []).map((o) => (
          <option key={o.id} value={o.label}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink/40">
        <svg viewBox="0 0 16 16" className="h-4 w-4">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  )
}

function FileControl({
  block,
  value,
  onChange,
}: {
  block: Block
  value: FilePayload | null
  onChange: (v: FilePayload | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const maxMb = block.maxSizeMb ?? 10
  const [tooBig, setTooBig] = useState(false)

  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-ink/15 bg-ink/[0.02] px-4 py-3">
          <span className="text-xl">📎</span>
          <span className="flex-1 truncate text-[14px] text-ink/80">{value.name}</span>
          <span className="text-[12px] text-ink/40">{(value.size / 1024).toFixed(1)} KB</span>
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = ''
              onChange(null)
            }}
            className="text-[13px] font-medium text-brand-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-fit items-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 bg-ink/[0.02] px-5 py-3.5 text-[15px] font-medium text-ink/60 transition hover:border-ink/40 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M12 15V5m0 0L8 9m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Upload a file
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={block.fileTypes?.join(',')}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          if (f.size > maxMb * 1024 * 1024) {
            setTooBig(true)
            onChange(null)
            return
          }
          setTooBig(false)
          onChange({ name: f.name, size: f.size })
        }}
      />
      <p className="mt-2 text-[12px] text-ink/40">
        {block.fileTypes?.slice(0, 4).join(', ')} — up to {maxMb} MB
      </p>
      {tooBig && <p className="mt-1 text-[12px] font-medium text-brand-600">That file is larger than {maxMb} MB.</p>}
    </div>
  )
}

export function FieldControl({
  block,
  value,
  onChange,
  preview = false,
}: {
  block: Block
  value: AnswerValue
  onChange: (v: AnswerValue) => void
  preview?: boolean
}) {
  switch (block.type) {
    case 'shortText':
    case 'email':
    case 'phone':
      return (
        <input
          type={block.type === 'email' ? 'email' : block.type === 'phone' ? 'tel' : 'text'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={block.placeholder ?? (block.type === 'email' ? 'you@example.com' : 'Type your answer')}
          disabled={preview}
          className="w-full max-w-xl rounded-2xl border border-ink/20 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink/35 hover:border-ink/40 focus:border-ink focus:ring-4 focus:ring-ink/[0.06]"
        />
      )
    case 'number':
      return (
        <input
          type="number"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder={block.placeholder ?? '0'}
          className="w-full max-w-xl rounded-2xl border border-ink/20 bg-white px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-ink/35 hover:border-ink/40 focus:border-ink focus:ring-4 focus:ring-ink/[0.06]"
        />
      )
    case 'date':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full max-w-xl rounded-2xl border border-ink/20 bg-white px-4 py-3 text-[15px] text-ink outline-none transition hover:border-ink/40 focus:border-ink focus:ring-4 focus:ring-ink/[0.06]"
        />
      )
    case 'longText':
      return (
        <textarea
          rows={value ? Math.max(2, Math.min(6, String(value).split('\n').length + 1)) : 2}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={block.placeholder ?? 'Write a longer answer…'}
          disabled={preview}
          className="w-full max-w-xl rounded-2xl border border-ink/20 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition placeholder:text-ink/35 hover:border-ink/40 focus:border-ink focus:ring-4 focus:ring-ink/[0.06]"
        />
      )
    case 'rating':
      return <RatingControl block={block} value={typeof value === 'number' ? value : null} onChange={(v) => onChange(v)} />
    case 'nps':
      return <NpsControl block={block} value={typeof value === 'number' ? value : null} onChange={(v) => onChange(v)} />
    case 'linear':
      return <LinearControl block={block} value={typeof value === 'number' ? value : null} onChange={(v) => onChange(v)} />
    case 'multipleChoice':
    case 'checkbox':
      return (
        <ChoiceControl
          block={block}
          value={value as string | string[]}
          onChange={(v) => onChange(v)}
          preview={preview}
        />
      )
    case 'dropdown':
      return <DropdownControl block={block} value={value as string | null} onChange={(v) => onChange(v)} />
    case 'fileUpload':
      return <FileControl block={block} value={value as FilePayload | null} onChange={(v) => onChange(v)} />
    default:
      return null
  }
}