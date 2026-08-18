import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { CalendarGrid } from './components/CalendarGrid'
import { TaskList } from './components/TaskList'
import { addMonths, dateKey, isSameMonth } from './dates'
import { loadTasks, saveTasks } from './storage'
import { applyTheme, loadTheme, saveTheme, type Theme } from './theme'
import type { DayProgress, Task, TasksByDate } from './types'
import './App.css'

applyTheme(loadTheme())

export default function App() {
  const today = useMemo(() => new Date(), [])
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [tasksOpen, setTasksOpen] = useState(false)
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>(loadTasks)

  useEffect(() => {
    saveTasks(tasksByDate)
  }, [tasksByDate])

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  const selectedKey = dateKey(selected)
  const selectedTasks = tasksByDate[selectedKey] ?? []

  function getProgress(date: Date): DayProgress {
    const tasks = tasksByDate[dateKey(date)] ?? []
    const completed = tasks.filter((task) => task.completed).length
    const total = tasks.length
    return {
      total,
      completed,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    }
  }

  function updateSelected(mutator: (tasks: Task[]) => Task[]) {
    setTasksByDate((current) => {
      const next = mutator(current[selectedKey] ?? [])
      const copy = { ...current }
      if (next.length === 0) {
        delete copy[selectedKey]
      } else {
        copy[selectedKey] = next
      }
      return copy
    })
  }

  function addTask(text: string) {
    updateSelected((tasks) => [
      ...tasks,
      { id: crypto.randomUUID(), text, completed: false },
    ])
  }

  function toggleTask(id: string) {
    updateSelected((tasks) =>
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function updateTask(id: string, text: string) {
    updateSelected((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, text } : task)),
    )
  }

  function deleteTask(id: string) {
    updateSelected((tasks) => tasks.filter((task) => task.id !== id))
  }

  function handleSelectDay(date: Date) {
    setSelected(date)
    setTasksOpen(true)
    if (!isSameMonth(date, viewDate)) {
      setViewDate(date)
    }
  }

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      />
      <main className="app-main">
        <div className={`workspace ${tasksOpen ? 'tasks-open' : ''}`}>
          <CalendarGrid
            viewDate={viewDate}
            selected={selected}
            today={today}
            tasksOpen={tasksOpen}
            onSelect={handleSelectDay}
            onPrevMonth={() => setViewDate((current) => addMonths(current, -1))}
            onNextMonth={() => setViewDate((current) => addMonths(current, 1))}
            getProgress={getProgress}
          />
          <aside className={`tasks-panel ${tasksOpen ? 'is-open' : ''}`}>
            <TaskList
              date={selected}
              tasks={selectedTasks}
              onAdd={addTask}
              onToggle={toggleTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onClose={() => setTasksOpen(false)}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}
