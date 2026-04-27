import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { GripVertical, Calendar, CheckCircle2, Circle } from 'lucide-react'
import type { Kesibukan, SubKesibukan, KesibukanStep } from '../../types'
import { calcSubProgress, calcSubStatus } from '../../store/useKesibukanStore'
import { formatDateMini, daysUntil } from '../../utils/formatDate'

type SubColId = 'belum_mulai' | 'berjalan' | 'selesai'

const COLUMNS: {
  id: SubColId
  label: string
  dot: string
  activeBg: string
  activeBorder: string
}[] = [
  {
    id: 'belum_mulai',
    label: 'Belum Mulai',
    dot: 'bg-gray-400',
    activeBg: 'bg-gray-50 dark:bg-gray-900/20',
    activeBorder: 'border-gray-300 dark:border-gray-600/50',
  },
  {
    id: 'berjalan',
    label: 'Sedang Berjalan',
    dot: 'bg-blue-500',
    activeBg: 'bg-blue-50 dark:bg-blue-950/20',
    activeBorder: 'border-blue-300 dark:border-blue-700/50',
  },
  {
    id: 'selesai',
    label: 'Selesai',
    dot: 'bg-green-500',
    activeBg: 'bg-green-50 dark:bg-green-950/20',
    activeBorder: 'border-green-300 dark:border-green-700/50',
  },
]

interface SubKesibukanFlat {
  sub: SubKesibukan
  parentId: string
  parentName: string
  parentColor: string
  status: SubColId
  draggableId: string
}

function flattenSubs(items: Kesibukan[]): SubKesibukanFlat[] {
  return items.flatMap((k) =>
    k.subKesibukan.map((sub) => ({
      sub,
      parentId: k.id,
      parentName: k.name,
      parentColor: k.colorLabel,
      status: calcSubStatus(sub) as SubColId,
      draggableId: `${k.id}::${sub.id}`,
    }))
  )
}

function StepRow({ step }: { step: KesibukanStep }) {
  return (
    <div className="flex items-start gap-1.5 py-0.5">
      {step.isCompleted ? (
        <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-green-500" />
      ) : (
        <Circle size={11} className="mt-0.5 shrink-0 text-text-muted" />
      )}
      <span
        className={[
          'text-[10px] leading-tight',
          step.isCompleted ? 'line-through text-text-muted' : 'text-text-secondary',
        ].join(' ')}
      >
        {step.name}
      </span>
    </div>
  )
}

function SubKanbanCardVisual({
  flat,
  overlay = false,
  listeners,
  attributes,
}: {
  flat: SubKesibukanFlat
  overlay?: boolean
  listeners?: SyntheticListenerMap
  attributes?: DraggableAttributes
}) {
  const { sub, parentName, parentColor } = flat
  const progress = calcSubProgress(sub)
  const daysLeft = sub.deadline ? daysUntil(sub.deadline) : null
  const isOverdue = daysLeft !== null && daysLeft < 0
  const isCritical = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3
  const visibleSteps = sub.steps.slice(0, 4)
  const extraCount = sub.steps.length - visibleSteps.length

  return (
    <div
      className={[
        'bg-bg-card border border-border rounded-xl overflow-hidden transition-all duration-150',
        overlay ? 'shadow-xl rotate-1 scale-[1.02]' : 'hover:shadow-sm',
      ].join(' ')}
    >
      <div className="h-1 shrink-0" style={{ backgroundColor: parentColor }} />
      <div className="p-3 flex items-start gap-2">
        {listeners && (
          <button
            {...listeners}
            {...attributes}
            className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary touch-none"
            aria-label="Seret kartu"
            tabIndex={-1}
          >
            <GripVertical size={14} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {/* Parent kesibukan badge */}
          <div
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium mb-1 max-w-full truncate"
            style={{ backgroundColor: `${parentColor}25`, color: parentColor }}
          >
            {parentName}
          </div>

          {/* Sub-kesibukan name */}
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">
            {sub.name}
          </h3>

          {/* Steps list */}
          {sub.steps.length > 0 && (
            <div className="mt-2 space-y-0">
              {visibleSteps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
              {extraCount > 0 && (
                <p className="text-[10px] text-text-muted pl-4">+{extraCount} langkah lainnya</p>
              )}
            </div>
          )}

          {/* Progress bar */}
          {sub.steps.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>
                  {sub.steps.filter((s) => s.isCompleted).length}/{sub.steps.length} selesai
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-1 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${progress}%`, backgroundColor: parentColor }}
                />
              </div>
            </div>
          )}

          {/* Deadline */}
          {sub.deadline && (
            <div className="flex items-center gap-1 mt-1.5">
              <Calendar
                size={10}
                className={
                  isOverdue ? 'text-danger' : isCritical ? 'text-warning' : 'text-text-muted'
                }
              />
              <span
                className={[
                  'text-[10px]',
                  isOverdue
                    ? 'text-danger font-medium'
                    : isCritical
                    ? 'text-warning font-medium'
                    : 'text-text-muted',
                ].join(' ')}
              >
                {formatDateMini(sub.deadline)}
                {isOverdue ? ' · Terlambat' : isCritical ? ` · ${daysLeft}h lagi` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DraggableSubCard({ flat, isActive }: { flat: SubKesibukanFlat; isActive: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: flat.draggableId })
  return (
    <div ref={setNodeRef} className={isActive ? 'opacity-30' : ''}>
      <SubKanbanCardVisual flat={flat} listeners={listeners} attributes={attributes} />
    </div>
  )
}

function DroppableColumn({
  col,
  flats,
  activeId,
}: {
  col: (typeof COLUMNS)[number]
  flats: SubKesibukanFlat[]
  activeId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className="flex flex-col flex-1 min-w-[260px] max-w-sm">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
        <span className="text-xs font-semibold text-text-primary">{col.label}</span>
        <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-bg-secondary text-text-muted rounded-full font-medium leading-none">
          {flats.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={[
          'flex-1 min-h-[320px] rounded-xl p-2 space-y-2 border-2 transition-colors duration-150',
          isOver
            ? `${col.activeBg} ${col.activeBorder}`
            : 'bg-bg-secondary/40 border-transparent',
        ].join(' ')}
      >
        {flats.map((flat) => (
          <DraggableSubCard
            key={flat.draggableId}
            flat={flat}
            isActive={activeId === flat.draggableId}
          />
        ))}
        {flats.length === 0 && (
          <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-border">
            <span className="text-xs text-text-muted">
              {isOver ? 'Lepaskan di sini' : 'Kosong'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface KanbanViewProps {
  items: Kesibukan[]
  onSetSubComplete: (kId: string, subId: string, complete: boolean) => void
}

export function KanbanView({ items, onSetSubComplete }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const allFlats = flattenSubs(items)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const activeFlat = activeId ? (allFlats.find((f) => f.draggableId === activeId) ?? null) : null

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const targetCol = over.id as SubColId
    const flat = allFlats.find((f) => f.draggableId === active.id)
    if (!flat || flat.status === targetCol) return

    if (targetCol === 'selesai') {
      onSetSubComplete(flat.parentId, flat.sub.id, true)
    } else if (flat.status === 'selesai') {
      onSetSubComplete(flat.parentId, flat.sub.id, false)
    }
  }

  const handleDragCancel = () => setActiveId(null)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            col={col}
            flats={allFlats.filter((f) => f.status === col.id)}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeFlat && <SubKanbanCardVisual flat={activeFlat} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
