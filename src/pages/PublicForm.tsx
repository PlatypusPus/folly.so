import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AnswerValue, Block, Form } from '../types'
import { useForms } from '../store'
import { blockVisible, formatWhen, getQuestionLabel, splitIntoPages } from '../lib/logic'
import { FieldControl, getDefaultValue, isFilled } from '../components/fields'
import { RichText } from '../components/richtext'
import { LogoMark, themeFont } from '../components/ui'

function notFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <LogoMark className="h-10 w-10" />
      <h1 className="text-2xl font-bold text-ink">This form is unavailable</h1>
      <p className="max-w-sm text-[15px] text-ink/50">
        It may have been deleted, or the link is missing a few characters.
      </p>
      <Link to="/" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Back to Folly
      </Link>
    </div>
  )
}

function BlockView({
  form,
  block,
  answers,
  errors,
  onChange,
}: {
  form: Form
  block: Block
  answers: Record<string, AnswerValue>
  errors: Record<string, string>
  onChange: (blockId: string, v: AnswerValue) => void
}) {
  if (block.type === 'heading') {
    return (
      <div className="py-1">
        <RichText
          text={block.text}
        />
      </div>
    )
  }
  if (block.type === 'paragraph') {
    return (
      <p className="font-form-serif text-[18px] leading-relaxed">
        <RichText text={block.text} />
      </p>
    )
  }
  if (block.type === 'image') {
    return (
      <div className="py-1">
        {block.imageUrl ? (
          <div>
            <img src={block.imageUrl} alt={block.text || 'image'} className="max-h-[340px] w-fit rounded-2xl border border-black/5" />
            {block.imageCaption && <p className="mt-2 text-[13px] italic">{block.imageCaption}</p>}
          </div>
        ) : (
          <div className="flex h-28 w-full max-w-md items-center justify-center rounded-2xl border border-dashed border-black/20 text-sm">
            Image
          </div>
        )}
      </div>
    )
  }
  if (block.type === 'pageBreak') return null
  if (block.type === 'thankYou') return null

  const questionStyle = block.type === 'longText' ? 'text-[20px]' : 'text-[19px]'
  const visibleIndex = (() => {
    let n = -1
    for (const b of form.blocks) {
      const isQ = !['heading', 'paragraph', 'image', 'pageBreak', 'thankYou'].includes(b.type)
      if (!isQ || !blockVisible(b, answers)) continue
      n += 1
      if (b.id === block.id) return n
    }
    return n
  })()
  return (
    <div className="py-1">
      <label className={`mb-2.5 block font-medium leading-snug ${questionStyle}`}>
        <span className="mr-1.5 inline-block text-[14px] font-normal text-ink/35 align-1">
          {form.settings.showProgress ? `${visibleIndex + 1}.` : ''}
        </span>
        <RichText text={block.text || getQuestionLabel(block)} />
        {block.required && <span className="ml-1 text-brand-500">*</span>}
      </label>
      <div onClick={(e) => e.stopPropagation()}>
        <FieldControl block={block} value={answers[block.id] ?? getDefaultValue(block)} onChange={(v) => onChange(block.id, v)} />
      </div>
      {errors[block.id] && <p className="mt-1.5 text-[13px] font-medium text-brand-600">{errors[block.id]}</p>}
    </div>
  )
}

export default function PublicForm() {
  const { formId = '' } = useParams()
  const form = useForms((s) => s.forms.find((f) => f.id === formId))
  const addSubmission = useForms((s) => s.addSubmission)

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [visited, setVisited] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const pages = useMemo(() => (form ? splitIntoPages(form.blocks, answers) : []), [form, answers])
  const safePage = Math.min(currentPage, Math.max(0, pages.length - 1))
  const visibleHere = pages[safePage] ?? []

  useEffect(() => {
    setVisited(true)
  }, [])

  useEffect(() => {
    setAnswers({})
    setErrors({})
    setCurrentPage(0)
    setSubmitted(false)
  }, [formId])

  if (!form) return notFound()

  const theme = form.settings.theme
  const font = themeFont(theme.font)
  const accent = theme.button
  const dark = theme.darkMode

  const pageCount = pages.length

  const changeAnswer = (blockId: string, v: AnswerValue) => {
    const next = { ...answers, [blockId]: v }
    setAnswers(next)
    setErrors((e) => ({ ...e, [blockId]: '' }))
  }

  const validateVisible = (): boolean => {
    const errs: Record<string, string> = {}
    for (const block of form.blocks) {
      if (!blockVisible(block, answers)) continue
      if (!block.required) continue
      if (!isFilled(answers[block.id])) {
        errs[block.id] = 'Field is required'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => {
    if (!validateVisible()) return
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setCurrentPage((p) => Math.min(p + 1, pageCount - 1))
  }

  const submit = () => {
    if (!validateVisible()) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const collected: Record<string, AnswerValue> = {}
    for (const b of form.blocks) {
      if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'image' || b.type === 'pageBreak' || b.type === 'thankYou') continue
      if (b.type !== 'fileUpload') {
        const v = answers[b.id]
        if (Array.isArray(v) && v.length === 0) collected[b.id] = null
        else collected[b.id] = v ?? null
      }
    }
    addSubmission(form.id, collected)

    // Redirect logic:
    if (form.settings.thankYouRedirectUrl && form.settings.thankYouRedirectUrl.trim() !== '') {
      const redirectUrl = sanitizeUrl(form.settings.thankYouRedirectUrl)
      if (redirectUrl) {
        window.location.replace(redirectUrl)
        return
      }
    }

    // keep file names off the persisted summary to keep localStorage tidy
    setSubmitted(true)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const headerFont = blockHeadingFontName(font)

  if (submitted) {
    const ctaText = form.settings.thankYouButtonText?.trim()
    const ctaUrl = form.settings.thankYouButtonUrl?.trim()

    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-6"
        style={{ background: theme.background, fontFamily: font, color: dark ? '#f5f5f5' : '#0b0f19' }}
      >
        <div className="w-full max-w-xl text-center animate-pop">
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: theme.button, color: theme.buttonText }}
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8">
              <path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h1 className="font-form-serif mt-6 text-4xl font-semibold leading-tight" style={{ fontFamily: headerFont }}>
            {form.settings.thankYouMessage}
          </h1>
          {visited && <p className="mt-3 text-[14px] opacity-50">Response recorded</p>}
          {ctaText && ctaUrl && (
            <div className="mt-8">
              <a
                href={sanitizeUrl(ctaUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full px-6 py-3 text-[14px] font-bold shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
                style={{ background: theme.button, color: theme.buttonText }}
              >
                {ctaText}
              </a>
            </div>
          )}
        </div>
        {form.settings.poweredBy && <PoweredBy dark={dark} font={font} />}
      </div>
    )
  }

  const progress = (pageCount > 1 ? (safePage + 1) / pageCount : 1) * 100

  return (
    <div ref={topRef} className="flex min-h-screen flex-col" style={{ background: theme.background, fontFamily: font, color: dark ? '#f5f5f5' : '#0b0f19' }}>
      <div className="h-1 w-full" style={{ background: 'transparent' }}>
        <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: theme.button }} />
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-end px-6 text-[13px]" style={{ opacity: 0.5 }}>
          {safePage + 1} / {pageCount}
        </div>
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:py-16">
        <div className="mb-10">
          <div className="font-form-serif text-[38px] font-semibold leading-[1.15] tracking-tight sm:text-[44px]" style={{ fontFamily: headerFont, color: dark ? '#fff' : '#1c1c1e' }}>
            <RichText text={form.settings.title} />
          </div>
          {form.settings.description && (
            <p className="mt-3 text-[17px] leading-relaxed" style={{ opacity: 0.6 }}>
              <RichText text={form.settings.description} />
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (safePage < pageCount - 1) goNext()
            else submit()
          }}
          className="space-y-8"
        >
          {visibleHere.map((block) => (
            <BlockView
              key={block.id}
              form={form}
              block={block}
              answers={answers}
              errors={errors}
              onChange={changeAnswer}
            />
          ))}

          <div className="flex items-center justify-between pt-2">
            {safePage > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="rounded-full px-5 py-3 text-[15px] font-medium transition"
                style={{ color: dark ? '#f5f5f5' : '#3a3a3c' }}
              >
                ← Back
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="rounded-full px-8 py-3.5 text-[15px] font-semibold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
              style={{ background: accent, color: theme.buttonText }}
            >
              {safePage < pageCount - 1 ? 'Next' : 'Submit'}
            </button>
          </div>
        </form>
      </main>

      {form.settings.poweredBy && <PoweredBy dark={dark} font={font} />}
    </div>
  )
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed
  }
  return `https://${trimmed}`
}

function blockHeadingFontName(_font: string): string {
  return "'DM Serif Display', Georgia, serif"
}

function PoweredBy({ dark, font }: { dark: boolean; font: string }) {
  return (
    <footer
      className="flex w-full items-center justify-center gap-2 py-8 text-[13px]"
      style={{ opacity: 0.45, fontFamily: font }}
    >
      <LogoMark className="h-4 w-4" />
      <span style={{ color: dark ? '#fff' : '#0b0f19' }}>
        Powered by <span className="font-semibold">Folly</span>
      </span>
    </footer>
  )
}