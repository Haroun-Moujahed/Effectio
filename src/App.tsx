import { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { CalendarGrid } from './components/CalendarGrid'
import { TaskList } from './components/TaskList'
import { AuthScreen } from './components/AuthScreen'
import { useAuthSession } from './useAuthSession'
import { addMonths, dateKey, isSameMonth } from './dates'
import {
  hydrateTasks,
  loadLocalTasks,
  saveCloudTasks,
  saveLocalTasks,
} from './storage'
import { applyTheme, loadTheme, saveTheme, type Theme } from './theme'
import { isSupabaseConfigured } from './lib/supabase'
import type { DayProgress, Task, TasksByDate } from './types'
import './App.css'

applyTheme(loadTheme())

const SAVE_DEBOUNCE_MS = 400

export default function App() {
  const { session, user, ready, signOut } = useAuthSession()
  const today = useMemo(() => new Date(), [])
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [tasksOpen, setTasksOpen] = useState(false)
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({})
  const [tasksReady, setTasksReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const skipNextSave = useRef(true)
  const activeUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!ready) return

    if (!isSupabaseConfigured) {
      setTasksByDate(loadLocalTasks())
      setTasksReady(true)
      skipNextSave.current = true
      return
    }

    if (!user) {
      activeUserId.current = null
      setTasksByDate({})
      setTasksReady(false)
      setTasksOpen(false)
      return
    }

    // Switching accounts: wipe in-memory calendar immediately so nothing leaks
    if (activeUserId.current !== user.id) {
      activeUserId.current = user.id
      setTasksByDate({})
      setTasksReady(false)
      setTasksOpen(false)
    }

    let cancelled = false
    setSyncError(null)

    hydrateTasks(user.id)
      .then((tasks) => {
        if (cancelled || activeUserId.current !== user.id) return
        skipNextSave.current = true
        setTasksByDate(tasks)
        setTasksReady(true)
      })
      .catch((err) => {
        if (cancelled || activeUserId.current !== user.id) return
        setSyncError(err instanceof Error ? err.message : 'Failed to load tasks.')
        skipNextSave.current = true
        setTasksByDate(loadLocalTasks(user.id))
        setTasksReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [ready, user])

  useEffect(() => {
    if (!tasksReady) return

    if (isSupabaseConfigured && user) {
      saveLocalTasks(tasksByDate, user.id)
    } else if (!isSupabaseConfigured) {
      saveLocalTasks(tasksByDate)
    }

    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (!user || !isSupabaseConfigured) return

    const userId = user.id
    const timer = window.setTimeout(() => {
      if (activeUserId.current !== userId) return
      saveCloudTasks(userId, tasksByDate).catch((err) => {
        setSyncError(err instanceof Error ? err.message : 'Failed to save tasks.')
      })
    }, SAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [tasksByDate, tasksReady, user])

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  if (!ready) {
    return (
      <div className="app">
        <div className="boot-screen">Loading…</div>
      </div>
    )
  }

  if (isSupabaseConfigured && !session) {
    return (
      <div className="app">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        />
        <AuthScreen />
      </div>
    )
  }

  if (isSupabaseConfigured && !tasksReady) {
    return (
      <div className="app">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          userEmail={user?.email}
          onSignOut={signOut}
        />
        <div className="boot-screen">Loading your tasks…</div>
      </div>
    )
  }

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
        userEmail={user?.email}
        onSignOut={isSupabaseConfigured ? signOut : undefined}
      />
      {syncError ? (
        <div className="sync-banner" role="status">
          Sync issue: {syncError}
          <button type="button" onClick={() => setSyncError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}
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
