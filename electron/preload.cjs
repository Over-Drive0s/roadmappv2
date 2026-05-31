const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overDriveBins", {
  getRoot: () => ipcRenderer.invoke("bins:getRoot"),
  loadAll: (profileId) => ipcRenderer.invoke("bins:loadAll", profileId),
  readJson: (relativePath) => ipcRenderer.invoke("bins:readJson", relativePath),
  writeJson: (relativePath, payload) => ipcRenderer.invoke("bins:writeJson", relativePath, payload),
  writeAttachment: (relativePath, dataUrl) =>
    ipcRenderer.invoke("bins:writeAttachment", relativePath, dataUrl),
  readAttachment: (relativePath) => ipcRenderer.invoke("bins:readAttachment", relativePath),
  reset: (profileId) => ipcRenderer.invoke("bins:reset", profileId),
  deleteProfileWorkspace: (profileId) => ipcRenderer.invoke("bins:deleteProfileWorkspace", profileId),
});
