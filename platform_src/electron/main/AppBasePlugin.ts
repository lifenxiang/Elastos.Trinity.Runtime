import { TrinityRuntime } from "./Runtime";
import { TrinityPlugin, SuccessCallback, ErrorCallback } from "./TrinityPlugin";
import { AppInfo } from './AppInfo';
import { AppManager } from './AppManager';
import { Log } from './Log';
import { PreferenceManager } from './PreferenceManager';
import { app } from 'electron';
import { IntentInfo } from './IntentInfo';
import { IntentManager } from './IntentManager';
import { ConfigManager } from './ConfigManager';

type CallbackContext = {
    success: SuccessCallback;
    error: ErrorCallback;
}

export class AppBasePlugin extends TrinityPlugin {
    private static LOG_TAG = "AppBasePlugin";

    isChangeIconPath = false;
    mMessageContext: CallbackContext = null;
    mIntentContext: CallbackContext = null;
    
    constructor(appId: string) {
        super(appId);
    }

    protected getVersion(success: SuccessCallback, error: ErrorCallback, args: any) {
        let version = PreferenceManager.getSharedInstance().getVersion();
        success(version);
    }

    protected async launcher(success: SuccessCallback, error: ErrorCallback, args: any) {
        await this.appManager.loadLauncher();
        AppManager.getSharedInstance().sendLauncherMessageMinimize(this.getModeId());
        success("ok");
    }

    private async startByMode(success: SuccessCallback, error: ErrorCallback, args: any, startupMode: string) {
        let id = args[0];
        console.log("asd - AppBasePlugin - startByMode id:"+id);
        let service = null;
        if (startupMode == AppManager.STARTUP_SERVICE) {
            service = args[1];
        }

        if (id == null || id == "") {
            error("Invalid id.");
        }
        else if (this.appManager.isLauncher(id)) {
            error("Can't start launcher! Please use launcher().");
        }
        else if (this.appManager.isDIDSession(id)) {
            error("Can't start did session!");
        }
        else {
            //TODO: sync with setAppVisible
            await this.appManager.setAppVisible(id, "show");
            await this.appManager.start(id, startupMode, service);
            success("ok");
        }
    }

    protected async start(success: SuccessCallback, error: ErrorCallback, args: any) {
        await this.startByMode(success, error, args, AppManager.STARTUP_APP);
    }

    protected close(success: SuccessCallback, error: ErrorCallback, args: any) {
        this.appManager.close(this.appId, AppManager.STARTUP_APP, null);
        success("ok");
    }

    //TODO: sync with start
    protected async setVisible(success: SuccessCallback, error: ErrorCallback, args: any) {
        /*let visible = args[0] as string;
        console.log("asd - AppBasePlugin - setVisible visible: "+visible);

        if (this.startupMode != AppManager.STARTUP_APP) {
            error("'" + this.startupMode + "' mode can't setVisible.");
            return;
        }

        if (visible == null || visible != "hide") {
            visible = "show";
        }

        this.appManager.setAppVisible(this.appId, visible);
        if (visible == "show") {
            await this.appManager.start(this.appId, AppManager.STARTUP_APP, null);
        }
        else {
            await this.appManager.loadLauncher();
        }
        this.appManager.sendLauncherMessage(AppManager.MSG_TYPE_INTERNAL, "{\"visible\": \"" + visible + "\"}", this.appId);*/
        success("ok");
    }

    protected async closeApp(success: SuccessCallback, error: ErrorCallback, args: any) {
        let appId = args[0];

        if (appId == null || appId == "") {
            error("Invalid id.");
        }
        await this.appManager.close(appId, AppManager.STARTUP_APP, null);
        success("ok");
    }

    private jsonAppPlugins(plugins: Array<AppInfo.PluginAuth>): any[] {
        let jsons: any[] = [];
        for (let pluginAuth of plugins) {
            let ret = {
                plugin: pluginAuth.plugin,
                authority: pluginAuth.authority
            };
            jsons.push(ret);
        }
        return jsons;
    }

    private jsonAppUrls(plugins: Array<AppInfo.UrlAuth>): any[] {
        let jsons: any[] = [];
        for (let urlAuth of plugins) {
            let ret = {
                url: urlAuth.url,
                authority: urlAuth.authority
            };
            jsons.push(ret);
        }
        return jsons;
    }

    private jsonAppIcons(info: AppInfo): any[] {
        let jsons: any[] = [];

        let icons: AppInfo.Icon[] = info.icons;

        for (let i = 0; i < icons.length; i++) {
            let icon = info.icons[i];
            let src = icon.src;
            if (this.isChangeIconPath) {
                src = "icon://" + info.app_id + "/" + i;
            }

            let ret = {
                src: src,
                size: icon.sizes,
                type: icon.type
            }
            jsons.push(ret);
        }
        return jsons;
    }

    private jsonAppLocales(info: AppInfo): any {
        let ret: any = {};
        for (let locale of info.locales) {
            let language = {
                name: locale.name,
                shortName: locale.short_name,
                description: locale.description,
                authorName: locale.author_name
            };
            ret[locale.language] = language;
        }
        return ret;
    }

    protected jsonAppFrameworks(info: AppInfo): any {
        let jsons: any[] = [];

        for (let framework of info.frameworks) {
            let ret = {
                name: framework.name,
                version: framework.version
            };
            jsons.push(ret);
        }
        return jsons;
    }

    protected jsonAppPlatforms(info: AppInfo): any {
        let jsons: any[] = [];

        for (let platform of info.platforms) {
            let ret = {
                name: platform.name,
                version: platform.version
            };
            jsons.push(ret);
        }
        return jsons;
    }

    protected jsonAppInfo(info: AppInfo): any {
        let appUrl = this.appManager.getAppUrl(info);
        let dataUrl = this.appManager.getDataUrl(info.app_id);
        let ret = {
            id: info.app_id,
            version: info.version,
            versionCode: info.version_code,
            name: info.name,
            shortName: info.short_name,
            description: info.description,
            startUrl: this.appManager.getStartPath(info),
            startVisible: info.start_visible,
            icons: this.jsonAppIcons(info),
            authorName: info.author_name,
            authorEmail: info.author_email,
            defaultLocale: info.default_locale,
            category: info.category,
            keyWords: info.key_words,
            plugins: this.jsonAppPlugins(info.plugins),
            urls: this.jsonAppUrls(info.urls),
            backgroundColor: info.background_color,
            themeDisplay: info.theme_display,
            themeColor: info.theme_color,
            themeFontName: info.theme_font_name,
            themeFontColor: info.theme_font_color,
            installTime: info.install_time,
            builtIn: (info.built_in == 1)?true:false,
            remote: (info.remote == 1)?true:false,
            appPath: appUrl,
            dataPath: dataUrl,
            locales: this.jsonAppLocales(info),
            frameworks: this.jsonAppFrameworks(info),
            platforms: this.jsonAppPlatforms(info)
        };
        return ret;
    }

    protected async getAppInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        let appId = args[0];

        if (appId == null || appId == "") {
            error("Invalid id.");
        }

        let info = await this.appManager.getAppInfo(appId);
        if (info != null) {
            this.isChangeIconPath = true;
            success(this.jsonAppInfo(info));
        } else {
            error("No such app!");
        }
    }

    protected async getInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        let info = await this.appManager.getAppInfo(this.appId);
        if (info != null) {
            success(this.jsonAppInfo(info));
        } else {
            error("No such app!");
        }
    }

    protected async getLocale(success: SuccessCallback, error: ErrorCallback, args: any) {
        let info = await this.appManager.getAppInfo(this.appId);
        let ret = {
            defaultLang: info.default_locale,
            currentLang: await PreferenceManager.getSharedInstance().getCurrentLocale(),
            systemLang: app.getLocale()
        }

        success(ret);
    }

    protected setCurrentLocale(success: SuccessCallback, error: ErrorCallback, args: any) {
        let code = args[0];
        PreferenceManager.getSharedInstance().setCurrentLocale(code);
        success("ok");
    }

    protected sendMessage(success: SuccessCallback, error: ErrorCallback, args: any) {
        let toId = args[0];
        let type = args[1];
        let msg = args[2];

        if (toId.startsWith("#")) {
            if (toId.startsWith("#service:") || AppManager.isStartupMode(toId.substring(1))) {
                toId = this.appId + toId;
            }
            else {
                error("It is invalid startup mode!");
                return;
            }
        }

        this.appManager.sendMessage(toId, type, msg, this.getModeId());
        success("ok");
    }

    //TODO: diff with java
    protected setListener(success: SuccessCallback, error: ErrorCallback, args: any) {
        this.mMessageContext = {
            success: success,
            error: error
        };

        //success();

        if (this.appManager.isLauncher(this.appId)) {
            this.appManager.setLauncherReady();
        }
    }

    //TODO: adapt PluginResult
    public onReceive(msg: string, type: number, from: string) {
        if (this.mMessageContext == null)
            return;
        
        let ret: any = {
            message: msg,
            type: type,
            from: from
        };
        this.mMessageContext.success(ret);
    }

    //TODO: adapt PluginResult
    protected async sendIntent(success: SuccessCallback, error: ErrorCallback, args: any) {
        let callbackContext: CallbackContext = {
            success: success,
            error: error
        };

        let action = args[0];
        let params = args[1];
        let currentTime = new Date().getMilliseconds();
        let toId = null;

        if (args[2] != null) {
            let options = args[2];
            if (options.appId != null) {
                toId = options.appId;
            }
        }

        let info = new IntentInfo(action, params, this.getModeId(), toId, currentTime, callbackContext);

        await IntentManager.getShareInstance().doIntent(info);
        callbackContext.success();
    }

    //TODO: implement
    protected sendUrlIntent(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    protected sendIntentResponse(success: SuccessCallback, error: ErrorCallback, args: any) {
        let action = args[0];
        let result = args[1];
        let intentId = args[2];

        IntentManager.getShareInstance().sendIntentResponse(this, result, intentId, this.getModeId());
        success("ok");
    }

    //TODO: adapt PluginResult
    protected setIntentListener(success: SuccessCallback, error: ErrorCallback, args: any) {
        this.mIntentContext = {
            success: success,
            error: error
        };
        //this.mIntentContext.success();
        IntentManager.getShareInstance().setIntentReady(this.getModeId());
    }

    protected hasPendingIntent(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ret = IntentManager.getShareInstance().getIntentCount(this.getModeId()) != 0;
        success(ret);
    }

    public isIntentReady(): boolean {
        return (this.mIntentContext != null);
    }

    //TODO: adapt PluginResult
    public onReceiveIntent(info: IntentInfo) {
        if (this.mIntentContext == null)
            return;
        
        this.mIntentContext.success({
            action: info.action,
            params: info.params,
            from: info.fromId,
            intentId: info.intentId,
            originalJwtRequest: info.originalJwtRequest
        });
    }

    //TODO: adapt PluginResult
    public onReceiveIntentResponse(info: IntentInfo) {
        let obj: any = {};
        obj.action = info.action;
        if (info.params != null) {
            obj.result = info.params;
        }
        else {
            obj.result = null
        }
        obj.from = info.toId;
        info.callbackContext.success(obj);
    }


    //---------------- for AppManager --------------------------------------------------------------

    protected async install(success: SuccessCallback, error: ErrorCallback, args: any) {
        let url: string = args[0];
        let update: boolean = args[1];

        if (url.startsWith("trinity://")) {
            url = await this.getCanonicalPath(url);
        }

        this.appManager.checkInProtectList(url);
        let info = this.appManager.install(url, update, false);
        if (info != null) {
            success(this.jsonAppInfo(info));
        }
        else {
            error("error");
        }
    }

    protected unInstall(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0];
        this.appManager.unInstall(id, false);
        success(id);
    }

    protected getAppInfos(success: SuccessCallback, error: ErrorCallback, args: any) {
        let appInfos = this.appManager.getAppInfos();
        let infos: any = {};
        this.isChangeIconPath = true;

        if (appInfos != null) {
            appInfos.forEach((value: AppInfo, key: string) => {
                infos[key] = this.jsonAppInfo(value);
            });
        }
        let ids: string[] = this.appManager.getAppIdList();
        let list: any[] = this.jsonIdList(ids);

        let ret = {
            infos: infos,
            list: list
        };
        success(ret);
    }

    protected async setPluginAuthority(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0];
        let plugin = args[1];
        let authority = args[2];

        if (id == null || id == "") {
            error("Invalid id.");
            return;
        }
        await this.appManager.setPluginAuthority(id, plugin, authority);
        success("ok");
    }

    protected async setUrlAuthority(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0];
        let url = args[1];
        let authority = args[2];

        if (id == null || id == "") {
            error("Invalid id.");
            return;
        }
        await this.appManager.setUrlAuthority(id, url, authority);
        success("ok");
    }

    protected jsonIdList(ids: string[]): any[] {
        let json: any[] = [];
        for (let id of ids) {
            if (!this.appManager.isLauncher(id)) {
                json.push(id);
            }
        }
        return json;
    }

    protected jsonList(ids: string[]): any[] {
        let json: any[] = [];
        for (let id of ids) {
            json.push(id);
        }
        return json;
    }

    protected getRunningList(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ids = this.appManager.getRunningList();
        let ret = this.jsonIdList(ids);
        success(ret);
    }

    protected getAppList(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ids = this.appManager.getAppIdList();
        let ret = this.jsonIdList(ids);
        success(ret);
    }

    protected getLastList(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ids = this.appManager.getLastList();
        let ret = this.jsonIdList(ids);
        success(ret);
    }

    //TODO: implement
    private alertDialog(args: any, icon: number, success: SuccessCallback, error: ErrorCallback) {

    }

    //TODO: implement
    protected alertPrompt(success: SuccessCallback, error: ErrorCallback, args: any) {

    }

    //TODO: implement
    protected infoPrompt(success: SuccessCallback, error: ErrorCallback, args: any) {

    }

    //TODO: implement
    protected askPrompt(success: SuccessCallback, error: ErrorCallback, args: any) {

    }

    protected async getSetting(success: SuccessCallback, error: ErrorCallback, args: any) {
        let key = args[0];

        let ret = await AppManager.getSharedInstance().getDBAdapter().getSetting(this.appId, key);
        if (ret != null) {
            success(ret);
        }
        else {
            error("'" + key + "' isn't exist value.");
        }
    }

    protected async getSettings(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ret = await AppManager.getSharedInstance().getDBAdapter().getSettings(this.appId);
        success(ret);
    }

    protected async setSetting(success: SuccessCallback, error: ErrorCallback, args: any) {
        let key = args[0];
        let value: any = args[1];
        if (JSON.stringify(value) == "null") {
            value = null;
        }
        await AppManager.getSharedInstance().getDBAdapter().setSetting(this.appId, key, value);
        success("ok");
    }

    protected async getPreference(success: SuccessCallback, error: ErrorCallback, args: any) {
        let key = args[0];

        let ret = await PreferenceManager.getSharedInstance().getPreference(key);
        if (ret != null) {
            success(ret);
        }
        else {
            error("'" + key + "' isn't exist value.");
        }
    }

    protected async getPreferences(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ret = await PreferenceManager.getSharedInstance().getPreferences();
        success(ret);
    }

    protected setPreference(success: SuccessCallback, error: ErrorCallback, args: any) {
        let key = args[0];
        let value: any = args[1];
        if (JSON.stringify(value) == "null") {
            value = null;
        }
        PreferenceManager.getSharedInstance().setPreference(key, value);
        success("ok");
    }

    protected async resetPreferences(success: SuccessCallback, error: ErrorCallback, args: any) {
        await AppManager.getSharedInstance().getDBAdapter().resetPreferences();
        success("ok");
    }

    protected broadcastMessage(success: SuccessCallback, error: ErrorCallback, args: any) {
        let type = args[0];
        let msg = args[0];
        AppManager.getSharedInstance().broadcastMessage(type, msg, this.getModeId());
        success("ok");
    }

    protected getStartupMode(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ret: any = {};
        ret.startupMode = this.startupMode;
        if (this.startupMode == AppManager.STARTUP_SERVICE) {
            ret.serviceName = this.serviceName;
        }
        success(ret);
    }

    protected async startBackgroundService(success: SuccessCallback, error: ErrorCallback, args: any) {
        let serviceName = args[0];
        await this.appManager.start(this.appId, AppManager.STARTUP_SERVICE, serviceName);
        success("ok");
    }

    protected async stopBackgroundService(success: SuccessCallback, error: ErrorCallback, args: any) {
        let serviceName = args[0];
        await this.appManager.close(this.appId, AppManager.STARTUP_SERVICE, serviceName);
        success("ok");
    }

    protected getRunningServiceList(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ids = this.appManager.getServiceRunningList(this.appId);
        let ret = this.jsonList(ids);
        success(ret);
    }

    protected async startAppBackgroundService(success: SuccessCallback, error: ErrorCallback, args: any) {
        await this.startByMode(success, error, args, AppManager.STARTUP_SERVICE);
    }

    protected async stopAppBackgroundService(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0];
        let serviceName = args[1];
        await this.appManager.close(id, AppManager.STARTUP_SERVICE, serviceName);
        success("ok");
    }

    protected stopAllBackgroundService(success: SuccessCallback, error: ErrorCallback, args: any) {
        this.appManager.closeAllServices();
        success("ok");
    }

    protected getAllRunningServiceList(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ids = this.appManager.getAllServiceRunningList();
        let ret = this.jsonIdList(ids);
        success(ret);
    }

    protected getBuildInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        let ret: any = {};
        let type = ConfigManager.getShareInstance().getStringValue("build.type", "elastOS");
        ret.type = type;

        let variant = ConfigManager.getShareInstance().getStringValue("build.variant", "");
        ret.variant = variant;

        ret.platform = "android";

        success(ret);
    }

    private checkIntentScheme(url: string): boolean {
        return IntentManager.checkTrinityScheme(url);// && (!isUrlApp() || url.contains("callbackurl="));
    }

    //TODO: adapt Uri
    public shouldAllowNavigation(url: string): boolean {
        if (this.appManager.isLauncher(this.appId) || this.appManager.isDIDSession(this.appId)) {
            return true;
        }
        else if (this.checkIntentScheme(url)) {
            try {
                //IntentManager.getShareInstance().sendIntentByUri(Uri.parse(url), getModeId());
            } catch (e) {
                Log.e(AppBasePlugin.LOG_TAG, e);
            }
            return false;
        }

        return null;
    }

    public shouldAllowRequest(url: string): boolean {
        if (this.appManager.isLauncher(this.appId) || this.appManager.isDIDSession(this.appId)) {
            return true;
        }
        else if (this.checkIntentScheme(url)) {
            try {
                //IntentManager.getShareInstance().sendIntentByUri(Uri.parse(url), getModeId());
            } catch (e) {
                Log.e(AppBasePlugin.LOG_TAG, e);
            }
            return false;
        }

        if (url.startsWith("asset://www/cordova") || url.startsWith("asset://www/plugins")
                || url.startsWith("trinity:///asset/") || url.startsWith("trinity:///data/")
                || url.startsWith("trinity:///temp/")) {
            return true;
        }

        if (this.isChangeIconPath && url.startsWith("icon://")) {
            return true;
        }

        return null;
    }

    //TODO: implement
    public remapUri(uri: any): any {

    }
}

TrinityRuntime.getSharedInstance().registerPlugin("AppManager", (appId: string)=>{
    return new AppBasePlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("AppManager", [
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
]);