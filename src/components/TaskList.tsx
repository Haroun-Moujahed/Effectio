import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import type { DisplayTask } from '../types'
import { dateKey, formatSelectedDate } from '../dates'
import { TASK_TITLE_MAX_LENGTH } from '../constants'
import { setScheduleDragImage, writeTaskDragData } from '../schedule'
import { MaskedIcon } from './MaskedIcon'
import { Tooltip } from './Tooltip'
import { TaskEditModal } from './TaskEditModal'
import { TaskActionsMenu } from './TaskActionsMenu'
import { DuplicateTaskDialog } from './DuplicateTaskDialog'
import penIcon from '../assets/pen-icon.png'

type TaskListProps = {
  date: Date
  tasks: DisplayTask[]
  open: boolean
  mode?: 'panel' | 'schedule'
  onAdd: (title: string) => void
  onToggle: (id: string, source: DisplayTask['source']) => void
  onUpdate: (
    id: string,
    source: DisplayTask['source'],
    title: string,
    description: string,
  ) => void
  onDelete: (id: string, source: DisplayTask['source']) => void
  onDuplicate: (
    id: string,
    source: DisplayTask['source'],
    targetDates: string[],
  ) => void
  onClearAll: () => void
  onClose: () => void
}

const REVEAL_MS = 320

export function TaskList({
  date,
  tasks,
  open,
  mode = 'panel',
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  onClearAll,
  onClose,
}: TaskListProps) {
  const navigate = useNavigate()
  const isSchedule = mode === 'schedule'
  const [draft, setDraft] = useState('')
  const [clearOpen, setClearOpen] = useState(false)
  const [contentReady, setContentReady] = useState(isSchedule)
  const [editTask, setEditTask] = useState<DisplayTask | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null)
  const [duplicateTask, setDuplicateTask] = useState<DisplayTask | null>(null)
  const clearTitleId = useId()
  const clearDescId = useId()
  const clearConfirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setClearOpen(false)
    setEditTask(null)
    setOpenMenuKey(null)
    setDuplicateTask(null)
  }, [date])

  useEffect(() => {
    if (isSchedule) {
      setContentReady(true)
      return
    }

    if (!open) {
      setContentReady(false)
      setClearOpen(false)
      setEditTask(null)
      setOpenMenuKey(null)
      setDuplicateTask(null)
      return
    }

    setContentReady(false)
    const timer = window.setTimeout(() => setContentReady(true), REVEAL_MS)
    return () => window.clearTimeout(timer)
  }, [open, date, isSchedule])

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
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [clearOpen])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    onAdd(title)
    setDraft('')
  }

  function openEditModal(task: DisplayTask) {
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
    onUpdate(editTask.id, editTask.source, title, editDescription.trim())
    closeEditModal()
  }

  function handleTaskDragStart(event: DragEvent<HTMLLIElement>, task: DisplayTask) {
    const target = event.target as HTMLElement
    if (target.closest('button')) {
      event.preventDefault()
      return
    }

    writeTaskDragData(event.dataTransfer, {
      taskId: task.id,
      taskSource: task.source,
      title: task.title,
    })
    setScheduleDragImage(event.dataTransfer, task.title)
  }

  function openScheduleForDay() {
    navigate(`/schedule?date=${dateKey(date)}`)
  }

  function confirmDuplicate(selectedDates: Date[]) {
    if (!duplicateTask || selectedDates.length === 0) return
    onDuplicate(
      duplicateTask.id,
      duplicateTask.source,
      selectedDates.map((item) => dateKey(item)),
    )
    setDuplicateTask(null)
  }

  function taskMenuKey(task: DisplayTask) {
    return `${task.source}-${task.id}`
  }

  const completed = tasks.filter((task) => task.completed).length
  const showSkeleton = open && !contentReady

  return (
    <section className="tasks-card">
      {showSkeleton ? (
        <div className="tasks-skeleton" aria-hidden="true">
          <div className="tasks-skeleton-heading">
            <div className="tasks-skeleton-line is-title" />
            <div className="tasks-skeleton-line is-sub" />
          </div>
          <div className="tasks-skeleton-body">
            <div className="tasks-skeleton-line" />
            <div className="tasks-skeleton-line" />
            <div className="tasks-skeleton-line is-short" />
          </div>
          <div className="tasks-skeleton-form" />
        </div>
      ) : (
        <>
          <div className="tasks-heading">
            <div>
              {isSchedule ? (
                <h2>{formatSelectedDate(date)}</h2>
              ) : (
                <Tooltip label="Open schedule" placement="bottom">
                  <button
                    type="button"
                    className="calendar-title-btn tasks-date-link"
                    onClick={openScheduleForDay}
                  >
                    {formatSelectedDate(date)}
                  </button>
                </Tooltip>
              )}
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
              {!isSchedule ? (
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
              ) : null}
            </div>
          </div>

          <div className="tasks-body">
            {tasks.length === 0 ? (
              <p className="empty-hint">Add something you want to get done today.</p>
            ) : (
              <ul className="task-list">
                {tasks.map((task) => (
                  <li
                    key={`${task.source}-${task.id}`}
                    className={`${task.completed ? 'is-done' : ''} ${isSchedule ? 'schedule-task-draggable' : ''}`}
                    draggable={isSchedule}
                    onDragStart={
                      isSchedule
                        ? (event) => handleTaskDragStart(event, task)
                        : undefined
                    }
                  >
                    <button
                      type="button"
                      className="task-check"
                      onClick={() => onToggle(task.id, task.source)}
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

                    <TaskActionsMenu
                      open={openMenuKey === taskMenuKey(task)}
                      taskTitle={task.title}
                      onOpen={() => setOpenMenuKey(taskMenuKey(task))}
                      onClose={() => setOpenMenuKey(null)}
                      onEdit={() => openEditModal(task)}
                      onDuplicate={() => setDuplicateTask(task)}
                      onDelete={() => onDelete(task.id, task.source)}
                    />
                  </li>
                ))}
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
              maxLength={TASK_TITLE_MAX_LENGTH}
            />
            <span className="task-char-counter" aria-live="polite">
              {TASK_TITLE_MAX_LENGTH - draft.length} left
            </span>
          </form>
        </>
      )}

      {clearOpen ? (
        <div
          className="tasks-confirm"
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
            {tasks.length === 1 ? '' : 's'} for {formatSelectedDate(date)}.
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

      <DuplicateTaskDialog
        open={duplicateTask !== null}
        taskTitle={duplicateTask?.title ?? ''}
        initialDate={date}
        onConfirm={confirmDuplicate}
        onClose={() => setDuplicateTask(null)}
      />

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
