import { ipcMain, BrowserView, app, session, Request, Session, BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import path from 'path';
import fs from 'fs';
//import "reflect-metadata"; // Needed by TypeORM at the app root

const cdvElectronSettings = require('./cdv-electron-settings.json');
import { AppManager } from './AppManager';
import { createConnection, getConnection } from 'typeorm';
import { AppInfo } from './AppInfo';
import { TrinityPlugin } from './TrinityPlugin';

//import { createRxDatabase, addRxPlugin } from 'rxdb';
//addRxPlugin(require('pouchdb-adapter-idb'));

let runtimeInstance: TrinityRuntime = null;

type RegisteredPlugin = {
    instanceCreationCallback: (appID: string) => TrinityPlugin
}

export class TrinityRuntime {
    plugins: { [key:string]: RegisteredPlugin };
    
    mainWindow: BrowserWindow = null;
    appManager: AppManager = null;

    private constructor() {
        this.plugins = {};
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
                return this.appManager.handleIPCCall(event, pluginName, m, fullMethodName, args);
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
        
    }

    /*stopApp(appId: string) {
        let runningApp = this.runningApps[appId];
        let browserView = BrowserView.fromId(runningApp.browserViewID)
        this.mainWindow.removeBrowserView(browserView)
    }*/
}

// Embed all plugins main process files

// TODO: FIND A WAY TO MAKE THIS DYNAMIC AND CLEAN
require("./plugins_main/AppManagerPluginMain")
