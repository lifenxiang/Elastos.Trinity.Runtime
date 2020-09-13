let fs = require("fs")
const { contextBridge, ipcRenderer, remote } = require("electron")
require("../../../../trinity-renderer")

contextBridge.exposeInMainWorld(
    'appManagerImpl',
    TrinityRenderer.TrinityRuntimeHelper.createIPCDefinitionToMainProcess("AppManager", [
        "getVersion",
        "start",
        "closeApp",
        "getAppInfos",
        "setCurrentLocale",
        "install",
        "unInstall",
        "setPluginAuthority",
        "setUrlAuthority",
        "getRunningList",
        "getAppList",
        "alertPrompt",
        "infoPrompt",
        "askPrompt",
        "getAppInfo",

        "getLocale",
        "getInfo",
        "launcher",
        "close",
        "sendMessage",
        "setListener",
        "sendIntent",
        "sendUrlIntent",
        "setIntentListener",
        "sendIntentResponse",
        "hasPendingIntent",
        "setVisible",
        "getSetting",
        "getSettings",
        "setSetting",
        "getPreference",
        "getPreferences",
        "setPreference",
        "resetPreferences",
        "broadcastMessage",

        "getStartupMode",
        "startBackgroundService",
        "stopBackgroundService",
        "getRunningServiceList",
        "startAppBackgroundService",
        "stopAppBackgroundService",
        "stopAllBackgroundService",
        "getAllRunningServiceList",
		
		"getBuildInfo"
    ])
 )
