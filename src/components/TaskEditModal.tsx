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

  function htmlToPlainText(html: string) {
    const node = document.createElement('div')
    node.innerHTML = html
    return (node.innerText || node.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
  }

  async function copyDescription() {
    const text = htmlToPlainText(description)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
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
                {copied ? 'Copied' : 'Copy'}
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
