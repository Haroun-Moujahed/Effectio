import { useState, type DragEvent } from 'react'
import { TASK_REORDER_TYPE } from '../types'

type UseListReorderOptions = {
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function useListReorder({ onReorder }: UseListReorderOptions) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function handleDragStart(event: DragEvent, index: number) {
    event.stopPropagation()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(TASK_REORDER_TYPE, String(index))
    event.dataTransfer.setData('text/plain', String(index))
    setDraggingIndex(index)
  }

  function handleDragOver(event: DragEvent, index: number) {
    const types = Array.from(event.dataTransfer.types)
    if (!types.includes(TASK_REORDER_TYPE) && !types.includes('text/plain')) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setOverIndex(index)
  }

  function handleDrop(event: DragEvent, index: number) {
    event.preventDefault()
    const raw =
      event.dataTransfer.getData(TASK_REORDER_TYPE) ||
      event.dataTransfer.getData('text/plain')
    const fromIndex = Number(raw)
    if (raw === '' || !Number.isInteger(fromIndex)) {
      setDraggingIndex(null)
      setOverIndex(null)
      return
    }
    onReorder(fromIndex, index)
    setDraggingIndex(null)
    setOverIndex(null)
  }

  function handleDragEnd() {
    setDraggingIndex(null)
    setOverIndex(null)
  }

  function itemClassName(index: number) {
    return [
      draggingIndex === index ? 'is-dragging' : '',
      overIndex === index && draggingIndex !== index ? 'is-drop-target' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return {
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    itemClassName,
  }
}
