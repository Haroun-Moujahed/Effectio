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
import { TASK_TITLE_MAX_LENGTH } from '../constants'
import { MaskedIcon } from './MaskedIcon'
import { Tooltip } from './Tooltip'
import { TaskEditModal } from './TaskEditModal'
import { TaskActionsMenu } from './TaskActionsMenu'
import { TaskDescriptionBadge } from './TaskDescriptionBadge'
import { TaskDragHandle } from './TaskDragHandle'
import { hasTaskDescription } from '../tasks'
import { useListReorder } from '../hooks/useListReorder'
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
  onUnassign: (id: string) => void
  onReorder: (
    fromIndex: number,
    toIndex: number,
    section: 'active' | 'done',
  ) => void
  onClearAll: () => void
  onClearChecked: () => void
}

export function BacklogPage({
  tasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onAssign,
  onUnassign,
  onReorder,
  onClearAll,
  onClearChecked,
}: BacklogPageProps) {
  const [draft, setDraft] = useState('')
  const [doneOpen, setDoneOpen] = useState(true)
  const [activeVisible, setActiveVisible] = useState(PAGE_SIZE)
  const [doneVisible, setDoneVisible] = useState(PAGE_SIZE)
  const [clearKind, setClearKind] = useState<'all' | 'checked' | null>(null)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [editMode, setEditMode] = useState<'edit' | 'view'>('edit')
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
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
    if (!clearKind) return
    clearConfirmRef.current?.focus()

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setClearKind(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [clearKind])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    onAdd(title)
    setDraft('')
  }

  function openTaskModal(task: Task, mode: 'edit' | 'view') {
    setEditTask(task)
    setEditMode(mode)
    setEditTitle(task.title)
    setEditDescription(task.description)
  }

  function closeEditModal() {
    setEditTask(null)
    setEditMode('edit')
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
  const activeReorder = useListReorder({
    onReorder: (from, to) => onReorder(from, to, 'active'),
  })
  const doneReorder = useListReorder({
    onReorder: (from, to) => onReorder(from, to, 'done'),
  })

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
          <div className="backlog-header-actions">
            {doneTasks.length > 0 ? (
              <Tooltip label="Clear checked tasks" placement="bottom">
                <button
                  type="button"
                  className="tasks-clear backlog-clear"
                  onClick={() => setClearKind('checked')}
                  aria-label="Clear checked backlog tasks"
                >
                  Clear checked
                </button>
              </Tooltip>
            ) : null}
            <Tooltip label="Clear all tasks" placement="bottom">
              <button
                type="button"
                className="tasks-clear backlog-clear"
                onClick={() => setClearKind('all')}
                aria-label="Clear all backlog tasks"
              >
                Clear all
              </button>
            </Tooltip>
          </div>
        ) : null}
      </div>

      <div className="backlog-scroll" ref={scrollRef}>
        {activeTasks.length === 0 ? (
          <p className="empty-hint">
            Capture tasks here, then assign them to a day.
          </p>
        ) : (
          <ul className="backlog-list">
            {visibleActive.map((task, index) => (
              <BacklogRow
                key={task.id}
                task={task}
                index={index}
                reorder={activeReorder}
                menuOpen={openMenuId === task.id}
                onToggle={() => onToggle(task.id)}
                onOpenMenu={() => setOpenMenuId(task.id)}
                onCloseMenu={() => setOpenMenuId(null)}
                onView={() => openTaskModal(task, 'view')}
                onEdit={() => openTaskModal(task, 'edit')}
                onDelete={() => onDelete(task.id)}
                onAssign={() => onAssign(task.id)}
                onUnassign={
                  task.assignedDate ? () => onUnassign(task.id) : undefined
                }
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
            maxLength={TASK_TITLE_MAX_LENGTH}
          />
          <span className="task-char-counter" aria-live="polite">
            {TASK_TITLE_MAX_LENGTH - draft.length} left
          </span>
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
                  {visibleDone.map((task, index) => (
                    <BacklogRow
                      key={task.id}
                      task={task}
                      index={index}
                      reorder={doneReorder}
                      menuOpen={openMenuId === task.id}
                      onToggle={() => onToggle(task.id)}
                      onOpenMenu={() => setOpenMenuId(task.id)}
                      onCloseMenu={() => setOpenMenuId(null)}
                      onView={() => openTaskModal(task, 'view')}
                      onEdit={() => openTaskModal(task, 'edit')}
                      onDelete={() => onDelete(task.id)}
                      onAssign={() => onAssign(task.id)}
                      onUnassign={
                        task.assignedDate ? () => onUnassign(task.id) : undefined
                      }
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

      {clearKind ? (
        <div
          className="backlog-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={clearTitleId}
          aria-describedby={clearDescId}
        >
          <h2 id={clearTitleId} className="tasks-confirm-title">
            {clearKind === 'checked' ? 'Clear checked tasks?' : 'Clear all tasks?'}
          </h2>
          <p id={clearDescId} className="tasks-confirm-description">
            {clearKind === 'checked'
              ? `This will remove ${doneTasks.length} checked task${
                  doneTasks.length === 1 ? '' : 's'
                } from your backlog. Tasks assigned to days before today stay on the calendar so past progress is unchanged.`
              : `This will permanently remove all ${tasks.length} task${
                  tasks.length === 1 ? '' : 's'
                } from your backlog. Tasks assigned to days before today stay on the calendar so past progress is unchanged.`}
          </p>
          <div className="tasks-confirm-actions">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={() => setClearKind(null)}
            >
              Keep tasks
            </button>
            <button
              ref={clearConfirmRef}
              type="button"
              className="modal-btn modal-btn-primary is-danger"
              onClick={() => {
                const kind = clearKind
                setClearKind(null)
                if (kind === 'checked') onClearChecked()
                else onClearAll()
              }}
            >
              {clearKind === 'checked' ? 'Clear checked' : 'Clear all'}
            </button>
          </div>
        </div>
      ) : null}

      <TaskEditModal
        open={editTask !== null}
        mode={editMode}
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
  index: number
  reorder: ReturnType<typeof useListReorder>
  menuOpen: boolean
  onToggle: () => void
  onOpenMenu: () => void
  onCloseMenu: () => void
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onAssign: () => void
  onUnassign?: () => void
}

function BacklogRow({
  task,
  index,
  reorder,
  menuOpen,
  onToggle,
  onOpenMenu,
  onCloseMenu,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
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
    <li
      className={`backlog-item ${task.completed ? 'is-done' : ''} ${reorder.itemClassName(index)}`.trim()}
      onDragOver={(event) => reorder.handleDragOver(event, index)}
      onDrop={(event) => reorder.handleDrop(event, index)}
    >
      <TaskDragHandle
        label={`Reorder "${task.title}"`}
        onDragStart={(event) => reorder.handleDragStart(event, index)}
        onDragEnd={reorder.handleDragEnd}
      />
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

      <span className="task-text">{task.title}</span>

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
        {hasTaskDescription(task.description) ? <TaskDescriptionBadge /> : null}
        <TaskActionsMenu
          open={menuOpen}
          taskTitle={task.title}
          onOpen={onOpenMenu}
          onClose={onCloseMenu}
          onView={onView}
          onEdit={onEdit}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onDelete={onDelete}
        />
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
