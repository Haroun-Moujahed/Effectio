import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarGrid, type CalendarMode } from '../components/CalendarGrid'
import { TaskList } from '../components/TaskList'
import { parseDateKey } from '../dates'
import type { DayProgress, DisplayTask, TaskSource } from '../types'

type CalendarPageProps = {
  calendarMode: CalendarMode
  viewDate: Date
  selected: Date
  today: Date
  tasksOpen: boolean
  tasks: DisplayTask[]
  onSelectDay: (date: Date) => void
  onPrev: () => void
  onNext: () => void
  onOpenYearView: () => void
  onSelectMonth: (monthIndex: number) => void
  onSelectYear: (year: number) => void
  getProgress: (date: Date) => DayProgress
  onAdd: (title: string) => void
  onToggle: (id: string, source: TaskSource) => void
  onUpdate: (
    id: string,
    source: TaskSource,
    title: string,
    description: string,
  ) => void
  onDelete: (id: string, source: TaskSource) => void
  onDuplicate: (
    id: string,
    source: TaskSource,
    targetDates: string[],
  ) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onClearAll: () => void
  onCloseTasks: () => void
  onNavigateToDate: (date: Date) => void
}

export function CalendarPage({
  calendarMode,
  viewDate,
  selected,
  today,
  tasksOpen,
  tasks,
  onSelectDay,
  onPrev,
  onNext,
  onOpenYearView,
  onSelectMonth,
  onSelectYear,
  getProgress,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  onClearAll,
  onCloseTasks,
  onNavigateToDate,
}: CalendarPageProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (!dateParam) return
    const parsed = parseDateKey(dateParam)
    if (!parsed) return
    onNavigateToDate(parsed)
    navigate('/calendar', { replace: true })
  }, [searchParams, navigate, onNavigateToDate])

  return (
    <div className={`workspace ${tasksOpen ? 'tasks-open' : ''}`}>
      <CalendarGrid
        mode={calendarMode}
        viewDate={viewDate}
        selected={selected}
        today={today}
        tasksOpen={tasksOpen}
        onSelect={onSelectDay}
        onPrev={onPrev}
        onNext={onNext}
        onOpenYearView={onOpenYearView}
        onSelectMonth={onSelectMonth}
        onSelectYear={onSelectYear}
        getProgress={getProgress}
      />
      <aside className={`tasks-panel ${tasksOpen ? 'is-open' : ''}`}>
        <TaskList
          date={selected}
          tasks={tasks}
          open={tasksOpen}
          onAdd={onAdd}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onReorder={onReorder}
          onClearAll={onClearAll}
          onClose={onCloseTasks}
        />
      </aside>
    </div>
  )
}
