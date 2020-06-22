import { ipcRenderer, ipcMain, BrowserView, app, session, RedirectRequest, Request } from "electron";
import path from 'path';

export class TrinityPlugin {
    appId;

    constructor(appId) {
        this.appId = appId;
    }
}

export class RunningApp {
    appId;
    browserViewID;
    pluginInstances;

    constructor(appId, browserViewID, runtime) {
        this.browserViewID = browserViewID;
        this.appId = appId;

        // Create plugin instances fo this app
        this.pluginInstances = {};
        for (let pluginName of Object.keys(runtime.plugins)) {
            console.log("pluginName", pluginName)
            let plugin = runtime.plugins[pluginName];
            let pluginInstance = plugin.instanceCreationCallback(appId);
            this.pluginInstances[pluginName] = pluginInstance;
        }
    }
}

export class TrinityRuntime {
    runningApps;
    plugins;
    mainWindow;

    constructor() {
        this.runningApps = {};
        this.plugins = {};
    }

    setMainWindow(mainWindow) {
        this.mainWindow = mainWindow;
    }

    registerPlugin(pluginName, instanceCreationCallback) {
        this.plugins[pluginName] = {
            instanceCreationCallback: instanceCreationCallback
        }
    }

    // Plugin in main process -> handle IPC calls
    createIPCDefinitionForMainProcess(pluginName, methodsList) {
        for (let m of methodsList) {
            let fullMethodName = pluginName+"-"+m;
            console.log("Main process is registering an IPC event handler for event "+fullMethodName);
            ipcMain.handle(fullMethodName, (event, args)=>{
                console.log("handle "+fullMethodName, args);
    
                let callerWebContents = event.sender;
                let callerBrowserView = BrowserView.fromWebContents(callerWebContents)
    
                console.log("Caller ID: "+callerBrowserView.id)

                // Retrieve related running app based on caller id
                let runningApp = this.findRunningAppByCallerID(callerBrowserView.id);
                console.log("Found running app to handle IPC "+fullMethodName, runningApp);

                let pluginResult = runningApp.pluginInstances[pluginName][m]();
                console.log("pluginResult", pluginResult);
                return pluginResult;
            })
        }
    }

    findRunningAppByCallerID(browserViewCallerID) {
        for (let appId in this.runningApps) {
            if (this.runningApps[appId].browserViewID == browserViewCallerID)
                return this.runningApps[appId];
        }
        return null;
    }

    startLauncher() {
        const partition = 'TODO-TEST-persist:example' // TODO: SANDBOX PER DID/APPID
        const ses = session.fromPartition(partition)

        let wwwFilesPath = `${__dirname}`
        let dappFilesPath = `${__dirname}/launcher`

        ses.protocol.registerFileProtocol("trinityapp", (request: Request, callback: (filePath: string)=>void) => {
            console.log("Handle FILE trinityapp:", request);

            // Ex: request.url = trinityapp://index.html/
            let redirectedFilePath: string;
            if (request.url == "trinityapp://index.html/")
                redirectedFilePath = dappFilesPath + "/index.html"
            else {
                redirectedFilePath = request.url.replace("trinityapp://index.html", "");
                if (!redirectedFilePath.startsWith(dappFilesPath))
                    redirectedFilePath = dappFilesPath + redirectedFilePath;
            }

            console.log("Redirecting to file path: "+redirectedFilePath);
            callback(redirectedFilePath)
        }, (err)=>{
            if (err)
                console.error("Asset intercept error:", err);
        });

        ses.protocol.interceptFileProtocol("asset", (request: Request, callback: (filePath: string)=>void) => {
            console.log("Intercepting ASSET request:", request.url);

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
        }, (err)=>{
            if (err)
                console.error("Asset intercept error:", err);
        });

        // TODO: bad name : title bar now used as launcher
        let titleBarView = new BrowserView({
            webPreferences: {
                nodeIntegration: false, // is default value after Electron v5
                contextIsolation: true, // protect against prototype pollution
                enableRemoteModule: false, // turn off remote
                preload: path.join(app.getAppPath(), 'dapp_preload.js'),
                partition: partition
            }
        })
        let titleBarHeight = 500
        this.mainWindow.addBrowserView(titleBarView)
        titleBarView.setBounds({ x: 0, y: 0, width: 1200, height: titleBarHeight })
        console.log("Loading launcher url")
        titleBarView.webContents.loadURL('trinityapp://index.html')
        titleBarView.webContents.openDevTools();

        /*ses.webRequest.onBeforeRequest({
            urls:[]
        }, (details, callback) => {
            console.log("onBeforeRequest "+details.url)
            callback(null)
        });*/

        let appId = "launcher";
        let runningApp = new RunningApp(appId, titleBarView.id, this);
        this.runningApps[appId] = runningApp;
        console.log("STARTED APP: ", runningApp)
    }

    startApp(appId) {
        let appView = new BrowserView()
        this.mainWindow.addBrowserView(appView)
        appView.setBounds({ x: 0, y: 500, width: 400, height: 400 })
        appView.webContents.loadFile(`file://${__dirname}/index.html`, {
        })
//        appView.webContents.loadURL(`file://${__dirname}/index.html`)    

        let runningApp = new RunningApp(appId, appView.id, this);
        this.runningApps[appId] = runningApp;
        console.log("STARTED APP: ", runningApp)
    }

    stopApp(appId) {
        let runningApp = this.runningApps[appId];
        let browserView = BrowserView.fromId(runningApp.browserViewId)
        this.mainWindow.removeBrowserView(browserView)
    }

    // TODO: Apply all of this android method to interceptFileProtocol()
    remapUri() {
        /*String url = uri.toString();
        if (isChangeIconPath && url.startsWith("icon://")) {
            String str = url.substring(7);
            int index = str.indexOf("/");
            if (index > 0) {
                String app_id = str.substring(0, index);
                AppInfo info = appManager.getAppInfo(app_id);
                if (info != null) {
                    index = Integer.valueOf(str.substring(index + 1));
                    AppInfo.Icon icon = info.icons.get(index);
                    url = appManager.getIconUrl(info, icon.src);
                }
            }
        }
        else if ("asset".equals(uri.getScheme())) {;
            url = "file:///android_asset/www" + uri.getPath();
        }
        else if (url.startsWith("trinity:///asset/")) {
            AppInfo info = appManager.getAppInfo(this.appId);
            url = appManager.getAppUrl(info) + url.substring(17);
        }
        else if (url.startsWith("trinity:///data/")) {
            url = appManager.getDataUrl(this.appId) + url.substring(16);
        }
        else if (url.startsWith("trinity:///temp/")) {
            url = appManager.getTempUrl(this.appId) + url.substring(16);
        }
        else {
            return null;
        }

        uri = Uri.parse(url);
        return uri;*/
    }
}

export class TrinityRuntimeHelper {
    // Plugin "preload" context -> expose apis that send IPS calls to main process
    static createIPCDefinitionToMainProcess(pluginName, methodsList) {
        let exposedMethods = {}
        for (let m of methodsList) {
            let methodFullName = pluginName + "-" + m;
            exposedMethods[m] = async (args) => {
                let result = await ipcRenderer.invoke(methodFullName, args)
                return result;
            }
        }
        return exposedMethods
    }
}
