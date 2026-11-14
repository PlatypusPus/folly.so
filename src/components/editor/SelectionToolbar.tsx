import { useEffect, useRef, useState } from 'react'

export function SelectionToolbar({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [hasSelection, setHasSelection] = useState(false)

  const updatePosition = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setCoords(null)
      setHasSelection(false)
      return
    }

    const text = sel.toString().trim()
    if (!text) {
      setCoords(null)
      setHasSelection(false)
      return
    }

    const range = sel.getRangeAt(0)
    const container = containerRef.current
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setCoords(null)
      setHasSelection(false)
      return
    }

    // Ensure the selection is inside a contentEditable node
    let node: Node | null = range.startContainer
    let isEditable = false
    while (node && node !== container) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).isContentEditable) {
        isEditable = true
        break
      }
      node = node.parentNode
    }

    if (!isEditable) {
      setCoords(null)
      setHasSelection(false)
      return
    }

    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setCoords(null)
      setHasSelection(false)
      return
    }

    savedRangeRef.current = range.cloneRange()
    setHasSelection(true)
    setCoords({
      top: Math.max(10, rect.top - 52),
      left: Math.max(12, rect.left + rect.width / 2),
    })
  }

  useEffect(() => {
    document.addEventListener('selectionchange', updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('selectionchange', updatePosition)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [containerRef])

  const dispatchInput = (range: Range | null) => {
    let targetEl: HTMLElement | null = (range?.commonAncestorContainer as HTMLElement) ?? null
    if (targetEl && targetEl.nodeType === Node.TEXT_NODE) targetEl = targetEl.parentElement
    while (targetEl && !targetEl.isContentEditable && targetEl !== document.body) {
      targetEl = targetEl.parentElement
    }
    if (targetEl) {
      targetEl.dispatchEvent(new Event('input', { bubbles: true }))
      targetEl.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  const execCmd = (cmd: string, val?: string) => {
    let range = savedRangeRef.current
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      range = sel.getRangeAt(0)
    }
    if (!range) return

    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }

    document.execCommand(cmd, false, val)
    dispatchInput(range)
    updatePosition()
  }

  const toggleWrap = (tagName: string, className?: string) => {
    let range = savedRangeRef.current
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      range = sel.getRangeAt(0)
    }
    if (!range || range.collapsed) return

    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }

    let parent = range.commonAncestorContainer as HTMLElement | null
    if (parent && parent.nodeType === Node.TEXT_NODE) parent = parent.parentElement

    let existingTag: HTMLElement | null = null
    while (parent && parent.isContentEditable) {
      if (parent.tagName.toLowerCase() === tagName.toLowerCase()) {
        existingTag = parent
        break
      }
      parent = parent.parentElement
    }

    if (existingTag) {
      const text = existingTag.innerHTML
      existingTag.outerHTML = text
    } else {
      const el = document.createElement(tagName)
      if (className) el.className = className
      try {
        range.surroundContents(el)
      } catch {
        const frag = range.extractContents()
        el.appendChild(frag)
        range.insertNode(el)
      }
    }

    dispatchInput(range)
    updatePosition()
  }

  const formatLink = () => {
    let range = savedRangeRef.current
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      range = sel.getRangeAt(0)
    }
    if (!range) return
    const text = range.toString()
    if (!text) return

    const url = window.prompt('Enter link URL:', 'https://')
    if (!url || !url.trim() || url === 'https://') return

    if (sel) {
      sel.removeAllRanges()
      sel.addRange(range)
    }

    document.execCommand('createLink', false, url.trim())

    let targetEl: HTMLElement | null = range.commonAncestorContainer as HTMLElement
    if (targetEl && targetEl.nodeType === Node.TEXT_NODE) targetEl = targetEl.parentElement
    while (targetEl && !targetEl.isContentEditable && targetEl !== document.body) {
      targetEl = targetEl.parentElement
    }
    if (targetEl) {
      targetEl.querySelectorAll('a').forEach((a) => {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
        a.className = 'text-black font-bold underline decoration-2 underline-offset-2 hover:bg-[#ffe600] transition-colors'
      })
      dispatchInput(range)
    }

    updatePosition()
  }

  // Keyboard shortcut listener for Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const container = containerRef.current
      if (!container) return

      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) return

      const range = sel.getRangeAt(0)
      if (!container.contains(range.commonAncestorContainer)) return

      if (e.metaKey || e.ctrlKey) {
        const key = e.key.toLowerCase()
        if (key === 'b') {
          e.preventDefault()
          execCmd('bold')
        } else if (key === 'i') {
          e.preventDefault()
          execCmd('italic')
        } else if (key === 'u') {
          e.preventDefault()
          execCmd('underline')
        } else if (key === 'k') {
          e.preventDefault()
          formatLink()
        } else if (key === 'e') {
          e.preventDefault()
          toggleWrap('code', 'border border-black bg-[#ffe600]/30 px-1 py-0.5 font-mono text-[0.88em] font-bold text-black')
        } else if (key === 'h') {
          e.preventDefault()
          toggleWrap('mark', 'bg-[#ffe600] text-black font-bold px-1 border border-black shadow-[1px_1px_0px_#000]')
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  if (!coords || !hasSelection) return null

  return (
    <div
      className="animate-pop fixed z-50 flex items-center gap-1 border-2 border-black bg-white px-1.5 py-1 text-black shadow-[4px_4px_0px_#000] -translate-x-1/2 font-mono text-xs"
      style={{ top: coords.top, left: coords.left }}
      onMouseDown={(e) => {
        // Prevent clicking toolbar buttons from unfocusing / deselecting the text!
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={() => execCmd('bold')}
        className="flex h-7 w-7 items-center justify-center border border-black bg-white hover:bg-[#ffe600] font-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition"
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={() => execCmd('italic')}
        className="flex h-7 w-7 items-center justify-center border border-black bg-white hover:bg-[#5ce1e6] italic font-serif font-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition"
        title="Italic (Ctrl+I)"
      >
        i
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={() => execCmd('underline')}
        className="flex h-7 w-7 items-center justify-center border border-black bg-white hover:bg-[#ff90e8] underline font-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition"
        title="Underline (Ctrl+U)"
      >
        U
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={() => execCmd('strikeThrough')}
        className="flex h-7 w-7 items-center justify-center border border-black bg-white hover:bg-[#ff5a27] hover:text-white line-through font-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition"
        title="Strikethrough"
      >
        S
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={() => toggleWrap('mark', 'bg-[#ffe600] text-black font-bold px-1 border border-black shadow-[1px_1px_0px_#000]')}
        className="flex h-7 w-7 items-center justify-center border border-black bg-[#ffe600] hover:bg-yellow-300 font-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition"
        title="Highlight (Ctrl+H)"
      >
        ★
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={() => toggleWrap('code', 'border border-black bg-[#ffe600]/30 px-1 py-0.5 font-mono text-[0.88em] font-bold text-black')}
        className="flex h-7 w-7 items-center justify-center border border-black bg-white hover:bg-neutral-100 font-mono text-[10px] font-black shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition"
        title="Inline code (Ctrl+E)"
      >
        &lt;/&gt;
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={formatLink}
        className="flex h-7 w-7 items-center justify-center border border-black bg-white hover:bg-[#00ef84] shadow-[1px_1px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition"
        title="Insert Link (Ctrl+K)"
      >
        🔗
      </button>
    </div>
  )
}
