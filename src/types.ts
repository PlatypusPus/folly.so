export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'shortText'
  | 'longText'
  | 'number'
  | 'email'
  | 'phone'
  | 'date'
  | 'rating'
  | 'nps'
  | 'linear'
  | 'multipleChoice'
  | 'checkbox'
  | 'dropdown'
  | 'fileUpload'
  | 'image'
  | 'pageBreak'
  | 'thankYou'

export interface ChoiceOption {
  id: string
  label: string
}

export interface LogicCondition {
  fieldId: string
  op: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan'
  value: string
}

export interface Block {
  id: string
  type: BlockType
  text: string
  helpText?: string
  placeholder?: string
  required?: boolean
  options?: ChoiceOption[]
  allowMultiple?: boolean
  allowOther?: boolean
  minChoices?: number
  maxChoices?: number
  ratingMax?: number
  ratingIcon?: 'star' | 'heart' | 'thumbs'
  linearMax?: number
  linearMinLabel?: string
  linearMaxLabel?: string
  npsMinLabel?: string
  npsMaxLabel?: string
  imageUrl?: string
  imageCaption?: string
  darkBackground?: boolean
  fileTypes?: string[]
  maxSizeMb?: number
  showIf?: LogicCondition[]
}

export interface FormTheme {
  background: string
  button: string
  buttonText: string
  font: 'system' | 'serif' | 'playful'
  darkMode: boolean
}

export interface FormSettings {
  title: string
  description?: string
  thankYouMessage: string
  thankYouRedirectUrl?: string
  thankYouButtonText?: string
  thankYouButtonUrl?: string
  coverImageUrl?: string
  logoUrl?: string
  hiddenFields?: string[]
  accent?: string
  theme: FormTheme
  showProgress: boolean
  poweredBy: boolean
}

export interface Form {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  settings: FormSettings
  blocks: Block[]
}

export interface Submission {
  id: string
  formId: string
  submittedAt: number
  answers: Record<string, string | string[] | number | FilePayload | null>
}

export interface FilePayload {
  name: string
  size: number
}

export type AnswerValue = string | string[] | number | FilePayload | null

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3)
}

export function makeOption(label = ''): ChoiceOption {
  return { id: uid(), label }
}

export function makeBlock(partial: Partial<Block> & { type: BlockType }): Block {
  const block: Block = {
    id: uid(),
    type: partial.type,
    text: partial.text ?? '',
    helpText: partial.helpText,
    placeholder: partial.placeholder ?? (partial.type === 'shortText' ? 'Your answer' : undefined),
    required: partial.required ?? false,
    options: partial.options,
    allowMultiple: partial.allowMultiple,
    allowOther: partial.allowOther,
    minChoices: partial.minChoices,
    maxChoices: partial.maxChoices,
    ratingMax: partial.ratingMax ?? 5,
    ratingIcon: partial.ratingIcon ?? 'star',
    linearMax: partial.linearMax ?? 5,
    linearMinLabel: partial.linearMinLabel,
    linearMaxLabel: partial.linearMaxLabel,
    npsMinLabel: partial.npsMinLabel ?? 'Not at all likely',
    npsMaxLabel: partial.npsMaxLabel ?? 'Extremely likely',
    darkBackground: partial.darkBackground ?? false,
    imageUrl: partial.imageUrl,
    imageCaption: partial.imageCaption,
    fileTypes: partial.fileTypes ?? ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.doc', '.docx', '.zip', '.mp4'],
    maxSizeMb: partial.maxSizeMb ?? 10,
    showIf: partial.showIf,
  }
  return block
}

export function defaultTheme(): FormTheme {
  return {
    background: '#ffffff',
    button: '#0b0f19',
    buttonText: '#ffffff',
    font: 'system',
    darkMode: false,
  }
}

export function makeForm(partial: Partial<Form> = {}): Form {
  const settings = partial.settings ?? {
    title: 'Untitled form',
    description: '',
    thankYouMessage: 'Thanks! We’ve received your submission.',
    accent: '#ff5470',
    theme: defaultTheme(),
    showProgress: true,
    poweredBy: true,
  }
  return {
    id: partial.id ?? uid(),
    name: partial.name ?? settings.title,
    createdAt: partial.createdAt ?? Date.now(),
    updatedAt: partial.updatedAt ?? Date.now(),
    settings,
    blocks: partial.blocks ?? [makeBlock({ type: 'longText' })],
  }
}