import { ipcRenderer } from "electron";

type InvocationRequest = {
    success: any;
    error: any;
    args: any;
}

export type InvocationResult = {
    successResultArgs?: any;
    errorResultArgs?: any;
}

export class TrinityRuntimeHelper {
    // Plugin "preload" context -> expose apis that send IPS calls to main process
    static createIPCDefinitionToMainProcess(pluginName, methodsList) {
        let exposedMethods = {}
        for (let m of methodsList) {
            let methodFullName = pluginName + "-" + m;

            // TODO: Filter sending/receiving app id/view

            exposedMethods[m] = async (success, error, args) => {
                // Listen to async call responses
                ipcRenderer.addListener(methodFullName+"-result", (event, resultArgs: InvocationResult)=>{
                    //console.log("RENDERER SIDE CALL TO "+methodFullName+"-result", resultArgs)
                    if (resultArgs.errorResultArgs) {
                        error(resultArgs.errorResultArgs);
                    }
                    else {
                        success(resultArgs.successResultArgs);
                    }
                });

                ipcRenderer.send(methodFullName, args);
            }
        }
        return exposedMethods
    }
}
