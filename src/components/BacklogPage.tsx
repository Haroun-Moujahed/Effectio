import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { Task } from "../types";
import { MaskedIcon } from "./MaskedIcon";
import { Tooltip } from "./Tooltip";
import taskIcon from "../assets/task-icon.png";
import penIcon from "../assets/pen-icon.png";
import chevronIcon from "../assets/chevron.png";

const PAGE_SIZE = 10;

type BacklogPageProps = {
  tasks: Task[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string) => void;
};

export function BacklogPage({
  tasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  onAssign,
}: BacklogPageProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [doneOpen, setDoneOpen] = useState(true);
  const [activeVisible, setActiveVisible] = useState(PAGE_SIZE);
  const [doneVisible, setDoneVisible] = useState(PAGE_SIZE);
  const editInputRef = useRef<HTMLInputElement>(null);
  const activeSentinelRef = useRef<HTMLDivElement>(null);
  const doneSentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTasks = tasks.filter((task) => !task.completed);
  const doneTasks = tasks.filter((task) => task.completed);

  useEffect(() => {
    setActiveVisible((current) => {
      if (activeTasks.length <= PAGE_SIZE) return PAGE_SIZE;
      return Math.min(current, activeTasks.length);
    });
  }, [activeTasks.length]);

  useEffect(() => {
    setDoneVisible((current) => {
      if (doneTasks.length <= PAGE_SIZE) return PAGE_SIZE;
      return Math.min(current, doneTasks.length);
    });
  }, [doneTasks.length]);

  useEffect(() => {
    if (editingId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = activeSentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setActiveVisible((current) =>
          Math.min(current + PAGE_SIZE, activeTasks.length),
        );
      },
      { root, rootMargin: "80px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTasks.length, activeVisible]);

  useEffect(() => {
    if (!doneOpen) return;
    const root = scrollRef.current;
    const sentinel = doneSentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setDoneVisible((current) =>
          Math.min(current + PAGE_SIZE, doneTasks.length),
        );
      },
      { root, rootMargin: "80px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [doneOpen, doneTasks.length, doneVisible]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setEditText(task.text);
  }

  function commitEdit() {
    if (!editingId) return;
    const text = editText.trim();
    if (text) onUpdate(editingId, text);
    setEditingId(null);
    setEditText("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  const visibleActive = activeTasks.slice(0, activeVisible);
  const visibleDone = doneTasks.slice(0, doneVisible);
  const hasMoreActive = activeVisible < activeTasks.length;
  const hasMoreDone = doneVisible < doneTasks.length;

  return (
    <section className="backlog-page">
      <div className="backlog-header">
        <div>
          <h2>Backlog</h2>
          <p>
            {activeTasks.length === 0
              ? "No open tasks"
              : `${activeTasks.length} open · ${doneTasks.length} done`}
          </p>
        </div>
      </div>

      <div className="backlog-scroll" ref={scrollRef}>
        {activeTasks.length === 0 ? (
          <p className="empty-hint">
            Capture tasks here, then assign them to a day.
          </p>
        ) : (
          <ul className="backlog-list">
            {visibleActive.map((task) => (
              <BacklogRow
                key={task.id}
                task={task}
                editing={editingId === task.id}
                editText={editText}
                editInputRef={editInputRef}
                onEditTextChange={setEditText}
                onCommitEdit={commitEdit}
                onEditKeyDown={handleEditKeyDown}
                onToggle={() => onToggle(task.id)}
                onStartEdit={() => startEdit(task)}
                onDelete={() => onDelete(task.id)}
                onAssign={() => onAssign(task.id)}
              />
            ))}
          </ul>
        )}

        {hasMoreActive ? (
          <div
            ref={activeSentinelRef}
            className="backlog-sentinel"
            aria-hidden="true"
          />
        ) : null}

        <form className="backlog-form" onSubmit={handleSubmit}>
          <MaskedIcon src={penIcon} className="backlog-form-icon" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="List item"
            aria-label="Add backlog item"
            maxLength={120}
          />
        </form>

        {doneTasks.length > 0 ? (
          <div className="backlog-done">
            <button
              type="button"
              className="backlog-done-toggle"
              onClick={() => setDoneOpen((open) => !open)}
              aria-expanded={doneOpen}
            >
              <MaskedIcon
                src={chevronIcon}
                className={`backlog-done-chevron ${doneOpen ? "is-open" : ""}`}
              />
              {doneTasks.length} Completed item
              {doneTasks.length === 1 ? "" : "s"}
            </button>

            <div
              className={`backlog-done-panel ${doneOpen ? "is-open" : ""}`}
              aria-hidden={!doneOpen}
            >
              <div className="backlog-done-panel-inner">
                <ul className="backlog-list">
                  {visibleDone.map((task) => (
                    <BacklogRow
                      key={task.id}
                      task={task}
                      editing={editingId === task.id}
                      editText={editText}
                      editInputRef={editInputRef}
                      onEditTextChange={setEditText}
                      onCommitEdit={commitEdit}
                      onEditKeyDown={handleEditKeyDown}
                      onToggle={() => onToggle(task.id)}
                      onStartEdit={() => startEdit(task)}
                      onDelete={() => onDelete(task.id)}
                      onAssign={() => onAssign(task.id)}
                    />
                  ))}
                </ul>
                {hasMoreDone ? (
                  <div
                    ref={doneSentinelRef}
                    className="backlog-sentinel"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

type BacklogRowProps = {
  task: Task;
  editing: boolean;
  editText: string;
  editInputRef: RefObject<HTMLInputElement | null>;
  onEditTextChange: (value: string) => void;
  onCommitEdit: () => void;
  onEditKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
};

function BacklogRow({
  task,
  editing,
  editText,
  editInputRef,
  onEditTextChange,
  onCommitEdit,
  onEditKeyDown,
  onToggle,
  onStartEdit,
  onDelete,
  onAssign,
}: BacklogRowProps) {
  return (
    <li className={`backlog-item ${task.completed ? "is-done" : ""}`}>
      <button
        type="button"
        className="task-check"
        onClick={onToggle}
        aria-pressed={task.completed}
        aria-label={
          task.completed
            ? `Mark "${task.text}" as incomplete`
            : `Mark "${task.text}" as complete`
        }
      >
        <TickIcon />
      </button>

      {editing ? (
        <input
          ref={editInputRef}
          className="task-edit-input"
          value={editText}
          onChange={(event) => onEditTextChange(event.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={onEditKeyDown}
          aria-label="Update task"
          maxLength={120}
        />
      ) : (
        <span className="task-text">{task.text}</span>
      )}

      <div className="task-actions">
        <Tooltip label="Assign to day" placement="top">
          <button
            type="button"
            className="task-action"
            onClick={onAssign}
            aria-label={`Assign "${task.text}" to a day`}
          >
            <CalendarActionIcon />
          </button>
        </Tooltip>
        <Tooltip label="Edit task" placement="top">
          <button
            type="button"
            className="task-action"
            onClick={onStartEdit}
            aria-label={`Update "${task.text}"`}
          >
            <MaskedIcon src={taskIcon} />
          </button>
        </Tooltip>
        <Tooltip label="Delete task" placement="top">
          <button
            type="button"
            className="task-action task-delete"
            onClick={onDelete}
            aria-label={`Delete "${task.text}"`}
          >
            ×
          </button>
        </Tooltip>
      </div>
    </li>
  );
}

function TickIcon() {
  return (
    <svg className="task-check-tick" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M5 10.5 8.2 13.7 15 6.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarActionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="backlog-calendar-icon"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5v3M16 3.5v3M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
