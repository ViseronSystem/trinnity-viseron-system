
const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld("tvs", {
  platform: process.platform,
  versions: { node: process.versions.node, electron: process.versions.electron },
});
