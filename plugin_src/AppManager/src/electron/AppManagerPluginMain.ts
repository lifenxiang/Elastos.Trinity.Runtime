const { ipcMain, BrowserView } = require("electron")
//var addon = require('bindings')('hello');

import { TrinityRuntime } from "../Runtime";
import { TrinityPlugin, SuccessCallback, ErrorCallback } from "../TrinityPlugin";
import { AppInfo } from '../AppInfo';
import { AppManager } from '../AppManager';
import { Log } from '../Log';

type MessageContext = {
    success: SuccessCallback;
    error: ErrorCallback;
}

export class AppManagerPlugin extends TrinityPlugin {
    private static LOG_TAG = "AppManagerPlugin";

    isChangeIconPath = false;
    mMessageContext: MessageContext = null;
    
    constructor(appId: string) {
        super(appId)
    }
    
    getAppInfos(success: SuccessCallback, error: ErrorCallback, args: any) {
        //console.log("getAppInfos - caller appId="+this.appId)

        let infosMap = this.appManager.getAppInfos();
        this.isChangeIconPath = true;

        let infos: any = {};
        let keys: string[] = [];
        infosMap.forEach((info, key)=>{
            infos[key] = this.jsonAppInfo(info);
            keys.push(key);
        })

        success({
            infos: infos,
            list: keys
        });
    }

    getPreference(success: SuccessCallback, error: ErrorCallback, args: any) {
        //console.log("getPreference")
        success("");
    }

    setListener(success: SuccessCallback, error: ErrorCallback, args: any) {
        this.mMessageContext = {
            success: success,
            error: error
        };

        if (this.appManager.isLauncher(this.appId)) {
            this.appManager.setLauncherReady();
        }
    }

    public onReceive(msg: string, type: number, from: string) {
        if (this.mMessageContext == null)
            return;
        
        this.mMessageContext.success({
            message: msg,
            type: type,
            from: from
        });
    }

    protected setVisible(success: SuccessCallback, error: ErrorCallback, args: any) {
        //console.error("asd - setVisible");
        //console.log(args);
        let visible = args[0] as string;

        if (visible == null || visible != "hide") {
            visible = "show";
        }

        this.appManager.setAppVisible(this.appId, visible);
        if (visible == "show") {
            this.appManager.start(this.appId, AppManager.STARTUP_APP, null);
        }
        else {
            this.appManager.loadLauncher();
        }
        this.appManager.sendLauncherMessage(AppManager.MSG_TYPE_INTERNAL,
                "{\"visible\": \"" + visible + "\"}", this.appId);
        success("ok");
    }

    start(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0];

        if (id == null || id == "") {
            throw new Error("Invalid id.");
        }
        else if (this.appManager.isLauncher(id)) {
            throw new Error("Can't start launcher! Please use launcher().");
        }
        else if (this.appManager.isDIDSession(id)) {
            throw new Error("Can't start did session!");
        }
        else {
            this.appManager.start(id, AppManager.STARTUP_APP, null);
            return "ok";
        }
    }

    protected jsonAppInfo(info: AppInfo): any {
        let appUrl = this.appManager.getAppUrl(info);
        let dataUrl = this.appManager.getDataUrl(info.app_id);
        let ret = {
            "id": info.app_id,
            "version": info.version,
            "versionCode": info.version_code,
            "name": info.name,
            "shortName": info.short_name,
            "description": info.description,
            "startUrl": this.appManager.getStartPath(info),
            "startVisible": info.start_visible,
            "icons": this.jsonAppIcons(info),
            "authorName": info.author_name,
            "authorEmail": info.author_email,
            "defaultLocale": info.default_locale,
            "category": info.category,
            "keyWords": info.key_words,
            // TODO "plugins": this.jsonAppPlugins(info.plugins),
            // TODO "urls": this.jsonAppUrls(info.urls),
            "backgroundColor": info.background_color,
            /* TODO "themeDisplay": info.theme_display,
            "themeColor": info.theme_color,
            "themeFontName": info.theme_font_name,
            "themeFontColor": info.theme_font_color,*/
            "installTime": info.install_time,
            "builtIn": info.built_in? 1 : 0,
            "remote": info.remote? 1 : 0,
            "appPath": appUrl,
            "dataPath": dataUrl,
            /* TODO "locales": this.jsonAppLocales(info),
            "frameworks": this.jsonAppFrameworks(info),
            "platforms": this.jsonAppPlatforms(info),*/
        }
        return ret;
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
    "getPreference",
    "setListener",
    "start",
    "setVisible"
])
