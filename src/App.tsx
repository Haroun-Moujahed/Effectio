import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import { Header } from './components/Header'
import { AssignDateDialog } from './components/AssignDateDialog'
import { AuthScreen } from './components/AuthScreen'
import { Sidebar } from './components/Sidebar'
import type { CalendarMode } from './components/CalendarGrid'
import { CalendarPage } from './pages/CalendarPage'
import { BacklogRoutePage } from './pages/BacklogRoutePage'
import { SchedulePage } from './pages/SchedulePage'
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
import { createTask, getProgressForDate, getTasksForDate } from './tasks'
import type { ScheduleByDate, ScheduleEntry, Task, TaskSource, TasksByDate } from './types'
import './styles/index.css'

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadSidebarCollapsed)
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month')
  const [viewDate, setViewDate] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())
  const [tasksOpen, setTasksOpen] = useState(false)
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({})
  const [backlog, setBacklog] = useState<Task[]>([])
  const [scheduleByDate, setScheduleByDate] = useState<ScheduleByDate>({})
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
      setScheduleByDate(local.scheduleByDate)
      setTasksReady(true)
      skipNextSave.current = true
      return
    }

    if (!user) {
      activeUserId.current = null
      setTasksByDate({})
      setBacklog([])
      setScheduleByDate({})
      setTasksReady(false)
      setTasksOpen(false)
      return
    }

    if (activeUserId.current !== user.id) {
      activeUserId.current = user.id
      setTasksByDate({})
      setBacklog([])
      setScheduleByDate({})
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
        setScheduleByDate(tasks.scheduleByDate)
        setTasksReady(true)
      })
      .catch((err) => {
        if (cancelled || activeUserId.current !== user.id) return
        setSyncError(err instanceof Error ? err.message : 'Failed to load tasks.')
        skipNextSave.current = true
        const local = loadLocalTasks(user.id)
        setTasksByDate(local.byDate)
        setBacklog(local.backlog)
        setScheduleByDate(local.scheduleByDate)
        setTasksReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [ready, user])

  useEffect(() => {
    if (!tasksReady) return

    const payload = { byDate: tasksByDate, backlog, scheduleByDate }

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
  }, [tasksByDate, backlog, scheduleByDate, tasksReady, user])

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    saveSidebarCollapsed(sidebarCollapsed)
  }, [sidebarCollapsed])

  const handleCalendarPrev = useCallback(() => {
    setViewDate((current) =>
      calendarMode === 'year' ? addYears(current, -1) : addMonths(current, -1),
    )
  }, [calendarMode])

  const handleCalendarNext = useCallback(() => {
    setViewDate((current) =>
      calendarMode === 'year' ? addYears(current, 1) : addMonths(current, 1),
    )
  }, [calendarMode])

  const navigateToDate = useCallback((date: Date) => {
    setSelected(date)
    setTasksOpen(true)
    setCalendarMode('month')
    setViewDate((current) => (isSameMonth(date, current) ? current : date))
  }, [])

  const closeTasksPanel = useCallback(() => {
    setTasksOpen(false)
  }, [])

  if (!ready) {
    return (
      <div className="app">
        <div className="boot-screen">Loading…</div>
      </div>
    )
  }

  const authRequired = isSupabaseConfigured && !session
  const tasksLoading = isSupabaseConfigured && session && !tasksReady

  if (authRequired) {
    return (
      <Routes>
        <Route
          path="/sign-up"
          element={
            <div className="app">
              <Header
                theme={theme}
                onToggleTheme={() =>
                  setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
                }
              />
              <AuthScreen mode="signup" />
            </div>
          }
        />
        <Route
          path="/sign-in"
          element={
            <div className="app">
              <Header
                theme={theme}
                onToggleTheme={() =>
                  setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
                }
              />
              <AuthScreen mode="signin" />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    )
  }

  if (tasksLoading) {
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
  const selectedTasks = getTasksForDate(selectedKey, tasksByDate, backlog)
  const assignTask = assignTaskId
    ? backlog.find((task) => task.id === assignTaskId) ?? null
    : null

  function getProgress(date: Date) {
    return getProgressForDate(dateKey(date), tasksByDate, backlog)
  }

  function updateCalendarTasks(key: string, mutator: (tasks: Task[]) => Task[]) {
    setTasksByDate((current) => {
      const next = mutator(current[key] ?? [])
      const copy = { ...current }
      if (next.length === 0) {
        delete copy[key]
      } else {
        copy[key] = next
      }
      return copy
    })
  }

  function addTask(title: string) {
    updateCalendarTasks(selectedKey, (tasks) => [...tasks, createTask(title)])
  }

  function toggleTask(id: string, source: TaskSource) {
    if (source === 'backlog') {
      setBacklog((current) =>
        current.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task,
        ),
      )
      return
    }

    updateCalendarTasks(selectedKey, (tasks) =>
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function updateTask(
    id: string,
    source: TaskSource,
    title: string,
    description: string,
  ) {
    if (source === 'backlog') {
      setBacklog((current) =>
        current.map((task) =>
          task.id === id ? { ...task, title, description } : task,
        ),
      )
      return
    }

    updateCalendarTasks(selectedKey, (tasks) =>
      tasks.map((task) =>
        task.id === id ? { ...task, title, description } : task,
      ),
    )
  }

  function deleteTask(id: string, source: TaskSource) {
    purgeScheduleForTask(id, source, selectedKey)
    if (source === 'backlog') {
      setBacklog((current) => current.filter((task) => task.id !== id))
      return
    }

    updateCalendarTasks(selectedKey, (tasks) =>
      tasks.filter((task) => task.id !== id),
    )
  }

  function clearAllTasksForDay() {
    const key = selectedKey
    setTasksByDate((current) => {
      const copy = { ...current }
      delete copy[key]
      return copy
    })
    setBacklog((current) =>
      current.map((task) =>
        task.assignedDate === key ? { ...task, assignedDate: undefined } : task,
      ),
    )
    setScheduleByDate((current) => {
      if (!(key in current)) return current
      const copy = { ...current }
      delete copy[key]
      return copy
    })
  }

  function purgeScheduleForTask(
    taskId: string,
    taskSource: TaskSource,
    dayKey?: string,
  ) {
    setScheduleByDate((current) => {
      let changed = false
      const copy = { ...current }
      for (const key of Object.keys(copy)) {
        if (dayKey && key !== dayKey) continue
        const next = copy[key].filter(
          (entry) => !(entry.taskId === taskId && entry.taskSource === taskSource),
        )
        if (next.length !== copy[key].length) {
          changed = true
          if (next.length === 0) delete copy[key]
          else copy[key] = next
        }
      }
      return changed ? copy : current
    })
  }

  function addScheduleEntryForKey(key: string, entry: ScheduleEntry) {
    setScheduleByDate((current) => ({
      ...current,
      [key]: [...(current[key] ?? []), entry],
    }))
  }

  function updateScheduleEntryForKey(
    key: string,
    entryId: string,
    patch: Partial<Pick<ScheduleEntry, 'startMinutes' | 'durationMinutes'>>,
  ) {
    setScheduleByDate((current) => {
      const entries = current[key]
      if (!entries) return current
      return {
        ...current,
        [key]: entries.map((entry) =>
          entry.id === entryId ? { ...entry, ...patch } : entry,
        ),
      }
    })
  }

  function removeScheduleEntryForKey(key: string, entryId: string) {
    setScheduleByDate((current) => {
      const entries = current[key]
      if (!entries) return current
      const next = entries.filter((entry) => entry.id !== entryId)
      const copy = { ...current }
      if (next.length === 0) delete copy[key]
      else copy[key] = next
      return copy
    })
  }

  function addTaskForKey(key: string, title: string) {
    updateCalendarTasks(key, (tasks) => [...tasks, createTask(title)])
  }

  function toggleTaskForKey(key: string, id: string, source: TaskSource) {
    if (source === 'backlog') {
      setBacklog((current) =>
        current.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task,
        ),
      )
      return
    }

    updateCalendarTasks(key, (tasks) =>
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function updateTaskForKey(
    key: string,
    id: string,
    source: TaskSource,
    title: string,
    description: string,
  ) {
    if (source === 'backlog') {
      setBacklog((current) =>
        current.map((task) =>
          task.id === id ? { ...task, title, description } : task,
        ),
      )
      return
    }

    updateCalendarTasks(key, (tasks) =>
      tasks.map((task) =>
        task.id === id ? { ...task, title, description } : task,
      ),
    )
  }

  function deleteTaskForKey(key: string, id: string, source: TaskSource) {
    purgeScheduleForTask(id, source, key)
    if (source === 'backlog') {
      setBacklog((current) => current.filter((task) => task.id !== id))
      return
    }

    updateCalendarTasks(key, (tasks) => tasks.filter((task) => task.id !== id))
  }

  function clearAllTasksForKey(key: string) {
    setTasksByDate((current) => {
      const copy = { ...current }
      delete copy[key]
      return copy
    })
    setBacklog((current) =>
      current.map((task) =>
        task.assignedDate === key ? { ...task, assignedDate: undefined } : task,
      ),
    )
    setScheduleByDate((current) => {
      if (!(key in current)) return current
      const copy = { ...current }
      delete copy[key]
      return copy
    })
  }

  function addBacklogTask(title: string) {
    setBacklog((current) => [...current, createTask(title)])
  }

  function toggleBacklogTask(id: string) {
    setBacklog((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function updateBacklogTask(id: string, title: string, description: string) {
    setBacklog((current) =>
      current.map((task) =>
        task.id === id ? { ...task, title, description } : task,
      ),
    )
  }

  function deleteBacklogTask(id: string) {
    purgeScheduleForTask(id, 'backlog')
    setBacklog((current) => current.filter((task) => task.id !== id))
  }

  function clearAllBacklogTasks() {
    setBacklog([])
  }

  function assignBacklogTaskToDay(date: Date) {
    if (!assignTaskId) return
    const task = backlog.find((item) => item.id === assignTaskId)
    if (!task) {
      setAssignTaskId(null)
      return
    }

    const key = dateKey(date)
    setBacklog((current) =>
      current.map((item) =>
        item.id === assignTaskId ? { ...item, assignedDate: key } : item,
      ),
    )
    setAssignTaskId(null)
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
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route
              path="/calendar"
              element={
                <CalendarPage
                  calendarMode={calendarMode}
                  viewDate={viewDate}
                  selected={selected}
                  today={today}
                  tasksOpen={tasksOpen}
                  tasks={selectedTasks}
                  onSelectDay={handleSelectDay}
                  onPrev={handleCalendarPrev}
                  onNext={handleCalendarNext}
                  onOpenYearView={handleOpenYearView}
                  onSelectMonth={handleSelectMonth}
                  getProgress={getProgress}
                  onAdd={addTask}
                  onToggle={toggleTask}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onClearAll={clearAllTasksForDay}
                  onCloseTasks={closeTasksPanel}
                  onNavigateToDate={navigateToDate}
                />
              }
            />
            <Route
              path="/backlog"
              element={
                <BacklogRoutePage
                  tasks={backlog}
                  onAdd={addBacklogTask}
                  onToggle={toggleBacklogTask}
                  onUpdate={updateBacklogTask}
                  onDelete={deleteBacklogTask}
                  onAssign={setAssignTaskId}
                  onClearAll={clearAllBacklogTasks}
                  onCloseTasks={closeTasksPanel}
                />
              }
            />
            <Route
              path="/schedule"
              element={
                <SchedulePage
                  today={today}
                  tasksByDate={tasksByDate}
                  backlog={backlog}
                  scheduleByDate={scheduleByDate}
                  onAddTask={addTaskForKey}
                  onToggleTask={toggleTaskForKey}
                  onUpdateTask={updateTaskForKey}
                  onDeleteTask={deleteTaskForKey}
                  onClearAllTasks={clearAllTasksForKey}
                  onAddScheduleEntry={addScheduleEntryForKey}
                  onUpdateScheduleEntry={updateScheduleEntryForKey}
                  onRemoveScheduleEntry={removeScheduleEntryForKey}
                />
              }
            />
            <Route path="/sign-in" element={<Navigate to="/calendar" replace />} />
            <Route path="/sign-up" element={<Navigate to="/calendar" replace />} />
            <Route path="*" element={<Navigate to="/calendar" replace />} />
          </Routes>
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
