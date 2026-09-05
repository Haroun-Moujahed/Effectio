import { type DragEvent } from 'react'

type TaskDragHandleProps = {
  label: string
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void
  onDragEnd: () => void
}

export function TaskDragHandle({
  label,
  onDragStart,
  onDragEnd,
}: TaskDragHandleProps) {
  return (
    <button
      type="button"
      className="task-drag-handle"
      draggable
      aria-label={label}
      title="Drag to reorder"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <span className="task-drag-dots" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} />
        ))}
      </span>
    </button>
  )
}
