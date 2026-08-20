import { supabase } from './lib/supabase'
import type { TasksByDate } from './types'

const STORAGE_PREFIX = 'effectio.tasks.v1'

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`
}

export function loadLocalTasks(userId?: string): TasksByDate {
  try {
    const key = userId ? storageKey(userId) : STORAGE_PREFIX
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as TasksByDate
  } catch {
    return {}
  }
}

export function saveLocalTasks(tasks: TasksByDate, userId?: string): void {
  const key = userId ? storageKey(userId) : STORAGE_PREFIX
  localStorage.setItem(key, JSON.stringify(tasks))
}

export function clearLocalTasks(userId?: string): void {
  if (userId) {
    localStorage.removeItem(storageKey(userId))
  }
  localStorage.removeItem(STORAGE_PREFIX)
}

function isTasksByDate(value: unknown): value is TasksByDate {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function loadCloudTasks(userId: string): Promise<TasksByDate | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_tasks')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return isTasksByDate(data.data) ? data.data : {}
}

export async function saveCloudTasks(userId: string, tasks: TasksByDate): Promise<void> {
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

/**
 * Load this account's tasks only.
 * Cloud is the source of truth. A per-user local cache is used for speed —
 * never shared across accounts.
 */
export async function hydrateTasks(userId: string): Promise<TasksByDate> {
  const cloud = await loadCloudTasks(userId)

  if (cloud !== null) {
    saveLocalTasks(cloud, userId)
    return cloud
  }

  const cached = loadLocalTasks(userId)
  if (Object.keys(cached).length > 0) {
    await saveCloudTasks(userId, cached)
    return cached
  }

  // Brand-new account: empty calendar (do not import another account's cache)
  return {}
}
