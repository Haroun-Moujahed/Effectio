import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import type { Task } from '../types'
import { formatSelectedDate } from '../dates'
import { MaskedIcon } from './MaskedIcon'
import { Tooltip } from './Tooltip'
import { ConfirmModal } from './ConfirmModal'
import taskIcon from '../assets/task-icon.png'
import penIcon from '../assets/pen-icon.png'

type TaskListProps = {
  date: Date
  tasks: Task[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onClearAll: () => void
  onClose: () => void
}

export function TaskList({
  date,
  tasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onClearAll,
  onClose,
}: TaskListProps) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [clearOpen, setClearOpen] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditingId(null)
    setEditText('')
    setClearOpen(false)
  }, [date])

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [editingId])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    onAdd(text)
    setDraft('')
  }

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditText(task.text)
  }

  function commitEdit() {
    if (!editingId) return
    const text = editText.trim()
    if (text) onUpdate(editingId, text)
    setEditingId(null)
    setEditText('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditText('')
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit()
    }
  }

  const completed = tasks.filter((task) => task.completed).length

  return (
    <section className="tasks-card">
      <div className="tasks-heading">
        <div>
          <h2>{formatSelectedDate(date)}</h2>
          <p>
            {tasks.length === 0
              ? 'No tasks yet'
              : `${completed} of ${tasks.length} completed`}
          </p>
        </div>
        <div className="tasks-heading-actions">
          {tasks.length > 0 ? (
            <Tooltip label="Clear all tasks" placement="bottom">
              <button
                type="button"
                className="tasks-clear"
                onClick={() => setClearOpen(true)}
                aria-label="Clear all tasks for this day"
              >
                Clear all
              </button>
            </Tooltip>
          ) : null}
          <Tooltip label="Close task list" placement="left">
            <button
              type="button"
              className="tasks-close"
              onClick={onClose}
              aria-label="Close task list"
            >
              <CloseIcon />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="tasks-body">
        {tasks.length === 0 ? (
          <p className="empty-hint">Add something you want to get done today.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => {
              const isEditing = editingId === task.id

              return (
                <li key={task.id} className={task.completed ? 'is-done' : ''}>
                  <button
                    type="button"
                    className="task-check"
                    onClick={() => onToggle(task.id)}
                    aria-pressed={task.completed}
                    aria-label={
                      task.completed
                        ? `Mark "${task.text}" as incomplete`
                        : `Mark "${task.text}" as complete`
                    }
                  >
                    <TickIcon />
                  </button>

                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      className="task-edit-input"
                      value={editText}
                      onChange={(event) => setEditText(event.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleEditKeyDown}
                      aria-label="Update task"
                      maxLength={120}
                    />
                  ) : (
                    <span className="task-text">{task.text}</span>
                  )}

                  <div className="task-actions">
                    <Tooltip label="Edit task" placement="top">
                      <button
                        type="button"
                        className="task-action"
                        onClick={() => startEdit(task)}
                        aria-label={`Update "${task.text}"`}
                      >
                        <MaskedIcon src={taskIcon} />
                      </button>
                    </Tooltip>
                    <Tooltip label="Delete task" placement="top">
                      <button
                        type="button"
                        className="task-action task-delete"
                        onClick={() => onDelete(task.id)}
                        aria-label={`Delete "${task.text}"`}
                      >
                        ×
                      </button>
                    </Tooltip>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <form className="task-form" onSubmit={handleSubmit}>
        <MaskedIcon src={penIcon} className="task-form-icon" />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Enter new task"
          aria-label="Enter new task"
          maxLength={120}
        />
      </form>

      <ConfirmModal
        open={clearOpen}
        title="Clear all tasks?"
        description={`This will permanently remove all ${tasks.length} task${
          tasks.length === 1 ? '' : 's'
        } for ${formatSelectedDate(date)}.`}
        confirmLabel="Clear all"
        cancelLabel="Keep tasks"
        danger
        onCancel={() => setClearOpen(false)}
        onConfirm={() => {
          setClearOpen(false)
          onClearAll()
        }}
      />
    </section>
  )
}

function TickIcon() {
  return (
    <svg className="task-check-tick" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 10.5 8.2 13.7 15 6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7 17 17M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
