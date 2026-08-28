import { useRef, type DragEvent, type PointerEvent } from 'react'
import {
  clampDuration,
  DURATION_STEP_MINUTES,
  formatTimeRange,
  HOUR_HEIGHT_PX,
  MINUTES_PER_DAY,
  setScheduleDragImage,
  writeEntryDragData,
} from '../schedule'
import type { DisplayScheduleEntry } from '../types'
import { Tooltip } from './Tooltip'

type ScheduleBlockProps = {
  entry: DisplayScheduleEntry
  onRemove: (entryId: string) => void
  onResize: (entryId: string, durationMinutes: number) => void
}

export function ScheduleBlock({ entry, onRemove, onResize }: ScheduleBlockProps) {
  const resizeStartY = useRef(0)
  const resizeStartDuration = useRef(entry.durationMinutes)

  const topPx = (entry.startMinutes / MINUTES_PER_DAY) * (24 * HOUR_HEIGHT_PX)
  const heightPx = (entry.durationMinutes / MINUTES_PER_DAY) * (24 * HOUR_HEIGHT_PX)

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    writeEntryDragData(event.dataTransfer, { entryId: entry.id })
    setScheduleDragImage(
      event.dataTransfer,
      entry.title,
      entry.startMinutes,
      entry.durationMinutes,
    )
  }

  function handleResizePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    const handle = event.currentTarget
    resizeStartY.current = event.clientY
    resizeStartDuration.current = entry.durationMinutes
    handle.setPointerCapture(event.pointerId)

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      const deltaY = moveEvent.clientY - resizeStartY.current
      const deltaMinutes =
        Math.round(((deltaY / HOUR_HEIGHT_PX) * 60) / DURATION_STEP_MINUTES) *
        DURATION_STEP_MINUTES
      const nextDuration = clampDuration(
        entry.startMinutes,
        resizeStartDuration.current + deltaMinutes,
      )
      onResize(entry.id, nextDuration)
    }

    function handlePointerUp(upEvent: globalThis.PointerEvent) {
      handle.releasePointerCapture(upEvent.pointerId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div
      className={`schedule-block ${entry.completed ? 'is-done' : ''}`}
      style={{ top: `${topPx}px`, height: `${Math.max(heightPx, 28)}px` }}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="schedule-block-body">
        <span className="schedule-block-title">{entry.title}</span>
        <span className="schedule-block-time">
          {formatTimeRange(entry.startMinutes, entry.durationMinutes)}
        </span>
      </div>
      <div className="schedule-block-actions">
        <Tooltip label="Remove from schedule" placement="top">
          <button
            type="button"
            className="schedule-block-remove"
            onClick={() => onRemove(entry.id)}
            aria-label={`Remove "${entry.title}" from schedule`}
          >
            ×
          </button>
        </Tooltip>
      </div>
      <div
        className="schedule-block-resize"
        onPointerDown={handleResizePointerDown}
        aria-hidden="true"
      />
    </div>
  )
}
