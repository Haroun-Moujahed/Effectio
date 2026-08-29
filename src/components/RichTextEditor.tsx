import { useEffect, useRef, useState, type ClipboardEvent } from 'react'

type RichTextEditorProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
}

type FormatCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'insertUnorderedList'
  | 'insertOrderedList'

const FORMAT_BUTTONS: Array<{
  command: FormatCommand
  label: string
  icon: 'bold' | 'italic' | 'underline' | 'bullet' | 'ordered'
}> = [
  { command: 'bold', label: 'Bold', icon: 'bold' },
  { command: 'italic', label: 'Italic', icon: 'italic' },
  { command: 'underline', label: 'Underline', icon: 'underline' },
  { command: 'insertUnorderedList', label: 'Bullet list', icon: 'bullet' },
  { command: 'insertOrderedList', label: 'Numbered list', icon: 'ordered' },
]

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = 'Add details (optional)',
  maxLength = 2000,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (document.activeElement === editor) return
    if (editor.innerHTML !== value) {
      editor.innerHTML = value
    }
    setCharCount(getTextLength(editor))
  }, [value])

  function getTextLength(node: HTMLElement) {
    return (node.textContent ?? '').length
  }

  function emitChange() {
    const editor = editorRef.current
    if (!editor) return

    const nextLength = getTextLength(editor)
    if (nextLength > maxLength) {
      document.execCommand('undo')
      setCharCount(getTextLength(editor))
      return
    }

    const html = editor.innerHTML.trim() === '' ? '' : editor.innerHTML
    setCharCount(nextLength)
    onChange(html)
  }

  function runCommand(command: FormatCommand) {
    editorRef.current?.focus()
    document.execCommand(command)
    emitChange()
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
    emitChange()
  }

  const remaining = maxLength - charCount

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar" role="toolbar" aria-label="Text formatting">
        {FORMAT_BUTTONS.map(({ command, label, icon }) => (
          <button
            key={command}
            type="button"
            className="rich-text-tool"
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
          >
            <FormatIcon type={icon} />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        id={id}
        className="rich-text-content"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Description"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={emitChange}
        onPaste={handlePaste}
      />

      <div className="rich-text-footer">
        <span className="task-char-counter" aria-live="polite">
          {remaining} left
        </span>
      </div>
    </div>
  )
}

function FormatIcon({
  type,
}: {
  type: 'bold' | 'italic' | 'underline' | 'bullet' | 'ordered'
}) {
  switch (type) {
    case 'bold':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 5h5.5a3.5 3.5 0 0 1 0 7H8V5zm0 7h6.2a3.8 3.8 0 0 1 0 7.6H8v-7.6z"
            fill="currentColor"
          />
        </svg>
      )
    case 'italic':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M13 5h6v2h-2.4l-3.2 10H16v2H7v-2h2.4l3.2-10H7V5h6z"
            fill="currentColor"
          />
        </svg>
      )
    case 'underline':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 5v6a5 5 0 0 0 10 0V5h2v6a7 7 0 0 1-14 0V5h2zm-2 14h16v2H5v-2z"
            fill="currentColor"
          />
        </svg>
      )
    case 'bullet':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 7h12v2H9V7zm0 5h12v2H9v-2zm0 5h12v2H9v-2zM5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"
            fill="currentColor"
          />
        </svg>
      )
    case 'ordered':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 6h1v4H5V7.5L4 8V6h2zm-1 6h2v6H4v-1l1-.5V14H5v-2zm3-4h12v2H8V8zm0 5h12v2H8v-2zm0 5h12v2H8v-2z"
            fill="currentColor"
          />
        </svg>
      )
  }
}
