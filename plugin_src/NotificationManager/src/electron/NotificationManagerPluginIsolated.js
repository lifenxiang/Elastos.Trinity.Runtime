let fs = require("fs")
const { contextBridge, ipcRenderer, remote } = require("electron")
require("../../../../trinity-renderer")

contextBridge.exposeInMainWorld(
    'notificationManagerImpl',
    TrinityRenderer.TrinityRuntimeHelper.createIPCDefinitionToMainProcess("NotificationManager", [
        "clearNotification",
		"getNotifications",
		"sendNotification",
		"setNotificationListener"
    ])
 )
