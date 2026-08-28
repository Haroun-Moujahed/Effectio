import { useEffect, useId, useRef, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { TASK_TITLE_MAX_LENGTH } from '../constants'

type TaskEditModalProps = {
  open: boolean
  title: string
  description: string
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSave: () => void
  onClose: () => void
}

export function TaskEditModal({
  open,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onClose,
}: TaskEditModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const titleRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const titleRemaining = TASK_TITLE_MAX_LENGTH - title.length

  useEffect(() => {
    if (!open) return

    titleRef.current?.focus()
    titleRef.current?.select()

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) return
    onSave()
  }

  return createPortal(
    <div className="modal-root" role="presentation">
      <button
        type="button"
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Close task editor"
      />
      <form className="modal-card task-edit-modal" onSubmit={handleSubmit}>
        <h2 className="modal-title">Edit task</h2>

        <label className="task-edit-field" htmlFor={titleId}>
          <span className="task-edit-field-label">
            <span>Title</span>
            <span className="task-char-counter" aria-live="polite">
              {titleRemaining} left
            </span>
          </span>
          <input
            ref={titleRef}
            id={titleId}
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            maxLength={TASK_TITLE_MAX_LENGTH}
            required
          />
        </label>

        <label className="task-edit-field" htmlFor={descriptionId}>
          <span>Description</span>
          <textarea
            id={descriptionId}
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Add details (optional)"
          />
        </label>

        <div className="modal-actions">
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
        </div>
      </form>
    </div>,
    document.body,
  )
}
