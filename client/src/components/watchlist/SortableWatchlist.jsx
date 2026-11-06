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
import { Sparklines, SparklinesLine } from "react-sparklines";
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
          <CompanyLogo symbol={sym} companyName={stock.name} size={40} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white group-hover:text-emerald-400">{sym}</span>
              <span className="text-[10px] font-semibold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">NSE</span>
              {stock.pulseScore && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono inline-flex items-center gap-1">
                  <Zap size={10} /> {stock.pulseScore.score} · {stock.pulseScore.grade}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 truncate mt-0.5">{stock.name}</p>
          </div>
        </div>

        <div className="w-24 h-8 shrink-0 hidden lg:block">
          {Array.isArray(stock.data) && stock.data.length > 1 ? (
            <Sparklines data={stock.data} margin={2}>
              <SparklinesLine color={stock.positive ? "#10b981" : "#f43f5e"} style={{ fill: "none", strokeWidth: 2 }} />
            </Sparklines>
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
              <span className="hidden sm:inline">Set Alert</span>
            </button>
            <button
              type="button"
              onClick={(event) => onRemove(event, stock._id, stock.symbol)}
              className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center"
              aria-label={`Remove ${sym}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-12" onClick={(event) => event.stopPropagation()}>
        {(stock.tags || []).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onRemoveTag(stock, tag)}
            className="h-7 px-2 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-bold"
          >
            {tag} ×
          </button>
        ))}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const input = event.currentTarget.elements.tag;
            onAddTag(stock, input.value);
            input.value = "";
          }}
        >
          <input
            name="tag"
            placeholder="Add tag"
            className="h-7 w-24 rounded-full bg-[#080d1a] border border-white/10 px-2 text-[10px] text-white outline-none"
          />
        </form>
        <select
          value={stock.listName || "My Watchlist"}
          onChange={(event) => onMove(stock, event.target.value)}
          className="h-7 rounded-full bg-[#080d1a] border border-white/10 px-2 text-[10px] text-gray-300 outline-none"
        >
          {boards.map((board) => (
            <option key={board.name} value={board.name}>
              {board.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function SortableWatchlist({ items, boards, onReorder, onOpen, onAlert, onRemove, onMove, onAddTag, onRemoveTag }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        onReorder(arrayMove(items, oldIndex, newIndex));
      }}
    >
      <SortableContext items={items.map((item) => item._id)} strategy={verticalListSortingStrategy}>
        <div className="divide-y divide-white/[0.04]">
          {items.map((stock) => (
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
