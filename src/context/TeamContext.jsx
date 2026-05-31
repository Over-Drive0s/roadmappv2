import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  areTeamMembersEqual,
  createTeamMember,
  isProfileLinkedTeamMemberId,
  mergeCurrentUserIntoMembers,
  membersToAssignees,
  teamMemberToAssignee,
  updateTeamMember,
} from "../data/teamData";
import { loadTeamMembers, saveTeamMembers } from "../lib/teamStorage";
import { useRoadmapAuth } from "./RoadmapAuthContext";

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const { profile, isAdmin } = useRoadmapAuth();
  const [members, setMembers] = useState(() => loadTeamMembers());
  const lastSavedMembersRef = useRef(null);

  useEffect(() => {
    if (!profile) return;
    setMembers((prev) => mergeCurrentUserIntoMembers(prev, profile));
  }, [profile?.id, profile?.username, profile?.fullName, profile?.role, profile?.workspaceName, profile?.profilePicture]);

  useEffect(() => {
    if (areTeamMembersEqual(lastSavedMembersRef.current, members)) return;
    lastSavedMembersRef.current = members;
    saveTeamMembers(members);
  }, [members]);

  const addMember = useCallback(
    (fields) => {
      if (!profile) return null;

      const requestedId = fields.id?.trim();
      if (requestedId && isProfileLinkedTeamMemberId(requestedId) && !isAdmin) {
        return null;
      }

      let created = null;
      setMembers((prev) => {
        if (requestedId && prev.some((member) => member.id === requestedId)) {
          return prev;
        }
        created = createTeamMember(fields, prev);
        return [...prev, created];
      });
      return created;
    },
    [profile, isAdmin]
  );

  const updateMember = useCallback(
    (memberId, fields) => {
      if (!profile) return null;

      let updated = null;
      setMembers((prev) => {
        const index = prev.findIndex((member) => member.id === memberId);
        if (index === -1) return prev;

        updated = updateTeamMember(prev[index], fields);
        const next = [...prev];
        next[index] = updated;
        return next;
      });
      return updated;
    },
    [profile]
  );

  const deleteMember = useCallback(
    (memberId) => {
      if (!profile) return false;

      let removed = false;
      setMembers((prev) => {
        const member = prev.find((item) => item.id === memberId);
        if (!member || member.isCurrentUser) return prev;
        removed = true;
        return prev.filter((item) => item.id !== memberId);
      });
      return removed;
    },
    [profile]
  );

  const currentUserMember = useMemo(
    () => members.find((member) => member.isCurrentUser) ?? null,
    [members]
  );

  const currentUserMemberId = currentUserMember?.id ?? null;
  const currentUserAssignee = useMemo(
    () => (currentUserMember ? teamMemberToAssignee(currentUserMember) : null),
    [currentUserMember]
  );

  const assignees = useMemo(() => membersToAssignees(members), [members]);

  const value = useMemo(
    () => ({
      members,
      assignees,
      addMember,
      updateMember,
      deleteMember,
      canAddMembers: Boolean(profile),
      canLinkProfileMembers: isAdmin,
      currentUserMember,
      currentUserMemberId,
      currentUserAssignee,
    }),
    [members, assignees, addMember, updateMember, deleteMember, profile, isAdmin, currentUserMember, currentUserMemberId, currentUserAssignee]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) {
    throw new Error("useTeam must be used within TeamProvider");
  }
  return ctx;
}
