import type { ReactNode } from 'react'
import type { BlockType } from './types'

function Svg({ children, viewBox = '0 0 24 24' }: { children: ReactNode; viewBox?: string }) {
  return (
    <svg viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
      {children}
    </svg>
  )
}

export function Icon({ name, className }: { name: BlockType | string; className?: string }) {
  return <span className={className}>{icons[name] ?? icons.shortText}</span>
}

export const icons: Record<string, ReactNode> = {
  heading: (
    <Svg>
      <path d="M6 4v16" />
      <path d="M18 4v16" />
      <path d="M6 12h12" />
    </Svg>
  ),
  paragraph: (
    <Svg>
      <path d="M7 5h10" />
      <path d="M7 9h7" />
      <path d="M7 13h10" />
      <path d="M7 17h5" />
    </Svg>
  ),
  shortText: (
    <Svg>
      <path d="M14 4.5 9.5 19" />
      <path d="M15.5 19 11 4.5" />
    </Svg>
  ),
  longText: (
    <Svg>
      <path d="M7 5h10" />
      <path d="M7 9h10" />
      <path d="M7 13h10" />
    </Svg>
  ),
  number: (
    <Svg>
      <path d="M7 6v12" />
      <path d="M17 6v12" />
      <path d="m5 11 14-3" />
      <path d="m5 15 14-3" />
    </Svg>
  ),
  email: (
    <Svg>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </Svg>
  ),
  phone: (
    <Svg>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L17 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </Svg>
  ),
  date: (
    <Svg>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Svg>
  ),
  rating: (
    <Svg>
      <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8L12 3.5Z" />
    </Svg>
  ),
  nps: (
    <Svg>
      <rect x="6" y="6" width="12" height="12" rx="2" transform="rotate(45 12 12)" />
      <path d="M9.5 15.5v-4M6.5 15.5v-2M12.5 15.5v-7M15.5 15.5v-2M18.5 15.5v-4" />
    </Svg>
  ),
  linear: (
    <Svg>
      <path d="M4 17 10 11" />
      <path d="M10 17 14 13" />
      <path d="M14 17 20 10" />
      <path d="M3 20h18" />
    </Svg>
  ),
  multipleChoice: (
    <Svg>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" />
    </Svg>
  ),
  checkbox: (
    <Svg>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Svg>
  ),
  dropdown: (
    <Svg>
      <rect x="4" y="6" width="16" height="12" rx="3" />
      <path d="m9 10 3 3 3-3" />
    </Svg>
  ),
  fileUpload: (
    <Svg>
      <path d="M12 15V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </Svg>
  ),
  image: (
    <Svg>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4 17 5-4 4 3 3.5-3 3.5 4" />
    </Svg>
  ),
  pageBreak: (
    <Svg>
      <path d="M7 12h10" />
      <path d="M5 3h14" />
      <circle cx="12" cy="21" r="0" />
    </Svg>
  ),
  thankYou: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </Svg>
  ),
  plus: (
    <Svg>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  dots: (
    <Svg viewBox="0 0 24 8">
      <circle cx="4" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="20" cy="4" r="1.4" fill="currentColor" stroke="none" />
    </Svg>
  ),
  chevron: (
    <Svg>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  ),
  trash: (
    <Svg>
      <path d="M5 7h14" />
      <path d="M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
      <path d="M7 7l.6 12a2 2 0 0 0 2 1.9h4.8a2 2 0 0 0 2-1.9L17 7" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  ),
  duplicate: (
    <Svg>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Svg>
  ),
  moveUp: (
    <Svg>
      <path d="m5 10 7-6 7 6" />
      <path d="M12 4v16" />
    </Svg>
  ),
  moveDown: (
    <Svg>
      <path d="m5 14 7 6 7-6" />
      <path d="M12 20V4" />
    </Svg>
  ),
  gear: (
    <Svg>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19 12a7 7 0 0 0-.15-1.4l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2.4-1.4L14 2.6h-4l-.15 2.1a7 7 0 0 0-2.4 1.4l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .15 1.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2.4 1.4l.15 2.1h4l.15-2.1a7 7 0 0 0 2.4-1.4l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12Z" />
    </Svg>
  ),
  arrowUp: (
    <Svg>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </Svg>
  ),
  arrowDown: (
    <Svg>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </Svg>
  ),
  back: (
    <Svg>
      <path d="M15 19l-7-7 7-7" />
    </Svg>
  ),
  share: (
    <Svg>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </Svg>
  ),
  theme: (
    <Svg>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2 0-3 2-4 4-4 1.4 0 2-.5 3-1.5a9 9 0 0 0-9-10.5Z" />
    </Svg>
  ),
  link: (
    <Svg>
      <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </Svg>
  ),
  copy: (
    <Svg>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" />
    </Svg>
  ),
  check: (
    <Svg>
      <path d="m4.5 12.5 5 5 10-11" />
    </Svg>
  ),
  close: (
    <Svg>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
}

export interface BlockDef {
  type: BlockType
  label: string
  hint: string
  group: string
  shortcut?: string
}

export const BLOCKS: BlockDef[] = [
  { type: 'heading', label: 'Heading', hint: 'Large heading text', group: 'Text', shortcut: '# ' },
  { type: 'paragraph', label: 'Text', hint: 'Paragraph of text', group: 'Text', shortcut: 'txt' },
  { type: 'image', label: 'Image', hint: 'Embed an image', group: 'Text' },
  { type: 'shortText', label: 'Short text', hint: 'One line of text', group: 'Input', shortcut: 'short' },
  { type: 'longText', label: 'Long text', hint: 'Multiple lines of text', group: 'Input', shortcut: 'long' },
  { type: 'email', label: 'Email', hint: 'Email address', group: 'Input', shortcut: 'email' },
  { type: 'number', label: 'Number', hint: 'Numeric input', group: 'Input', shortcut: 'number' },
  { type: 'phone', label: 'Phone', hint: 'Phone number', group: 'Input', shortcut: 'phone' },
  { type: 'date', label: 'Date', hint: 'Date picker', group: 'Input', shortcut: 'date' },
  { type: 'fileUpload', label: 'File upload', hint: 'Collect files from respondents', group: 'Input', shortcut: 'file' },
  { type: 'multipleChoice', label: 'Multiple choice', hint: 'Pick from a list of options', group: 'Choice', shortcut: 'multiple' },
  { type: 'checkbox', label: 'Checkbox', hint: 'Select multiple options', group: 'Choice', shortcut: 'checkbox' },
  { type: 'dropdown', label: 'Dropdown', hint: 'Choose from a dropdown list', group: 'Choice', shortcut: 'dropdown' },
  { type: 'rating', label: 'Rating', hint: 'Rate with icons', group: 'Scale', shortcut: 'rating' },
  { type: 'linear', label: 'Linear scale', hint: 'Rate on a numeric scale', group: 'Scale', shortcut: 'linear' },
  { type: 'nps', label: 'NPS score', hint: 'Net promoter score (0–10)', group: 'Scale', shortcut: 'nps' },
  { type: 'pageBreak', label: 'Page break', hint: 'Split the form into pages', group: 'Layout', shortcut: 'page' },
  { type: 'thankYou', label: 'Thank you page', hint: 'Custom completion message', group: 'Layout', shortcut: 'thank' },
]

export const GROUPS = ['Text', 'Input', 'Choice', 'Scale', 'Layout']

export function searchBlocks(query: string): BlockDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...BLOCKS]
  return BLOCKS.filter(
    (b) =>
      b.label.toLowerCase().includes(q) ||
      b.hint.toLowerCase().includes(q) ||
      (b.shortcut && b.shortcut.toLowerCase().includes(q)),
  )
}

export function defaultOptions(count = 3): string[] {
  return Array.from({ length: count }, (_, i) => `Option ${i + 1}`)
}