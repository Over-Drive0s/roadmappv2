import fs from "node:fs/promises";
import path from "node:path";
import {
  ATTACHMENTS_BIN_DIR,
  BIN_PATH_BY_ID,
  WORKSPACE_BIN_IDS,
} from "./src/lib/binCatalog.js";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    if (err?.code === "ENOENT") return null;
    throw err;
  }
}

async function writeJsonFile(filePath, payload) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : null;
}

function resolveProfileId(url) {
  const profileId = url.searchParams.get("profileId");
  if (!profileId || !/^[a-zA-Z0-9-]+$/.test(profileId)) return null;
  return profileId;
}

function resolveWorkspaceRoot(root, url) {
  const profileId = resolveProfileId(url);
  if (!profileId) return root;
  return path.join(root, "profiles", profileId);
}

export function workspaceBinsPlugin(binsRoot) {
  const root = path.resolve(binsRoot);

  async function ensureRoot(workspaceRoot) {
    await fs.mkdir(path.join(workspaceRoot, ATTACHMENTS_BIN_DIR), { recursive: true });
    for (const binId of WORKSPACE_BIN_IDS) {
      const rel = BIN_PATH_BY_ID[binId];
      if (rel) await fs.mkdir(path.dirname(path.join(workspaceRoot, rel)), { recursive: true });
    }
  }

  return {
    name: "workspace-bins",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/bins")) return next();

        try {
          const url = new URL(req.url, "http://localhost");
          const pathname = url.pathname;
          const workspaceRoot = resolveWorkspaceRoot(root, url);

          await ensureRoot(workspaceRoot);

          if (req.method === "GET" && pathname === "/api/bins/bootstrap") {
            if (!resolveProfileId(url)) {
              return sendJson(res, 400, { error: "profileId required" });
            }
            const payload = { binsRoot: workspaceRoot, profileId: resolveProfileId(url) };
            for (const binId of WORKSPACE_BIN_IDS) {
              const rel = BIN_PATH_BY_ID[binId];
              payload[binId] = rel ? await readJsonFile(path.join(workspaceRoot, rel)) : null;
            }
            return sendJson(res, 200, payload);
          }

          if (req.method === "PUT" && pathname.startsWith("/api/bins/")) {
            if (!resolveProfileId(url)) {
              return sendJson(res, 400, { error: "profileId required" });
            }
            const binId = decodeURIComponent(pathname.slice("/api/bins/".length));
            const rel = BIN_PATH_BY_ID[binId];
            if (!rel) return sendJson(res, 404, { error: "Unknown bin" });
            const body = await readBody(req);
            await writeJsonFile(path.join(workspaceRoot, rel), body);
            return sendJson(res, 200, { ok: true });
          }

          if (req.method === "POST" && pathname === "/api/bins/delete-profile-workspace") {
            if (!resolveProfileId(url)) {
              return sendJson(res, 400, { error: "profileId required" });
            }
            const profileId = resolveProfileId(url);
            const profileRoot = path.join(root, "profiles", profileId);
            await fs.rm(profileRoot, { recursive: true, force: true });
            return sendJson(res, 200, { ok: true });
          }

          if (req.method === "POST" && pathname === "/api/bins/reset") {
            if (!resolveProfileId(url)) {
              return sendJson(res, 400, { error: "profileId required" });
            }
            for (const binId of WORKSPACE_BIN_IDS) {
              const rel = BIN_PATH_BY_ID[binId];
              if (!rel) continue;
              const filePath = path.join(workspaceRoot, rel);
              try {
                await fs.unlink(filePath);
              } catch (err) {
                if (err?.code !== "ENOENT") throw err;
              }
            }
            const attachmentsDir = path.join(workspaceRoot, ATTACHMENTS_BIN_DIR);
            try {
              const entries = await fs.readdir(attachmentsDir);
              await Promise.all(
                entries.map((entry) => fs.unlink(path.join(attachmentsDir, entry)))
              );
            } catch (err) {
              if (err?.code !== "ENOENT") throw err;
            }
            return sendJson(res, 200, { ok: true });
          }

          if (req.method === "POST" && pathname === "/api/bins/attachments") {
            const body = await readBody(req);
            const relativePath = body.relativePath;
            const dataUrl = body.dataUrl;
            if (!relativePath || !dataUrl) {
              return sendJson(res, 400, { error: "Missing attachment payload" });
            }
            const comma = dataUrl.indexOf(",");
            const meta = comma >= 0 ? dataUrl.slice(0, comma) : "";
            const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
            const buffer = Buffer.from(base64, "base64");
            const filePath = path.join(root, relativePath);
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, buffer);
            const sidecar = `${filePath}.meta.json`;
            await fs.writeFile(
              sidecar,
              JSON.stringify({ mime: meta.replace(/^data:/, "").replace(/;base64$/, "") }),
              "utf8"
            );
            return sendJson(res, 200, { relativePath });
          }

          if (req.method === "GET" && pathname.startsWith("/api/bins/attachments/")) {
            const relativePath = decodeURIComponent(pathname.slice("/api/bins/attachments/".length));
            const filePath = path.join(root, relativePath);
            const sidecar = `${filePath}.meta.json`;
            const buffer = await fs.readFile(filePath);
            let mime = "application/octet-stream";
            try {
              const meta = JSON.parse(await fs.readFile(sidecar, "utf8"));
              if (meta?.mime) mime = meta.mime;
            } catch {
              // optional sidecar
            }
            const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
            return sendJson(res, 200, { dataUrl, relativePath });
          }

          return sendJson(res, 404, { error: "Not found" });
        } catch (err) {
          console.error("[workspace-bins]", err);
          return sendJson(res, 500, { error: err?.message ?? "Server error" });
        }
      });
    },
  };
}
