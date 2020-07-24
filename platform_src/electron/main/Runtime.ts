import { ipcMain, BrowserView, app, session, Request, Session, BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { join as pathJoin } from "path";

const cdvElectronSettings = require('./cdv-electron-settings.json');
import { AppManager } from './AppManager';
import { TrinityPlugin } from './TrinityPlugin';
import { Log } from './Log';
import { TitleBarEventToMainProcess } from "./TitleBar";

let runtimeInstance: TrinityRuntime = null;

type RegisteredPlugin = {
    instanceCreationCallback: (appID: string) => TrinityPlugin
}

type InvocationResult = {
    successResultArgs?: any;
    errorResultArgs?: any;
}

export class TrinityRuntime {
    private static LOG_TAG = "TrinityRuntime";
    plugins: { [key:string]: RegisteredPlugin };
    
    mainWindow: BrowserWindow = null;
    appManager: AppManager = null;
    titleBarView: BrowserView = null;

    private constructor() {
        this.plugins = {};
  
        ipcMain.addListener("titlebarevent", (event, titleBarEvent: TitleBarEventToMainProcess)=>{
            // TODO: "if sender == titlebar" only
            console.log("GOT titlebarevent", event, titleBarEvent);

            this.dispatchTitleBarEvent(titleBarEvent);
        });
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
            //console.log("Main process is registering an IPC event handler for event "+fullMethodName);
            ipcMain.on(fullMethodName, (event, args: any)=>{
                //console.log("IPCMAIN ON ", args)
                this.appManager.handleIPCCall(event, pluginName, m, fullMethodName, (data?: any)=>{
                    let response: InvocationResult = {
                        successResultArgs: data
                    }
                    event.reply(fullMethodName+"-result", response)
                }, (err?: any)=>{
                    let response: InvocationResult = {
                        errorResultArgs: err
                    }
                    event.reply(fullMethodName+"-result", response)
                }, args);
            })
        }
    }

    createMainWindow() {
        let appIcon = `${__dirname}/launcher/assets/icons/ic_elastos.png`;

        const browserWindowOpts = Object.assign({}, cdvElectronSettings.browserWindow, { 
            icon: appIcon,
            title: "elastOS"
        });
        this.mainWindow = new BrowserWindow(browserWindowOpts);
        this.appManager = new AppManager(this.mainWindow, this);

        // Empty root layout
        const loadUrl = `file://${__dirname}/index.html`
        this.mainWindow.loadURL(loadUrl, {});
        /*this.mainWindow.webContents.on('did-finish-load', function () {
            this.mainWindow.webContents.send('window-id', this.mainWindow.id);
        });*/

        // Open the DevTools.
        //mainWindow.webContents.openDevTools();

        // Emitted when the window is closed.
        /*this.mainWindow.on('closed', () => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            this.mainWindow = null;
        });*/

        this.startTitleBar();
    }

    startTitleBar() {
        Log.d(TrinityRuntime.LOG_TAG, "Starting title bar");

        const partition = 'titlebar';

        this.titleBarView = new BrowserView({
            webPreferences: {
                nodeIntegration: true,
                //nodeIntegration: false, // is default value after Electron v5
                //contextIsolation: true, // protect against prototype pollution
                //enableRemoteModule: false, // turn off remote
                enableRemoteModule: true,
                partition: partition
            }
        })
        this.mainWindow.addBrowserView(this.titleBarView)
        this.titleBarView.setBounds({ x: 0, y: 0, width: 500, height: 64 })

        //this.titleBarView.webContents.loadURL("http://localhost:8100"); // Ionic serve
        this.titleBarView.webContents.loadURL("file://"+pathJoin(__dirname,"/../../../platform_src/electron/titlebar/www/index.html"))
        //this.titleBarView.webContents.openDevTools({mode: "detach"});
    }

    /*stopApp(appId: string) {
        let runningApp = this.runningApps[appId];
        let browserView = BrowserView.fromId(runningApp.browserViewID)
        this.mainWindow.removeBrowserView(browserView)
    }*/

    dispatchTitleBarEvent(titleBarEvent: TitleBarEventToMainProcess) {
        // Find the target app id and dispatch
        let runningApp = this.appManager.findRunningAppByCallerID(titleBarEvent.appViewId);
        if (runningApp) {
            runningApp.titleBar.handleTitleBarEvent(titleBarEvent);
        }
    }
}

// Embed all plugins main process files

// TODO: FIND A WAY TO MAKE THIS DYNAMIC AND CLEAN
require("./plugins_main/AppManagerPluginMain")
