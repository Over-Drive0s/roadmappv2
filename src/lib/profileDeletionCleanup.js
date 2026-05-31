import { getCurrentUserTeamMemberId } from "../data/teamData";
import { clearProfileScopedLocalStorage } from "./blankWorkspace";
import { getBinRelativePath } from "./binCatalog";
import { getProfileScopedRelativePath, getScopedLocalStorageKey, isValidProfileScopeId } from "./profileWorkspaceScope";
import { isCurrentWorkspaceVersion } from "./workspaceConstants";

const TEAM_BIN_ID = "over-drive-os-team-members";
const FETCH_TIMEOUT_MS = 5000;

function hasElectronBins() {
  return typeof window !== "undefined" && window.overDriveBins?.readJson;
}

function canUseDiskApi() {
  return typeof fetch !== "undefined" && import.meta.env.DEV;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function stripTeamMember(payload, memberId) {
  if (!payload || !isCurrentWorkspaceVersion(payload) || !Array.isArray(payload.members)) {
    return null;
  }

  const members = payload.members.filter((member) => member.id !== memberId);
  if (members.length === payload.members.length) return null;

  return {
    ...payload,
    savedAt: new Date().toISOString(),
    members,
  };
}

function removeTeamMemberFromLocalStorage(ownerProfileId, memberId) {
  if (!isValidProfileScopeId(ownerProfileId)) return false;

  const key = getScopedLocalStorageKey(ownerProfileId, TEAM_BIN_ID);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const updated = stripTeamMember(JSON.parse(raw), memberId);
    if (!updated) return false;
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

async function readTeamBinFromDisk(ownerProfileId) {
  if (hasElectronBins()) {
    const relPath = getProfileScopedRelativePath(ownerProfileId, getBinRelativePath(TEAM_BIN_ID));
    return window.overDriveBins.readJson(relPath);
  }

  if (canUseDiskApi()) {
    const res = await fetchWithTimeout(
      `/api/bins/bootstrap?profileId=${encodeURIComponent(ownerProfileId)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[TEAM_BIN_ID] ?? null;
  }

  return null;
}

async function writeTeamBinToDisk(ownerProfileId, payload) {
  if (hasElectronBins()) {
    const relPath = getProfileScopedRelativePath(ownerProfileId, getBinRelativePath(TEAM_BIN_ID));
    await window.overDriveBins.writeJson(relPath, payload);
    return;
  }

  if (canUseDiskApi()) {
    const res = await fetchWithTimeout(
      `/api/bins/${encodeURIComponent(TEAM_BIN_ID)}?profileId=${encodeURIComponent(ownerProfileId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error(`Failed to update team for profile ${ownerProfileId}`);
  }
}

async function removeTeamMemberFromWorkspace(ownerProfileId, memberId) {
  removeTeamMemberFromLocalStorage(ownerProfileId, memberId);

  const payload = await readTeamBinFromDisk(ownerProfileId);
  const updated = stripTeamMember(payload, memberId);
  if (!updated) return;

  await writeTeamBinToDisk(ownerProfileId, updated);
  removeTeamMemberFromLocalStorage(ownerProfileId, memberId);
}

async function deleteProfileWorkspaceStorage(profileId) {
  clearProfileScopedLocalStorage(profileId);

  if (hasElectronBins() && window.overDriveBins.deleteProfileWorkspace) {
    await window.overDriveBins.deleteProfileWorkspace(profileId);
    return;
  }

  if (canUseDiskApi()) {
    const res = await fetchWithTimeout(
      `/api/bins/delete-profile-workspace?profileId=${encodeURIComponent(profileId)}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error(`Failed to delete workspace for profile ${profileId}`);
  }
}

/**
 * Removes a deleted roadmap profile from every workspace team list and wipes its workspace bins.
 * @param {string} deletedProfileId
 * @param {string[]} remainingProfileIds
 */
export async function cleanupDeletedRoadmapProfile(deletedProfileId, remainingProfileIds = []) {
  if (!isValidProfileScopeId(deletedProfileId)) return;

  const memberId = getCurrentUserTeamMemberId(deletedProfileId);

  for (const ownerProfileId of remainingProfileIds) {
    if (ownerProfileId === deletedProfileId) continue;
    await removeTeamMemberFromWorkspace(ownerProfileId, memberId);
  }

  await deleteProfileWorkspaceStorage(deletedProfileId);
}

export function getLinkedTeamMemberIdForProfile(profileId) {
  return getCurrentUserTeamMemberId(profileId);
}
