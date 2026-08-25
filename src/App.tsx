import { useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { CalendarGrid, type CalendarMode } from './components/CalendarGrid'
import { TaskList } from './components/TaskList'
import { AuthScreen } from './components/AuthScreen'
import { Sidebar } from './components/Sidebar'
import { BacklogPage } from './components/BacklogPage'
import { AssignDateDialog } from './components/AssignDateDialog'
import { useAuthSession } from './useAuthSession'
import { addMonths, addYears, dateKey, isSameMonth } from './dates'
import {
  hydrateTasks,
  loadLocalTasks,
  loadSidebarCollapsed,
  saveCloudTasks,
  saveLocalTasks,
  saveSidebarCollapsed,
} from './storage'
import { applyTheme, loadTheme, saveTheme, type Theme } from './theme'
import { isSupabaseConfigured } from './lib/supabase'
import type { AppView, DayProgress, Task, TasksByDate } from './types'
import './App.css'

applyTheme(loadTheme())

const SAVE_DEBOUNCE_MS = 400

function getUserDisplayName(user: {
  email?: string | null
  user_metadata?: Record<string, unknown>
} | null): string | null {
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const fullName = meta.full_name
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()
  const name = meta.name
  if (typeof name === 'string' && name.trim()) return name.trim()
  return user.email ?? null
}

export default function App() {
  const { session, user, ready, signOut } = useAuthSession()
  const today = useMemo(() => new Date(), [])
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [activeView, setActiveView] = useState<AppView>('calendar')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadSidebarCollapsed)
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month')
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [tasksOpen, setTasksOpen] = useState(false)
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({})
  const [backlog, setBacklog] = useState<Task[]>([])
  const [tasksReady, setTasksReady] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null)
  const skipNextSave = useRef(true)
  const activeUserId = useRef<string | null>(null)

  const userName = getUserDisplayName(user)
  const userEmail = user?.email ?? null

  useEffect(() => {
    if (!ready) return

    if (!isSupabaseConfigured) {
      const local = loadLocalTasks()
      setTasksByDate(local.byDate)
      setBacklog(local.backlog)
      setTasksReady(true)
      skipNextSave.current = true
      return
    }

    if (!user) {
      activeUserId.current = null
      setTasksByDate({})
      setBacklog([])
      setTasksReady(false)
      setTasksOpen(false)
      return
    }

    if (activeUserId.current !== user.id) {
      activeUserId.current = user.id
      setTasksByDate({})
      setBacklog([])
      setTasksReady(false)
      setTasksOpen(false)
    }

    let cancelled = false
    setSyncError(null)

    hydrateTasks(user.id)
      .then((tasks) => {
        if (cancelled || activeUserId.current !== user.id) return
        skipNextSave.current = true
        setTasksByDate(tasks.byDate)
        setBacklog(tasks.backlog)
        setTasksReady(true)
      })
      .catch((err) => {
        if (cancelled || activeUserId.current !== user.id) return
        setSyncError(err instanceof Error ? err.message : 'Failed to load tasks.')
        skipNextSave.current = true
        const local = loadLocalTasks(user.id)
        setTasksByDate(local.byDate)
        setBacklog(local.backlog)
        setTasksReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [ready, user])

  useEffect(() => {
    if (!tasksReady) return

    const payload = { byDate: tasksByDate, backlog }

    if (isSupabaseConfigured && user) {
      saveLocalTasks(payload, user.id)
    } else if (!isSupabaseConfigured) {
      saveLocalTasks(payload)
    }

    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (!user || !isSupabaseConfigured) return

    const userId = user.id
    const timer = window.setTimeout(() => {
      if (activeUserId.current !== userId) return
      saveCloudTasks(userId, payload).catch((err) => {
        setSyncError(err instanceof Error ? err.message : 'Failed to save tasks.')
      })
    }, SAVE_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [tasksByDate, backlog, tasksReady, user])

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    saveSidebarCollapsed(sidebarCollapsed)
  }, [sidebarCollapsed])

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
          userName={userName}
          userEmail={userEmail}
          onSignOut={signOut}
        />
        <div className="boot-screen">Loading your tasks…</div>
      </div>
    )
  }

  const selectedKey = dateKey(selected)
  const selectedTasks = tasksByDate[selectedKey] ?? []
  const assignTask = assignTaskId
    ? backlog.find((task) => task.id === assignTaskId) ?? null
    : null

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

  function clearAllTasks() {
    updateSelected(() => [])
  }

  function addBacklogTask(text: string) {
    setBacklog((current) => [
      ...current,
      { id: crypto.randomUUID(), text, completed: false },
    ])
  }

  function toggleBacklogTask(id: string) {
    setBacklog((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function updateBacklogTask(id: string, text: string) {
    setBacklog((current) =>
      current.map((task) => (task.id === id ? { ...task, text } : task)),
    )
  }

  function deleteBacklogTask(id: string) {
    setBacklog((current) => current.filter((task) => task.id !== id))
  }

  function assignBacklogTaskToDay(date: Date) {
    if (!assignTaskId) return
    const task = backlog.find((item) => item.id === assignTaskId)
    if (!task) {
      setAssignTaskId(null)
      return
    }

    const key = dateKey(date)
    setBacklog((current) => current.filter((item) => item.id !== assignTaskId))
    setTasksByDate((current) => ({
      ...current,
      [key]: [...(current[key] ?? []), task],
    }))
    setAssignTaskId(null)
    setActiveView('calendar')
    setSelected(date)
    setTasksOpen(true)
    setCalendarMode('month')
    if (!isSameMonth(date, viewDate)) {
      setViewDate(date)
    }
  }

  function handleSelectDay(date: Date) {
    setSelected(date)
    setTasksOpen(true)
    setCalendarMode('month')
    if (!isSameMonth(date, viewDate)) {
      setViewDate(date)
    }
  }

  function handleOpenYearView() {
    setCalendarMode('year')
    setTasksOpen(false)
  }

  function handleSelectMonth(monthIndex: number) {
    const next = new Date(viewDate.getFullYear(), monthIndex, 1)
    setViewDate(next)
    setCalendarMode('month')
  }

  function handleCalendarPrev() {
    setViewDate((current) =>
      calendarMode === 'year' ? addYears(current, -1) : addMonths(current, -1),
    )
  }

  function handleCalendarNext() {
    setViewDate((current) =>
      calendarMode === 'year' ? addYears(current, 1) : addMonths(current, 1),
    )
  }

  function handleSelectView(view: AppView) {
    setActiveView(view)
    if (view === 'backlog') {
      setTasksOpen(false)
    }
  }

  return (
    <div className="app">
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        userName={userName}
        userEmail={userEmail}
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
      <div className="app-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          activeView={activeView}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
          onSelectView={handleSelectView}
        />
        <main className="app-main">
          {activeView === 'calendar' ? (
            <div className={`workspace ${tasksOpen ? 'tasks-open' : ''}`}>
              <CalendarGrid
                mode={calendarMode}
                viewDate={viewDate}
                selected={selected}
                today={today}
                tasksOpen={tasksOpen}
                onSelect={handleSelectDay}
                onPrev={handleCalendarPrev}
                onNext={handleCalendarNext}
                onOpenYearView={handleOpenYearView}
                onSelectMonth={handleSelectMonth}
                getProgress={getProgress}
              />
              <aside className={`tasks-panel ${tasksOpen ? 'is-open' : ''}`}>
                <TaskList
                  date={selected}
                  tasks={selectedTasks}
                  open={tasksOpen}
                  onAdd={addTask}
                  onToggle={toggleTask}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onClearAll={clearAllTasks}
                  onClose={() => setTasksOpen(false)}
                />
              </aside>
            </div>
          ) : (
            <BacklogPage
              tasks={backlog}
              onAdd={addBacklogTask}
              onToggle={toggleBacklogTask}
              onUpdate={updateBacklogTask}
              onDelete={deleteBacklogTask}
              onAssign={setAssignTaskId}
            />
          )}
        </main>
      </div>

      <AssignDateDialog
        open={Boolean(assignTask)}
        initialDate={today}
        onConfirm={assignBacklogTaskToDay}
        onClose={() => setAssignTaskId(null)}
      />
    </div>
  )
}
