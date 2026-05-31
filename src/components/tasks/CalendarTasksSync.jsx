import { useEffect } from "react";
import { useCalendarEvents } from "../../context/CalendarEventsContext";
import { useTasks } from "../../context/TasksContext";
import { useTeam } from "../../context/TeamContext";

/** Keeps calendar events mirrored as tasks in the tasks list. */
export default function CalendarTasksSync() {
  const { events } = useCalendarEvents();
  const { syncCalendarEvents } = useTasks();
  const { currentUserAssignee } = useTeam();

  useEffect(() => {
    if (!currentUserAssignee) return;
    syncCalendarEvents(events, currentUserAssignee);
  }, [events, syncCalendarEvents, currentUserAssignee]);

  return null;
}
