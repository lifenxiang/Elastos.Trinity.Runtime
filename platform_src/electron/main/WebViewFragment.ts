import { AppManager } from './AppManager';
import { AppInfo } from './AppInfo';
import { app, session, Session, Request, BrowserView, BrowserWindow } from 'electron';
import { LauncherViewFragment } from './LauncherViewFragment';
import { AppViewFragment } from './AppViewFragment';
import { PreferenceManager } from './PreferenceManager';
import { UIStyling } from './UIStyling';
import { join as pathJoin } from "path";
import { Log } from './Log';
import { TitleBar } from './titlebar/TitleBar';
import { TrinityRuntime } from './Runtime';
import { TrinityPlugin } from './TrinityPlugin';
import { AppBasePlugin } from './AppBasePlugin';
import { TrinityCordovaInterfaceImpl } from './TrinityCordovaInterfaceImpl';
import { ProtocolRequest } from 'electron/main';

export class WebViewFragment {
    private static LOG_TAG = "WebViewFragment";

    protected static cfgPluginEntries: Array<PluginEntry>;

    protected appManager: AppManager;
    protected runtime: TrinityRuntime;
    protected window: BrowserWindow;

    // Keep app running when pause is received. (default = true)
    // If true, then the JavaScript and native code continue to run in the background
    // when another application (activity) is started.
    protected keepRunning: boolean = true;

    //Instance of the actual WebView
    public appView: BrowserView;
    public browserViewId: number;
    pluginInstances: { [key: string] : TrinityPlugin };

    public pluginEntries: Array<PluginEntry>;
    protected cordovaInterface: TrinityCordovaInterfaceImpl;
    public basePlugin: AppBasePlugin;
    public packageId: string;
    public modeId: string;
    public did: string;
    public startupMode: string = AppManager.STARTUP_APP;
    public serivceName: string = null;

    public appInfo: AppInfo;
    protected launchUrl: string;

    public titleBar: TitleBar;

    constructor() {}

    public static newInstance(appId: string, startupMode: string, serviceName: string): WebViewFragment {
        if (appId != null) {
            let fragment: WebViewFragment = null;
            if (AppManager.getSharedInstance().isLauncher(appId) || AppManager.getSharedInstance().isDIDSession(appId)) {
                //fragment = new LauncherViewFragment();
                fragment = new WebViewFragment();
            }
            else {
                //fragment = new AppViewFragment();
                fragment = new WebViewFragment();
            }

            fragment.packageId = appId;
            fragment.startupMode = startupMode;
            fragment.serivceName = serviceName;

            return fragment;
        }
        else {
            return null;
        }
    }

    public async createView(runtime: TrinityRuntime): Promise<WebViewFragment> {
        this.appManager = AppManager.getSharedInstance();
        this.runtime = runtime;
        this.window = this.appManager.window;


        let darkMode = await PreferenceManager.getSharedInstance().getBooleanValue("ui.darkmode", false);
        UIStyling.prepare(darkMode);

        this.appInfo = await this.appManager.getAppInfo(this.packageId);
        this.did = this.appManager.getDID();

        //logic difference with java
        if (this.startupMode != AppManager.STARTUP_SERVICE) {
            this.serivceName = null;
        }
        this.modeId = this.appManager.getIdbyStartupMode(this.packageId, this.startupMode, this.serivceName);

        const partition = 'TODO-TEST-persist:example'+this.appInfo.app_id // TODO: SANDBOX PER DID/APPID
        const ses = session.fromPartition(partition);
        
        let dappFilesPath = this.appManager.getAppLocalPath(this.appInfo);
        this.setupSessionProtocolHandlers(ses, this.appInfo.app_id, dappFilesPath);

        this.appView = new BrowserView({
            webPreferences: {
                nodeIntegration: false, // is default value after Electron v5
                contextIsolation: true, // protect against prototype pollution
                enableRemoteModule: false, // turn off remote
                preload: pathJoin(app.getAppPath(), 'dapp_preload.js'),
                partition: partition
            }
        });

        //dev mode
        //this.appView.webContents.openDevTools();

        this.window.addBrowserView(this.appView);
        this.appView.setBounds({ x: 0, y: 64, width: 500, height: 800 });

        this.titleBar = new TitleBar(this.runtime.titleBarView);
        this.browserViewId = this.appView.id;

        this.titleBar.setFragment(this);

        await this.createPluginInstances();
        

        this.appManager.fragments.set(this.browserViewId, this);
        this.appManager.fragmentIds.set(this.packageId, this.browserViewId);

        Log.d(WebViewFragment.LOG_TAG, "Started app "+this.appInfo.app_id+" with browser view id "+ this.browserViewId);
        this.appView.webContents.loadURL('trinityapp://index.html');

        this.titleBar.initialize(this.modeId);

        // Set title bar title to app name by default. Apps are free to change this.
        //TODO: replace with fragment method
        if (!this.appManager.isLauncher(this.appInfo.app_id))
            this.titleBar.setTitle(this.appInfo.name);

        //this.loadConfig();

        console.log("WebViewFragment", "done");

        return this;
    }

    public getTitleBar(): TitleBar {
        return this.titleBar;
    }

    protected loadConfig() {
        
    }

    public isLauncher(): boolean {
        return false;
    }










    private async createPluginInstances() {
        // Create plugin instances fo this app
        this.pluginInstances = {};
        for (let pluginName of Object.keys(this.runtime.plugins)) {
            console.log("pluginName", pluginName)
            let plugin = this.runtime.plugins[pluginName];
            let pluginInstance = plugin.instanceCreationCallback(this.appInfo.app_id);
            this.pluginInstances[pluginName] = pluginInstance;

            await pluginInstance.setFragment(this);
            //await pluginInstance.setInfo(this.appInfo)
        }

        /*this.runtime.plugins2.forEach(async (value: any, key: string) => {
            let pluginName = key;
            console.log("pluginName: "+pluginName);
            let plugin = value;
            let pluginInstance = plugin.instanceCreationCallback(this.appInfo.app_id);
            this.pluginInstances[pluginName] = pluginInstance;

            await pluginInstance.setInfo(this.appInfo);
        });*/
    }

    private setupSessionProtocolHandlers(ses: Session, appId: string, dappFilesPath: string) {
        let wwwFilesPath = `${__dirname}`

        ses.protocol.registerFileProtocol("trinityapp", async (request: ProtocolRequest, callback: (filePath: string)=>void) => {
            //console.log("Handle FILE trinityapp:", request);

            // Ex: request.url = trinityapp://index.html/
            let redirectedFilePath: string;
            if (request.url == "trinityapp://index.html/")
                redirectedFilePath = dappFilesPath + "/index.html"
            else {
                redirectedFilePath = request.url.replace("trinityapp://index.html", "");
                if (!redirectedFilePath.startsWith(dappFilesPath)) {
                    let info = await this.appManager.getAppInfo(appId);
                    redirectedFilePath = this.appManager.getAppUrl(info) + redirectedFilePath.substring(1);
                }
            }

            //console.log("Redirecting to file path: "+redirectedFilePath);
            callback(redirectedFilePath)
        });

        ses.protocol.interceptFileProtocol("asset", (request: ProtocolRequest, callback: (filePath: string)=>void) => {
            //console.log("Intercepting ASSET request:", request.url);

            let allowedUrls = [
                "asset://www/cordova.js",
                "asset://www/cordova_plugins.js"
            ]

            // Ex: request.url = asset://www/cordova.js
            if (allowedUrls.indexOf(request.url) >= 0 || 
                request.url.startsWith("asset://www/plugins"))
                callback(wwwFilesPath + "/" + request.url.replace("asset://www/", ""));
            else {
                // All other file access are forbidden for now. For security: don't allow a generic access to
                // the shared www folder.
                callback(dappFilesPath + "/index.html"); // TMP TEST
            }
        });

        ses.protocol.registerFileProtocol("icon", async (request: ProtocolRequest, callback: (filePath: string)=>void) => {
            //console.log("Intercepting ASSET request:", request.url);

            // Ex: request.url = icon://appid/iconindex
            // TODO? if (isChangeIconPath && url.startsWith("icon://")) {
                let str = request.url.substring(7);
                let index = str.indexOf("/");
                if (index > 0) {
                    let app_id = str.substring(0, index);
                    let info = await this.appManager.getAppInfo(app_id);
                    if (info != null) {
                        index = parseInt(str.substring(index + 1));
                        let icon = info.icons[index];
                        let url = this.appManager.getIconUrl(info, icon.src);
                        callback(url);
                        return;
                    }
                }

                callback(null);
            //}
        });

        /*ses.protocol.registerFileProtocol("icon", (request: Request, callback: (filePath: string)=>void) => {
            console.log("ICON request:", request.url);

            let parsedUrl = new URL(request.url);
            console.log("parsedUrl", parsedUrl)

            callback(null)
        }, (err)=>{
            if (err)
                console.error("Icon intercept error:", err);
        });*/
    }
}

export class PluginEntry {
    public service: string;
    public pluginClass: string;
    public plugin: TrinityPlugin;

    constructor(service: string, pluginClass: string, plugin: TrinityPlugin) {
        this.service = service;
        this.pluginClass = pluginClass;
        this.plugin = plugin;
    }
}