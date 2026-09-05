import descriptionIcon from '../assets/description-icon.png'
import { MaskedIcon } from './MaskedIcon'
import { Tooltip } from './Tooltip'

export function TaskDescriptionBadge() {
  return (
    <Tooltip label="task has a description" placement="top">
      <span
        className="task-description-badge"
        tabIndex={0}
        aria-label="task has a description"
      >
        <MaskedIcon src={descriptionIcon} className="task-description-icon" />
      </span>
    </Tooltip>
  )
}
