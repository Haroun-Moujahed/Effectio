import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { Task } from '../types'
import { formatAssignedDate, parseDateKey } from '../dates'
import { MaskedIcon } from './MaskedIcon'
import { Tooltip } from './Tooltip'
import { TaskEditModal } from './TaskEditModal'
import penIcon from '../assets/pen-icon.png'
import chevronIcon from '../assets/chevron.png'

const PAGE_SIZE = 10

type BacklogPageProps = {
  tasks: Task[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onUpdate: (id: string, title: string, description: string) => void
  onDelete: (id: string) => void
  onAssign: (id: string) => void
  onClearAll: () => void
}

export function BacklogPage({
  tasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onAssign,
  onClearAll,
}: BacklogPageProps) {
  const [draft, setDraft] = useState('')
  const [doneOpen, setDoneOpen] = useState(true)
  const [activeVisible, setActiveVisible] = useState(PAGE_SIZE)
  const [doneVisible, setDoneVisible] = useState(PAGE_SIZE)
  const [clearOpen, setClearOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const activeSentinelRef = useRef<HTMLDivElement>(null)
  const doneSentinelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const clearConfirmRef = useRef<HTMLButtonElement>(null)
  const clearTitleId = useId()
  const clearDescId = useId()

  const activeTasks = tasks.filter((task) => !task.completed)
  const doneTasks = tasks.filter((task) => task.completed)

  useEffect(() => {
    setActiveVisible((current) => {
      if (activeTasks.length <= PAGE_SIZE) return PAGE_SIZE
      return Math.min(current, activeTasks.length)
    })
  }, [activeTasks.length])

  useEffect(() => {
    setDoneVisible((current) => {
      if (doneTasks.length <= PAGE_SIZE) return PAGE_SIZE
      return Math.min(current, doneTasks.length)
    })
  }, [doneTasks.length])

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = activeSentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setActiveVisible((current) =>
          Math.min(current + PAGE_SIZE, activeTasks.length),
        )
      },
      { root, rootMargin: '80px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [activeTasks.length, activeVisible])

  useEffect(() => {
    if (!doneOpen) return
    const root = scrollRef.current
    const sentinel = doneSentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setDoneVisible((current) =>
          Math.min(current + PAGE_SIZE, doneTasks.length),
        )
      },
      { root, rootMargin: '80px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [doneOpen, doneTasks.length, doneVisible])

  useEffect(() => {
    if (!clearOpen) return
    clearConfirmRef.current?.focus()

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setClearOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [clearOpen])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    onAdd(title)
    setDraft('')
  }

  function openEditModal(task: Task) {
    setEditTask(task)
    setEditTitle(task.title)
    setEditDescription(task.description)
  }

  function closeEditModal() {
    setEditTask(null)
    setEditTitle('')
    setEditDescription('')
  }

  function saveEditModal() {
    if (!editTask) return
    const title = editTitle.trim()
    if (!title) return
    onUpdate(editTask.id, title, editDescription.trim())
    closeEditModal()
  }

  const visibleActive = activeTasks.slice(0, activeVisible)
  const visibleDone = doneTasks.slice(0, doneVisible)
  const hasMoreActive = activeVisible < activeTasks.length
  const hasMoreDone = doneVisible < doneTasks.length

  return (
    <section className="backlog-page">
      <div className="backlog-header">
        <div>
          <h2>Backlog</h2>
          <p>
            {activeTasks.length === 0
              ? 'No open tasks'
              : `${activeTasks.length} open · ${doneTasks.length} done`}
          </p>
        </div>
        {tasks.length > 0 ? (
          <Tooltip label="Clear all tasks" placement="bottom">
            <button
              type="button"
              className="tasks-clear backlog-clear"
              onClick={() => setClearOpen(true)}
              aria-label="Clear all backlog tasks"
            >
              Clear all
            </button>
          </Tooltip>
        ) : null}
      </div>

      <div className="backlog-scroll" ref={scrollRef}>
        {activeTasks.length === 0 ? (
          <p className="empty-hint">
            Capture tasks here, then assign them to a day.
          </p>
        ) : (
          <ul className="backlog-list">
            {visibleActive.map((task) => (
              <BacklogRow
                key={task.id}
                task={task}
                onToggle={() => onToggle(task.id)}
                onOpenEdit={() => openEditModal(task)}
                onDelete={() => onDelete(task.id)}
                onAssign={() => onAssign(task.id)}
              />
            ))}
          </ul>
        )}

        {hasMoreActive ? (
          <div
            ref={activeSentinelRef}
            className="backlog-sentinel"
            aria-hidden="true"
          />
        ) : null}

        <form className="backlog-form" onSubmit={handleSubmit}>
          <MaskedIcon src={penIcon} className="backlog-form-icon" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Enter new task"
            aria-label="Add backlog item"
            maxLength={120}
          />
        </form>

        {doneTasks.length > 0 ? (
          <div className="backlog-done">
            <button
              type="button"
              className="backlog-done-toggle"
              onClick={() => setDoneOpen((open) => !open)}
              aria-expanded={doneOpen}
            >
              <MaskedIcon
                src={chevronIcon}
                className={`backlog-done-chevron ${doneOpen ? 'is-open' : ''}`}
              />
              {doneTasks.length} Completed item
              {doneTasks.length === 1 ? '' : 's'}
            </button>

            <div
              className={`backlog-done-panel ${doneOpen ? 'is-open' : ''}`}
              aria-hidden={!doneOpen}
            >
              <div className="backlog-done-panel-inner">
                <ul className="backlog-list">
                  {visibleDone.map((task) => (
                    <BacklogRow
                      key={task.id}
                      task={task}
                      onToggle={() => onToggle(task.id)}
                      onOpenEdit={() => openEditModal(task)}
                      onDelete={() => onDelete(task.id)}
                      onAssign={() => onAssign(task.id)}
                    />
                  ))}
                </ul>
                {hasMoreDone ? (
                  <div
                    ref={doneSentinelRef}
                    className="backlog-sentinel"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {clearOpen ? (
        <div
          className="backlog-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={clearTitleId}
          aria-describedby={clearDescId}
        >
          <h2 id={clearTitleId} className="tasks-confirm-title">
            Clear all tasks?
          </h2>
          <p id={clearDescId} className="tasks-confirm-description">
            This will permanently remove all {tasks.length} task
            {tasks.length === 1 ? '' : 's'} from your backlog.
          </p>
          <div className="tasks-confirm-actions">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={() => setClearOpen(false)}
            >
              Keep tasks
            </button>
            <button
              ref={clearConfirmRef}
              type="button"
              className="modal-btn modal-btn-primary is-danger"
              onClick={() => {
                setClearOpen(false)
                onClearAll()
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      ) : null}

      <TaskEditModal
        open={editTask !== null}
        title={editTitle}
        description={editDescription}
        onTitleChange={setEditTitle}
        onDescriptionChange={setEditDescription}
        onSave={saveEditModal}
        onClose={closeEditModal}
      />
    </section>
  )
}

type BacklogRowProps = {
  task: Task
  onToggle: () => void
  onOpenEdit: () => void
  onDelete: () => void
  onAssign: () => void
}

function BacklogRow({
  task,
  onToggle,
  onOpenEdit,
  onDelete,
  onAssign,
}: BacklogRowProps) {
  const navigate = useNavigate()
  const assignedDate = task.assignedDate
    ? parseDateKey(task.assignedDate)
    : null

  function handleDateClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (!task.assignedDate) return
    navigate(`/calendar?date=${task.assignedDate}`)
  }

  return (
    <li className={`backlog-item ${task.completed ? 'is-done' : ''}`}>
      <button
        type="button"
        className="task-check"
        onClick={onToggle}
        aria-pressed={task.completed}
        aria-label={
          task.completed
            ? `Mark "${task.title}" as incomplete`
            : `Mark "${task.title}" as complete`
        }
      >
        <TickIcon />
      </button>

      <button type="button" className="task-text-btn" onClick={onOpenEdit}>
        <span className="task-text">{task.title}</span>
      </button>

      {assignedDate ? (
        <button
          type="button"
          className="backlog-assigned-date"
          onClick={handleDateClick}
        >
          {formatAssignedDate(assignedDate)}
        </button>
      ) : null}

      <div className="task-actions">
        <Tooltip label="Assign to day" placement="top">
          <button
            type="button"
            className="task-action"
            onClick={onAssign}
            aria-label={`Assign "${task.title}" to a day`}
          >
            <CalendarActionIcon />
          </button>
        </Tooltip>
        <Tooltip label="Delete task" placement="top">
          <button
            type="button"
            className="task-action task-delete"
            onClick={onDelete}
            aria-label={`Delete "${task.title}"`}
          >
            ×
          </button>
        </Tooltip>
      </div>
    </li>
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

function CalendarActionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="backlog-calendar-icon"
    >
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
