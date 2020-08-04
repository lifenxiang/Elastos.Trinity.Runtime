let fs = require("fs")
const { contextBridge, ipcRenderer, remote } = require("electron")
require("../../../../trinity-renderer")

contextBridge.exposeInMainWorld(
    'titleBarManagerImpl',
    TrinityRenderer.TrinityRuntimeHelper.createIPCDefinitionToMainProcess("TitleBarManager", [
        "setTitle",
        "setBackgroundColor",
        "setForegroundMode",
        "setNavigationMode",
        "setNavigationIconVisibility",
        "addOnItemClickedListener",
        "removeOnItemClickedListener",
        "setIcon",
        "setBadgeCount",
        "setupMenuItems",
        "showActivityIndicator",
        "hideActivityIndicator"
    ])
  )