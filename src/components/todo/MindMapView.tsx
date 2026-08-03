import { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Pin } from "lucide-react";
import type { TodoItem, Kesibukan } from "../../types";

interface MindMapViewProps {
  todos: TodoItem[];
  kesibukan: Kesibukan[];
  onToggle: (id: string) => void;
  onEdit: (item: TodoItem) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  high: "#f97316",
  medium: "#6366f1",
  low: "#94a3b8",
};

// ─── Node dimensions: desktop & mobile ────────────────────────────────────────
const DIM = {
  // Desktop (horizontal tree: center-left → kesibukan → todos)
  d: { centerR: 48, kW: 144, kH: 40, tW: 168, tH: 52, gap: 16, pad: 56 },
  // Mobile (vertical tree: center-top → kesibukan → todos)
  m: { centerR: 36, kW: 120, kH: 36, tW: 148, tH: 46, gap: 12, pad: 32 },
};

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "center" | "kesibukan" | "todo";
  color: string;
  parentId?: string;
  todo?: TodoItem;
  kesibukan?: Kesibukan;
}

interface EdgeData {
  from: string;
  to: string;
  color: string;
}

interface LayoutResult {
  nodes: NodeData[];
  edges: EdgeData[];
  canvasWidth: number;
  canvasHeight: number;
}

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    setWidth(ref.current.getBoundingClientRect().width);
    const ro = new ResizeObserver((e) => setWidth(e[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function rectEdge(
  nx: number,
  ny: number,
  hw: number,
  hh: number,
  ox: number,
  oy: number,
): [number, number] {
  const dx = ox - nx,
    dy = oy - ny;
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return [nx, ny];
  const tx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const ty = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty);
  return [nx + dx * t, ny + dy * t];
}

function circleEdge(
  nx: number,
  ny: number,
  r: number,
  ox: number,
  oy: number,
): [number, number] {
  const dx = ox - nx,
    dy = oy - ny;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.001) return [nx, ny - r];
  return [nx + (dx / d) * r, ny + (dy / d) * r];
}

// ─── DESKTOP LAYOUT: horizontal tree ─────────────────────────────────────────
// center (left) → kesibukan (middle) → todos (right), stacked vertically
function buildDesktopLayout(
  todos: TodoItem[],
  kesibukan: Kesibukan[],
  containerW: number,
  unlinkedTodos: TodoItem[],
): LayoutResult {
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];
  const { centerR, kW, kH, tW, tH, gap, pad } = DIM.d;

  const activeK = kesibukan.filter((k) => k.status !== "selesai");
  const branches: {
    id: string;
    label: string;
    color: string;
    kesibukan?: Kesibukan;
    todos: TodoItem[];
  }[] = [];
  activeK.forEach((k) => {
    branches.push({
      id: k.id,
      label: k.name,
      color: k.colorLabel,
      kesibukan: k,
      todos: todos.filter((t) => t.kesibukanId === k.id && !t.isCompleted),
    });
  });
  if (unlinkedTodos.length > 0) {
    branches.push({
      id: "unlinked",
      label: "Lainnya",
      color: "#94a3b8",
      todos: unlinkedTodos,
    });
  }

  const col0x = pad + centerR;
  const col1x = col0x + centerR + gap * 2 + kW / 2;
  const col2x = col1x + kW / 2 + gap * 2 + tW / 2;

  let cursor = pad;
  const branchLayouts: {
    id: string;
    color: string;
    kesibukan?: Kesibukan;
    label: string;
    ky: number;
    todos: { todo: TodoItem; ty: number }[];
  }[] = [];

  branches.forEach((branch) => {
    const n = branch.todos.length;
    const todoBlockH = n === 0 ? 0 : n * tH + (n - 1) * gap;
    const slotH = Math.max(kH, todoBlockH);
    const slotTop = cursor;
    const ky = slotTop + slotH / 2;
    const todoStartY = slotTop + (slotH - todoBlockH) / 2 + tH / 2;
    branchLayouts.push({
      id: branch.id,
      color: branch.color,
      kesibukan: branch.kesibukan,
      label: branch.label,
      ky,
      todos: branch.todos.map((todo, ti) => ({
        todo,
        ty: todoStartY + ti * (tH + gap),
      })),
    });
    cursor = slotTop + slotH + gap;
  });

  const totalH = cursor - gap;
  const centerY = totalH / 2 + pad / 2;
  const rightEdge = branches.some((b) => b.todos.length > 0)
    ? col2x + tW / 2
    : col1x + kW / 2;
  const canvasWidth = Math.max(containerW, rightEdge + pad);
  const canvasHeight = Math.max(480, totalH + pad * 2);

  nodes.push({
    id: "center",
    label: "To-Do",
    x: col0x,
    y: centerY,
    type: "center",
    color: "#6366f1",
  });

  branchLayouts.forEach((bl) => {
    nodes.push({
      id: bl.id,
      label: bl.label,
      x: col1x,
      y: bl.ky,
      type: "kesibukan",
      color: bl.color,
      kesibukan: bl.kesibukan,
    });
    edges.push({ from: "center", to: bl.id, color: bl.color + "90" });
    bl.todos.forEach(({ todo, ty }) => {
      nodes.push({
        id: todo.id,
        label: todo.title,
        x: col2x,
        y: ty,
        type: "todo",
        color: PRIORITY_COLORS[todo.priority] ?? "#6366f1",
        parentId: bl.id,
        todo,
      });
      edges.push({ from: bl.id, to: todo.id, color: bl.color + "60" });
    });
  });

  return { nodes, edges, canvasWidth, canvasHeight };
}

// ─── MOBILE LAYOUT: vertical tree ────────────────────────────────────────────
// center (top) → per branch: kesibukan (below center) → todos (below kesibukan)
// Each branch is a column, arranged left-to-right.
// If only 1 branch → single centered column.
function buildMobileLayout(
  todos: TodoItem[],
  kesibukan: Kesibukan[],
  containerW: number,
  unlinkedTodos: TodoItem[],
): LayoutResult {
  const nodes: NodeData[] = [];
  const edges: EdgeData[] = [];
  const { centerR, kW, kH, tW, tH, gap, pad } = DIM.m;
  void kW;

  const activeK = kesibukan.filter((k) => k.status !== "selesai");
  const branches: {
    id: string;
    label: string;
    color: string;
    kesibukan?: Kesibukan;
    todos: TodoItem[];
  }[] = [];
  activeK.forEach((k) => {
    branches.push({
      id: k.id,
      label: k.name,
      color: k.colorLabel,
      kesibukan: k,
      todos: todos.filter((t) => t.kesibukanId === k.id && !t.isCompleted),
    });
  });
  if (unlinkedTodos.length > 0) {
    branches.push({
      id: "unlinked",
      label: "Lainnya",
      color: "#94a3b8",
      todos: unlinkedTodos,
    });
  }

  // Column width: at least tW + gap on each side
  const colW = Math.max(
    tW + gap * 2,
    containerW / Math.max(branches.length, 1),
  );
  const nCols = branches.length || 1;
  const canvasWidth = Math.max(containerW, nCols * colW + pad);

  // Row Y positions
  const centerY = pad + centerR;
  const kRowY = centerY + centerR + gap * 3 + kH / 2;
  // todos start below kesibukan — each branch has its own column stack

  // Center node (horizontally centered)
  const cx = canvasWidth / 2;
  nodes.push({
    id: "center",
    label: "To-Do",
    x: cx,
    y: centerY,
    type: "center",
    color: "#6366f1",
  });

  let maxBottomY = kRowY + kH / 2;

  branches.forEach((branch, bi) => {
    const colCx = pad / 2 + bi * colW + colW / 2;

    // Kesibukan node
    nodes.push({
      id: branch.id,
      label: branch.label,
      x: colCx,
      y: kRowY,
      type: "kesibukan",
      color: branch.color,
      kesibukan: branch.kesibukan,
    });
    edges.push({ from: "center", to: branch.id, color: branch.color + "90" });

    // Todo nodes stacked below kesibukan
    branch.todos.forEach((todo, ti) => {
      const ty = kRowY + kH / 2 + gap * 2 + tH / 2 + ti * (tH + gap);
      nodes.push({
        id: todo.id,
        label: todo.title,
        x: colCx,
        y: ty,
        type: "todo",
        color: PRIORITY_COLORS[todo.priority] ?? "#6366f1",
        parentId: branch.id,
        todo,
      });
      edges.push({ from: branch.id, to: todo.id, color: branch.color + "60" });
      maxBottomY = Math.max(maxBottomY, ty + tH / 2);
    });
  });

  const canvasHeight = maxBottomY + pad * 2;

  return { nodes, edges, canvasWidth, canvasHeight };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function MindMapView({
  todos,
  kesibukan,
  onToggle,
  onEdit,
}: MindMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerW = useContainerWidth(containerRef);
  const isMobile = containerW > 0 && containerW < 540;
  const [selectedKesibukan, setSelectedKesibukan] = useState<string | null>(
    null,
  );

  const unlinkedTodos = useMemo(
    () => todos.filter((t) => !t.kesibukanId && !t.isCompleted),
    [todos],
  );

  const layout = useMemo<LayoutResult>(() => {
    if (containerW === 0)
      return { nodes: [], edges: [], canvasWidth: 0, canvasHeight: 0 };
    if (isMobile)
      return buildMobileLayout(todos, kesibukan, containerW, unlinkedTodos);
    return buildDesktopLayout(todos, kesibukan, containerW, unlinkedTodos);
  }, [containerW, isMobile, todos, kesibukan, unlinkedTodos]);

  const nodeMap = useMemo(() => {
    const m: Record<string, NodeData> = {};
    layout.nodes.forEach((n) => (m[n.id] = n));
    return m;
  }, [layout.nodes]);

  const dim = isMobile ? DIM.m : DIM.d;
  const { centerR, kH, tW, tH } = dim;
  const kW = dim.kW;

  // Bezier curve style depends on layout direction
  function edgePath(fromN: NodeData, toN: NodeData): string {
    // Start
    let sx: number, sy: number;
    if (fromN.type === "center")
      [sx, sy] = circleEdge(fromN.x, fromN.y, centerR, toN.x, toN.y);
    else if (fromN.type === "kesibukan")
      [sx, sy] = rectEdge(fromN.x, fromN.y, kW / 2, kH / 2, toN.x, toN.y);
    else [sx, sy] = rectEdge(fromN.x, fromN.y, tW / 2, tH / 2, toN.x, toN.y);
    // End
    let ex: number, ey: number;
    if (toN.type === "center")
      [ex, ey] = circleEdge(toN.x, toN.y, centerR, fromN.x, fromN.y);
    else if (toN.type === "kesibukan")
      [ex, ey] = rectEdge(toN.x, toN.y, kW / 2, kH / 2, fromN.x, fromN.y);
    else [ex, ey] = rectEdge(toN.x, toN.y, tW / 2, tH / 2, fromN.x, fromN.y);

    const dx = ex - sx,
      dy = ey - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 4) return "";

    if (isMobile) {
      // Vertical tree → horizontal bezier handles
      const off = Math.min(dist * 0.45, 60);
      return `M ${sx} ${sy} C ${sx} ${sy + off}, ${ex} ${ey - off}, ${ex} ${ey}`;
    } else {
      // Horizontal tree → vertical bezier handles
      const off = Math.min(dist * 0.45, 80);
      return `M ${sx} ${sy} C ${sx + off} ${sy}, ${ex - off} ${ey}, ${ex} ${ey}`;
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{
        overflowX: isMobile ? "auto" : "hidden",
        overflowY: "auto",
        maxHeight: isMobile ? 560 : 720,
      }}
    >
      {/* Scroll hint on mobile */}
      {isMobile && layout.canvasWidth > containerW && (
        <div className="flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-text-muted opacity-60 select-none">
          <span>←</span>
          <span>geser untuk melihat lebih</span>
          <span>→</span>
        </div>
      )}

      <div
        style={{
          position: "relative",
          width: layout.canvasWidth || "100%",
          height: layout.canvasHeight || (isMobile ? 400 : 480),
          minHeight: isMobile ? 360 : 480,
        }}
      >
        {/* ── SVG edges ── */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <defs>
            <filter id="mm-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {layout.edges.map((e) => {
            const fromN = nodeMap[e.from];
            const toN = nodeMap[e.to];
            if (!fromN || !toN) return null;
            const d = edgePath(fromN, toN);
            if (!d) return null;
            const isTrunk = e.from === "center";
            return (
              <motion.path
                key={`${e.from}-${e.to}`}
                d={d}
                stroke={e.color}
                strokeWidth={isTrunk ? 2.5 : 1.8}
                strokeLinecap="round"
                fill="none"
                filter={isTrunk ? "url(#mm-glow)" : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            );
          })}
        </svg>

        {/* ── Nodes ── */}
        {layout.nodes.map((node) => {
          // ── Center ──
          if (node.type === "center") {
            return (
              <motion.div
                key="center"
                style={{
                  position: "absolute",
                  left: node.x - centerR,
                  top: node.y - centerR,
                  width: centerR * 2,
                  height: centerR * 2,
                  zIndex: 10,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.4,
                  type: "spring",
                  stiffness: 220,
                  damping: 18,
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center font-bold text-white select-none"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    boxShadow: "0 0 28px 8px #6366f140, 0 4px 16px #0008",
                    fontSize: isMobile ? 12 : 14,
                    letterSpacing: "0.04em",
                  }}
                >
                  To-Do
                </div>
              </motion.div>
            );
          }

          // ── Todo ──
          if (node.type === "todo") {
            const todo = node.todo!;
            const isHighlighted =
              selectedKesibukan === null || node.parentId === selectedKesibukan;
            return (
              <motion.div
                key={node.id}
                style={{
                  position: "absolute",
                  left: node.x - tW / 2,
                  top: node.y - tH / 2,
                  width: tW,
                  height: tH,
                  zIndex: 20,
                  cursor: "pointer",
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: isHighlighted ? 1 : 0.18 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                whileHover={{ scale: 1.03, zIndex: 30 }}
                onDoubleClick={() => onEdit(todo)}
              >
                <div
                  className="w-full h-full rounded-xl border flex items-center"
                  style={{
                    backgroundColor: node.color + "18",
                    borderColor: node.color + "65",
                    padding: `0 ${isMobile ? 9 : 12}px`,
                    boxShadow: `0 2px 10px ${node.color}1a`,
                  }}
                >
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <button
                      className="flex-shrink-0"
                      style={{ color: node.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(todo.id);
                      }}
                    >
                      {todo.isCompleted ? (
                        <CheckCircle2 size={isMobile ? 13 : 14} />
                      ) : (
                        <Circle size={isMobile ? 13 : 14} />
                      )}
                    </button>
                    <span
                      className="leading-tight font-medium flex-1 min-w-0"
                      style={{
                        color: node.color,
                        fontSize: isMobile ? 11 : 12,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {todo.title}
                    </span>
                    {todo.isPinned && (
                      <Pin
                        size={9}
                        style={{ color: node.color, flexShrink: 0 }}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }

          // ── Kesibukan ──
          const isHighlighted =
            selectedKesibukan === null || selectedKesibukan === node.id;
          const isSelected = selectedKesibukan === node.id;
          return (
            <motion.div
              key={node.id}
              style={{
                position: "absolute",
                left: node.x - kW / 2,
                top: node.y - kH / 2,
                width: kW,
                height: kH,
                zIndex: 15,
                cursor: "pointer",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: isHighlighted ? 1 : 0.25 }}
              transition={{
                duration: 0.35,
                delay: 0.05,
                type: "spring",
                stiffness: 180,
                damping: 16,
              }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedKesibukan(isSelected ? null : node.id)}
            >
              <div
                className="w-full h-full rounded-xl flex items-center justify-center text-center font-semibold border-2 select-none"
                style={{
                  backgroundColor: isSelected
                    ? node.color + "30"
                    : node.color + "1a",
                  borderColor: isSelected ? node.color : node.color + "70",
                  color: node.color,
                  fontSize: isMobile ? 11 : 12,
                  padding: `0 ${isMobile ? 8 : 10}px`,
                  wordBreak: "break-word",
                  boxShadow: isSelected
                    ? `0 0 16px 3px ${node.color}44`
                    : `0 2px 8px ${node.color}20`,
                  transition: "all 0.2s",
                }}
              >
                {node.label}
              </div>
            </motion.div>
          );
        })}

        {/* ── Legend ── */}
        {!isMobile ? (
          <div
            className="absolute bottom-4 right-4 flex flex-col gap-1.5 text-[11px] text-text-muted bg-bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg"
            style={{ zIndex: 50 }}
          >
            <p className="font-semibold text-text-secondary mb-0.5 text-[12px]">
              Prioritas
            </p>
            {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
              <div key={p} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: c, boxShadow: `0 0 4px ${c}88` }}
                />
                <span className="capitalize">{p}</span>
              </div>
            ))}
            <p className="text-[10px] mt-1.5 opacity-50 leading-tight">
              Klik kategori untuk filter
              <br />
              2× klik todo untuk edit
            </p>
          </div>
        ) : (
          // Mobile: compact horizontal legend at the bottom
          <div
            className="absolute bottom-3 left-0 right-0 flex justify-center"
            style={{ zIndex: 50 }}
          >
            <div className="flex gap-3 text-[10px] text-text-muted bg-bg-card/95 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 shadow">
              {Object.entries(PRIORITY_COLORS).map(([p, c]) => (
                <div key={p} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c }}
                  />
                  <span className="capitalize">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
