import { Link } from 'react-router-dom'
import { Logo, LogoMark } from '../components/ui'
import { useForms } from '../store'

const NAV = [
  { label: 'Pricing', href: '#' },
  { label: 'Templates', href: '#' },
  { label: 'Integrations', href: '#' },
  { label: 'Help', href: '#' },
]

const COMPANIES = ['Acme', 'Notionette', 'Kite', 'Rakutenly', 'Glover', 'Brush&Co']

const FAQ = [
  {
    q: 'Is Folly really free?',
    a: 'Yes. Born out of frustration with pay-per-response form builders, Folly offers unlimited forms and unlimited submissions for free, forever. Upgrade only if you want to remove branding or use custom CSS.',
  },
  {
    q: 'Why does it work like a text document?',
    a: 'Because form building should feel like writing, not wiring together widgets. Click into any block and keep typing. Hit / to insert any question type — same model as Notion.',
  },
  {
    q: 'Can I make forms adapt to the respondent?',
    a: 'Yes. Conditional logic lets you show or hide questions based on earlier answers, split forms into multiple pages, and calculate values with formulas.',
  },
  {
    q: 'What happens to my data?',
    a: 'It lives entirely in your browser. There is no tracking, no cookies, and nothing leaves your machine unless you share a form link. GDPR-friendly by construction.',
  },
]

function Face({ emoji, className }: { emoji: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute select-none text-5xl drop-shadow-sm sm:text-6xl ${className ?? ''}`}
      aria-hidden
    >
      {emoji}
    </span>
  )
}

function Hero() {
  const go = () => {
    useForms
      .getState()
      .createForm?.()
    window.location.hash = '#/forms'
  }
  return (
    <section className="relative overflow-hidden">
      <div className="dot-bg absolute inset-0 -z-10 opacity-60" />
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-20 text-center sm:pt-24 sm:pb-28">
        <Face emoji="😀" className="left-[8%] top-24 hidden rotate-[-8deg] md:block" />
        <Face emoji="🤩" className="right-[10%] top-40 hidden rotate-[10deg] md:block" />
        <Face emoji="😍" className="left-[16%] top-[70%] hidden rotate-6 md:block" />
        <Face emoji="🥳" className="right-[14%] top-[64%] hidden -rotate-6 md:block" />

        <a
          href="#/"
          onClick={go}
          className="group inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-4 py-1.5 text-sm font-medium text-ink/70 shadow-sm transition hover:border-brand-300 hover:text-ink"
        >
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          Try it now — no signup required
          <span className="transition group-hover:translate-x-0.5">→</span>
        </a>

        <h1 className="mt-7 text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-7xl">
          The simplest way to
          <br />
          create <span className="highlight italic">beautiful</span> forms
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink/60">
          Say goodbye to boring forms. Folly is the free, intuitive form builder you’ve been looking for
          — type your questions like you would in a doc.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={go}
            className="rounded-full bg-ink px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-black"
          >
            Create a free form
          </button>
          <Link
            to="/forms"
            className="rounded-full border border-ink/15 bg-white px-7 py-3.5 text-[15px] font-semibold text-ink transition hover:border-ink/30"
          >
            Browse the builder
          </Link>
        </div>
        <p className="mt-3 text-sm text-ink/40">No account needed · Unlimited forms &amp; submissions</p>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-ink/35">
          <span className="text-[13px] font-semibold uppercase tracking-widest">
            Powering <span className="font-bold text-ink/60">500,000+</span> teams
          </span>
          {COMPANIES.map((c) => (
            <span key={c} className="text-lg font-bold tracking-tight opacity-75">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function MiniEditor() {
  return (
    <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-pop">
      <div className="flex items-center gap-2 border-b border-ink/5 px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-ink/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-300" />
        <span className="ml-3 rounded-md bg-ink/[0.04] px-2 py-0.5 text-xs font-medium text-ink/40">
          Untitled form
        </span>
      </div>
      <div className="space-y-3 px-6 py-6">
        <div className="font-form-serif text-2xl font-semibold leading-snug text-ink">
          How did you hear about us?
        </div>
        <div className="space-y-2">
          {['Word of mouth', 'Google search', 'Social media', 'Read a blog post'].map((o, i) => (
            <div key={o} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  i === 0 ? 'border-ink text-ink' : 'border-ink/20'
                }`}
              >
                {i === 0 && <span className="h-2 w-2 rounded-full bg-ink" />}
              </span>
              <span className="text-[15px] text-ink/75">{o}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 pb-0.5 text-sm italic text-ink/35">“Type / for any block”</div>
        <div className="flex justify-end">
          <span className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">Submit</span>
        </div>
      </div>
    </div>
  )
}

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">A form builder like no other</p>
        <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Fill it out the way you <span className="highlight italic">think</span>
        </h2>
        <p className="mt-4 text-lg text-ink/55">
          Folly makes it simple for anyone to build free online forms. No code needed — just type your
          questions like you would in a doc, and hit <code className="rounded bg-ink/5 px-1.5 py-0.5 font-mono text-sm">/</code> to insert any question type.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center rounded-3xl border border-ink/10 bg-ink/[0.02] p-8">
          <h3 className="text-3xl font-bold tracking-tight text-ink">Nothing to learn.</h3>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink/55">
            The editor works like Notion. Enter to drop a new question, <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[13px]">/</code> for the
            block picker, <code className="rounded bg-ink/5 px-1 py-0.5 font-mono text-[13px]">⋮⋮</code> to drag, reorder and configure each block.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Drag & reorder', 'Inline editing', 'Slash commands', 'Format shortcuts'].map((t) => (
              <span key={t} className="rounded-full border border-ink/10 bg-white px-3 py-1.5 text-[13px] font-medium text-ink/70">
                {t}
              </span>
            ))}
          </div>
        </div>
        <MiniEditor />
      </div>
    </section>
  )
}

const INPUT_TYPES = [
  { icon: 'Aa', label: 'Short text' },
  { icon: '¶', label: 'Long text' },
  { icon: '@', label: 'Email' },
  { icon: '123', label: 'Numbers' },
  { icon: '✓', label: 'Multiple choice' },
  { icon: '▣', label: 'Checkbox' },
  { icon: '▾', label: 'Dropdown' },
  { icon: '★', label: 'Rating' },
  { icon: '✎', label: 'Signature' },
  { icon: '📅', label: 'Date & time' },
  { icon: '🔗', label: 'Links' },
  { icon: '↥', label: 'File upload' },
  { icon: '⧉', label: 'Matrix' },
  { icon: '◔', label: 'NPS score' },
  { icon: '₿', label: 'Payments' },
  { icon: '🧩', label: 'Embed video' },
]

function InputTypes() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">Simple but powerful</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Build any form <span className="highlight italic">in seconds</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/55">
            From contact info to payments, signatures and file uploads — collect any kind of data with a
            wide range of free input blocks. Everything from surveys to quizzes to lead generation forms.
          </p>
          <Link
            to="/forms"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
          >
            Start building <span>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INPUT_TYPES.map((t) => (
            <div
              key={t.label}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-card"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/[0.04] text-[15px] font-bold text-ink transition group-hover:bg-brand-50 group-hover:text-brand-600">
                {t.icon}
              </span>
              <span className="text-[12px] font-medium leading-tight text-ink/60">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const SMART = [
  {
    icon: '⚡',
    title: 'Conditional logic',
    desc: 'Build dynamic forms that adapt to answers — show, hide and skip questions based on prior input.',
  },
  {
    icon: '🧮',
    title: 'Calculator',
    desc: 'Use variables to create dynamic content, scores and prices. Compute values as respondents type.',
  },
  {
    icon: '🫥',
    title: 'Hidden fields',
    desc: 'Pass data through your form URL. Pre-fill fields and pipe answers into later questions.',
  },
  {
    icon: '🧭',
    title: 'Multi-page forms',
    desc: 'Split long surveys into pages with a gentle progress bar. One tap per section.',
  },
]

function Smart() {
  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-400">Craft intelligent forms</p>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Forms that think <span className="italic text-brand-400">ahead</span>
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SMART.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Themes() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="grid grid-cols-3 gap-4">
            {[
              { bg: '#ffffff', accent: '#0b0f19', label: 'Clean' },
              { bg: '#0b0f19', accent: '#ff5470', label: 'Midnight' },
              { bg: '#fdf6ef', accent: '#1a7f5a', label: 'Paper' },
            ].map((t) => (
              <div key={t.label} className="overflow-hidden rounded-2xl border border-ink/10 shadow-card">
                <div className="p-3" style={{ background: t.bg }}>
                  <div className="h-2 w-2/3 rounded-full" style={{ background: t.accent }} />
                  <div className="mt-2 h-1.5 w-full rounded-full bg-black/10" />
                  <div className="mt-2 h-1.5 w-4/5 rounded-full bg-black/10" />
                  <div className="mt-3 flex justify-end">
                    <span className="h-5 w-9 rounded-full text-[8px] font-bold leading-5 text-center" style={{ background: t.accent, color: '#fff' }}>
                      OK
                    </span>
                  </div>
                </div>
                <div className="bg-white px-3 py-2 text-[12px] font-semibold text-ink/60">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">Make forms uniquely yours</p>
          <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Pick a theme, or craft <span className="highlight italic">your own</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/55">
            Choose a background, a button color, and a typeface. Add a logo, cover image or embedded video.
            Column layouts, custom fonts and even full custom CSS — all without touching code.
          </p>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Start typing', d: 'Open the builder and write your first question. Press Enter for the next one.' },
    { n: '02', t: 'Add magic', d: 'Hit / for blocks, set up conditional logic and split into pages with a page break.' },
    { n: '03', t: 'Share & collect', d: 'Grab your Folly link, embed it anywhere, and watch submissions roll in — unlimited.' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 text-center">
        <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">Roll up your sleeves</p>
        <h2 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Build stunning forms, free.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-ink/55">
          It’s as simple as one-two-three — and you don’t even need an account to try it.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-3xl border border-ink/10 p-8 shadow-sm transition hover:shadow-card">
            <span className="text-sm font-black tracking-widest text-brand-500">{s.n}</span>
            <h3 className="mt-3 text-xl font-bold text-ink">{s.t}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/55">{s.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link
          to="/forms"
          className="rounded-full bg-ink px-8 py-4 text-[15px] font-semibold text-white shadow-lg shadow-ink/20 transition hover:-translate-y-0.5 hover:bg-black"
        >
          Create a free form
        </Link>
      </div>
    </section>
  )
}

function FAQSection() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="mb-10 text-center text-4xl font-extrabold tracking-tight text-ink">Questions &amp; answers</h2>
      <div className="divide-y divide-ink/10 rounded-3xl border border-ink/10 bg-white shadow-sm">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="shrink-0 text-ink/30 transition group-open:rotate-45">＋</span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/60">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-24">
      <div className="overflow-hidden rounded-[2rem] bg-brand-500 px-8 py-16 text-center text-white sm:px-16">
        <LogoMark className="mx-auto h-10 w-10" />
        <h2 className="mx-auto mt-6 max-w-xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Say goodbye to boring forms
        </h2>
        <p className="mx-auto mt-3 max-w-md text-lg text-white/85">
          Free forever. Unlimited forms. Unlimited submissions.
        </p>
        <Link
          to="/forms"
          className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-[15px] font-bold text-brand-600 shadow-lg transition hover:-translate-y-0.5"
        >
          Create a free form →
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  const cols: Array<[string, string[]]> = [
    ['Product', ['Pricing', 'Features', 'Templates', 'Changelog', 'API docs']],
    ['Help', ['Get started', 'Help center', 'Contact support', 'Feedback']],
    ['Company', ['About us', 'Blog', 'Status', 'Security']],
    ['Compare', ['Typeform alternative', 'Jotform alternative', 'Google Forms alternative']],
  ]
  return (
    <footer className="border-t border-ink/10 bg-ink/[0.02]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/50">
              The free form builder for people who can’t stand form builders.
            </p>
            <p className="mt-6 text-xs text-ink/35">Made with 🤍 · Runs entirely in your browser</p>
          </div>
          {cols.map(([title, links]) => (
            <div key={title}>
              <h4 className="text-[13px] font-bold uppercase tracking-wider text-ink/45">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <span className="cursor-pointer text-sm text-ink/60 transition hover:text-brand-500">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-6 text-xs text-ink/40 sm:flex-row">
          <span>© {new Date().getFullYear()} Folly BV — Built as an MVP clone of tally.so</span>
          <div className="flex gap-5">
            {['X', 'Reddit', 'LinkedIn', 'Instagram', 'Bluesky'].map((s) => (
              <span key={s} className="cursor-pointer hover:text-ink/70">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  const goCreate = () => {
    useForms.getState().createForm
    window.location.hash = '#/forms'
  }
  return (
    <div className="min-h-full bg-white">
      <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-7 text-[14px] font-medium text-ink/60 md:flex">
            {NAV.map((n) => (
              <a key={n.label} href={n.href} className="transition hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/forms" className="hidden text-[14px] font-medium text-ink/60 transition hover:text-ink sm:block">
              Sign in
            </Link>
            <button
              onClick={goCreate}
              className="rounded-full bg-ink px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-black"
            >
              Create form
            </button>
          </div>
        </div>
      </header>

      <Hero />
      <Features />
      <InputTypes />
      <Smart />
      <Themes />
      <HowItWorks />
      <FAQSection />
      <CTA />
      <Footer />
    </div>
  )
}