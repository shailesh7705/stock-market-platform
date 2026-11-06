import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDownRight, ArrowUpRight, Bell, GripVertical, Trash2, Zap } from "lucide-react";
import Sparkline from "../ui/Sparkline";
import CompanyLogo from "../ui/CompanyLogo";

function cleanSymbol(symbol = "") {
  return symbol.replace(".NS", "").replace(".BO", "").toUpperCase();
}

function SortableRow({ stock, boards, onOpen, onAlert, onRemove, onMove, onAddTag, onRemoveTag }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stock._id,
  });
  const sym = cleanSymbol(stock.symbol);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(sym)}
      className="p-4 flex flex-col gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer group bg-[#0e1626]"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 md:w-2/5">
          <button
            type="button"
            className="w-9 h-11 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center shrink-0"
            aria-label={`Reorder ${sym}`}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
          <CompanyLogo symbol={sym} companyName={stock.name} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                {sym}
              </span>
              <span className="text-[10px] font-semibold text-gray-500">NSE</span>
              {stock.pulseScore?.score !== undefined && stock.pulseScore.score !== null && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono inline-flex items-center gap-1">
                  <Zap size={10} /> {stock.pulseScore.score} · {stock.pulseScore.grade}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{stock.name}</p>
          </div>
        </div>

        <div className="w-24 h-8 shrink-0 hidden lg:flex items-center justify-center">
          {Array.isArray(stock.data) && stock.data.length > 1 ? (
            <Sparkline data={stock.data} positive={stock.positive} width={96} height={28} strokeWidth={2} />
          ) : null}
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4">
          <div className="text-right">
            <p className="text-base font-extrabold text-white font-mono tabular-nums">{stock.price || "—"}</p>
            <p className={`text-xs font-bold font-mono inline-flex items-center gap-0.5 ${stock.positive ? "text-emerald-400" : "text-rose-400"}`}>
              {stock.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {stock.change || "0.00%"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => onAlert(event, stock)}
              className="h-11 px-3 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-amber-500/20"
            >
              <Bell size={13} />
              Alert
            </button>
            <button
              type="button"
              onClick={(event) => onRemove(event, stock._id, stock.symbol)}
              className="w-11 h-11 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center"
              aria-label={`Remove ${sym}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Board:</span>
          <select
            value={stock.listName || "Primary"}
            onChange={(event) => onMove(stock._id, event.target.value)}
            className="bg-[#080d18] border border-white/10 rounded-lg text-xs text-gray-300 px-2 py-1 focus:outline-none"
          >
            {boards.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {(stock.tags || []).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/10 flex items-center gap-1"
            >
              #{tag}
              <button
                type="button"
                onClick={() => onRemoveTag(stock._id, tag)}
                className="hover:text-rose-400 text-gray-500 ml-0.5"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const input = event.target.elements.tag;
              if (input.value.trim()) {
                onAddTag(stock._id, input.value.trim());
                input.value = "";
              }
            }}
            className="flex items-center"
          >
            <input
              name="tag"
              type="text"
              placeholder="+tag"
              className="bg-[#080d18] border border-white/10 rounded-md text-[10px] text-gray-300 px-1.5 py-0.5 w-16 focus:w-24 transition-all focus:outline-none focus:border-amber-500/50"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SortableWatchlist({
  stocks = [],
  boards = ["Primary"],
  onReorder,
  onOpen,
  onAlert,
  onRemove,
  onMove,
  onAddTag,
  onRemoveTag,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stocks.findIndex((s) => s._id === active.id);
    const newIndex = stocks.findIndex((s) => s._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(stocks, oldIndex, newIndex);
    onReorder(reordered);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stocks.map((s) => s._id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-white/5">
          {stocks.map((stock) => (
            <SortableRow
              key={stock._id}
              stock={stock}
              boards={boards}
              onOpen={onOpen}
              onAlert={onAlert}
              onRemove={onRemove}
              onMove={onMove}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
