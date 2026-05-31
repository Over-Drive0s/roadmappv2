import { useMemo } from "react";
import { useRoadmapAuth } from "../context/RoadmapAuthContext";
import { getCurrentUserTeamMemberId } from "../data/teamData";
import { getRoadmapProfileFullName, getRoadmapProfileRole } from "../data/roadmapProfileStorage";

export function useCurrentUser() {
  const { profile } = useRoadmapAuth();

  return useMemo(() => {
    const displayName =
      getRoadmapProfileFullName(profile, { fallbackToUsername: false }) ||
      `@${profile.username}`;
    const role = profile ? getRoadmapProfileRole(profile) : "";
    const memberId = profile ? getCurrentUserTeamMemberId(profile.id) : null;

    return {
      profile,
      displayName,
      role,
      memberId,
    };
  }, [profile]);
}
