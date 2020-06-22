import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, BrowserView, protocol }  from 'electron';
const cdvElectronSettings = require('./cdv-electron-settings.json');
const reservedScheme = require('./cdv-reserved-scheme.json');
import { TrinityRuntime } from './Runtime';

console.log("Loaded electron settings:", cdvElectronSettings)

const scheme = cdvElectronSettings.scheme;
const hostname = cdvElectronSettings.hostname;
const isFileProtocol = scheme === 'file';

/**
 * The base url path.
 * E.g:
 * When scheme is defined as "file" the base path is "file://path-to-the-app-root-directory"
 * When scheme is anything except "file", for example "app", the base path will be "app://localhost"
 *  The hostname "localhost" can be changed but only set when scheme is not "file"
 */
const basePath = (() => isFileProtocol ? `file://${__dirname}` : `${scheme}://${hostname}`)();
console.log("Base path:", basePath)

if (reservedScheme.includes(scheme)) throw new Error(`The scheme "${scheme}" can not be registered. Please use a non-reserved scheme.`);

if (!isFileProtocol) {
    protocol.registerSchemesAsPrivileged([
        { scheme, privileges: { standard: true, secure: true } }
    ]);
}

// Main app window
let mainWindow: BrowserWindow;

// Runtime singleton instance
let runtime = new TrinityRuntime();
//require("plugin-ben/src/electron/PluginBenMain")

function createWindow () {
    // Create the browser window.
    let appIcon = `${__dirname}/launcher/assets/icons/ic_elastos.png`;

    const browserWindowOpts = Object.assign({}, cdvElectronSettings.browserWindow, { 
        icon: appIcon,
        title: "elastOS"
    });
    mainWindow = new BrowserWindow(browserWindowOpts);

    // Empty root layout
    const loadUrl = `file://${__dirname}/index.html`
    mainWindow.loadURL(loadUrl, {});
    mainWindow.webContents.on('did-finish-load', function () {
        mainWindow.webContents.send('window-id', mainWindow.id);
    });

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    runtime.setMainWindow(mainWindow);

    app.whenReady().then(()=>{
        runtime.startLauncher();
    })
}

function configureProtocol () {
    protocol.registerFileProtocol(scheme, (request, cb) => {
        const url = request.url.substr(basePath.length + 1);
        cb({ path: path.normalize(`${__dirname}/${url}`) });
    });

    protocol.interceptFileProtocol('file', (_, cb) => { cb(null); });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if (!isFileProtocol) {
        configureProtocol();
    }

    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        if (!isFileProtocol) {
            configureProtocol();
        }

        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// BPI: Needed to be able to intercept all kind of urls in protocols, including relative files without scheme.
protocol.registerSchemesAsPrivileged([
    {
        scheme: "trinityapp",
        privileges: {
            standard: true,
            /*secure: true, 
            bypassCSP: true,
            allowServiceWorkers: true,
            supportFetchAPI: true,
            corsEnabled: true*/
        }
    }
])