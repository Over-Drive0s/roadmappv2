import { Check, ListTodo } from "lucide-react";
import { getPreTaskProgress, getTaskPreTasks } from "../../data/tasksData";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function resolveItems({ preTasks, items = [] }) {
  if (preTasks?.length) return getTaskPreTasks({ preTasks });
  if (items.length) {
    return items
      .map((item, index) =>
        typeof item === "string"
          ? { id: `preview-${index}`, title: item, completed: false }
          : item
      )
      .filter((item) => item?.title);
  }
  return [];
}

function PreTaskProgressBar({ completed, total, percent }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold">
        <span className="text-slate-500">Pre-task progress</span>
        <span className="tabular-nums text-violet-700">
          {completed}/{total} complete
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function PreTasksDisplay({
  preTasks,
  items = [],
  variant = "default",
  embedded = false,
  interactive = false,
  onToggle,
  className,
}) {
  const listItems = resolveItems({ preTasks, items });
  if (!listItems.length) return null;

  const { total, completed, percent, allComplete } = getPreTaskProgress(listItems);
  const isCompact = variant === "compact";

  const checklist = (
    <ul className={cn("divide-y divide-slate-100", embedded && "border-t border-slate-100")}>
      {listItems.map((item, index) => (
        <li
          key={item.id ?? `${item.title}-${index}`}
          className={cn(
            "flex items-start gap-3",
            embedded ? "px-5 py-3" : isCompact ? "px-4 py-2.5" : "px-5 py-3.5",
            index % 2 === 0 ? "bg-white" : "bg-slate-50/90"
          )}
        >
          {interactive ? (
            <button
              type="button"
              onClick={() => onToggle?.(item.id)}
              aria-label={item.completed ? `Mark "${item.title}" incomplete` : `Mark "${item.title}" complete`}
              className={cn(
                "mt-0.5 flex shrink-0 items-center justify-center rounded-full border-2 transition",
                embedded || !isCompact ? "h-5 w-5" : "h-4 w-4",
                item.completed
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-300 bg-white hover:border-violet-400"
              )}
            >
              {item.completed ? (
                <Check className={embedded || !isCompact ? "h-3 w-3" : "h-2.5 w-2.5"} strokeWidth={3} />
              ) : null}
            </button>
          ) : (
            <span
              className={cn(
                "mt-0.5 flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-inset",
                embedded || !isCompact ? "h-6 w-6 text-[11px]" : "h-5 w-5 text-[10px]",
                item.completed
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200/80"
                  : "bg-violet-100 text-violet-700 ring-violet-200/80"
              )}
            >
              {item.completed ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
            </span>
          )}
          <p
            className={cn(
              "min-w-0 flex-1 font-medium leading-snug",
              embedded || !isCompact ? "text-sm" : "text-xs",
              item.completed ? "text-slate-500 line-through" : "text-slate-800"
            )}
          >
            {item.title}
          </p>
        </li>
      ))}
    </ul>
  );

  const header = (
    <div
      className={cn(
        "border-b border-slate-100 bg-slate-50/80",
        embedded ? "space-y-3 px-5 py-3" : isCompact ? "space-y-2.5 px-4 py-2.5" : "space-y-3 px-5 py-3"
      )}
    >
      <div className="flex items-center gap-2">
        <ListTodo className="h-3.5 w-3.5 shrink-0 text-violet-600" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Pre-Tasks
          <span className="ml-1.5 font-semibold text-violet-700">({total})</span>
        </p>
        {allComplete ? (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Ready
          </span>
        ) : null}
      </div>
      <PreTaskProgressBar completed={completed} total={total} percent={percent} />
      {interactive && !allComplete ? (
        <p className="text-[11px] leading-relaxed text-slate-500">
          Complete every pre-task before marking this task done.
        </p>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <div className={className}>
        {header}
        {checklist}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200/90 bg-white",
        className
      )}
    >
      {header}
      {checklist}
    </div>
  );
}
