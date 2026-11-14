import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { AnswerValue, Block, Form } from '../types'
import { uid } from '../types'
import { useForms } from '../store'
import { blockVisible, computeScore, computeTotalQuizScore, formatWhen, getPageJumpTarget, getQuestionLabel, pipeText, splitBlocksByPage, splitIntoPages } from '../lib/logic'
import { rowLayout, resolveRow } from '../lib/layout'
import { embedInfo } from '../lib/embed'
import { FieldControl, getDefaultValue, isFilled } from '../components/fields'
import { RichText } from '../components/richtext'
import { LogoMark, themeFont } from '../components/ui'

const NON_ANSWER_TYPES = ['heading', 'heading2', 'heading3', 'label', 'paragraph', 'image', 'divider', 'embed', 'pageBreak', 'thankYou']

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

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
  const blockStyle: React.CSSProperties = {
    fontFamily: block.font ? themeFont(block.font) : undefined,
    textAlign: block.textAlign,
    color: block.textColor,
    backgroundColor: block.bgColor,
  }
  const blockCardCls = (block.cardBorder || block.bgColor)
    ? 'border-2 border-black p-4 sm:p-5 shadow-[4px_4px_0px_#000] my-2'
    : ''

  const renderContent = () => {
    if (block.type === 'heading' || block.type === 'heading2' || block.type === 'heading3' || block.type === 'label') {
      const cls =
        block.type === 'label'
          ? 'text-[13px] font-bold uppercase tracking-wide opacity-60'
          : block.type === 'heading3'
            ? 'text-[19px] font-semibold leading-snug'
            : block.type === 'heading2'
              ? 'text-[24px] font-semibold leading-snug'
              : ''
      return (
        <div className={`py-1 ${cls}`}>
          <RichText
            text={pipeText(block.text, answers, form.blocks, form.settings.hiddenFields)}
          />
        </div>
      )
    }
    if (block.type === 'divider') {
      return <hr className="my-2 h-px w-full border-0 bg-current opacity-15" />
    }
    if (block.type === 'embed') {
      const info = embedInfo(block.embedUrl)
      if (!info) return null
      return (
        <div className="py-1">
          <div className="aspect-video w-full max-w-xl overflow-hidden rounded-2xl border border-black/10">
            <iframe src={info.src} title={block.text || info.provider} className="h-full w-full" allowFullScreen />
          </div>
          {block.text && <p className="mt-2 text-[13px] opacity-60">{block.text}</p>}
        </div>
      )
    }
    if (block.type === 'paragraph') {
      return (
        <p className="text-[18px] leading-relaxed">
          <RichText text={pipeText(block.text, answers, form.blocks, form.settings.hiddenFields)} />
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
        const isQ = !NON_ANSWER_TYPES.includes(b.type)
        if (!isQ || !blockVisible(b, answers)) continue
        n += 1
        if (b.id === block.id) return n
      }
      return n
    })()
    const qNum = visibleIndex >= 0 ? visibleIndex + 1 : null
    const questionCls = [
      'tally-question',
      'q',
      qNum ? `q${qNum} q-${qNum}` : '',
      `q-${block.type}`,
      block.type === 'multipleChoice' ? 'q-multi' : '',
      block.type === 'checkbox' ? 'q-check' : '',
      block.type === 'shortText' ? 'q-short' : '',
      block.type === 'longText' ? 'q-long' : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        className={`${questionCls} py-1`}
        data-q={qNum ?? undefined}
        data-block-id={block.id}
        data-block-type={block.type}
      >
        <label className={`mb-2.5 block font-medium leading-snug ${questionStyle}`}>
          <span className="mr-1.5 inline-block text-[14px] font-normal text-ink/35 align-1">
            {form.settings.showProgress && qNum ? `${qNum}.` : ''}
          </span>
          <RichText text={pipeText(block.text || getQuestionLabel(block), answers, form.blocks, form.settings.hiddenFields)} />
          {block.required && <span className="ml-1 text-brand-500">*</span>}
        </label>
        <div onClick={(e) => e.stopPropagation()}>
          <FieldControl
            block={block}
            value={block.type === 'score' ? computeScore(block, answers, form.blocks) : (answers[block.id] ?? getDefaultValue(block))}
            onChange={(v) => onChange(block.id, v)}
            formSettings={form.settings}
          />
        </div>
        {errors[block.id] && <p className="mt-1.5 text-[13px] font-medium text-brand-600">{errors[block.id]}</p>}
      </div>
    )
  }

  const content = renderContent()
  if (!content) return null

  if (block.font || block.textAlign || block.textColor || block.bgColor || block.cardBorder) {
    return (
      <div style={blockStyle} className={blockCardCls}>
        {content}
      </div>
    )
  }
  return content
}

function getUrlQueryParams(): Record<string, string> {
  const params: Record<string, string> = {}
  try {
    const fullSearch = window.location.search
    const hashParts = window.location.hash.split('?')
    const hashSearch = hashParts[1]
    const searchParams = new URLSearchParams(fullSearch || '')
    searchParams.forEach((val, key) => {
      params[key] = val
    })
    if (hashSearch) {
      const hashParams = new URLSearchParams(`?${hashSearch}`)
      hashParams.forEach((val, key) => {
        params[key] = val
      })
    }
  } catch (err) {
    console.error('Error parsing query params:', err)
  }
  return params
}

export default function PublicForm() {
  const { formId = '' } = useParams()
  const form = useForms((s) =>
    s.forms.find(
      (f) =>
        f.id === formId ||
        (f.settings?.slug && f.settings.slug.trim().toLowerCase() === formId.trim().toLowerCase())
    )
  )
  const addSubmission = useForms((s) => s.addSubmission)
  const ensureForm = useForms((s) => s.ensureForm)

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(0)
  const [pageHistory, setPageHistory] = useState<number[]>([0])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const attemptRef = useRef<{ id: string; key: string } | null>(null)
  // True from the moment a submit starts until it fails (or the form changes).
  // A ref, not state, so the keyboard shortcut handler always reads the
  // current value: no second submission and no edits while saving.
  const lockRef = useRef(false)
  const activeFormRef = useRef(formId)
  activeFormRef.current = formId
  const [visited, setVisited] = useState(false)
  const [formFailed, setFormFailed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    if (!form) {
      setFormFailed(false)
      ensureForm(formId).then((ok) => {
        if (mounted) setFormFailed(!ok)
      })
    } else {
      setFormFailed(false)
    }
    return () => {
      mounted = false
    }
  }, [formId, form, ensureForm])

  const pages = useMemo(() => (form ? splitBlocksByPage(form.blocks) : []), [form])
  const safePage = Math.min(currentPage, Math.max(0, pages.length - 1))
  const visibleHere = (pages[safePage] ?? []).filter((b) => {
    if (b.type === 'score' && !b.showDuringForm) return false
    return b.type === 'pageBreak' || b.type === 'thankYou' || blockVisible(b, answers)
  })

  useEffect(() => {
    setVisited(true)
  }, [])

  useEffect(() => {
    const qParams = getUrlQueryParams()
    let initialAnswers: Record<string, AnswerValue> = {}

    // Restore draft from localStorage if available
    try {
      const draftKey = form?.id || formId
      const draft = localStorage.getItem(`folly_draft_${draftKey}`) || localStorage.getItem(`folly_draft_${formId}`)
      if (draft) {
        const parsed = JSON.parse(draft)
        if (parsed && typeof parsed === 'object') {
          initialAnswers = { ...parsed }
        }
      }
    } catch {}

    if (form?.settings.hiddenFields) {
      for (const field of form.settings.hiddenFields) {
        if (qParams[field] !== undefined) {
          initialAnswers[field] = qParams[field]
        }
      }
    }

    // Capture incoming URL query parameters into answers for metadata/telemetry
    for (const [key, val] of Object.entries(qParams)) {
      if (initialAnswers[key] === undefined) {
        initialAnswers[key] = val
      }
    }

    // Pre-fill matching question fields (by block ID, block type, or question text)
    if (form?.blocks) {
      for (const [key, val] of Object.entries(qParams)) {
        const normalizedKey = slugify(key)
        for (const block of form.blocks) {
          if (NON_ANSWER_TYPES.includes(block.type)) continue

          const isIdMatch = block.id === key
          const isTypeMatch = block.type.toLowerCase() === key.toLowerCase()
          const blockSlug = slugify(block.text || getQuestionLabel(block))
          const isTextMatch = blockSlug === normalizedKey || (normalizedKey === 'name' && blockSlug.includes('name'))

          if (isIdMatch || isTypeMatch || isTextMatch) {
            if (block.type === 'checkbox' || block.allowMultiple) {
              const items = val.split(',').map((s) => s.trim())
              initialAnswers[block.id] = items
            } else {
              initialAnswers[block.id] = val
            }
          }
        }
      }
    }
    setAnswers(initialAnswers)
    setErrors({})
    setCurrentPage(0)
    setPageHistory([0])
    setSubmitted(false)
    setSubmitting(false)
    setSubmitError('')
    attemptRef.current = null
    lockRef.current = false
  }, [formId, form?.id, form?.settings.hiddenFields])

  // Persist response draft to localStorage
  useEffect(() => {
    const draftKey = form?.id || formId
    if (submitted || !draftKey || Object.keys(answers).length === 0) return
    try {
      localStorage.setItem(`folly_draft_${draftKey}`, JSON.stringify(answers))
    } catch {}
  }, [answers, submitted, form?.id, formId])

  // Emit auto-resize height messages to embedding parent windows
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sendHeight = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'folly-resize',
            height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, 400),
            formId: form?.id,
          },
          '*',
        )
      }
    }

    sendHeight()
    window.addEventListener('resize', sendHeight)
    const observer = new MutationObserver(sendHeight)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true })

    return () => {
      window.removeEventListener('resize', sendHeight)
      observer.disconnect()
    }
  }, [form?.id, currentPage, answers, submitted])

  // Keyboard shortcuts: Ctrl/Cmd+Enter to advance or submit, A-Z hotkeys for choice options
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (currentPage < pages.length - 1) goNext()
        else submit()
        return
      }

      const activeTag = (document.activeElement?.tagName || '').toLowerCase()
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      if (isInput) return

      if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const charCode = e.key.toUpperCase().charCodeAt(0) - 65
        const curBlocks = (pages[currentPage] ?? []).filter((b) => b.type === 'multipleChoice' || b.type === 'checkbox')
        if (curBlocks.length > 0) {
          const firstChoiceBlock = curBlocks[0]
          const opts = firstChoiceBlock.options ?? []
          if (charCode >= 0 && charCode < opts.length) {
            e.preventDefault()
            const opt = opts[charCode]
            if (firstChoiceBlock.type === 'checkbox' || firstChoiceBlock.allowMultiple) {
              const curAns = (Array.isArray(answers[firstChoiceBlock.id]) ? answers[firstChoiceBlock.id] : []) as string[]
              const next = curAns.includes(opt.label) ? curAns.filter((x) => x !== opt.label) : [...curAns, opt.label]
              changeAnswer(firstChoiceBlock.id, next)
            } else {
              changeAnswer(firstChoiceBlock.id, opt.label)
            }
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, pages, answers])

  useEffect(() => {
    let injectedCss = ''
    if (form?.settings.theme.customFontBase64 && form?.settings.theme.font === 'custom') {
      injectedCss += `@font-face { font-family: "CustomFont"; src: url("${form.settings.theme.customFontBase64}"); }\n`
    }
    const css = form?.settings.customCss?.trim()
    if (css) injectedCss += css

    if (!injectedCss) return
    const el = document.createElement('style')
    el.setAttribute('data-folly-custom-css', '')
    el.textContent = injectedCss
    document.head.appendChild(el)
    return () => {
      document.head.removeChild(el)
    }
  }, [form?.settings.customCss, form?.settings.theme.customFontBase64, form?.settings.theme.font])

  if (formFailed) return notFound()

  if (!form) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-ink/40">Loading…</div>
  }

  const theme = form.settings.theme
  const font = themeFont(theme.font)
  const accent = theme.button
  const dark = theme.darkMode

  const isClosedByDate = Boolean(form.settings.closedAt && Date.now() > form.settings.closedAt)
  const isClosedByLimit = Boolean(
    form.settings.maxResponses &&
      form.settings.maxResponses > 0 &&
      (form.submissionCount !== undefined ? form.submissionCount >= form.settings.maxResponses : false)
  )
  const isClosed = isClosedByDate || isClosedByLimit

  if (isClosed) {
    return (
      <div
        className={`tally-app flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center ${dark ? 'dark' : ''}`}
        style={{ background: theme.background, fontFamily: font, color: dark ? '#f5f5f5' : '#0b0f19' }}
      >
        <div className="w-full max-w-md rounded-3xl border border-ink/10 bg-white dark:bg-white/5 p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-white">This form is closed</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/60 dark:text-white/60">
            {isClosedByDate
              ? 'This form has reached its closing date and is no longer accepting new responses.'
              : 'This form has reached its maximum response limit and is no longer accepting new submissions.'}
          </p>
        </div>
        {form.settings.poweredBy && <PoweredBy dark={dark} font={font} />}
      </div>
    )
  }

  const isPasswordProtected = Boolean(form.settings.password && form.settings.password.trim().length > 0)
  const isLocked = isPasswordProtected && !unlocked

  if (isLocked) {
    return (
      <div
        className={`tally-app flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center ${dark ? 'dark' : ''}`}
        style={{ background: theme.background, fontFamily: font, color: dark ? '#f5f5f5' : '#0b0f19' }}
      >
        <div className="w-full max-w-sm rounded-3xl border border-ink/10 bg-white dark:bg-white/5 p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/[0.05] text-ink dark:bg-white/10 dark:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink dark:text-white">{form.settings.title}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/60 dark:text-white/60">
            This form is password protected. Enter the access code to continue.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (passwordInput === form.settings.password) {
                setUnlocked(true)
                setPasswordError(false)
              } else {
                setPasswordError(true)
              }
            }}
            className="mt-6 space-y-3"
          >
            <input
              type="password"
              placeholder="Enter access code"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value)
                setPasswordError(false)
              }}
              className="w-full rounded-xl border border-ink/20 bg-white dark:bg-white/10 px-4 py-2.5 text-[15px] text-ink dark:text-white outline-none focus:border-ink"
            />
            {passwordError && <p className="text-[12px] font-semibold text-brand-600">Incorrect password. Please try again.</p>}
            <button
              type="submit"
              className="w-full rounded-xl py-2.5 text-[14px] font-bold shadow-sm transition hover:opacity-90 active:scale-[0.99]"
              style={{ background: theme.button, color: theme.buttonText }}
            >
              Unlock form
            </button>
          </form>
        </div>
        {form.settings.poweredBy && <PoweredBy dark={dark} font={font} />}
      </div>
    )
  }

  const pageCount = pages.length

  const isPageVisible = (pageIdx: number): boolean => {
    const pageBlocks = pages[pageIdx] ?? []
    return pageBlocks.some((b) => b.type !== 'pageBreak' && b.type !== 'thankYou' && (b.type !== 'score' || b.showDuringForm) && blockVisible(b, answers))
  }

  const findNextVisiblePage = (fromPage: number): number | 'submit' => {
    for (let p = fromPage + 1; p < pageCount; p++) {
      if (isPageVisible(p)) return p
    }
    return 'submit'
  }

  const findPrevVisiblePage = (fromPage: number): number => {
    for (let p = fromPage - 1; p >= 0; p--) {
      if (isPageVisible(p)) return p
    }
    return 0
  }

  const nextVisibleAfterCurrent = findNextVisiblePage(safePage)
  const isLastPage = nextVisibleAfterCurrent === 'submit'

  const changeAnswer = (blockId: string, v: AnswerValue) => {
    if (lockRef.current) return
    const next = { ...answers, [blockId]: v }
    setAnswers(next)
    setErrors((e) => ({ ...e, [blockId]: '' }))
  }

  const validateVisible = (scopePage?: number): boolean => {
    const errs: Record<string, string> = {}
    const scope =
      scopePage === undefined
        ? form.blocks
        : (pages[scopePage] ?? []).flatMap((b) => (b.type === 'pageBreak' ? [] : [b]))
    for (const block of scope) {
      if (block.type === 'thankYou') continue
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
    if (!validateVisible(safePage)) return
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    const jumpTarget = getPageJumpTarget(form, safePage, answers)
    if (jumpTarget === 'submit') {
      submit()
      return
    }
    if (typeof jumpTarget === 'number') {
      const target = Math.max(0, Math.min(jumpTarget, pageCount - 1))
      if (isPageVisible(target)) {
        if (target !== safePage) {
          setPageHistory((prev) => [...prev, target])
          setCurrentPage(target)
          return
        }
      } else {
        const nextVis = findNextVisiblePage(target)
        if (nextVis === 'submit') {
          submit()
          return
        }
        if (nextVis !== safePage) {
          setPageHistory((prev) => [...prev, nextVis])
          setCurrentPage(nextVis)
          return
        }
      }
    }

    const nextVis = findNextVisiblePage(safePage)
    if (nextVis === 'submit') {
      submit()
      return
    }
    setPageHistory((prev) => [...prev, nextVis])
    setCurrentPage(nextVis)
  }

  const submit = async () => {
    if (isClosed || lockRef.current) return
    if (!validateVisible()) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    lockRef.current = true
    const scorePatch: Record<string, number> = {}
    for (const b of form.blocks) {
      if (b.type !== 'score') continue
      const seen = new Set(b.scoreSourceIds ?? [])
      if (seen.has(b.id)) continue
      scorePatch[b.id] = computeScore(b, answers, form.blocks)
    }
    const collected: Record<string, AnswerValue> = { ...scorePatch }
    for (const b of form.blocks) {
      if (NON_ANSWER_TYPES.includes(b.type)) continue
      if (b.type === 'score') continue
      const v = answers[b.id]
      if (Array.isArray(v) && v.length === 0) collected[b.id] = null
      else collected[b.id] = v ?? null
    }
    if (form.settings.hiddenFields) {
      for (const field of form.settings.hiddenFields) {
        const v = answers[field]
        if (v !== undefined && v !== null) {
          collected[field] = v
        }
      }
    }
    // Retrying the same answers reuses the id so the server can dedupe it;
    // edited answers count as a new response and get a fresh id.
    const key = JSON.stringify(collected)
    if (attemptRef.current?.key !== key) attemptRef.current = { id: uid(), key }
    const startedFor = formId

    setSubmitting(true)
    setSubmitError('')
    let saved = false
    try {
      await addSubmission(form.id, collected, attemptRef.current.id)
      saved = true
    } catch (err) {
      console.error('[folly] failed to save submission', err)
    }
    // The respondent switched to another form while this was in flight.
    if (activeFormRef.current !== startedFor) return
    setSubmitting(false)
    if (!saved) {
      lockRef.current = false
      setSubmitError('We couldn’t save your response. Please check your connection and try again.')
      return
    }
    attemptRef.current = null
    setAnswers((a) => ({ ...a, ...scorePatch }))

    // Redirect logic:
    if (form.settings.thankYouRedirectUrl && form.settings.thankYouRedirectUrl.trim() !== '') {
      const redirectUrl = sanitizeUrl(form.settings.thankYouRedirectUrl)
      if (redirectUrl) {
        window.location.replace(redirectUrl)
        return
      }
    }

    try {
      localStorage.removeItem(`folly_draft_${form.id}`)
      if (form.settings.slug) {
        localStorage.removeItem(`folly_draft_${form.settings.slug}`)
      }
    } catch {}

    setSubmitted(true)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (submitted) {
    const ctaText = form.settings.thankYouButtonText?.trim()
    const ctaUrl = form.settings.thankYouButtonUrl?.trim()
    const quizResult = computeTotalQuizScore(form.blocks, answers)

    return (
      <div
        className={`tally-app flex min-h-screen flex-col ${dark ? 'dark' : ''}`}
        style={{ background: theme.background || '#fffdfa', fontFamily: font, color: dark ? '#f5f5f5' : '#0b0f19' }}
      >
        {form.settings.coverImageUrl && (
          <div className="w-full h-[180px] sm:h-[240px] overflow-hidden relative">
            <img src={form.settings.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 sm:px-6 pb-16 pt-12 text-center">
          <div className="my-auto flex w-full flex-col items-center">
            {form.settings.logoUrl && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-sm border border-neutral-200/80 dark:border-neutral-800 mb-6 bg-white dark:bg-neutral-900">
                <img src={form.settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="w-full max-w-lg rounded-3xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-8 sm:p-12 shadow-sm sm:shadow-lg backdrop-blur-xs flex flex-col items-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full shadow-sm ring-8 ring-emerald-500/10 mb-4"
                style={{
                  backgroundColor: dark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-emerald-600 dark:text-emerald-400">
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-snug">
                {pipeText(form.settings.thankYouMessage, answers, form.blocks, form.settings.hiddenFields)}
              </h1>

              {quizResult.hasQuiz && (
                <div className="mt-8 w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50 p-6 text-center shadow-xs">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Quiz Results
                  </p>
                  <div className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    {quizResult.totalScore}
                    {quizResult.maxScore > 0 && (
                      <span className="text-2xl font-medium text-neutral-400 dark:text-neutral-500 ml-1">
                        / {quizResult.maxScore}
                      </span>
                    )}
                    <span className="text-base font-semibold text-neutral-500 dark:text-neutral-400 ml-2">pts</span>
                  </div>
                  {quizResult.maxScore > 0 && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {Math.round((quizResult.totalScore / quizResult.maxScore) * 100)}% accuracy
                    </div>
                  )}
                </div>
              )}

              {ctaText && ctaUrl && (
                <div className="mt-8">
                  <a
                    href={sanitizeUrl(ctaUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: theme.button || '#0b0f19',
                      color: theme.buttonText || '#ffffff',
                    }}
                    className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold tracking-wide shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
                  >
                    <span>{ctaText}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
            {form.settings.poweredBy && <PoweredBy dark={dark} font={font} />}
          </div>
        </main>
      </div>
    )
  }

  const progress = (pageCount > 1 ? (safePage + 1) / pageCount : 1) * 100

  return (
    <div
      ref={topRef}
      className={`tally-app flex min-h-screen flex-col ${dark ? 'dark' : ''}`}
      style={{ background: theme.background || '#fffdfa', fontFamily: font, color: dark ? '#f5f5f5' : '#0b0f19' }}
    >
      {/* Top Progress Bar - Sticky at top during scroll */}
      {form.settings.showProgress !== false && (
        <div className="sticky top-0 z-50 h-1.5 w-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%`, backgroundColor: theme.button || '#0b0f19' }}
          />
        </div>
      )}

      {form.settings.coverImageUrl && (
        <div className="w-full h-[180px] sm:h-[240px] overflow-hidden relative">
          <img src={form.settings.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      {pageCount > 1 && (
        <div className="mx-auto w-full max-w-2xl mt-6 px-6 flex justify-end">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-3 py-1 rounded-full">
            Page {safePage + 1} of {pageCount}
          </span>
        </div>
      )}

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 sm:px-6 pb-16 pt-6">
        <div className="w-full rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-6 sm:p-10 shadow-sm sm:shadow-md backdrop-blur-xs">
          {form.settings.logoUrl && (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-sm border border-neutral-200/80 dark:border-neutral-800 mb-6 bg-white dark:bg-neutral-900">
              <img src={form.settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="tally-form-title mb-8 border-b border-neutral-100 dark:border-neutral-800/80 pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              <RichText text={pipeText(form.settings.title, answers, form.blocks, form.settings.hiddenFields)} />
            </h1>
            {form.settings.description && (
              <p className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <RichText text={pipeText(form.settings.description, answers, form.blocks, form.settings.hiddenFields)} />
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!isLastPage) goNext()
              else submit()
            }}
            className="tally-form space-y-7"
          >
            <fieldset disabled={submitting} className="min-w-0 space-y-7 disabled:opacity-60">
            {rowLayout(visibleHere).map((row) => {
              const resolved = resolveRow(row)
              const rendered = row.blocks.map((block) => (
                <div key={block.id} className="tally-block">
                  <BlockView
                    form={form}
                    block={block}
                    answers={answers}
                    errors={errors}
                    onChange={changeAnswer}
                  />
                </div>
              ))
              if (!resolved.template) return rendered[0]
              return (
                <div
                  key={row.key}
                  className="col-split"
                  style={{ gridTemplateColumns: resolved.template }}
                >
                  {rendered}
                </div>
              )
            })}
            </fieldset>

            <div className="flex items-center justify-between pt-6 border-t border-neutral-200/80 dark:border-neutral-800/80 mt-8">
              {safePage > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (pageHistory.length > 1) {
                      const nextHistory = [...pageHistory]
                      nextHistory.pop()
                      const prev = nextHistory[nextHistory.length - 1] ?? 0
                      setPageHistory(nextHistory)
                      setCurrentPage(prev)
                    } else {
                      setCurrentPage(findPrevVisiblePage(safePage))
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800/80 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                style={{
                  backgroundColor: theme.button || '#0b0f19',
                  color: theme.buttonText || '#ffffff',
                }}
                className="tally-submit-button group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Submitting…</span>
                  </>
                ) : !isLastPage ? (
                  <>
                    <span>Next</span>
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Submit</span>
                    <span className="hidden sm:inline-block text-[11px] font-normal opacity-70 tracking-normal ml-1 px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/20">
                      ⌘ Enter
                    </span>
                  </>
                )}
              </button>
            </div>
            {submitError && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40 p-4 text-sm font-medium text-rose-800 dark:text-rose-300">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{submitError}</span>
                </div>
              </div>
            )}
          </form>
        </div>
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

function PoweredBy({ dark, font }: { dark: boolean; font: string }) {
  return (
    <footer className="flex w-full items-center justify-center py-8">
      <a
        href="https://folly.so"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-sm shadow-xs transition hover:border-neutral-300 dark:hover:border-neutral-700"
        style={{ fontFamily: font }}
      >
        <LogoMark className="h-3.5 w-3.5" />
        <span>Powered by Folly</span>
      </a>
    </footer>
  )
}