import { useMemo, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Pin } from 'lucide-react'
import type { TodoItem, Kesibukan } from '../../types'

interface MindMapViewProps {
  todos: TodoItem[]
  kesibukan: Kesibukan[]
  onToggle: (id: string) => void
  onEdit: (item: TodoItem) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high:   '#f97316',
  medium: '#6366f1',
  low:    '#94a3b8',
}

interface NodeData {
  id: string
  label: string
  x: number
  y: number
  color: string
  isCenter?: boolean
  parentId?: string
  todo?: TodoItem
  kesibukan?: Kesibukan
}

interface EdgeData {
  from: string
  to: string
  color: string
}

interface LayoutResult {
  nodes: NodeData[]
  edges: EdgeData[]
  canvasWidth: number
  canvasHeight: number
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    // Initial measure
    setWidth(ref.current.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [ref])
  return width
}

// ─── RADIAL LAYOUT (Desktop ≥ 520px) ─────────────────────────────────────────
function buildRadialLayout(
  todos: TodoItem[],
  kesibukan: Kesibukan[],
  containerW: number,
  containerH: number,
  unlinkedTodos: TodoItem[]
): LayoutResult {
  const cx = containerW / 2
  const cy = containerH / 2
  const nodes: NodeData[] = []
  const edges: EdgeData[] = []

  nodes.push({ id: 'center', label: 'To-Do', x: cx, y: cy, color: '#6366f1', isCenter: true })

  const activeK = kesibukan.filter((k) => k.status !== 'selesai')
  const totalBranches = activeK.length + (unlinkedTodos.length > 0 ? 1 : 0)
  if (totalBranches === 0) return { nodes, edges, canvasWidth: containerW, canvasHeight: containerH }

  // Adaptive radii — leave padding so nodes stay inside canvas
  const padding = 80
  const maxR = Math.min(cx, cy) - padding
  const kRadius = Math.min(maxR * 0.42, 180)
  const tRadius = Math.min(maxR * 0.84, 300)
  const angleStep = (2 * Math.PI) / totalBranches

  activeK.forEach((k, ki) => {
    const angle = ki * angleStep - Math.PI / 2
    const kx = cx + kRadius * Math.cos(angle)
    const ky = cy + kRadius * Math.sin(angle)

    nodes.push({ id: k.id, label: k.name, x: kx, y: ky, color: k.colorLabel, kesibukan: k })
    edges.push({ from: 'center', to: k.id, color: k.colorLabel + '70' })

    const kTodos = todos.filter((t) => t.kesibukanId === k.id && !t.isCompleted)
    if (kTodos.length === 0) return

    const spread = Math.min(Math.PI * 0.65, (kTodos.length - 1) * 0.38)
    kTodos.forEach((todo, ti) => {
      const offset = kTodos.length === 1 ? 0 : -spread / 2 + (ti / (kTodos.length - 1)) * spread
      const tAngle = angle + offset
      const tx = cx + tRadius * Math.cos(tAngle)
      const ty = cy + tRadius * Math.sin(tAngle)
      nodes.push({
        id: todo.id, label: todo.title, x: tx, y: ty,
        color: PRIORITY_COLORS[todo.priority] ?? '#6366f1',
        parentId: k.id, todo,
      })
      edges.push({ from: k.id, to: todo.id, color: k.colorLabel + '45' })
    })
  })

  if (unlinkedTodos.length > 0) {
    const angle = activeK.length * angleStep - Math.PI / 2
    const ubx = cx + kRadius * Math.cos(angle)
    const uby = cy + kRadius * Math.sin(angle)
    nodes.push({ id: 'unlinked', label: 'Lainnya', x: ubx, y: uby, color: '#94a3b8' })
    edges.push({ from: 'center', to: 'unlinked', color: '#94a3b860' })

    const spread = Math.min(Math.PI * 0.65, (unlinkedTodos.length - 1) * 0.38)
    unlinkedTodos.forEach((todo, ti) => {
      const offset = unlinkedTodos.length === 1 ? 0 : -spread / 2 + (ti / (unlinkedTodos.length - 1)) * spread
      const tAngle = angle + offset
      const tx = cx + tRadius * Math.cos(tAngle)
      const ty = cy + tRadius * Math.sin(tAngle)
      nodes.push({
        id: todo.id, label: todo.title, x: tx, y: ty,
        color: PRIORITY_COLORS[todo.priority] ?? '#94a3b8',
        parentId: 'unlinked', todo,
      })
      edges.push({ from: 'unlinked', to: todo.id, color: '#94a3b845' })
    })
  }

  return { nodes, edges, canvasWidth: containerW, canvasHeight: containerH }
}

// ─── TREE LAYOUT (Mobile < 520px) ────────────────────────────────────────────
// Layout: Root at top, kesibukan in one row, todos stacked in columns below
function buildTreeLayout(
  todos: TodoItem[],
  kesibukan: Kesibukan[],
  containerW: number,
  unlinkedTodos: TodoItem[]
): LayoutResult {
  const nodes: NodeData[] = []
  const edges: EdgeData[] = []

  const activeK = kesibukan.filter((k) => k.status !== 'selesai')
  const branches: {
    id: string; label: string; color: string; kesibukan?: Kesibukan; todos: TodoItem[]
  }[] = []

  activeK.forEach((k) => {
    branches.push({
      id: k.id, label: k.name, color: k.colorLabel, kesibukan: k,
      todos: todos.filter((t) => t.kesibukanId === k.id && !t.isCompleted),
    })
  })
  if (unlinkedTodos.length > 0) {
    branches.push({ id: 'unlinked', label: 'Lainnya', color: '#94a3b8', todos: unlinkedTodos })
  }

  // Dimensions
  const COL_MIN_W = 160       // minimum column width
  const COL_PADDING = 12      // horizontal padding between columns
  const ROOT_R = 38           // radius of center circle
  const K_W = 110; const K_H = 38   // kesibukan node
  const T_W = 136; const T_H = 44   // todo node
  const T_GAP = 12            // vertical gap between todos
  const ROOT_Y = ROOT_R + 16
  const K_Y = ROOT_Y + ROOT_R + 48
  const T_START_Y = K_Y + K_H / 2 + 40

  const numCols = branches.length || 1
  // Canvas width: at least containerW, but expand if columns need more space
  const colW = Math.max(COL_MIN_W, (containerW - COL_PADDING * 2) / numCols)
  const canvasWidth = Math.max(containerW, numCols * colW + COL_PADDING * 2)
  const totalX = (canvasWidth - numCols * colW) / 2  // left offset to center columns
  const cx = canvasWidth / 2

  // Root node
  nodes.push({ id: 'center', label: 'To-Do', x: cx, y: ROOT_Y, color: '#6366f1', isCenter: true })

  let maxColumnHeight = 0

  branches.forEach((branch, bi) => {
    const kx = totalX + bi * colW + colW / 2
    nodes.push({ id: branch.id, label: branch.label, x: kx, y: K_Y, color: branch.color, kesibukan: branch.kesibukan })
    edges.push({ from: 'center', to: branch.id, color: branch.color + '70' })

    branch.todos.forEach((todo, ti) => {
      const ty = T_START_Y + ti * (T_H + T_GAP)
      nodes.push({
        id: todo.id, label: todo.title, x: kx, y: ty,
        color: PRIORITY_COLORS[todo.priority] ?? '#6366f1',
        parentId: branch.id, todo,
      })
      edges.push({ from: branch.id, to: todo.id, color: branch.color + '45' })

      const bottomEdge = ty + T_H / 2
      if (bottomEdge > maxColumnHeight) maxColumnHeight = bottomEdge
    })
  })

  const canvasHeight = (maxColumnHeight > 0 ? maxColumnHeight : T_START_Y) + 32

  // Unused vars — silence TypeScript
  void COL_PADDING; void K_W; void T_W

  return { nodes, edges, canvasWidth, canvasHeight }
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function MindMapView({ todos, kesibukan, onToggle, onEdit }: MindMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const containerW = useContainerWidth(containerRef)
  const isMobile = containerW > 0 && containerW < 520
  const [selectedKesibukan, setSelectedKesibukan] = useState<string | null>(null)

  const unlinkedTodos = useMemo(
    () => todos.filter((t) => !t.kesibukanId && !t.isCompleted),
    [todos]
  )

  const layout = useMemo<LayoutResult>(() => {
    if (containerW === 0) return { nodes: [], edges: [], canvasWidth: 0, canvasHeight: 0 }
    if (isMobile) {
      return buildTreeLayout(todos, kesibukan, containerW, unlinkedTodos)
    } else {
      const h = Math.max(520, containerW * 0.65)
      return buildRadialLayout(todos, kesibukan, containerW, h, unlinkedTodos)
    }
  }, [containerW, isMobile, todos, kesibukan, unlinkedTodos])

  const nodeMap = useMemo(() => {
    const m: Record<string, NodeData> = {}
    layout.nodes.forEach((n) => (m[n.id] = n))
    return m
  }, [layout.nodes])

  // Node size helpers
  const TODO_W = isMobile ? 128 : 144
  const TODO_H = isMobile ? 42 : 46
  const K_W = isMobile ? 106 : 116
  const K_H = isMobile ? 36 : 40
  const CENTER_R = isMobile ? 38 : 44

  return (
    <div
      ref={containerRef}
      className="w-full overflow-auto"
      style={{ maxHeight: isMobile ? 560 : 680 }}
    >
      {/* Canvas — wider than container on mobile if needed */}
      <div
        style={{
          position: 'relative',
          width: layout.canvasWidth || '100%',
          height: layout.canvasHeight || 500,
          minHeight: isMobile ? 340 : 480,
        }}
      >
        {/* SVG edges */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {layout.edges.map((e) => {
            const from = nodeMap[e.from]
            const to = nodeMap[e.to]
            if (!from || !to) return null
            const dx = to.x - from.x
            const dy = to.y - from.y
            // Smooth bezier
            const cp1x = from.x + dx * 0.4
            const cp1y = from.y + dy * 0.1
            const cp2x = from.x + dx * 0.6
            const cp2y = from.y + dy * 0.9
            return (
              <motion.path
                key={`${e.from}-${e.to}`}
                d={`M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`}
                stroke={e.color}
                strokeWidth={isMobile ? 1.5 : 2}
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {layout.nodes.map((node) => {
          // ── Center node ──
          if (node.isCenter) {
            return (
              <motion.div
                key="center"
                style={{
                  position: 'absolute',
                  left: node.x - CENTER_R,
                  top: node.y - CENTER_R,
                  width: CENTER_R * 2,
                  height: CENTER_R * 2,
                  zIndex: 10,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  className="w-full h-full rounded-full flex items-center justify-center shadow-lg font-bold text-white select-none"
                  style2={{ fontSize: isMobile ? 12 : 14 }}
                >
                  <span style={{ fontSize: isMobile ? 11 : 13 }}>To-Do</span>
                </div>
              </motion.div>
            )
          }

          // ── Todo node ──
          if (node.todo) {
            const todo = node.todo
            const isHighlighted = selectedKesibukan === null || node.parentId === selectedKesibukan
            return (
              <motion.div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.x - TODO_W / 2,
                  top: node.y - TODO_H / 2,
                  width: TODO_W,
                  zIndex: 20,
                  opacity: isHighlighted ? 1 : 0.25,
                  cursor: 'pointer',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: isHighlighted ? 1 : 0.25 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                whileHover={{ scale: 1.04, zIndex: 30 }}
                onDoubleClick={() => onEdit(todo)}
              >
                <div
                  className="rounded-xl shadow-md border"
                  style={{
                    backgroundColor: node.color + '18',
                    borderColor: node.color + '55',
                    padding: isMobile ? '6px 8px' : '7px 10px',
                  }}
                >
                  <div className="flex items-start gap-1.5">
                    <button
                      className="flex-shrink-0 mt-0.5"
                      style={{ color: node.color }}
                      onClick={(e) => { e.stopPropagation(); onToggle(todo.id) }}
                    >
                      {todo.isCompleted
                        ? <CheckCircle2 size={isMobile ? 12 : 13} />
                        : <Circle size={isMobile ? 12 : 13} />
                      }
                    </button>
                    <span
                      className="leading-tight font-medium"
                      style={{
                        color: node.color,
                        fontSize: isMobile ? 10 : 11,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {todo.title}
                    </span>
                    {todo.isPinned && (
                      <Pin size={8} style={{ color: node.color, flexShrink: 0, marginTop: 2 }} />
                    )}
                  </div>
                </div>
              </motion.div>
            )
          }

          // ── Kesibukan / Unlinked node ──
          const isHighlighted = selectedKesibukan === null || selectedKesibukan === node.id
          return (
            <motion.div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x - K_W / 2,
                top: node.y - K_H / 2,
                width: K_W,
                zIndex: 15,
                cursor: 'pointer',
                opacity: isHighlighted ? 1 : 0.4,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: isHighlighted ? 1 : 0.4 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              whileHover={{ scale: 1.06 }}
              onClick={() => setSelectedKesibukan(selectedKesibukan === node.id ? null : node.id)}
            >
              <div
                className="rounded-xl text-center font-semibold border-2 leading-tight"
                style={{
                  backgroundColor: node.color + '22',
                  borderColor: selectedKesibukan === node.id ? node.color : node.color + '65',
                  color: node.color,
                  fontSize: isMobile ? 10 : 11,
                  padding: isMobile ? '6px 6px' : '8px 8px',
                  wordBreak: 'break-word',
                }}
              >
                {node.label}
              </div>
            </motion.div>
          )
        })}

        {/* Legend — bottom right, compact on mobile */}
        {!isMobile && (
          <div className="absolute bottom-3 right-3 flex flex-col gap-1 text-[10px] text-text-muted bg-bg-card/80 backdrop-blur-sm border border-border rounded-lg p-2">
            <p className="font-medium text-text-secondary mb-0.5">Prioritas</p>
            {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
              <div key={p} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                <span className="capitalize">{p}</span>
              </div>
            ))}
            <p className="text-[9px] mt-1 opacity-60">Klik kategori untuk filter · 2× klik todo untuk edit</p>
          </div>
        )}
        {isMobile && (
          <div className="absolute bottom-2 right-2 flex gap-1.5 text-[9px] text-text-muted bg-bg-card/80 backdrop-blur-sm border border-border rounded-md px-1.5 py-1">
            {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
              <div key={p} className="flex items-center gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                <span className="capitalize" style={{ fontSize: 8 }}>{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
