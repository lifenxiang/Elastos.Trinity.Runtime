const { ipcMain, BrowserView } = require("electron")
var addon = require('bindings')('hello');

let { TrinityPlugin } = require("../../../../platforms/electron/platform_www/cdv-electron-main")

class AppManagerPlugin extends TrinityPlugin {
    constructor(appId) {
        super(appId)
    }
    
    getAppInfos(args) {
        console.log("getAppInfos - caller appId="+this.appId)

        let fakeAppInfos = [
            {
                id: "org.a.b",
                version: "1.0",
                versionCode: 1,
                name: "Super app",
                shortName: "Super app",
                description: "This is a really cool app"
            },
            {
                id: "org.c.d",
                version: "2.0",
                versionCode: 12,
                name: "Super other app",
                shortName: "Super other app",
                description: "This is a really cool other app"
            }
        ]
        return fakeAppInfos;
    }

    getPreference(args) {
        console.log("getPreference")
        return "";
    }
}

runtime.registerPlugin("AppManager", (appId)=>{
    return new AppManagerPlugin(appId);
});
runtime.createIPCDefinitionForMainProcess("AppManager", [
    "getAppInfos",
    "getPreference"
])
