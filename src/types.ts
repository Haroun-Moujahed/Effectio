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

export type PersistedTasks = {
  byDate: TasksByDate
  backlog: Task[]
}

export type DayProgress = {
  total: number
  completed: number
  percent: number
}

export type AppView = 'calendar' | 'backlog'
