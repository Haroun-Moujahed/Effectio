import { supabase } from './lib/supabase'
import type { PersistedTasks, Task, TasksByDate } from './types'

const STORAGE_PREFIX = 'effectio.tasks.v1'
const SIDEBAR_COLLAPSED_KEY = 'effectio.sidebar.collapsed'

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

export function emptyPersistedTasks(): PersistedTasks {
  return { byDate: {}, backlog: [] }
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

function isPersistedEnvelope(value: unknown): value is { byDate: unknown; backlog: unknown } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return 'byDate' in value && 'backlog' in value
}

/** Normalize legacy date-map payloads and the new { byDate, backlog } envelope. */
export function normalizePersistedTasks(value: unknown): PersistedTasks {
  if (isPersistedEnvelope(value)) {
    return {
      byDate: coerceTasksByDate(value.byDate),
      backlog: coerceTaskList(value.backlog),
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { byDate: coerceTasksByDate(value), backlog: [] }
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

export async function loadCloudTasks(userId: string): Promise<PersistedTasks | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_tasks')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return normalizePersistedTasks(data.data)
}

export async function saveCloudTasks(userId: string, tasks: PersistedTasks): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.from('user_tasks').upsert(
    {
      user_id: userId,
      data: tasks,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) throw error
}

function hasPersistedContent(tasks: PersistedTasks): boolean {
  return Object.keys(tasks.byDate).length > 0 || tasks.backlog.length > 0
}

/**
 * Load this account's tasks only.
 * Cloud is the source of truth. A per-user local cache is used for speed —
 * never shared across accounts.
 */
export async function hydrateTasks(userId: string): Promise<PersistedTasks> {
  const cloud = await loadCloudTasks(userId)

  if (cloud !== null) {
    saveLocalTasks(cloud, userId)
    return cloud
  }

  const cached = loadLocalTasks(userId)
  if (hasPersistedContent(cached)) {
    await saveCloudTasks(userId, cached)
    return cached
  }

  // Brand-new account: empty calendar (do not import another account's cache)
  return emptyPersistedTasks()
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
