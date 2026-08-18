import type { TasksByDate } from './types'

const STORAGE_KEY = 'effectio.tasks.v1'

export function loadTasks(): TasksByDate {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as TasksByDate
  } catch {
    return {}
  }
}

export function saveTasks(tasks: TasksByDate): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
