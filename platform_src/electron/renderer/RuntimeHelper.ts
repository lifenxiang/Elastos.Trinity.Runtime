import { ipcRenderer } from "electron";

export class TrinityRuntimeHelper {
    // Plugin "preload" context -> expose apis that send IPS calls to main process
    static createIPCDefinitionToMainProcess(pluginName, methodsList) {
        let exposedMethods = {}
        for (let m of methodsList) {
            let methodFullName = pluginName + "-" + m;
            exposedMethods[m] = async (args) => {
                let result = await ipcRenderer.invoke(methodFullName, args)
                console.log("IPC RESULT", result)
                return result;
            }
        }
        return exposedMethods
    }
}
