import { type DragEvent } from 'react'
import { Tooltip } from './Tooltip'

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
    <Tooltip label="Drag to reorder" placement="top">
      <button
        type="button"
        className="task-drag-handle"
        draggable
        aria-label={label}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <span className="task-drag-dots" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} />
          ))}
        </span>
      </button>
    </Tooltip>
  )
}
