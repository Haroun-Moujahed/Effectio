import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  arrow,
  FloatingArrow,
} from '@floating-ui/react'
import { useRef, useState, type ReactNode } from 'react'

type TooltipProps = {
  label: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ label, children, placement = 'bottom' }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const arrowRef = useRef(null)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef, padding: 6 }),
    ],
  })

  const hover = useHover(context, {
    move: false,
    delay: { open: 120, close: 60 },
    mouseOnly: true,
  })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ])

  return (
    <>
      <span
        ref={refs.setReference}
        className="tooltip-anchor"
        {...getReferenceProps({
          onPointerDown() {
            setOpen(false)
          },
          onClick() {
            setOpen(false)
          },
        })}
      >
        {children}
      </span>
      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            className="app-tooltip"
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {label}
            <FloatingArrow ref={arrowRef} context={context} className="app-tooltip-arrow" />
          </div>
        </FloatingPortal>
      ) : null}
    </>
  )
}
