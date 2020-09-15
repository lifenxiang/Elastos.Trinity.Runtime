let fs = require("fs")
const { contextBridge, ipcRenderer, remote } = require("electron")
require("../../../../trinity-renderer")

contextBridge.exposeInMainWorld(
    'didSessionManagerImpl',
    TrinityRenderer.TrinityRuntimeHelper.createIPCDefinitionToMainProcess("DIDSessionManager", [
        "addIdentityEntry",
        "deleteIdentityEntry",
        "getIdentityEntries",
        "getSignedInIdentity",
        "signIn",
        "signOut",
		"authenticate"
    ])
 )
