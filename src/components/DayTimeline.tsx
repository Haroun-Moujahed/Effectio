import { useCallback, type DragEvent } from 'react'
import { Tooltip } from './Tooltip'
import { ScheduleBlock } from './ScheduleBlock'
import { formatSelectedDate } from '../dates'
import {
  createScheduleEntry,
  formatHourLabel,
  HOUR_HEIGHT_PX,
  readEntryDragData,
  readTaskDragData,
  resolveScheduleEntries,
  snapToHour,
  TIMELINE_HEIGHT_PX,
} from '../schedule'
import { ENTRY_DRAG_TYPE } from '../types'
import type { DisplayScheduleEntry, DisplayTask, ScheduleEntry } from '../types'

type DayTimelineProps = {
  date: Date
  entries: ScheduleEntry[]
  tasks: DisplayTask[]
  onPrevDay: () => void
  onNextDay: () => void
  onAddEntry: (entry: ScheduleEntry) => void
  onUpdateEntry: (
    entryId: string,
    patch: Partial<Pick<ScheduleEntry, 'startMinutes' | 'durationMinutes'>>,
  ) => void
  onRemoveEntry: (entryId: string) => void
}

export function DayTimeline({
  date,
  entries,
  tasks,
  onPrevDay,
  onNextDay,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
}: DayTimelineProps) {
  const displayEntries = resolveScheduleEntries(entries, tasks)

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(ENTRY_DRAG_TYPE)
      ? 'move'
      : 'copy'
  }, [])

  function handleDropOnHour(event: DragEvent<HTMLDivElement>, hour: number) {
    event.preventDefault()
    event.stopPropagation()
    const startMinutes = snapToHour(hour * 60)

    const taskPayload = readTaskDragData(event.dataTransfer)
    if (taskPayload) {
      onAddEntry(
        createScheduleEntry(
          taskPayload.taskId,
          taskPayload.taskSource,
          startMinutes,
        ),
      )
      return
    }

    const entryPayload = readEntryDragData(event.dataTransfer)
    if (entryPayload) {
      onUpdateEntry(entryPayload.entryId, { startMinutes })
    }
  }

  const scheduledCount = displayEntries.length
  const taskCount = tasks.length

  return (
    <section className="schedule-card calendar-card">
      <div className="schedule-header month-nav">
        <Tooltip label="Previous day" placement="bottom">
          <button
            type="button"
            className="nav-btn"
            onClick={onPrevDay}
            aria-label="Previous day"
          >
            <ChevronIcon direction="left" />
          </button>
        </Tooltip>

        <div className="schedule-header-center">
          <h2 className="calendar-title">{formatSelectedDate(date)}</h2>
          <p className="schedule-subtitle">
            {taskCount === 0
              ? 'No tasks'
              : `${taskCount} task${taskCount === 1 ? '' : 's'}`}
            {' · '}
            {scheduledCount} scheduled
          </p>
        </div>

        <Tooltip label="Next day" placement="bottom">
          <button
            type="button"
            className="nav-btn"
            onClick={onNextDay}
            aria-label="Next day"
          >
            <ChevronIcon direction="right" />
          </button>
        </Tooltip>
      </div>

      <div className="schedule-timeline-scroll">
        <div
          className="schedule-timeline"
          style={{ height: `${TIMELINE_HEIGHT_PX}px` }}
          onDragOver={handleDragOver}
        >
          <div className="schedule-hours">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="schedule-hour-row"
                style={{ height: `${HOUR_HEIGHT_PX}px` }}
              >
                <span className="schedule-hour-label">{formatHourLabel(hour)}</span>
                <div
                  className="schedule-hour-slot"
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDropOnHour(event, hour)}
                />
              </div>
            ))}
          </div>

          <div className="schedule-blocks-layer">
            {displayEntries.map((entry: DisplayScheduleEntry) => (
              <ScheduleBlock
                key={entry.id}
                entry={entry}
                onRemove={onRemoveEntry}
                onResize={(entryId, durationMinutes) =>
                  onUpdateEntry(entryId, { durationMinutes })
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M14 6 8 12l6 6' : 'M10 6l6 6-6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
