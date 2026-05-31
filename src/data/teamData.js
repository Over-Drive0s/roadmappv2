import { resolveAssetUrl } from "../lib/assetUrl";
import { formatPhoneNumber } from "../lib/roadmap/phoneFormat";
import { getRoadmapProfileEmail, getRoadmapProfileFullName, getRoadmapProfileRole } from "./roadmapProfileStorage";

export const TEAM_ROLE_FILTERS = [
  { id: "all", label: "All roles" },
  { id: "leadership", label: "Leadership" },
  { id: "design", label: "Design" },
  { id: "engineering", label: "Engineering" },
  { id: "data", label: "Data" },
  { id: "devops", label: "DevOps" },
];

export const TEAM_DEPARTMENT_OPTIONS = TEAM_ROLE_FILTERS.filter((f) => f.id !== "all");

export const TEAM_STATUS_OPTIONS = [
  { id: "available", label: "Available" },
  { id: "busy", label: "Busy" },
  { id: "away", label: "Away" },
];

/** @typedef {"available" | "busy" | "away"} TeamMemberStatus */

/**
 * @typedef {{
 *   id: string;
 *   name: string;
 *   role: string;
 *   department: string;
 *   initials: string;
 *   color: string;
 *   avatarUrl?: string;
 *   workload: number;
 *   status: TeamMemberStatus;
 *   email: string;
 *   phoneNumber?: string;
 *   notes?: string;
 *   isCurrentUser?: boolean;
 * }} TeamMember
 */

/** @type {TeamMember[]} */
export const DEFAULT_TEAM_MEMBERS = [];

/** @deprecated Use DEFAULT_TEAM_MEMBERS or TeamContext */
export const TEAM_MEMBERS = DEFAULT_TEAM_MEMBERS;

export const TEAM_STATUS_STYLES = {
  available: { label: "Available", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  busy: { label: "Busy", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  away: { label: "Away", className: "bg-slate-100 text-slate-600 ring-slate-200" },
};

const MEMBER_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#64748b",
];

export function getWorkloadTone(workload) {
  if (workload >= 80) return { label: "High load", bar: "bg-red-500" };
  if (workload >= 60) return { label: "Moderate", bar: "bg-amber-500" };
  return { label: "Light", bar: "bg-emerald-500" };
}

export function getDepartmentLabel(departmentId) {
  return TEAM_DEPARTMENT_OPTIONS.find((d) => d.id === departmentId)?.label ?? departmentId;
}

export function buildMemberInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function buildMemberEmail(name, email) {
  if (email?.trim()) return email.trim().toLowerCase();
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  return slug ? `${slug}@overdrive.os` : "member@overdrive.os";
}

export function getNextTeamMemberId(name, members) {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "member";
  let id = base;
  let n = 2;
  while (members.some((member) => member.id === id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

export function pickMemberColor(members) {
  const used = new Set(members.map((member) => member.color));
  const available = MEMBER_COLORS.find((color) => !used.has(color));
  return available ?? MEMBER_COLORS[members.length % MEMBER_COLORS.length];
}

export function getCurrentUserTeamMemberId(profileId) {
  return `user-${profileId}`;
}

/** Team member IDs tied to a saved roadmap profile (admin-only to add manually). */
export function isProfileLinkedTeamMemberId(memberId) {
  return typeof memberId === "string" && memberId.startsWith("user-");
}

/** @param {import("./roadmapProfileStorage").RoadmapProfile | null | undefined} profile */
export function getRoadmapProfileContactFields(profile) {
  if (!profile) {
    return { name: "", email: "", phoneNumber: "", avatarUrl: "", username: "", role: "" };
  }

  const name = getRoadmapProfileFullName(profile);
  const role = getRoadmapProfileRole(profile);
  const email = getRoadmapProfileEmail(profile);
  const phoneNumber = profile.phoneNumber ? formatPhoneNumber(profile.phoneNumber) : "";

  return {
    name,
    email,
    phoneNumber,
    avatarUrl: profile.profilePicture ?? "",
    username: profile.username,
    role,
  };
}

/** @param {TeamMember} member @param {string} profileId */
export function isCurrentUserTeamMember(member, profileId) {
  if (!member || !profileId) return false;
  return member.id === getCurrentUserTeamMemberId(profileId) || Boolean(member.isCurrentUser);
}

/**
 * @param {import("./roadmapProfileStorage").RoadmapProfile} profile
 * @param {TeamMember | null | undefined} existingMember
 * @param {TeamMember[]} otherMembers
 * @returns {TeamMember}
 */
export function profileToTeamMember(profile, existingMember, otherMembers = []) {
  const contact = getRoadmapProfileContactFields(profile);
  const name = contact.name;
  const role = contact.role;

  const member = {
    id: getCurrentUserTeamMemberId(profile.id),
    name,
    role,
    department: existingMember?.department ?? "leadership",
    initials: buildMemberInitials(name),
    color: existingMember?.color ?? pickMemberColor(otherMembers),
    workload: existingMember?.workload ?? 0,
    status: existingMember?.status ?? "available",
    email: contact.email,
    isCurrentUser: true,
    ...(existingMember?.notes ? { notes: existingMember.notes } : {}),
    ...(contact.avatarUrl ? { avatarUrl: contact.avatarUrl } : {}),
    ...(contact.phoneNumber ? { phoneNumber: contact.phoneNumber } : {}),
  };
  return member;
}

/**
 * @param {TeamMember[]} members
 * @param {import("./roadmapProfileStorage").RoadmapProfile | null | undefined} profile
 * @returns {TeamMember[]}
 */
function teamMemberSnapshot(member) {
  if (!member) return null;
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    department: member.department,
    initials: member.initials,
    color: member.color,
    avatarUrl: member.avatarUrl ?? null,
    workload: member.workload ?? 0,
    status: member.status,
    email: member.email,
    phoneNumber: member.phoneNumber ?? null,
    notes: member.notes ?? null,
    isCurrentUser: Boolean(member.isCurrentUser),
  };
}

export function areTeamMembersEqual(left, right) {
  if (left === right) return true;
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  return left.every(
    (member, index) =>
      JSON.stringify(teamMemberSnapshot(member)) === JSON.stringify(teamMemberSnapshot(right[index]))
  );
}

export function mergeCurrentUserIntoMembers(members, profile) {
  if (!profile) return members;

  const userId = getCurrentUserTeamMemberId(profile.id);
  const existing = members.find((member) => member.id === userId || member.isCurrentUser);
  const others = members.filter((member) => member.id !== userId && !member.isCurrentUser);
  const userMember = profileToTeamMember(profile, existing, others);
  const next = [userMember, ...others];

  if (areTeamMembersEqual(members, next)) {
    return members;
  }

  return next;
}

/** @param {{ assignee?: { id?: string; name?: string } }} task @param {{ displayName: string; memberId?: string | null }} user */
export function isTaskAssignedToUser(task, user) {
  if (!task?.assignee || !user?.displayName) return false;
  if (user.memberId && task.assignee.id === user.memberId) return true;
  return task.assignee.name === user.displayName;
}

/**
 * @param {{
 *   name: string;
 *   email?: string;
 *   role: string;
 *   department: string;
 *   status?: TeamMemberStatus;
 *   notes?: string;
 *   avatarUrl?: string;
 *   phoneNumber?: string;
 *   id?: string;
 * }} fields
 * @param {TeamMember[]} existingMembers
 * @returns {TeamMember}
 */
export function createTeamMember(fields, existingMembers) {
  const name = fields.name.trim();
  const id = fields.id?.trim() || getNextTeamMemberId(name, existingMembers);
  return {
    id,
    name,
    role: fields.role.trim(),
    department: fields.department,
    initials: buildMemberInitials(name),
    color: pickMemberColor(existingMembers),
    workload: 0,
    status: fields.status ?? "available",
    email: buildMemberEmail(name, fields.email),
    ...(fields.notes?.trim() ? { notes: fields.notes.trim() } : {}),
    ...(fields.avatarUrl ? { avatarUrl: fields.avatarUrl } : {}),
    ...(fields.phoneNumber?.trim() ? { phoneNumber: fields.phoneNumber.trim() } : {}),
  };
}

/**
 * @param {TeamMember} member
 * @param {{
 *   name?: string;
 *   email?: string;
 *   role?: string;
 *   department?: string;
 *   status?: TeamMemberStatus;
 *   notes?: string;
 *   avatarUrl?: string;
 *   phoneNumber?: string;
 * }} fields
 * @returns {TeamMember}
 */
export function updateTeamMember(member, fields) {
  const name = fields.name?.trim() || member.name;
  const next = {
    ...member,
    name,
    role: fields.role?.trim() || member.role,
    department: fields.department ?? member.department,
    status: fields.status ?? member.status,
    email: buildMemberEmail(name, fields.email ?? member.email),
    initials: buildMemberInitials(name),
  };

  if (fields.notes !== undefined) {
    if (fields.notes?.trim()) next.notes = fields.notes.trim();
    else delete next.notes;
  }

  if (fields.phoneNumber !== undefined) {
    if (fields.phoneNumber?.trim()) next.phoneNumber = fields.phoneNumber.trim();
    else delete next.phoneNumber;
  }

  if (fields.avatarUrl !== undefined) {
    if (fields.avatarUrl) next.avatarUrl = fields.avatarUrl;
    else delete next.avatarUrl;
  }

  return next;
}

/** @param {TeamMember} member */
export function teamMemberToAssignee(member) {
  return {
    id: member.id,
    name: member.name,
    initials: member.initials,
    color: member.color,
    ...(member.avatarUrl ? { avatarUrl: resolveAssetUrl(member.avatarUrl) } : {}),
  };
}

/** @param {TeamMember[]} members */
export function membersToAssignees(members) {
  return members.map(teamMemberToAssignee);
}
