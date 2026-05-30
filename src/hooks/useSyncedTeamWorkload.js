import { useMemo } from "react";
import { useTasks } from "../context/TasksContext";
import { useTeam } from "../context/TeamContext";
import { computeTeamWorkloadAggregate } from "../lib/workloadSync";

export function useSyncedTeamWorkload(projects) {
  const { members } = useTeam();
  const { tasks } = useTasks();

  return useMemo(
    () => computeTeamWorkloadAggregate(members, projects, tasks),
    [members, projects, tasks]
  );
}
