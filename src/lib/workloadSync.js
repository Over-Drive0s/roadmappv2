import { ensurePhases, filterActiveProjects, PHASE_DEFS } from "./projectUtils";

/** Base workload per active project (non-owner team member). */
export const WORKLOAD_PERCENT_PER_PROJECT = 20;
/** Base workload when the member owns the project. */
export const WORKLOAD_PERCENT_PER_PROJECT_OWNER = 25;
/** Added per open standalone task or phase job assigned to the member. */
export const WORKLOAD_PERCENT_PER_OPEN_TASK = 5;

export function memberMatchesAssignee(member, assignee) {
  if (!member || !assignee) return false;
  if (assignee.id && assignee.id === member.id) return true;
  if (assignee.name && assignee.name === member.name) return true;
  return false;
}

export function memberOnProject(project, member) {
  if (!project || !member) return false;
  if (project.team?.projectOwner === member.name) return true;

  const teamMembers = project.team?.teamMembers ?? [];
  return teamMembers.some((entry) => {
    if (typeof entry === "string") {
      return entry === member.id || entry === member.name;
    }
    return entry?.id === member.id || entry?.name === member.name;
  });
}

export function memberAssignedToProject(project, member) {
  if (!project || !member) return false;
  if (memberOnProject(project, member)) return true;

  const phases = ensurePhases(project.phases);
  return PHASE_DEFS.some((def) => phases[def.id]?.assignedMemberId === member.id);
}

export function isStandaloneTaskOpen(task) {
  if (!task) return false;
  if (task.completed) return false;
  if (task.status === "done") return false;
  return true;
}

export function countIncompleteProjectJobs(project) {
  const phases = ensurePhases(project.phases);
  return PHASE_DEFS.reduce((sum, def) => {
    const tasks = phases[def.id]?.tasks ?? [];
    return sum + tasks.filter((task) => !task.completed).length;
  }, 0);
}

export function countProjectPhaseTasks(project) {
  const phases = ensurePhases(project.phases);
  return PHASE_DEFS.reduce((sum, def) => {
    return sum + (phases[def.id]?.tasks ?? []).length;
  }, 0);
}

export function countProjectTeamSize(project, members) {
  const size = members.filter((member) => memberOnProject(project, member)).length;
  return Math.max(1, size);
}

export function projectWorkloadPercent(project, member) {
  if (project?.team?.projectOwner === member.name) {
    return WORKLOAD_PERCENT_PER_PROJECT_OWNER;
  }
  return WORKLOAD_PERCENT_PER_PROJECT;
}

/** Sum of 20–25% per active project the member is tied to. */
export function computeMemberProjectWorkload(member, projects) {
  return filterActiveProjects(projects).reduce((sum, project) => {
    if (!memberAssignedToProject(project, member)) return sum;
    return sum + projectWorkloadPercent(project, member);
  }, 0);
}

export function countMemberActiveProjects(member, projects) {
  return filterActiveProjects(projects).filter((project) =>
    memberAssignedToProject(project, member)
  ).length;
}

/** Open + total phase jobs attributed to a member (by phase assignee or project team share). */
export function computeMemberPhaseJobCounts(member, projects, members) {
  const activeProjects = filterActiveProjects(projects);
  let openJobs = 0;
  let totalJobs = 0;

  for (const project of activeProjects) {
    const phases = ensurePhases(project.phases);
    let unassignedOpen = 0;
    let unassignedTotal = 0;

    for (const def of PHASE_DEFS) {
      const phase = phases[def.id];
      const phaseTasks = phase?.tasks ?? [];
      const openInPhase = phaseTasks.filter((task) => !task.completed).length;
      const totalInPhase = phaseTasks.length;
      if (!totalInPhase) continue;

      if (phase?.assignedMemberId) {
        if (phase.assignedMemberId === member.id) {
          openJobs += openInPhase;
          totalJobs += totalInPhase;
        }
        continue;
      }

      unassignedOpen += openInPhase;
      unassignedTotal += totalInPhase;
    }

    if (unassignedTotal > 0 && memberOnProject(project, member)) {
      const share = 1 / countProjectTeamSize(project, members);
      openJobs += unassignedOpen * share;
      totalJobs += unassignedTotal * share;
    }
  }

  return {
    openJobs: Math.round(openJobs * 10) / 10,
    totalJobs: Math.round(totalJobs * 10) / 10,
  };
}

export function computeMemberOpenJobs(member, projects, members) {
  return computeMemberPhaseJobCounts(member, projects, members).openJobs;
}

export function computeMemberOpenTasks(member, tasks) {
  return tasks.filter(
    (task) => isStandaloneTaskOpen(task) && memberMatchesAssignee(member, task.assignee)
  ).length;
}

export function computeMemberStandaloneTaskCounts(member, tasks) {
  const assigned = tasks.filter((task) => memberMatchesAssignee(member, task.assignee));
  return {
    openTasks: assigned.filter(isStandaloneTaskOpen).length,
    totalTasks: assigned.length,
  };
}

/**
 * Workload % = (20–25% × active projects) + (5% × open assigned tasks/jobs).
 * Capped at 100%.
 */
export function computeMemberWorkload(member, projects, tasks, members) {
  const projectLoad = computeMemberProjectWorkload(member, projects);
  const openTasks = computeMemberOpenTasks(member, tasks);
  const openJobs = computeMemberOpenJobs(member, projects, members);
  const taskLoad = (openTasks + openJobs) * WORKLOAD_PERCENT_PER_OPEN_TASK;

  return Math.min(100, Math.round(projectLoad + taskLoad));
}

/**
 * @param {import("../data/teamData").TeamMember[]} members
 */
export function computeTeamWorkloadAggregate(members, projects, tasks) {
  const rows = members.map((member) => {
    const { openTasks, totalTasks } = computeMemberStandaloneTaskCounts(member, tasks);
    const { openJobs, totalJobs } = computeMemberPhaseJobCounts(member, projects, members);
    const projectLoad = computeMemberProjectWorkload(member, projects);
    const activeProjects = countMemberActiveProjects(member, projects);
    const workload = computeMemberWorkload(member, projects, tasks, members);

    return {
      memberId: member.id,
      member,
      workload,
      projectLoad,
      activeProjects,
      openTasks,
      openJobs,
      totalTasks,
      totalJobs,
    };
  });

  const avgWorkload = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.workload, 0) / rows.length)
    : 0;

  const totalOpenTasks = tasks.filter(isStandaloneTaskOpen).length;

  const activeProjectsList = filterActiveProjects(projects);
  const totalOpenJobs = activeProjectsList.reduce(
    (sum, project) => sum + countIncompleteProjectJobs(project),
    0
  );
  const totalPhaseTasks = activeProjectsList.reduce(
    (sum, project) => sum + countProjectPhaseTasks(project),
    0
  );

  const workloadByMemberId = Object.fromEntries(rows.map((row) => [row.memberId, row.workload]));

  return {
    rows,
    avgWorkload,
    totalOpenTasks,
    totalOpenJobs,
    totalPhaseTasks,
    workloadByMemberId,
  };
}
