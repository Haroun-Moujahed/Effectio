export type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  assignedDate?: string
}

export type TaskSource = 'calendar' | 'backlog'

export type DisplayTask = Task & {
  source: TaskSource
}

export type TasksByDate = Record<string, Task[]>

export type ScheduleEntry = {
  id: string
  taskId: string
  taskSource: TaskSource
  startMinutes: number
  durationMinutes: number
}

export type ScheduleByDate = Record<string, ScheduleEntry[]>

export type DayTaskOrder = Record<string, string[]>

export type PersistedTasks = {
  byDate: TasksByDate
  backlog: Task[]
  scheduleByDate: ScheduleByDate
  dayTaskOrder: DayTaskOrder
}

export type DayProgress = {
  total: number
  completed: number
  percent: number
}

export type AppView = 'calendar' | 'backlog' | 'schedule'

export type DisplayScheduleEntry = ScheduleEntry & {
  title: string
  completed: boolean
}

export const TASK_DRAG_TYPE = 'application/x-effectio-task'
export const TASK_REORDER_TYPE = 'application/x-effectio-task-reorder'
export const ENTRY_DRAG_TYPE = 'application/x-effectio-schedule-entry'
