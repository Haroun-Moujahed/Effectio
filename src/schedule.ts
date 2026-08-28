import type { DisplayScheduleEntry, DisplayTask, ScheduleEntry, TaskSource } from './types'
import { ENTRY_DRAG_TYPE, TASK_DRAG_TYPE } from './types'

export const MINUTES_PER_DAY = 1440
export const DEFAULT_DURATION_MINUTES = 60
export const MIN_DURATION_MINUTES = 15
export const DURATION_STEP_MINUTES = 15
export const HOUR_HEIGHT_PX = 56
export const TIMELINE_HEIGHT_PX = 24 * HOUR_HEIGHT_PX

export function createScheduleEntry(
  taskId: string,
  taskSource: TaskSource,
  startMinutes: number,
  durationMinutes = DEFAULT_DURATION_MINUTES,
): ScheduleEntry {
  return {
    id: crypto.randomUUID(),
    taskId,
    taskSource,
    startMinutes: snapToHour(startMinutes),
    durationMinutes: clampDuration(snapToHour(startMinutes), durationMinutes),
  }
}

export function snapToHour(minutes: number): number {
  const hour = Math.floor(minutes / 60)
  return Math.max(0, Math.min(23, hour)) * 60
}

export function snapToDurationStep(minutes: number): number {
  const stepped = Math.round(minutes / DURATION_STEP_MINUTES) * DURATION_STEP_MINUTES
  return Math.max(MIN_DURATION_MINUTES, stepped)
}

export function clampDuration(startMinutes: number, durationMinutes: number): number {
  const maxDuration = MINUTES_PER_DAY - startMinutes
  return Math.max(
    MIN_DURATION_MINUTES,
    Math.min(maxDuration, snapToDurationStep(durationMinutes)),
  )
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatTimeRange(startMinutes: number, durationMinutes: number): string {
  const endMinutes = startMinutes + durationMinutes
  return `${formatMinutes(startMinutes)} – ${formatMinutes(endMinutes)}`
}

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function resolveScheduleEntries(
  entries: ScheduleEntry[],
  tasks: DisplayTask[],
): DisplayScheduleEntry[] {
  const taskMap = new Map(
    tasks.map((task) => [`${task.source}:${task.id}`, task] as const),
  )

  return entries
    .map((entry) => {
      const task = taskMap.get(`${entry.taskSource}:${entry.taskId}`)
      if (!task) return null
      return {
        ...entry,
        title: task.title,
        completed: task.completed,
      }
    })
    .filter((entry): entry is DisplayScheduleEntry => entry !== null)
}

export function pruneOrphanScheduleEntries(
  entries: ScheduleEntry[],
  tasks: DisplayTask[],
): ScheduleEntry[] {
  const taskIds = new Set(tasks.map((task) => `${task.source}:${task.id}`))
  return entries.filter((entry) =>
    taskIds.has(`${entry.taskSource}:${entry.taskId}`),
  )
}

export type TaskDragPayload = {
  taskId: string
  taskSource: TaskSource
  title: string
}

export type EntryDragPayload = {
  entryId: string
}

export function writeTaskDragData(dataTransfer: DataTransfer, payload: TaskDragPayload) {
  dataTransfer.setData(TASK_DRAG_TYPE, JSON.stringify(payload))
  dataTransfer.effectAllowed = 'copy'
}

export function writeEntryDragData(dataTransfer: DataTransfer, payload: EntryDragPayload) {
  dataTransfer.setData(ENTRY_DRAG_TYPE, JSON.stringify(payload))
  dataTransfer.effectAllowed = 'move'
}

export function readTaskDragData(dataTransfer: DataTransfer): TaskDragPayload | null {
  const raw = dataTransfer.getData(TASK_DRAG_TYPE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as TaskDragPayload
    if (!parsed.taskId || !parsed.taskSource) return null
    return parsed
  } catch {
    return null
  }
}

export function readEntryDragData(dataTransfer: DataTransfer): EntryDragPayload | null {
  const raw = dataTransfer.getData(ENTRY_DRAG_TYPE)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as EntryDragPayload
    if (!parsed.entryId) return null
    return parsed
  } catch {
    return null
  }
}

let activeDragPreview: HTMLElement | null = null

function removeActiveDragPreview() {
  activeDragPreview?.remove()
  activeDragPreview = null
}

export function setScheduleDragImage(
  dataTransfer: DataTransfer,
  title: string,
  startMinutes = 0,
  durationMinutes = DEFAULT_DURATION_MINUTES,
) {
  removeActiveDragPreview()

  const heightPx = Math.max(
    (durationMinutes / MINUTES_PER_DAY) * TIMELINE_HEIGHT_PX,
    28,
  )
  const preview = document.createElement('div')
  preview.className = 'schedule-block schedule-drag-preview'
  preview.style.position = 'fixed'
  preview.style.top = '-1000px'
  preview.style.left = '-1000px'
  preview.style.width = '220px'
  preview.style.height = `${heightPx}px`
  preview.style.pointerEvents = 'none'

  const body = document.createElement('div')
  body.className = 'schedule-block-body'

  const titleEl = document.createElement('span')
  titleEl.className = 'schedule-block-title'
  titleEl.textContent = title

  const timeEl = document.createElement('span')
  timeEl.className = 'schedule-block-time'
  timeEl.textContent = formatTimeRange(startMinutes, durationMinutes)

  body.append(titleEl, timeEl)
  preview.append(body)
  document.body.append(preview)
  activeDragPreview = preview

  dataTransfer.setDragImage(preview, 110, Math.min(20, heightPx / 2))

  window.addEventListener('dragend', removeActiveDragPreview, { once: true })
}