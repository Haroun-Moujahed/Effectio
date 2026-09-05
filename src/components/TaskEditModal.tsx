import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from '../constants'
import { hasTaskDescription } from '../tasks'
import { RichTextEditor } from './RichTextEditor'

type TaskEditModalProps = {
  open: boolean
  mode?: 'edit' | 'view'
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onClose: () => void
}

export function TaskEditModal({
  open,
  mode = 'edit',
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onClose,
}: TaskEditModalProps) {
  const isView = mode === 'view'
  const titleId = useId()
  const descriptionId = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<number>(0)
  const titleRemaining = TASK_TITLE_MAX_LENGTH - title.length
  const hasDescription = hasTaskDescription(description)

  useEffect(() => {
    if (!open) {
      setCopied(false)
      window.clearTimeout(copyTimerRef.current)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    if (isView) {
      closeRef.current?.focus()
    } else {
      titleRef.current?.focus()
      titleRef.current?.select()
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, isView])

  if (!open) return null

  async function copyDescription() {
    if (!description.trim()) return
    try {
      await copyRichText(description)
      setCopied(true)
      window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) return
    onSave()
  }

  const content = (
    <>
      <h2 className="modal-title">{isView ? 'View task' : 'Edit task'}</h2>

      <div className="task-edit-field">
        <span className="task-edit-field-label">
          <span>Title</span>
          {!isView ? (
            <span className="task-char-counter" aria-live="polite">
              {titleRemaining} left
            </span>
          ) : null}
        </span>
        {isView ? (
          <p id={titleId} className="task-view-value">
            {title}
          </p>
        ) : (
          <input
            ref={titleRef}
            id={titleId}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            maxLength={TASK_TITLE_MAX_LENGTH}
            required
          />
        )}
      </div>

      <div className="task-edit-field task-edit-description-field">
        <span id={descriptionId}>Description</span>
        {isView ? (
          hasDescription ? (
            <div className="task-view-description-wrap">
              <button
                type="button"
                className="task-view-copy"
                onClick={() => void copyDescription()}
                aria-label={copied ? 'Description copied' : 'Copy description'}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <div
                className="task-view-description rich-text-content"
                aria-labelledby={descriptionId}
                dangerouslySetInnerHTML={{ __html: description }}
              />
            </div>
          ) : (
            <p className="task-view-empty" aria-labelledby={descriptionId}>
              No description
            </p>
          )
        ) : (
          <RichTextEditor
            id={descriptionId}
            value={description}
            onChange={onDescriptionChange}
            placeholder="Add details (optional)"
            maxLength={TASK_DESCRIPTION_MAX_LENGTH}
          />
        )}
      </div>

      <div className="modal-actions">
        {isView ? (
          <button
            ref={closeRef}
            type="button"
            className="modal-btn modal-btn-primary"
            onClick={onClose}
          >
            Close
          </button>
        ) : (
          <>
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-primary">
              Save
            </button>
          </>
        )}
      </div>
    </>
  )

  return createPortal(
    <div className="modal-root" role="presentation">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label={isView ? 'Close task details' : 'Close task editor'}
      />
      {isView ? (
        <div className="modal-card task-edit-modal">{content}</div>
      ) : (
        <form className="modal-card task-edit-modal" onSubmit={handleSubmit}>
          {content}
        </form>
      )}
    </div>,
    document.body,
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="12"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12.5 9.5 17 19 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function htmlToPlainText(html: string) {
  const node = document.createElement('div')
  node.innerHTML = html
  return (node.innerText || node.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}

function wrapClipboardHtml(html: string) {
  return `<!DOCTYPE html><html><body><!--StartFragment-->${html}<!--EndFragment--></body></html>`
}

async function copyRichText(html: string) {
  const plain = htmlToPlainText(html)
  const clipboardHtml = wrapClipboardHtml(html)

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([clipboardHtml], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ])
      return
    }
  } catch {
    // Some browsers reject text/html on ClipboardItem; use the copy event instead.
  }

  if (copyHtmlWithCopyEvent(clipboardHtml, plain)) return

  copyHtmlWithSelection(html)
}

function copyHtmlWithCopyEvent(html: string, plain: string) {
  let copied = false

  function onCopy(event: ClipboardEvent) {
    event.clipboardData?.setData('text/html', html)
    event.clipboardData?.setData('text/plain', plain)
    event.preventDefault()
    copied = true
  }

  document.addEventListener('copy', onCopy)
  try {
    document.execCommand('copy')
  } finally {
    document.removeEventListener('copy', onCopy)
  }

  return copied
}

function copyHtmlWithSelection(html: string) {
  const holder = document.createElement('div')
  holder.contentEditable = 'true'
  holder.innerHTML = html
  holder.style.position = 'fixed'
  holder.style.left = '-9999px'
  document.body.append(holder)

  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(holder)
  selection?.removeAllRanges()
  selection?.addRange(range)
  document.execCommand('copy')
  selection?.removeAllRanges()
  holder.remove()
}
