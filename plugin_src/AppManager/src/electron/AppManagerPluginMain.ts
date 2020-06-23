const { ipcMain, BrowserView } = require("electron")
//var addon = require('bindings')('hello');

import { TrinityRuntime, TrinityPlugin } from "../Runtime"

class AppManagerPlugin extends TrinityPlugin {
    constructor(appId: string) {
        super(appId)
    }
    
    getAppInfos(args: any) {
        console.log("getAppInfos - caller appId="+this.appId)

        let fakeAppInfos = {
            "org.elastos.trinity.dapp.did": {
                id: "org.elastos.trinity.dapp.did",
                version: "1.0",
                versionCode: 1,
                name: "DID app",
                shortName: "DID app",
                description: "This is a really cool app",
                icons: [
                    {
                        src: "icon://org.elastos.trinity.dapp.did/0",
                        size: "512x512",
                        type: "image/png"
                    }
                ]
            },
            "org.elastos.trinity.dapp.qrcodescanner": {
                id: "org.elastos.trinity.dapp.qrcodescanner",
                version: "2.0",
                versionCode: 12,
                name: "Scanner app",
                shortName: "Scanner app",
                description: "This is a really cool other app",
                icons: [
                    {
                        src: "icon://org.elastos.trinity.dapp.qrcodescanner/0",
                        size: "512x512",
                        type: "image/png"
                    }
                ]
            }
        }
        return {
            infos: fakeAppInfos,
            list: Object.keys(fakeAppInfos)
        };
    }

    getPreference(args: any) {
        console.log("getPreference")
        return "";
    }
}

TrinityRuntime.getSharedInstance().registerPlugin("AppManager", (appId: string)=>{
    return new AppManagerPlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("AppManager", [
    "getAppInfos",
    "getPreference"
])
