import descriptionIcon from "../assets/description-icon.png";
import { MaskedIcon } from "./MaskedIcon";
import { Tooltip } from "./Tooltip";

export function TaskDescriptionBadge() {
  return (
    <Tooltip label="Task has a description" placement="top">
      <span
        className="task-description-badge"
        tabIndex={0}
        aria-label="Task has a description"
      >
        <MaskedIcon src={descriptionIcon} className="task-description-icon" />
      </span>
    </Tooltip>
  );
}
