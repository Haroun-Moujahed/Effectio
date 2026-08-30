import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react'
import { useId, type ReactNode } from 'react'

type TaskActionsMenuProps = {
  open: boolean
  taskTitle: string
  onOpen: () => void
  onClose: () => void
  onView?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onAssign?: () => void
  onUnassign?: () => void
  onDelete: () => void
}

export function TaskActionsMenu({
  open,
  taskTitle,
  onOpen,
  onClose,
  onView,
  onEdit,
  onDuplicate,
  onAssign,
  onUnassign,
  onDelete,
}: TaskActionsMenuProps) {
  const menuId = useId()

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange(nextOpen) {
      if (nextOpen) onOpen()
      else onClose()
    },
    placement: 'bottom-end',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({ fallbackAxisSideDirection: 'start', padding: 8 }),
      shift({ padding: 8 }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'menu' })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ])

  function runAction(action: () => void) {
    onClose()
    action()
  }

  return (
    <div className="task-menu">
      <button
        type="button"
        className="task-menu-trigger"
        ref={refs.setReference}
        {...getReferenceProps()}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Actions for "${taskTitle}"`}
      >
        <KebabIcon />
      </button>

      {open ? (
        <FloatingPortal>
          <div
            id={menuId}
            ref={refs.setFloating}
            className="task-menu-dropdown"
            style={floatingStyles}
            role="menu"
            aria-label={`Actions for "${taskTitle}"`}
            {...getFloatingProps()}
          >
            {onView ? (
              <MenuItem onClick={() => runAction(onView)}>
                <ViewIcon />
                <span>View</span>
              </MenuItem>
            ) : null}
            {onEdit ? (
              <MenuItem onClick={() => runAction(onEdit)}>
                <EditIcon />
                <span>Edit</span>
              </MenuItem>
            ) : null}
            {onAssign ? (
              <MenuItem onClick={() => runAction(onAssign)}>
                <AssignIcon />
                <span>Assign</span>
              </MenuItem>
            ) : null}
            {onUnassign ? (
              <MenuItem onClick={() => runAction(onUnassign)}>
                <UnassignIcon />
                <span>Unassign</span>
              </MenuItem>
            ) : null}
            {onDuplicate ? (
              <MenuItem onClick={() => runAction(onDuplicate)}>
                <DuplicateIcon />
                <span>Duplicate</span>
              </MenuItem>
            ) : null}
            <MenuItem className="is-danger" onClick={() => runAction(onDelete)}>
              <DeleteIcon />
              <span>Delete</span>
            </MenuItem>
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  )
}

function MenuItem({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={`task-menu-item ${className}`.trim()}
      role="menuitem"
      onClick={onClick}
    >
      {children}
    </button>
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

function AssignIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="task-menu-icon">
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5v3M16 3.5v3M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function UnassignIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="task-menu-icon">
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5v3M16 3.5v3M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 14.5h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
