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
import { GripVertical, Calendar } from 'lucide-react'
import type { Kesibukan, KesibukanStatus } from '../../types'
import { calcKesibukanProgress } from '../../store/useKesibukanStore'
import { formatDateMini, daysUntil } from '../../utils/formatDate'

const COLUMNS: {
  id: KesibukanStatus
  label: string
  dot: string
  activeBg: string
  activeBorder: string
}[] = [
  {
    id: 'aktif',
    label: 'Aktif',
    dot: 'bg-blue-500',
    activeBg: 'bg-blue-50 dark:bg-blue-950/20',
    activeBorder: 'border-blue-300 dark:border-blue-700/50',
  },
  {
    id: 'ditunda',
    label: 'Ditunda',
    dot: 'bg-amber-500',
    activeBg: 'bg-amber-50 dark:bg-amber-950/20',
    activeBorder: 'border-amber-300 dark:border-amber-700/50',
  },
  {
    id: 'selesai',
    label: 'Selesai',
    dot: 'bg-green-500',
    activeBg: 'bg-green-50 dark:bg-green-950/20',
    activeBorder: 'border-green-300 dark:border-green-700/50',
  },
]

// Shared visual for both draggable cards and the drag overlay
function KanbanCardVisual({
  kesibukan,
  overlay = false,
  listeners,
  attributes,
}: {
  kesibukan: Kesibukan
  overlay?: boolean
  listeners?: SyntheticListenerMap
  attributes?: DraggableAttributes
}) {
  const progress = calcKesibukanProgress(kesibukan)
  const totalSteps = kesibukan.subKesibukan.reduce((s, sub) => s + sub.steps.length, 0)
  const daysLeft = kesibukan.deadline ? daysUntil(kesibukan.deadline) : null
  const isOverdue = daysLeft !== null && daysLeft < 0
  const isCritical = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3

  return (
    <div
      className={[
        'bg-bg-card border border-border rounded-xl overflow-hidden transition-all duration-150',
        overlay ? 'shadow-xl rotate-1 scale-[1.02]' : 'hover:shadow-sm',
      ].join(' ')}
    >
      <div className="h-1 shrink-0" style={{ backgroundColor: kesibukan.colorLabel }} />
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
          <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">
            {kesibukan.name}
          </h3>
          {kesibukan.description && (
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{kesibukan.description}</p>
          )}

          {totalSteps > 0 && (
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>{kesibukan.subKesibukan.length} sub-kesibukan</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-1 bg-bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${progress}%`, backgroundColor: kesibukan.colorLabel }}
                />
              </div>
            </div>
          )}

          {kesibukan.deadline && (
            <div className="flex items-center gap-1 mt-2">
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
                {formatDateMini(kesibukan.deadline)}
                {isOverdue ? ' · Terlambat' : isCritical ? ` · ${daysLeft}h lagi` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DraggableCard({ kesibukan, isActive }: { kesibukan: Kesibukan; isActive: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: kesibukan.id })
  return (
    <div ref={setNodeRef} className={isActive ? 'opacity-30' : ''}>
      <KanbanCardVisual kesibukan={kesibukan} listeners={listeners} attributes={attributes} />
    </div>
  )
}

function DroppableColumn({
  col,
  items,
  activeId,
}: {
  col: (typeof COLUMNS)[number]
  items: Kesibukan[]
  activeId: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div className="flex flex-col flex-1 min-w-[260px] max-w-sm">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
        <span className="text-xs font-semibold text-text-primary">{col.label}</span>
        <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-bg-secondary text-text-muted rounded-full font-medium leading-none">
          {items.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={[
          'flex-1 min-h-[320px] rounded-xl p-2 space-y-2 border-2 transition-colors duration-150',
          isOver
            ? `${col.activeBg} ${col.activeBorder}`
            : 'bg-bg-secondary/40 border-transparent',
        ].join(' ')}
      >
        {items.map((k) => (
          <DraggableCard key={k.id} kesibukan={k} isActive={activeId === k.id} />
        ))}
        {items.length === 0 && (
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
  onSetStatus: (id: string, status: KesibukanStatus) => void
}

export function KanbanView({ items, onSetStatus }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const activeItem = activeId ? (items.find((k) => k.id === activeId) ?? null) : null

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id))
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over) return
    const newStatus = over.id as KesibukanStatus
    const item = items.find((k) => k.id === active.id)
    if (item && item.status !== newStatus) {
      onSetStatus(String(active.id), newStatus)
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
            items={items.filter((k) => k.status === col.id)}
            activeId={activeId}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {activeItem && <KanbanCardVisual kesibukan={activeItem} overlay />}
      </DragOverlay>
    </DndContext>
  )
}
