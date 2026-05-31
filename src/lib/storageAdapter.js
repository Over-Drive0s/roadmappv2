import {
  ATTACHMENTS_BIN_DIR,
  BIN_PATH_BY_ID,
  WORKSPACE_BIN_IDS,
  buildAttachmentRelativePath,
  getBinRelativePath,
} from "./binCatalog";
import {
  getProfileScopedRelativePath,
  getScopedLocalStorageKey,
  isValidProfileScopeId,
  migrateLegacyLocalStorageToProfile,
} from "./profileWorkspaceScope";
import { LEGACY_LOCAL_STORAGE_KEYS, WORKSPACE_VERSION } from "./workspaceConstants";

/** @typedef {"local" | "disk" | "electron"} StorageMode */

/** @type {StorageMode} */
let mode = "local";

/** @type {string | null} */
let activeProfileId = null;

/** @type {Record<string, unknown | null>} */
const cache = Object.create(null);

/** @type {Record<string, ReturnType<typeof setTimeout>>} */
const pendingWrites = Object.create(null);

const WRITE_DEBOUNCE_MS = 250;
const FETCH_TIMEOUT_MS = 5000;

function hasElectronBins() {
  return typeof window !== "undefined" && window.overDriveBins?.readJson;
}

function canUseDiskApi() {
  return typeof fetch !== "undefined";
}

function binsQueryString() {
  if (!activeProfileId) return "";
  return `?profileId=${encodeURIComponent(activeProfileId)}`;
}

function scopeDiskPath(relativePath) {
  return getProfileScopedRelativePath(activeProfileId, relativePath);
}

function readScopedLocalStorage(binId) {
  if (!activeProfileId) return null;
  try {
    const key = getScopedLocalStorageKey(activeProfileId, binId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchBootstrap() {
  const res = await fetchWithTimeout(`/api/bins/bootstrap${binsQueryString()}`);
  if (!res.ok) throw new Error(`Bootstrap failed (${res.status})`);
  return res.json();
}

async function persistToDisk(binId, payload) {
  if (mode === "electron") {
    const relPath = scopeDiskPath(getBinRelativePath(binId));
    if (!relPath) return;
    await window.overDriveBins.writeJson(relPath, payload);
    return;
  }

  if (mode === "disk") {
    const res = await fetchWithTimeout(`/api/bins/${encodeURIComponent(binId)}${binsQueryString()}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to save ${binId}`);
  }
}

function schedulePersist(binId) {
  if (!activeProfileId) return;

  if (mode === "local") {
    try {
      const key = getScopedLocalStorageKey(activeProfileId, binId);
      localStorage.setItem(key, JSON.stringify(cache[binId]));
    } catch (err) {
      console.warn(`Could not save ${binId} to localStorage:`, err);
    }
    return;
  }

  clearTimeout(pendingWrites[binId]);
  pendingWrites[binId] = setTimeout(() => {
    persistToDisk(binId, cache[binId]).catch((err) => {
      console.warn(`Could not persist ${binId}:`, err);
    });
  }, WRITE_DEBOUNCE_MS);
}

/**
 * Load workspace bins for a profile into memory before the React app mounts.
 * @param {string | null | undefined} profileId
 * @returns {Promise<{ mode: StorageMode, binsRoot: string | null, profileId: string | null }>}
 */
export async function initBinStorage(profileId) {
  activeProfileId = isValidProfileScopeId(profileId) ? profileId : null;

  for (const binId of WORKSPACE_BIN_IDS) {
    cache[binId] = null;
  }

  if (!activeProfileId) {
    mode = "local";
    return { mode, binsRoot: null, profileId: null };
  }

  migrateLegacyLocalStorageToProfile(activeProfileId);

  if (hasElectronBins()) {
    mode = "electron";
    const all = await window.overDriveBins.loadAll(activeProfileId);
    for (const binId of WORKSPACE_BIN_IDS) {
      cache[binId] = all[binId] ?? null;
    }
    return { mode, binsRoot: window.overDriveBins.getRoot?.() ?? null, profileId: activeProfileId };
  }

  if (import.meta.env.DEV && canUseDiskApi()) {
    try {
      const bootstrap = await fetchBootstrap();
      mode = "disk";
      for (const binId of WORKSPACE_BIN_IDS) {
        cache[binId] = bootstrap[binId] ?? null;
      }
      return { mode, binsRoot: bootstrap.binsRoot ?? "./bins", profileId: activeProfileId };
    } catch (err) {
      console.warn("Disk bins unavailable, using localStorage:", err);
    }
  }

  mode = "local";
  for (const binId of WORKSPACE_BIN_IDS) {
    cache[binId] = readScopedLocalStorage(binId);
  }
  return { mode, binsRoot: null, profileId: activeProfileId };
}

export function getActiveProfileId() {
  return activeProfileId;
}

export function getStorageMode() {
  return mode;
}

export function readBinPayload(binId) {
  if (!activeProfileId) return null;
  return cache[binId] ?? null;
}

export function writeBinPayload(binId, payload) {
  if (!activeProfileId) return;
  cache[binId] = payload;
  schedulePersist(binId);
}

export async function writeBinPayloadImmediate(binId, payload) {
  if (!activeProfileId) return;
  cache[binId] = payload;

  if (mode === "local") {
    try {
      const key = getScopedLocalStorageKey(activeProfileId, binId);
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn(`Could not save ${binId} to localStorage:`, err);
    }
    return;
  }

  await persistToDisk(binId, payload);
}

export function removeBinPayload(binId) {
  if (!activeProfileId) return;
  cache[binId] = null;
  schedulePersist(binId);
}

export async function flushBinStorage() {
  if (!activeProfileId) return;
  const jobs = WORKSPACE_BIN_IDS.filter((binId) => cache[binId] != null).map((binId) =>
    persistToDisk(binId, cache[binId])
  );
  await Promise.all(jobs);
}

export async function resetWorkspaceBinsOnDisk() {
  if (!activeProfileId) return;

  for (const binId of WORKSPACE_BIN_IDS) {
    cache[binId] = null;
  }

  if (activeProfileId) {
    for (const binId of WORKSPACE_BIN_IDS) {
      localStorage.removeItem(getScopedLocalStorageKey(activeProfileId, binId));
    }
  }

  if (mode === "electron") {
    await window.overDriveBins.reset?.(activeProfileId);
    return;
  }

  if (mode === "disk") {
    const res = await fetchWithTimeout(`/api/bins/reset${binsQueryString()}`, { method: "POST" });
    if (!res.ok) throw new Error(`Reset failed (${res.status})`);
  }
}

export async function saveAttachmentToBin(fileId, fileName, dataUrl) {
  if (!activeProfileId) return null;

  const relativePath = scopeDiskPath(buildAttachmentRelativePath(fileId, fileName));

  if (mode === "electron") {
    await window.overDriveBins.writeAttachment(relativePath, dataUrl);
    return relativePath;
  }

  if (mode === "disk") {
    const res = await fetch(`/api/bins/attachments${binsQueryString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, fileName, dataUrl, relativePath }),
    });
    if (!res.ok) throw new Error("Failed to save attachment");
    const data = await res.json();
    return data.relativePath ?? relativePath;
  }

  return null;
}

export async function loadAttachmentFromBin(relativePath) {
  if (!relativePath || !activeProfileId) return null;

  if (mode === "electron") {
    return window.overDriveBins.readAttachment(relativePath);
  }

  if (mode === "disk") {
    const res = await fetch(
      `/api/bins/attachments/${encodeURIComponent(relativePath)}${binsQueryString()}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.dataUrl ?? null;
  }

  return null;
}

export async function hydrateAttachments(items) {
  if (!activeProfileId || !Array.isArray(items) || mode === "local") return items;

  const hydrated = [];
  for (const item of items) {
    if (item?.dataUrl || !item?.binPath) {
      hydrated.push(item);
      continue;
    }
    const dataUrl = await loadAttachmentFromBin(item.binPath);
    hydrated.push(dataUrl ? { ...item, dataUrl } : item);
  }
  return hydrated;
}

export function stripAttachmentDataUrls(items) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item?.binPath || !item?.dataUrl) return item;
    const { dataUrl, ...rest } = item;
    return rest;
  });
}

export { ATTACHMENTS_BIN_DIR, BIN_PATH_BY_ID, WORKSPACE_VERSION };
