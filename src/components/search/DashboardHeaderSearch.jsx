import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { useCalendarEvents } from "../../context/CalendarEventsContext";
import { useFiles } from "../../context/FilesContext";
import { useRoadmapAuth } from "../../context/RoadmapAuthContext";
import { useTasks } from "../../context/TasksContext";
import { useTeam } from "../../context/TeamContext";
import {
  buildDashboardSearchIndex,
  searchDashboardIndex,
} from "../../lib/dashboardSearch";
import { loadDreamboard } from "../../lib/dreamboardStorage";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function DashboardHeaderSearch({ projects = [], onNavigate }) {
  const { tasks } = useTasks();
  const { binFiles } = useFiles();
  const { members } = useTeam();
  const { events } = useCalendarEvents();
  const { profile } = useRoadmapAuth();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dreamboardItems, setDreamboardItems] = useState([]);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const openSearch = useCallback(() => {
    setDreamboardItems(loadDreamboard().items ?? []);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      const tag = event.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || event.target?.isContentEditable) return;
      event.preventDefault();
      openSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) return;
      close();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  const index = useMemo(
    () =>
      buildDashboardSearchIndex({
        projects,
        tasks,
        files: binFiles,
        members,
        events,
        dreamboardItems,
        profile,
      }),
    [projects, tasks, binFiles, members, events, dreamboardItems, profile]
  );

  const results = useMemo(() => searchDashboardIndex(query, index), [query, index]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const selectResult = useCallback(
    (result) => {
      if (!result) return;
      onNavigate(result.page, result.pageOptions ?? {});
      close();
    },
    [close, onNavigate]
  );

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (results.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % results.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        selectResult(results[activeIndex]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, activeIndex, close, selectResult]);

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Search workspace"
        onClick={openSearch}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
      >
        <Search className="h-4 w-4" />
      </button>
    );
  }

  const showResults = query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative w-full sm:w-72">
      <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={close}
          aria-label="Close search"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {showResults ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 max-h-72 w-full min-w-[18rem] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">No results</p>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectResult(result)}
                    className={cn(
                      "flex w-full flex-col px-3 py-2 text-left",
                      index === activeIndex ? "bg-indigo-50" : "hover:bg-slate-50"
                    )}
                  >
                    <span className="truncate text-sm font-medium text-slate-900">{result.title}</span>
                    {result.subtitle ? (
                      <span className="truncate text-xs text-slate-500">{result.subtitle}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
