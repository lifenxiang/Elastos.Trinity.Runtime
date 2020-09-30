let fs = require("fs")
const { contextBridge, ipcRenderer, remote } = require("electron")
require("../../../../trinity-renderer")

contextBridge.exposeInMainWorld(
    'passwordManagerImpl',
    TrinityRenderer.TrinityRuntimeHelper.createIPCDefinitionToMainProcess("PasswordManager", [
        "setPasswordInfo",
		"getPasswordInfo",
		"getAllPasswordInfo",
		"deletePasswordInfo",
		"deleteAppPasswordInfo",
		"generateRandomPassword",
		"changeMasterPassword",
		"lockMasterPassword",
		"deleteAll",
		"setUnlockMode",
		"setVirtualDIDContext"
    ])
 )
