import {
  getRoadmapProfileEmail,
  getRoadmapProfileFullName,
  getRoadmapProfileRole,
} from "../data/roadmapProfileStorage";
import { getDefaultTimezone } from "./roadmap/timezones";

/**
 * @param {import("../data/roadmapProfileStorage").RoadmapProfile | null | undefined} roadmapProfile
 */
export function getSettingsProfileFormValues(roadmapProfile) {
  if (!roadmapProfile) {
    return { name: "", role: "", email: "", timezone: getDefaultTimezone() };
  }

  return {
    name: getRoadmapProfileFullName(roadmapProfile, { fallbackToUsername: false }),
    role: getRoadmapProfileRole(roadmapProfile),
    email: getRoadmapProfileEmail(roadmapProfile),
    timezone: roadmapProfile.timezone ?? getDefaultTimezone(),
  };
}
