import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, Check } from 'lucide-react'
import type { GoalStep } from '../../types'
import { formatDateMini, daysUntil } from '../../utils/formatDate'

interface SortableStepProps {
  step: GoalStep
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function SortableStep({ step, onToggle, onDelete }: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const daysLeft = step.targetDate ? daysUntil(step.targetDate) : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={['flex items-center gap-2 p-2 rounded-lg bg-bg-secondary group', isDragging ? 'opacity-50 shadow-lg' : ''].join(' ')}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="text-text-muted cursor-grab active:cursor-grabbing p-0.5 touch-none"
      >
        <GripVertical size={14} />
      </button>
      <button
        onClick={() => onToggle(step.id)}
        aria-label={step.isCompleted ? 'Batalkan selesai' : 'Tandai selesai'}
        className={[
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0',
          step.isCompleted
            ? 'bg-success border-success text-white'
            : 'border-border hover:border-success',
        ].join(' ')}
      >
        {step.isCompleted && <Check size={10} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={['text-sm', step.isCompleted ? 'line-through text-text-muted' : 'text-text-primary'].join(' ')}>
          {step.title}
        </p>
        {step.targetDate && (
          <p className={[
            'text-xs',
            daysLeft !== null && daysLeft < 0 ? 'text-danger' : daysLeft !== null && daysLeft <= 3 ? 'text-warning' : 'text-text-muted',
          ].join(' ')}>
            {formatDateMini(step.targetDate)}
          </p>
        )}
      </div>
      <button
        onClick={() => onDelete(step.id)}
        aria-label="Hapus langkah"
        className="p-1 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-all rounded"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

interface StepListProps {
  goalId: string
  steps: GoalStep[]
  onToggle: (goalId: string, stepId: string) => void
  onDelete: (goalId: string, stepId: string) => void
  onAdd: (goalId: string, title: string, targetDate?: string) => void
  onReorder: (goalId: string, activeId: string, overId: string) => void
}

export function StepList({ goalId, steps, onToggle, onDelete, onAdd, onReorder }: StepListProps) {
  const [newTitle, setNewTitle] = useState('')
  const sorted = [...steps].sort((a, b) => a.order - b.order)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder(goalId, active.id as string, over.id as string)
    }
  }

  const handleAddStep = () => {
    const title = newTitle.trim()
    if (!title) return
    onAdd(goalId, title)
    setNewTitle('')
  }

  return (
    <div className="space-y-2 pt-1">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sorted.map((step) => (
            <SortableStep
              key={step.id}
              step={step}
              onToggle={(id) => onToggle(goalId, id)}
              onDelete={(id) => onDelete(goalId, id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-1.5 text-sm bg-bg-secondary border border-transparent rounded-lg outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-text-muted text-text-primary"
          placeholder="Tambah langkah baru..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep() } }}
        />
        <button
          onClick={handleAddStep}
          aria-label="Tambah langkah"
          className="p-1.5 rounded-lg bg-bg-secondary hover:bg-border text-text-secondary transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
