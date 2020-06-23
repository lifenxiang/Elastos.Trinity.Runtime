import { ipcMain, BrowserView, app, session, Request, Session, BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import path from 'path';
import fs from 'fs';
//import "reflect-metadata"; // Needed by TypeORM at the app root

const cdvElectronSettings = require('./cdv-electron-settings.json');
import { AppManager } from './AppManager';
import { createConnection, getConnection } from 'typeorm';
import { AppInfo } from './AppInfo';

//import { createRxDatabase, addRxPlugin } from 'rxdb';
//addRxPlugin(require('pouchdb-adapter-idb'));



let runtimeInstance: TrinityRuntime = null;

export class TrinityPlugin {
    appId: string;

    constructor(appId: string) {
        this.appId = appId;
    }
}

export class RunningApp {
    appId: string;
    browserViewID: number;
    pluginInstances: { [key: string] : TrinityPlugin };

    constructor(appId: string, browserViewID: number, runtime: TrinityRuntime) {
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

type RegisteredPlugin = {
    instanceCreationCallback: (appID: string) => TrinityPlugin
}

export class TrinityRuntime {
    runningApps: { [key:string]: RunningApp };
    plugins: { [key:string]: RegisteredPlugin };
    
    mainWindow: BrowserWindow = null;
    appManager: AppManager = null;

    private constructor() {
        this.runningApps = {};
        this.plugins = {};

        this.setupDatabase();
    }

    private async setupDatabase() {
        // TODO: MOVE THIS TO THE APP MANAGER ADAPTERS
        // NOTE: We use sqljs with auto-save, instead of sqlite3, to avoid any dependency to native binaries
        // in electron and reduce build/packaging issues.
        console.log("Setup database")
        /*await createConnection({
            type: "sqlite",
            database: "manager.db",
            entities: [
                AppInfo
            ],
            synchronize: true,
            logging: false
        })*/

        let connection = await createConnection({
            type: "sqljs",
            location: app.getAppPath()+"/manager.db",
            entities: [
                AppInfo
            ],
            autoSave: true,
            synchronize: true,
            logging: false
        })

        /*const repository = connection.getRepository(AppInfo);

        setTimeout(()=>{
            console.log("before save");
            let appInfo = new AppInfo();
            repository.save(appInfo)
            console.log("after save");
        }, 3000)*/

        let appInfo = new AppInfo();
        appInfo.save()
        

        /*const db = await createRxDatabase({
            name: 'heroesdb',
            adapter: 'indexeddb',
            password: 'myLongAndStupidPassword' // optional
        });                                                       // create database

        let mySchema = {
            "title": "hero schema",
            "version": 0,
            "description": "describes a simple hero",
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "primary": true
                },
                "color": {
                    "type": "string"
                },
                "healthpoints": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 100
                },
                "secret": {
                    "type": "string"
                },
                "birthyear": {
                    "type": "number",
                    "final": true,
                    "minimum": 1900,
                    "maximum": 2050
                },
                "skills": {
                    "type": "array",
                    "maxItems": 5,
                    "uniqueItems": true,
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "damage": {
                                "type": "number"
                            }
                        }
                    }
                }
            },
            "required": ["color"],
            "encrypted": ["secret"],
            "attachments": {
                "encrypted": true
            }
          }
        await db.collection({name: 'heroes', schema: mySchema});    // create collection
        db.heroes.insert({ name: 'Bob' });  */
    }

    static getSharedInstance(): TrinityRuntime {
        if (runtimeInstance == null) {
            runtimeInstance = new TrinityRuntime();
        }
        return runtimeInstance
    }

    registerPlugin(pluginName: string, instanceCreationCallback: (appID: string) => TrinityPlugin) {
        this.plugins[pluginName] = {
            instanceCreationCallback: instanceCreationCallback
        }
    }

    // Plugin in main process -> handle IPC calls
    createIPCDefinitionForMainProcess(pluginName: string, methodsList: string[]) {
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
                if (runningApp) {
                    console.log("Found running app to handle IPC "+fullMethodName, runningApp);

                    let pluginResult = (runningApp.pluginInstances[pluginName] as any)[m]();
                    console.log("pluginResult", pluginResult);
                    return pluginResult;
                }
                else {
                    console.error("No running app found to handle this IPC request!");
                    return null;
                }
            })
        }
    }

    findRunningAppByCallerID(browserViewCallerID: number) {
        //console.debug("Looking for running app with browser view id "+browserViewCallerID);
        //console.debug("Running apps:", this.runningApps);

        for (let appId in this.runningApps) {
            if (this.runningApps[appId].browserViewID == browserViewCallerID)
                return this.runningApps[appId];
        }
        return null;
    }

    createMainWindow() {
        let appIcon = `${__dirname}/launcher/assets/icons/ic_elastos.png`;

        const browserWindowOpts = Object.assign({}, cdvElectronSettings.browserWindow, { 
            icon: appIcon,
            title: "elastOS"
        });
        this.mainWindow = new BrowserWindow(browserWindowOpts);
        this.appManager = new AppManager(this.mainWindow);

        // Empty root layout
        const loadUrl = `file://${__dirname}/index.html`
        this.mainWindow.loadURL(loadUrl, {});
        this.mainWindow.webContents.on('did-finish-load', function () {
            this.mainWindow.webContents.send('window-id', this.mainWindow.id);
        });

        // Open the DevTools.
        //mainWindow.webContents.openDevTools();

        // Emitted when the window is closed.
        /*this.mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.mainWindow = null;
        });*/
    }

    startLauncher() {
        const partition = 'TODO-TEST-persist:example' // TODO: SANDBOX PER DID/APPID
        const ses = session.fromPartition(partition)

        let dappFilesPath = `${__dirname}/launcher`

        this.setupSessionProtocolHandlers(ses, "launcher", dappFilesPath);

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

        let appId = "launcher";
        let runningApp = new RunningApp(appId, titleBarView.id, this);
        this.runningApps[appId] = runningApp;
        console.log("runningApps:", this.runningApps)
        console.log("STARTED APP: ", runningApp)

        console.log("Loading launcher url")
        titleBarView.webContents.loadURL('trinityapp://index.html')
        titleBarView.webContents.openDevTools();
    }

    startApp(appId: string) {
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

    stopApp(appId: string) {
        let runningApp = this.runningApps[appId];
        let browserView = BrowserView.fromId(runningApp.browserViewID)
        this.mainWindow.removeBrowserView(browserView)
    }

    private setupSessionProtocolHandlers(ses: Session, appId: string, dappFilesPath: string) {
        let wwwFilesPath = `${__dirname}`

        ses.protocol.registerFileProtocol("trinityapp", (request: Request, callback: (filePath: string)=>void) => {
            //console.log("Handle FILE trinityapp:", request);

            // Ex: request.url = trinityapp://index.html/
            let redirectedFilePath: string;
            if (request.url == "trinityapp://index.html/")
                redirectedFilePath = dappFilesPath + "/index.html"
            else {
                redirectedFilePath = request.url.replace("trinityapp://index.html", "");
                if (!redirectedFilePath.startsWith(dappFilesPath))
                    redirectedFilePath = dappFilesPath + redirectedFilePath;
            }

            //console.log("Redirecting to file path: "+redirectedFilePath);
            callback(redirectedFilePath)
        }, (err)=>{
            if (err)
                console.error("Asset intercept error:", err);
        });

        ses.protocol.interceptFileProtocol("asset", (request: Request, callback: (filePath: string)=>void) => {
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
        }, (err)=>{
            if (err)
                console.error("Asset intercept error:", err);
        });

        ses.protocol.interceptFileProtocol("icon", (request: Request, callback: (filePath: string)=>void) => {
            console.log("Intercepting ICON request:", request.url);

            let parsedUrl = new URL(request.url);
            console.log("parsedUrl", parsedUrl)

            callback(null)
        }, (err)=>{
            if (err)
                console.error("Icon intercept error:", err);
        });
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

// Embed all plugins main process files

// TODO: FIND A WAY TO MAKE THIS DYNAMIC AND CLEAN
require("./plugins_main/AppManagerPluginMain")
