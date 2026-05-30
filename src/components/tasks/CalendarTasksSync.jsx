import { useEffect } from "react";
import { useCalendarEvents } from "../../context/CalendarEventsContext";
import { useTasks } from "../../context/TasksContext";

/** Keeps calendar events mirrored as tasks in the tasks list. */
export default function CalendarTasksSync() {
  const { events } = useCalendarEvents();
  const { syncCalendarEvents } = useTasks();

  useEffect(() => {
    syncCalendarEvents(events);
  }, [events, syncCalendarEvents]);

  return null;
}
