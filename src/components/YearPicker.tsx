import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

const MIN_YEAR = 1970
const MAX_YEAR = 2100

type YearPickerProps = {
  year: number
  onSelectYear: (year: number) => void
}

export function YearPicker({ year, onSelectYear }: YearPickerProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const selectedRef = useRef<HTMLButtonElement | null>(null)
  const years = useMemo(() => {
    const start = Math.min(MIN_YEAR, year)
    const end = Math.max(MAX_YEAR, year)
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [year])

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(6),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            minWidth: `${Math.max(rects.reference.width, 108)}px`,
            maxHeight: `${Math.min(availableHeight, 280)}px`,
          })
        },
      }),
    ],
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'listbox' })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ])

  useEffect(() => {
    if (!open) return
    selectedRef.current?.scrollIntoView({ block: 'center' })
  }, [open, year])

  function selectYear(nextYear: number) {
    onSelectYear(nextYear)
    setOpen(false)
  }

  function moveSelection(event: KeyboardEvent<HTMLElement>) {
    const currentIndex = years.indexOf(year)
    let nextIndex = currentIndex

    if (event.key === 'ArrowDown') nextIndex = Math.min(years.length - 1, currentIndex + 1)
    else if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1)
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = years.length - 1
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(false)
      return
    } else return

    event.preventDefault()
    onSelectYear(years[nextIndex])
  }

  return (
    <div className="year-picker">
      <button
        type="button"
        className="year-picker-trigger"
        ref={refs.setReference}
        {...getReferenceProps()}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Select year, currently ${year}`}
      >
        <span>{year}</span>
        <ChevronDown />
      </button>

      {open ? (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              id={listId}
              ref={refs.setFloating}
              className="year-picker-menu"
              style={floatingStyles}
              role="listbox"
              tabIndex={0}
              aria-label="Years"
              aria-activedescendant={`${listId}-${year}`}
              {...getFloatingProps({
                onKeyDown: moveSelection,
              })}
            >
              {years.map((optionYear) => {
                const selected = optionYear === year
                return (
                  <button
                    key={optionYear}
                    type="button"
                    id={`${listId}-${optionYear}`}
                    role="option"
                    aria-selected={selected}
                    className={`year-picker-option${selected ? ' is-selected' : ''}`}
                    ref={selected ? selectedRef : undefined}
                    tabIndex={-1}
                    onClick={() => selectYear(optionYear)}
                  >
                    {optionYear}
                  </button>
                )
              })}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      ) : null}
    </div>
  )
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 9.5 12 15l5.5-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
