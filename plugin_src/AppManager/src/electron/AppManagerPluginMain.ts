const { ipcMain, BrowserView } = require("electron")
//var addon = require('bindings')('hello');

import { TrinityRuntime } from "../Runtime";
import { TrinityPlugin } from "../TrinityPlugin";
import { AppInfo } from '../AppInfo';

class AppManagerPlugin extends TrinityPlugin {
    isChangeIconPath = false;

    constructor(appId: string) {
        super(appId)
    }
    
    getAppInfos(args: any) {
        console.log("getAppInfos - caller appId="+this.appId)

        let infosMap = this.appManager.getAppInfos();
        this.isChangeIconPath = true;

        let infos: any = {};
        let keys: string[] = [];
        infosMap.forEach((info, key)=>{
            infos[key] = Object.assign({}, info); // Create an object copy to not modify the original
            keys.push(key);
        })

        // Customize a few fields from infos, such as icons
        for (let key of Object.keys(infos)) {
            infos[key]["icons"] = this.jsonAppIcons(infos[key])
        }
        // TODO: urls, etc. See android implementation
        
        return {
            infos: infos,
            list: keys
        };
    }

    getPreference(args: any) {
        console.log("getPreference")
        return "";
    }

    private jsonAppIcons(info: AppInfo): any[] {
        let reworkedIcons = new Array<any>();

        for (let i = 0; i < info.icons.length; i++) {
            let icon = info.icons[i];
            let src = icon.src;
            if (this.isChangeIconPath) {
                src = "icon://" + info.app_id + "/" + i;
            }

            let reworkedIcon = {
                src: src,
                size: icon.sizes,
                type: icon.type
            }
            
            reworkedIcons.push(reworkedIcon);
        }
        return reworkedIcons;
    }
}

TrinityRuntime.getSharedInstance().registerPlugin("AppManager", (appId: string)=>{
    return new AppManagerPlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("AppManager", [
    "getAppInfos",
    "getPreference"
])
