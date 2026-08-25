export type Task = {
  id: string
  text: string
  completed: boolean
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
