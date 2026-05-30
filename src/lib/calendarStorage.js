import { isCurrentWorkspaceVersion, WORKSPACE_VERSION } from "./workspaceConstants";
import { normalizeCalendarEvent } from "../data/calendarData";
import { readBinPayload, writeBinPayload } from "./storageAdapter";

const STORAGE_KEY = "over-drive-os-calendar-events";

export function loadCalendarEvents() {
  try {
    const data = readBinPayload(STORAGE_KEY);
    if (data && isCurrentWorkspaceVersion(data) && Array.isArray(data.events)) {
      return data.events.map(normalizeCalendarEvent);
    }
  } catch (err) {
    console.warn("Could not load calendar events:", err);
  }
  return [];
}

export function saveCalendarEvents(events) {
  try {
    writeBinPayload(STORAGE_KEY, {
      version: WORKSPACE_VERSION,
      savedAt: new Date().toISOString(),
      events,
    });
  } catch (err) {
    console.warn("Could not save calendar events:", err);
  }
}
