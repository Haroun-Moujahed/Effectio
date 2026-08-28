import { useEffect } from 'react'
import { BacklogPage } from '../components/BacklogPage'
import type { Task } from '../types'

type BacklogRoutePageProps = {
  tasks: Task[]
  onAdd: (title: string) => void
  onToggle: (id: string) => void
  onUpdate: (id: string, title: string, description: string) => void
  onDelete: (id: string) => void
  onAssign: (id: string) => void
  onClearAll: () => void
  onCloseTasks: () => void
}

export function BacklogRoutePage({
  tasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onAssign,
  onClearAll,
  onCloseTasks,
}: BacklogRoutePageProps) {
  useEffect(() => {
    onCloseTasks()
  }, [onCloseTasks])

  return (
    <BacklogPage
      tasks={tasks}
      onAdd={onAdd}
      onToggle={onToggle}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onAssign={onAssign}
      onClearAll={onClearAll}
    />
  )
}
