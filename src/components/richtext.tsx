import { Fragment, type ReactNode } from 'react'

export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>)
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      parts.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      )
    }
    last = m.index + token.length
  }
  if (last < text.length) parts.push(<Fragment key={key++}>{text.slice(last)}</Fragment>)
  return <>{parts}</>
}