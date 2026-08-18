type MaskedIconProps = {
  src: string
  className?: string
}

export function MaskedIcon({ src, className }: MaskedIconProps) {
  return (
    <span
      className={['icon-mask', className].filter(Boolean).join(' ')}
      style={{ ['--icon' as string]: `url("${src}")` }}
      aria-hidden="true"
    />
  )
}
