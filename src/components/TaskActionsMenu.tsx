import { useEffect, useId, useRef } from 'react'

type TaskActionsMenuProps = {
  open: boolean
  taskTitle: string
  onOpen: () => void
  onClose: () => void
  onEdit: () => void
  onView: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function TaskActionsMenu({
  open,
  taskTitle,
  onOpen,
  onClose,
  onEdit,
  onView,
  onDuplicate,
  onDelete,
}: TaskActionsMenuProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  function runAction(action: () => void) {
    onClose()
    action()
  }

  return (
    <div className="task-menu" ref={rootRef}>
      <button
        type="button"
        className="task-menu-trigger"
        onClick={() => (open ? onClose() : onOpen())}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Actions for "${taskTitle}"`}
      >
        <KebabIcon />
      </button>

      {open ? (
        <div
          id={menuId}
          className="task-menu-dropdown"
          role="menu"
          aria-label={`Actions for "${taskTitle}"`}
        >
          <button
            type="button"
            className="task-menu-item"
            role="menuitem"
            onClick={() => runAction(onView)}
          >
            <ViewIcon />
            <span>View</span>
          </button>
          <button
            type="button"
            className="task-menu-item"
            role="menuitem"
            onClick={() => runAction(onEdit)}
          >
            <EditIcon />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="task-menu-item"
            role="menuitem"
            onClick={() => runAction(onDuplicate)}
          >
            <DuplicateIcon />
            <span>Duplicate</span>
          </button>
          <button
            type="button"
            className="task-menu-item is-danger"
            role="menuitem"
            onClick={() => runAction(onDelete)}
          >
            <DeleteIcon />
            <span>Delete</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

function KebabIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="1.75" fill="currentColor" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      <circle cx="12" cy="19" r="1.75" fill="currentColor" />
    </svg>
  )
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="task-menu-icon">
      <path
        d="M2.5 12C4.5 7.5 8 5 12 5s7.5 2.5 9.5 7c-2 4.5-5.5 7-9.5 7s-7.5-2.5-9.5-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="task-menu-icon">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0 0-3L16.5 4.5a2.1 2.1 0 0 0-3 0L3 15v5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m13.5 6.5 4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DuplicateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="task-menu-icon">
      <rect
        x="8"
        y="8"
        width="12"
        height="12"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 16V6a2 2 0 0 1 2-2h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="task-menu-icon">
      <path
        d="M4 7h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 7l.8 11.2A1.5 1.5 0 0 0 8.8 19.5h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
