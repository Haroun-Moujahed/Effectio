import type { DisplayTask, Task, TaskSource, TasksByDate } from './types'

export function createTask(title: string): Task {
  return {
    id: crypto.randomUUID(),
    title,
    description: '',
    completed: false,
  }
}

export function cloneTaskFrom(task: Pick<Task, 'title' | 'description'>): Task {
  return {
    id: crypto.randomUUID(),
    title: task.title,
    description: task.description,
    completed: false,
  }
}

export function getTasksForDate(
  key: string,
  tasksByDate: TasksByDate,
  backlog: Task[],
): DisplayTask[] {
  const calendarTasks: DisplayTask[] = (tasksByDate[key] ?? []).map((task) => ({
    ...task,
    source: 'calendar' as const,
  }))

  const backlogTasks: DisplayTask[] = backlog
    .filter((task) => task.assignedDate === key)
    .map((task) => ({
      ...task,
      source: 'backlog' as const,
    }))

  return [...calendarTasks, ...backlogTasks]
}

export function getProgressForDate(
  key: string,
  tasksByDate: TasksByDate,
  backlog: Task[],
) {
  const tasks = getTasksForDate(key, tasksByDate, backlog)
  const completed = tasks.filter((task) => task.completed).length
  const total = tasks.length
  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

export function findTaskSource(
  id: string,
  dateKey: string,
  tasksByDate: TasksByDate,
  backlog: Task[],
): TaskSource | null {
  if ((tasksByDate[dateKey] ?? []).some((task) => task.id === id)) {
    return 'calendar'
  }
  if (backlog.some((task) => task.id === id && task.assignedDate === dateKey)) {
    return 'backlog'
  }
  return null
}
