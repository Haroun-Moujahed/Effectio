import type {
  DayTaskOrder,
  DisplayTask,
  ScheduleByDate,
  Task,
  TaskSource,
  TasksByDate,
} from './types'

export function taskListKey(task: { id: string; source: TaskSource }): string {
  return `${task.source}:${task.id}`
}

export function hasTaskDescription(description: string): boolean {
  return description
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length > 0
}

export function reorderItems<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list
  }

  const next = [...list]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

export function reorderFilteredByIds<T extends { id: string }>(
  list: T[],
  sectionIds: string[],
  fromIndex: number, toIndex: number,
): T[] {
  const nextIds = reorderItems(sectionIds, fromIndex, toIndex)
  if (nextIds === sectionIds) return list

  const byId = new Map(list.map((item) => [item.id, item]))
  const sectionSet = new Set(sectionIds)
  let index = 0

  return list.map((item) => {
    if (!sectionSet.has(item.id)) return item
    return byId.get(nextIds[index++]) ?? item
  })
}

export function sortTasksByOrder(
  tasks: DisplayTask[],
  order?: string[],
): DisplayTask[] {
  if (!order || order.length === 0) return tasks

  const byKey = new Map(tasks.map((task) => [taskListKey(task), task]))
  const seen = new Set<string>()
  const ordered: DisplayTask[] = []

  for (const key of order) {
    const task = byKey.get(key)
    if (!task || seen.has(key)) continue
    ordered.push(task)
    seen.add(key)
  }

  for (const task of tasks) {
    const key = taskListKey(task)
    if (seen.has(key)) continue
    ordered.push(task)
  }

  return ordered
}

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

export function isDateKeyBefore(dateKeyValue: string, todayKey: string): boolean {
  return dateKeyValue < todayKey
}

export function isDateKeyOnOrBefore(dateKeyValue: string, todayKey: string): boolean {
  return dateKeyValue <= todayKey
}

export function toDetachedCalendarTask(task: Task): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
  }
}

type TaskCollections = {
  byDate: TasksByDate
  backlog: Task[]
  scheduleByDate: ScheduleByDate
  dayTaskOrder: DayTaskOrder
}

function snapshotAssignedTask(task: Task): Task {
  return {
    ...toDetachedCalendarTask(task),
    id: crypto.randomUUID(),
  }
}

function keepAssignedDayCopy(
  task: Task,
  assigned: string,
  byDate: TasksByDate,
  scheduleByDate: ScheduleByDate,
  dayTaskOrder: DayTaskOrder,
) {
  const copy = snapshotAssignedTask(task)
  const existing = byDate[assigned] ?? []
  byDate[assigned] = [...existing, copy]
  const nextOrder = retargetOrderKey(
    dayTaskOrder[assigned],
    `backlog:${task.id}`,
    `calendar:${copy.id}`,
  )
  if (nextOrder) dayTaskOrder[assigned] = nextOrder
  const nextEntries = retargetScheduleEntries(
    scheduleByDate[assigned],
    { taskId: task.id, taskSource: 'backlog' },
    { taskId: copy.id, taskSource: 'calendar' },
  )
  if (nextEntries) scheduleByDate[assigned] = nextEntries
}

function dropAssignedDay(
  taskId: string,
  assigned: string,
  scheduleByDate: ScheduleByDate,
  dayTaskOrder: DayTaskOrder,
) {
  const nextOrder = removeOrderKey(dayTaskOrder[assigned], `backlog:${taskId}`)
  if (!nextOrder?.length) delete dayTaskOrder[assigned]
  else dayTaskOrder[assigned] = nextOrder
  purgeBacklogSchedule(scheduleByDate, taskId, assigned)
}

export function reassignBacklogTaskToDay(
  taskId: string,
  newDateKey: string,
  todayKey: string,
  state: TaskCollections,
): TaskCollections {
  const task = state.backlog.find((item) => item.id === taskId)
  if (!task) return state

  const oldKey = task.assignedDate
  if (oldKey === newDateKey) return state

  const byDate: TasksByDate = { ...state.byDate }
  const scheduleByDate: ScheduleByDate = { ...state.scheduleByDate }
  const dayTaskOrder: DayTaskOrder = { ...state.dayTaskOrder }

  if (oldKey) {
    if (isDateKeyOnOrBefore(oldKey, todayKey)) {
      keepAssignedDayCopy(task, oldKey, byDate, scheduleByDate, dayTaskOrder)
    } else {
      dropAssignedDay(task.id, oldKey, scheduleByDate, dayTaskOrder)
    }
  }

  for (const key of Object.keys(dayTaskOrder)) {
    if (!dayTaskOrder[key]?.length) delete dayTaskOrder[key]
  }

  return {
    byDate,
    backlog: state.backlog.map((item) =>
      item.id === taskId ? { ...item, assignedDate: newDateKey } : item,
    ),
    scheduleByDate,
    dayTaskOrder,
  }
}

export function removeBacklogTasks(
  ids: string[],
  todayKey: string,
  state: TaskCollections,
): TaskCollections {
  if (ids.length === 0) return state

  const idSet = new Set(ids)
  const byDate: TasksByDate = { ...state.byDate }
  const scheduleByDate: ScheduleByDate = { ...state.scheduleByDate }
  const dayTaskOrder: DayTaskOrder = { ...state.dayTaskOrder }

  for (const task of state.backlog) {
    if (!idSet.has(task.id)) continue

    const assigned = task.assignedDate
    if (assigned && isDateKeyBefore(assigned, todayKey)) {
      const existing = byDate[assigned] ?? []
      if (!existing.some((item) => item.id === task.id)) {
        byDate[assigned] = [...existing, toDetachedCalendarTask(task)]
      }
      const nextOrder = retargetOrderKey(
        dayTaskOrder[assigned],
        `backlog:${task.id}`,
        `calendar:${task.id}`,
      )
      if (nextOrder) dayTaskOrder[assigned] = nextOrder
      const nextEntries = retargetScheduleEntries(
        scheduleByDate[assigned],
        { taskId: task.id, taskSource: 'backlog' },
        { taskId: task.id, taskSource: 'calendar' },
      )
      if (nextEntries) scheduleByDate[assigned] = nextEntries
      continue
    }

    if (assigned) {
      dropAssignedDay(task.id, assigned, scheduleByDate, dayTaskOrder)
      continue
    }

    purgeBacklogSchedule(scheduleByDate, task.id)
  }

  for (const key of Object.keys(dayTaskOrder)) {
    if (!dayTaskOrder[key]?.length) delete dayTaskOrder[key]
  }

  return {
    byDate,
    backlog: state.backlog.filter((task) => !idSet.has(task.id)),
    scheduleByDate,
    dayTaskOrder,
  }
}

function retargetOrderKey(
  order: string[] | undefined,
  fromKey: string,
  toKey: string,
): string[] | undefined {
  if (!order) return order
  return order.map((item) => (item === fromKey ? toKey : item))
}

function removeOrderKey(
  order: string[] | undefined,
  listKey: string,
): string[] | undefined {
  if (!order) return order
  return order.filter((item) => item !== listKey)
}

function retargetScheduleEntries(
  entries: ScheduleByDate[string] | undefined,
  from: { taskId: string; taskSource: TaskSource },
  to: { taskId: string; taskSource: TaskSource },
): ScheduleByDate[string] | undefined {
  if (!entries) return entries
  return entries.map((entry) =>
    entry.taskId === from.taskId && entry.taskSource === from.taskSource
      ? { ...entry, taskId: to.taskId, taskSource: to.taskSource }
      : entry,
  )
}

function purgeBacklogSchedule(
  scheduleByDate: ScheduleByDate,
  taskId: string,
  dayKey?: string,
) {
  for (const key of Object.keys(scheduleByDate)) {
    if (dayKey && key !== dayKey) continue
    const next = scheduleByDate[key].filter(
      (entry) => !(entry.taskId === taskId && entry.taskSource === 'backlog'),
    )
    if (next.length === scheduleByDate[key].length) continue
    if (next.length === 0) delete scheduleByDate[key]
    else scheduleByDate[key] = next
  }
}

export function getTasksForDate(
  key: string,
  tasksByDate: TasksByDate,
  backlog: Task[],
  order?: string[],
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

  return sortTasksByOrder([...calendarTasks, ...backlogTasks], order)
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
