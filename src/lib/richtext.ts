export function markdownToHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-black font-bold underline decoration-2 underline-offset-2 hover:bg-[#ffe600] transition-colors">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/==([^=]+)==/g, '<mark class="bg-[#ffe600] text-black font-bold px-1 border border-black shadow-[1px_1px_0px_#000]">$1</mark>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, '<code class="border border-black bg-[#ffe600]/30 px-1 py-0.5 font-mono text-[0.88em] font-bold text-black">$1</code>')
    .replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

export function htmlToMarkdown(nodeOrHtml: Node | string): string {
  if (typeof nodeOrHtml === 'string') {
    if (typeof document === 'undefined') return nodeOrHtml
    const div = document.createElement('div')
    div.innerHTML = nodeOrHtml
    return htmlToMarkdown(div)
  }

  const node = nodeOrHtml
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()

  let inner = ''
  for (let i = 0; i < el.childNodes.length; i++) {
    inner += htmlToMarkdown(el.childNodes[i])
  }

  if (tag === 'b' || tag === 'strong' || el.style.fontWeight === 'bold' || Number(el.style.fontWeight) >= 600) {
    return inner ? `**${inner}**` : ''
  }
  if (tag === 'i' || tag === 'em' || el.style.fontStyle === 'italic') {
    return inner ? `*${inner}*` : ''
  }
  if (tag === 'u' || el.style.textDecoration.includes('underline')) {
    return inner ? `<u>${inner}</u>` : ''
  }
  if (tag === 's' || tag === 'strike' || tag === 'del' || el.style.textDecoration.includes('line-through')) {
    return inner ? `~~${inner}~~` : ''
  }
  if (tag === 'mark' || el.style.backgroundColor) {
    return inner ? `==${inner}==` : ''
  }
  if (tag === 'code') {
    return inner ? `\`${inner}\`` : ''
  }
  if (tag === 'a') {
    const href = el.getAttribute('href') || '#'
    return `[${inner || href}](${href})`
  }
  if (tag === 'br') return '\n'
  if (tag === 'div' || tag === 'p') {
    return inner
  }

  return inner
}
