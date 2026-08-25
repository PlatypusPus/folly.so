import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AnswerValue, Block, Form, FormSettings, FormTheme, Submission } from './types'
import { makeBlock, makeForm, makeOption, uid } from './types'

interface State {
  forms: Form[]
  submissions: Submission[]
  createForm: (name?: string) => Form
  deleteForm: (id: string) => void
  updateForm: (id: string, patch: Partial<Form>) => void
  updateSettings: (id: string, patch: Partial<FormSettings>) => void
  updateTheme: (id: string, patch: Partial<FormTheme>) => void
  updateBlock: (formId: string, blockId: string, patch: Partial<Block>) => void
  addBlock: (formId: string, block: Block, index?: number) => void
  removeBlock: (formId: string, blockId: string) => void
  moveBlock: (formId: string, fromIndex: number, toIndex: number) => void
  duplicateBlock: (formId: string, blockId: string) => void
  addSubmission: (formId: string, answers: Record<string, AnswerValue>) => Submission
}

function buildDemoForms(): { forms: Form[]; submissions: Submission[] } {
  const now = Date.now()
  const f1 = makeForm({
    id: 'demo-feedback',
    name: 'Client feedback survey',
    createdAt: now - 1000 * 60 * 60 * 48,
    settings: {
      title: 'Client feedback survey',
      description: 'Help us understand what’s working — and what isn’t.',
      thankYouMessage: 'Thanks so much! Your feedback helps us improve every single week.',
      theme: { background: '#ffffff', button: '#ff5470', buttonText: '#ffffff', font: 'system', darkMode: false },
      showProgress: true,
      poweredBy: true,
    },
    blocks: [
      makeBlock({ type: 'heading', text: 'How did we do?' }),
      makeBlock({
        type: 'paragraph',
        text: 'A couple of quick questions — this should take under a minute.',
      }),
      makeBlock({
        type: 'shortText',
        text: 'What’s your name?',
        placeholder: 'Type your answer',
        required: true,
      }),
      makeBlock({
        type: 'email',
        text: 'What’s the best email to reach you at?',
        placeholder: 'name@company.com',
      }),
      makeBlock({
        type: 'multipleChoice',
        text: 'Overall, how satisfied are you with us?',
        required: true,
        options: [
          makeOption('Very satisfied'),
          makeOption('Satisfied'),
          makeOption('Neutral'),
          makeOption('Dissatisfied'),
          makeOption('Very dissatisfied'),
        ],
      }),
      makeBlock({
        type: 'longText',
        text: 'What could we have done better?',
        placeholder: 'Share anything on your mind…',
        showIf: [{ fieldId: '', op: 'equals', value: 'Dissatisfied' }],
      }),
      makeBlock({ type: 'rating', text: 'How likely are you to recommend us?', ratingMax: 5 }),
      makeBlock({ type: 'pageBreak', text: 'Wrap up' }),
      makeBlock({ type: 'multipleChoice', text: 'Would you like to hop on a short call?', options: [makeOption('Yes, book me in!'), makeOption('I’ll think about it'), makeOption('No thanks')] }),
      makeBlock({
        type: 'fileUpload',
        text: 'Drop a screenshot or document if it helps explain.',
      }),
      makeBlock({ type: 'thankYou', text: "You're all set!" }),
    ],
  })

  const f2 = makeForm({
    id: 'demo-rsvp',
    name: 'Summer meetup RSVP',
    createdAt: now - 1000 * 60 * 60 * 24,
    settings: {
      title: 'Summer meetup RSVP',
      description: 'Friday, 7 PM · Riverside Gardens',
      thankYouMessage: 'See you there! 🌞',
      theme: { background: '#fdf6ef', button: '#0b0f19', buttonText: '#ffffff', font: 'serif', darkMode: false },
      showProgress: true,
      poweredBy: true,
    },
    blocks: [
      makeBlock({ type: 'heading', text: 'Summer meetup 🎉' }),
      makeBlock({ type: 'paragraph', text: 'Let us know if you’re coming. Bring friends!' }),
      makeBlock({ type: 'shortText', text: 'Full name', required: true }),
      makeBlock({ type: 'email', text: 'Email', required: true }),
      makeBlock({ type: 'checkbox', text: 'What are you bringing?', allowOther: true, options: [makeOption('Snacks'), makeOption('Drinks'), makeOption('A blanket'), makeOption('Music speaker')] }),
      makeBlock({ type: 'dropdown', text: 'When will you arrive?', options: [makeOption('4–5 PM'), makeOption('5–6 PM'), makeOption('6–7 PM'), makeOption('Later')] }),
      makeBlock({ type: 'rating', text: 'How excited are you?', ratingMax: 5, ratingIcon: 'heart' }),
    ],
  })

  const f3 = makeForm({
    id: 'demo-nps',
    name: 'NPS · Product pulse',
    createdAt: now - 1000 * 60 * 60 * 6,
    settings: {
      title: 'How likely are you to recommend us?',
      description: 'One tap is all it takes.',
      thankYouMessage: 'Pulse captured. Thank you!',
      theme: { background: '#0b0f19', button: '#ff5470', buttonText: '#ffffff', font: 'system', darkMode: true },
      showProgress: false,
      poweredBy: true,
    },
    blocks: [
      makeBlock({ type: 'nps', text: 'How likely are you to recommend Folly to a friend or colleague?', npsMinLabel: 'Not at all likely', npsMaxLabel: 'Extremely likely' }),
      makeBlock({ type: 'longText', text: 'What’s the main reason for your score?', placeholder: 'Optionally tell us more…' }),
    ],
  })

  const submissions: Submission[] = [
    { id: uid(), formId: 'demo-feedback', submittedAt: now - 1000 * 60 * 30, answers: { name: 'Priya Sharma', email: 'priya@acme.dev', 'q-4': 'Satisfied', 'q-5': 'The onboarding emails could be shorter.', 'q-6': 5 } },
    { id: uid(), formId: 'demo-feedback', submittedAt: now - 1000 * 60 * 90, answers: { name: 'Tom Becker', email: 'tom@kite.global', 'q-4': 'Very satisfied', 'q-6': 5 } },
    { id: uid(), formId: 'demo-feedback', submittedAt: now - 1000 * 60 * 60 * 5, answers: { name: 'Aisha Noor', email: 'aisha@paper.studio', 'q-4': 'Neutral', 'q-5': 'Pricing page could be clearer.', 'q-6': 4 } },
    { id: uid(), formId: 'demo-rsvp', submittedAt: now - 1000 * 60 * 45, answers: { name: 'Jonas Weber', email: 'jonas@ok.team', 'q-3': ['Snacks', 'Music speaker'], 'q-4': '5–6 PM', 'q-5': 5 } },
    { id: uid(), formId: 'demo-nps', submittedAt: now - 1000 * 45, answers: { 'q-0': 9, 'q-1': 'It is honestly just delightful to use.' } },
    { id: uid(), formId: 'demo-nps', submittedAt: now - 1000 * 1020, answers: { 'q-0': 7, 'q-1': '' } },
  ]

  return { forms: [f1, f2, f3], submissions }
}

const fresh = buildDemoForms()

export const useForms = create<State>()(
  persist(
    (set, get) => ({
      forms: fresh.forms,
      submissions: fresh.submissions,

      createForm: (name?: string) => {
        const form = makeForm({ name })
        if (name) form.settings.title = name
        set((s) => ({ forms: [form, ...s.forms] }))
        return form
      },

      deleteForm: (id) =>
        set((s) => ({
          forms: s.forms.filter((f) => f.id !== id),
          submissions: s.submissions.filter((x) => x.formId !== id),
        })),

      updateForm: (id, patch) =>
        set((s) => ({
          forms: s.forms.map((f) => (f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f)),
        })),

      updateSettings: (id, patch) =>
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === id ? { ...f, settings: { ...f.settings, ...patch }, updatedAt: Date.now() } : f,
          ),
        })),

      updateTheme: (id, patch) =>
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === id
              ? { ...f, settings: { ...f.settings, theme: { ...f.settings.theme, ...patch } }, updatedAt: Date.now() }
              : f,
          ),
        })),

      updateBlock: (formId, blockId, patch) =>
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === formId
              ? { ...f, updatedAt: Date.now(), blocks: f.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }
              : f,
          ),
        })),

      addBlock: (formId, block, index) =>
        set((s) => ({
          forms: s.forms.map((f) => {
            if (f.id !== formId) return f
            const blocks = [...f.blocks]
            blocks.splice(index ?? blocks.length, 0, block)
            return { ...f, updatedAt: Date.now(), blocks }
          }),
        })),

      removeBlock: (formId, blockId) =>
        set((s) => ({
          forms: s.forms.map((f) => {
            if (f.id !== formId) return f
            const blocks = f.blocks.filter((b) => b.id !== blockId)
            return { ...f, updatedAt: Date.now(), blocks }
          }),
        })),

      moveBlock: (formId, fromIndex, toIndex) =>
        set((s) => ({
          forms: s.forms.map((f) => {
            if (f.id !== formId) return f
            if (fromIndex === toIndex) return f
            const blocks = [...f.blocks]
            const [item] = blocks.splice(fromIndex, 1)
            blocks.splice(toIndex, 0, item)
            return { ...f, updatedAt: Date.now(), blocks }
          }),
        })),

      duplicateBlock: (formId, blockId) =>
        set((s) => ({
          forms: s.forms.map((f) => {
            if (f.id !== formId) return f
            const idx = f.blocks.findIndex((b) => b.id === blockId)
            if (idx === -1) return f
            const copy: Block = { ...f.blocks[idx], id: uid(), text: f.blocks[idx].text }
            if (copy.options) copy.options = f.blocks[idx].options?.map((o) => ({ ...o, id: uid() })) ?? copy.options
            const blocks = [...f.blocks]
            blocks.splice(idx + 1, 0, copy)
            return { ...f, updatedAt: Date.now(), blocks }
          }),
        })),

      addSubmission: (formId, answers) => {
        const submission: Submission = { id: uid(), formId, submittedAt: Date.now(), answers }
        set((s) => ({ submissions: [submission, ...s.submissions] }))
        return submission
      },
    }),
    {
      name: 'folly-data-v1',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)