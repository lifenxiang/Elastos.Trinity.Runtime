let fs = require("fs")
const { contextBridge, ipcRenderer, remote } = require("electron")
//var addon = require('bindings')('hello');
require("../../../../trinity-renderer")

contextBridge.exposeInMainWorld(
    'appManagerImpl',
    TrinityRenderer.TrinityRuntimeHelper.createIPCDefinitionToMainProcess("AppManager", [
        "getPreference",
        "getAppInfos"
    ])
  )
