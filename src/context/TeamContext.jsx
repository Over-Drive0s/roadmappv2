import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createTeamMember, membersToAssignees } from "../data/teamData";
import { loadTeamMembers, saveTeamMembers } from "../lib/teamStorage";

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const [members, setMembers] = useState(() => loadTeamMembers());

  useEffect(() => {
    setMembers((prev) => {
      const enisOnly = prev.filter((member) => member.id === "enis" || member.name === "Enis");
      if (enisOnly.length === prev.length && enisOnly.length > 0) return prev;
      if (enisOnly.length > 0) return enisOnly;
      return loadTeamMembers();
    });
  }, []);

  useEffect(() => {
    saveTeamMembers(members);
  }, [members]);

  const addMember = useCallback(
    (fields) => {
      const member = createTeamMember(fields, members);
      setMembers((prev) => [...prev, member]);
      return member;
    },
    [members]
  );

  const assignees = useMemo(() => membersToAssignees(members), [members]);

  const value = useMemo(
    () => ({ members, assignees, addMember }),
    [members, assignees, addMember]
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
