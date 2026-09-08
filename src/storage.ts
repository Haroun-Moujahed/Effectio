import { supabase } from './lib/supabase'
import type {
  PersistedTasks,
  ScheduleByDate,
  ScheduleEntry,
  Task,
  TaskSource,
  TasksByDate,
} from './types'

const STORAGE_PREFIX = 'effectio.tasks.v1'
const SIDEBAR_COLLAPSED_KEY = 'effectio.sidebar.collapsed'

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

export function emptyPersistedTasks(): PersistedTasks {
  return { byDate: {}, backlog: [], scheduleByDate: {}, dayTaskOrder: {} }
}

function coerceTask(value: unknown): Task | null {
  if (!value || typeof value !== 'object') return null
  const task = value as Record<string, unknown>
  if (typeof task.id !== 'string') return null

  const title =
    typeof task.title === 'string'
      ? task.title
      : typeof task.text === 'string'
        ? task.text
        : null
  if (title === null) return null

  const description = typeof task.description === 'string' ? task.description : ''
  const assignedDate =
    typeof task.assignedDate === 'string' ? task.assignedDate : undefined

  return {
    id: task.id,
    title,
    description,
    completed: Boolean(task.completed),
    ...(assignedDate ? { assignedDate } : {}),
  }
}

function coerceTaskList(value: unknown): Task[] {
  if (!Array.isArray(value)) return []
  return value.map(coerceTask).filter((task): task is Task => task !== null)
}

function coerceTasksByDate(value: unknown): TasksByDate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: TasksByDate = {}
  for (const [key, tasks] of Object.entries(value as Record<string, unknown>)) {
    const list = coerceTaskList(tasks)
    if (list.length > 0) result[key] = list
  }
  return result
}

function coerceScheduleEntry(value: unknown): ScheduleEntry | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  if (typeof entry.id !== 'string' || typeof entry.taskId !== 'string') return null
  if (entry.taskSource !== 'calendar' && entry.taskSource !== 'backlog') return null
  if (typeof entry.startMinutes !== 'number' || typeof entry.durationMinutes !== 'number') {
    return null
  }

  return {
    id: entry.id,
    taskId: entry.taskId,
    taskSource: entry.taskSource as TaskSource,
    startMinutes: entry.startMinutes,
    durationMinutes: entry.durationMinutes,
  }
}

function coerceScheduleByDate(value: unknown): ScheduleByDate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: ScheduleByDate = {}
  for (const [key, entries] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue
    const list = entries
      .map(coerceScheduleEntry)
      .filter((entry): entry is ScheduleEntry => entry !== null)
    if (list.length > 0) result[key] = list
  }
  return result
}

function coerceDayTaskOrder(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const result: Record<string, string[]> = {}
  for (const [key, items] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(items)) continue
    const list = items.filter((item): item is string => typeof item === 'string')
    if (list.length > 0) result[key] = list
  }
  return result
}

function isPersistedEnvelope(
  value: unknown,
): value is {
  byDate: unknown
  backlog: unknown
  scheduleByDate?: unknown
  dayTaskOrder?: unknown
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return 'byDate' in value && 'backlog' in value
}

/** Normalize legacy date-map payloads and the new { byDate, backlog, scheduleByDate } envelope. */
export function normalizePersistedTasks(value: unknown): PersistedTasks {
  if (isPersistedEnvelope(value)) {
    return {
      byDate: coerceTasksByDate(value.byDate),
      backlog: coerceTaskList(value.backlog),
      scheduleByDate: coerceScheduleByDate(value.scheduleByDate ?? {}),
      dayTaskOrder: coerceDayTaskOrder(value.dayTaskOrder),
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      byDate: coerceTasksByDate(value),
      backlog: [],
      scheduleByDate: {},
      dayTaskOrder: {},
    }
  }
  return emptyPersistedTasks()
}

export function loadLocalTasks(userId?: string): PersistedTasks {
  try {
    const key = userId ? storageKey(userId) : STORAGE_PREFIX
    const raw = localStorage.getItem(key)
    if (!raw) return emptyPersistedTasks()
    const parsed: unknown = JSON.parse(raw)
    return normalizePersistedTasks(parsed)
  } catch {
    return emptyPersistedTasks()
  }
}

export function saveLocalTasks(tasks: PersistedTasks, userId?: string): void {
  const key = userId ? storageKey(userId) : STORAGE_PREFIX
  localStorage.setItem(key, JSON.stringify(tasks))
}

export function clearLocalTasks(userId?: string): void {
  if (userId) {
    localStorage.removeItem(storageKey(userId))
  }
  localStorage.removeItem(STORAGE_PREFIX)
}

export type CloudTasksRecord = {
  tasks: PersistedTasks
  updatedAt: string | null
}

export type SaveCloudResult =
  | { status: 'saved'; updatedAt: string }
  | { status: 'conflict'; tasks: PersistedTasks; updatedAt: string }

export function persistSnapshot(tasks: PersistedTasks): string {
  return JSON.stringify(tasks)
}

export async function loadCloudTasks(userId: string): Promise<CloudTasksRecord | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_tasks')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return {
    tasks: normalizePersistedTasks(data.data),
    updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null,
  }
}

export async function saveCloudTasks(
  userId: string,
  tasks: PersistedTasks,
  expectedUpdatedAt: string | null,
): Promise<SaveCloudResult> {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const nextUpdatedAt = new Date().toISOString()

  if (expectedUpdatedAt === null) {
    const { data, error } = await supabase
      .from('user_tasks')
      .insert({
        user_id: userId,
        data: tasks,
        updated_at: nextUpdatedAt,
      })
      .select('data, updated_at')
      .maybeSingle()

    if (error) {
      if (error.code === '23505') {
        const latest = await loadCloudTasks(userId)
        if (latest?.updatedAt) {
          return { status: 'conflict', tasks: latest.tasks, updatedAt: latest.updatedAt }
        }
      }
      throw error
    }

    return {
      status: 'saved',
      updatedAt: typeof data?.updated_at === 'string' ? data.updated_at : nextUpdatedAt,
    }
  }

  const { data, error } = await supabase
    .from('user_tasks')
    .update({
      data: tasks,
      updated_at: nextUpdatedAt,
    })
    .eq('user_id', userId)
    .eq('updated_at', expectedUpdatedAt)
    .select('data, updated_at')
    .maybeSingle()

  if (error) throw error

  if (!data) {
    const latest = await loadCloudTasks(userId)
    if (!latest) {
      return saveCloudTasks(userId, tasks, null)
    }
    return {
      status: 'conflict',
      tasks: latest.tasks,
      updatedAt: latest.updatedAt ?? expectedUpdatedAt,
    }
  }

  return {
    status: 'saved',
    updatedAt: typeof data.updated_at === 'string' ? data.updated_at : nextUpdatedAt,
  }
}

function hasPersistedContent(tasks: PersistedTasks): boolean {
  return (
    Object.keys(tasks.byDate).length > 0 ||
    tasks.backlog.length > 0 ||
    Object.keys(tasks.scheduleByDate).length > 0 ||
    Object.keys(tasks.dayTaskOrder).length > 0
  )
}

/**
 * Load this account's tasks only.
 * Cloud is the source of truth. A per-user local cache is used for speed —
 * never shared across accounts.
 */
export async function hydrateTasks(userId: string): Promise<CloudTasksRecord> {
  const cloud = await loadCloudTasks(userId)

  if (cloud !== null) {
    saveLocalTasks(cloud.tasks, userId)
    return cloud
  }

  const cached = loadLocalTasks(userId)
  if (hasPersistedContent(cached)) {
    const saved = await saveCloudTasks(userId, cached, null)
    if (saved.status === 'conflict') {
      saveLocalTasks(saved.tasks, userId)
      return { tasks: saved.tasks, updatedAt: saved.updatedAt }
    }
    saveLocalTasks(cached, userId)
    return { tasks: cached, updatedAt: saved.updatedAt }
  }

  // Brand-new account: empty calendar (do not import another account's cache)
  return { tasks: emptyPersistedTasks(), updatedAt: null }
}

export function loadSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
}
