import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DayTimeline } from '../components/DayTimeline'
import { TaskList } from '../components/TaskList'
import { addDays, dateKey, parseDateKey } from '../dates'
import { clampDuration } from '../schedule'
import { getTasksForDate } from '../tasks'
import type {
  ScheduleByDate,
  ScheduleEntry,
  Task,
  TasksByDate,
  TaskSource,
} from '../types'

type SchedulePageProps = {
  today: Date
  tasksByDate: TasksByDate
  backlog: Task[]
  scheduleByDate: ScheduleByDate
  onAddTask: (key: string, title: string) => void
  onToggleTask: (key: string, id: string, source: TaskSource) => void
  onUpdateTask: (
    key: string,
    id: string,
    source: TaskSource,
    title: string,
    description: string,
  ) => void
  onDeleteTask: (key: string, id: string, source: TaskSource) => void
  onClearAllTasks: (key: string) => void
  onAddScheduleEntry: (key: string, entry: ScheduleEntry) => void
  onUpdateScheduleEntry: (
    key: string,
    entryId: string,
    patch: Partial<Pick<ScheduleEntry, 'startMinutes' | 'durationMinutes'>>,
  ) => void
  onRemoveScheduleEntry: (key: string, entryId: string) => void
}

export function SchedulePage({
  today,
  tasksByDate,
  backlog,
  scheduleByDate,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onClearAllTasks,
  onAddScheduleEntry,
  onUpdateScheduleEntry,
  onRemoveScheduleEntry,
}: SchedulePageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [date, setDate] = useState(() => {
    const param = new URLSearchParams(window.location.search).get('date')
    const parsed = param ? parseDateKey(param) : null
    return parsed ?? today
  })

  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (!dateParam) return
    const parsed = parseDateKey(dateParam)
    if (!parsed) return
    setDate(parsed)
    navigate('/schedule', { replace: true })
  }, [searchParams, navigate])

  const key = dateKey(date)
  const tasks = useMemo(
    () => getTasksForDate(key, tasksByDate, backlog),
    [key, tasksByDate, backlog],
  )
  const entries = scheduleByDate[key] ?? []

  function handleUpdateEntry(
    entryId: string,
    patch: Partial<Pick<ScheduleEntry, 'startMinutes' | 'durationMinutes'>>,
  ) {
    const entry = entries.find((item) => item.id === entryId)
    if (!entry) return

    const nextPatch = { ...patch }
    if (nextPatch.startMinutes !== undefined && nextPatch.durationMinutes === undefined) {
      nextPatch.durationMinutes = clampDuration(
        nextPatch.startMinutes,
        entry.durationMinutes,
      )
    } else if (nextPatch.durationMinutes !== undefined) {
      const start = nextPatch.startMinutes ?? entry.startMinutes
      nextPatch.durationMinutes = clampDuration(start, nextPatch.durationMinutes)
    }

    onUpdateScheduleEntry(key, entryId, nextPatch)
  }

  return (
    <div className="workspace tasks-open">
      <DayTimeline
        date={date}
        entries={entries}
        tasks={tasks}
        onPrevDay={() => setDate((current) => addDays(current, -1))}
        onNextDay={() => setDate((current) => addDays(current, 1))}
        onAddEntry={(entry) => onAddScheduleEntry(key, entry)}
        onUpdateEntry={handleUpdateEntry}
        onRemoveEntry={(entryId) => onRemoveScheduleEntry(key, entryId)}
      />
      <aside className="tasks-panel is-open">
        <TaskList
          date={date}
          tasks={tasks}
          open
          mode="schedule"
          onAdd={(title) => onAddTask(key, title)}
          onToggle={(id, source) => onToggleTask(key, id, source)}
          onUpdate={(id, source, title, description) =>
            onUpdateTask(key, id, source, title, description)
          }
          onDelete={(id, source) => onDeleteTask(key, id, source)}
          onClearAll={() => onClearAllTasks(key)}
          onClose={() => {}}
        />
      </aside>
    </div>
  )
}
