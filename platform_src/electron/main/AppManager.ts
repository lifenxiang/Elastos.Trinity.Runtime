import { existsSync, mkdirSync, readdirSync } from 'fs-extra';
import { app, BrowserWindow, session, BrowserView, Session, Request, Info } from 'electron';
import { join as pathJoin } from "path";

import { Log } from "./Log";
import { AppInstaller } from './AppInstaller';
import { AppInfo } from "./AppInfo";
import { MergeDBAdapter } from "./MergeDBAdapter";
import { PreferenceManager } from "./PreferenceManager";
import { IdentityEntry } from "./didsessions/IdentityEntry";
import { TrinityPlugin, SuccessCallback, ErrorCallback } from './TrinityPlugin';
import { TrinityRuntime } from './Runtime';
import { TitleBar } from './titlebar/TitleBar';
import { notImplemented } from './Utility';
import { UIStyling } from './UIStyling';
import { ConfigManager } from './ConfigManager';
import { WebViewFragment } from './WebViewFragment';
import { AppBasePlugin } from './AppBasePlugin';

export class AppManager {
    private static LOG_TAG = "AppManager";

    /**
     * The internal message
     */
    public static MSG_TYPE_INTERNAL = 1;
    /**
     * The internal return message.
     */
    public static MSG_TYPE_IN_RETURN = 2;
    /**
     * The internal refresh message.
     */
    public static MSG_TYPE_IN_REFRESH = 3;
    /**
     * The installing message.
     */
    public static MSG_TYPE_INSTALLING = 4;

    /**
     * The external message
     */
    public static MSG_TYPE_EXTERNAL = 11;
    /**
     * The external launcher message
     */
    public static MSG_TYPE_EX_LAUNCHER = 12;
    /**
     * The external install message
     */
    public static MSG_TYPE_EX_INSTALL = 13;
    /**
     * The external return message.
     */
    public static MSG_TYPE_EX_RETURN = 14;


    public static LAUNCHER = "org.elastos.trinity.launcher";
    //public static LAUNCHER = "launcher"; //TODO: check if working
    public static DIDSESSION = "didsession";

    /** The app mode. */
    public static STARTUP_APP = "app";
    /** The service mode. */
    public static STARTUP_SERVICE = "service";
    /** The intent mode. It will be closed after sendIntentResponse */
    public static STARTUP_INTENT = "intent";
    /** The silence intent mode. It will be closed after sendIntentResponse */
    public static STARTUP_SILENCE = "silence";

    static startupModes: string[] = [
        AppManager.STARTUP_APP,
        AppManager.STARTUP_SERVICE,
        AppManager.STARTUP_INTENT,
        AppManager.STARTUP_SILENCE
    ];

    private static appManager: AppManager;
    private runtime: TrinityRuntime; //TODO: diff with java
    private curFragment: WebViewFragment = null; //TODO: change type
    public fragments = new Map<number, WebViewFragment>();
    public fragmentIds = new Map<string, number>();
    public window: BrowserWindow = null;
    dbAdapter: MergeDBAdapter = null;


    private basePathInfo: AppPathInfo = null;
    private pathInfo: AppPathInfo = null;

    private signIning: boolean = true;
    private did: string = null;

    private shareInstaller: AppInstaller = new AppInstaller();

    protected appInfos: Map<string, AppInfo>;
    private lastList = new Array<string>();
    private runningList = new Array<string>();
    private serviceRunningList = new Array<string>();
    public appList: AppInfo[];
    protected visibles = new Map<string, boolean>();

    private launcherInfo: AppInfo = null;
    private didSessionInfo: AppInfo = null;

    private installUriList = new Array<InstallInfo>();
    private intentUriList = new Array<any>(); //TODO: diff with java
    private launcherReady: boolean = false;

    static defaultPlugins: string[] = [
        "AppManager",
        "StatusBar",
        "Clipboard",
        "TitleBarPlugin"
    ];

    constructor(window: BrowserWindow, runtime: TrinityRuntime) {
        AppManager.appManager = this;

        this.window = window;
        this.runtime = runtime;

        this.basePathInfo = new AppPathInfo(null);
        this.pathInfo = this.basePathInfo;

        this.shareInstaller.init(this.basePathInfo.appsPath, this.basePathInfo.tempPath);

        this.init();
    }

    private async init() {
        this.dbAdapter = await MergeDBAdapter.newInstance(this.window);

        await this.refreashInfos();
        await this.getLauncherInfo();
        await this.saveLauncher();
        await this.checkAndUpateDIDSession();
        await this.saveBuiltInApps();
        await this.refreashInfos();

        let entry: IdentityEntry = null;
        //TODO: migrate from java
        /*try {
            entry = DIDSessionManager.getSharedInstance().getSignedInIdentity();
        }
        catch (Exception e){
            e.printStackTrace();
        }*/

        // TMP if (entry != null) {
        if (true) { // TMP BPI FORCE LAUNCHER NOT DID SESSION
            this.signIning = false;
            this.did = "FAKEDIDFIXME" // TMP BPI entry.didString;
            await this.reInit(null);
        }
        else {
            try {
                await this.startDIDSession();
            }
            catch (e){
                Log.e(AppManager.LOG_TAG, e);
            }
        }

        if (await PreferenceManager.getSharedInstance().getDeveloperMode()) {
            //CLIService.getShareInstance().start();
        }

        //Apply theming for native popups
        let darkMode: boolean = await PreferenceManager.getSharedInstance().getBooleanValue("ui.darkmode", false);
        UIStyling.prepare(darkMode);

        //TODO: migrate from java
        /*try {
            ContactNotifier.getSharedInstance(activity, did);
        } catch (Exception e) {
            e.printStackTrace();
        }*/
    }

    public static getSharedInstance(): AppManager {
        return AppManager.appManager;
    }

    public static isStartupMode(startupMode: string): boolean {
        for (let mode of this.startupModes) {
            if (mode == startupMode) {
                return true;
            }
        }
        return false;
    }

    public getBaseDataPath(): string {
        return this.basePathInfo.dataPath;
    }

    private async reInit(sessionLanguage: string) {
        //TODO: diff with java
        //curFragment = null;

        this.pathInfo = new AppPathInfo(this.getDIDDir());

        await this.dbAdapter.setUserDBAdapter(this.pathInfo.databasePath);

        // If we have received an optional language info, we set the DID session language preference with it.
        // This is normally passed by the DID session app to force the initial session language
        if (sessionLanguage != null) {
            try {
                PreferenceManager.getSharedInstance().setPreference("locale.language", sessionLanguage);
            } catch (e) {
                Log.e(AppManager.LOG_TAG, e);
            }
        }

        await this.refreashInfos();
        await this.getLauncherInfo();
        try {
            await this.loadLauncher();
        }
        catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }
        await this.refreashInfos();
        this.sendRefreshList("initiated", null, false);
    }

    private startStartupServices() {
        for (let info of this.appList) {
            for (let service of info.startupServices) {
                try {
                    this.start(info.app_id, AppManager.STARTUP_SERVICE, service.name);
                } catch (e) {
                    Log.e(AppManager.LOG_TAG, e);
                }   
            }
        }
    }

    private closeAllApps() {
        for (let appId of this.getRunningList()) {
            if (!this.isLauncher(appId)) {
                this.closeAllModes(appId);
            }
        }

        //TODO: migrate from java
        /*FragmentManager manager = activity.getSupportFragmentManager();
        for (Fragment fragment : manager.getFragments()) {
            manager.beginTransaction().remove(fragment).commit();
        }*/
    }

    private async clean() {
        this.did = null;
        //TOOD: this.curFragment = null;
        this.appList = null;
        this.lastList = new Array<string>();
        this.runningList = new Array<string>();
        this.serviceRunningList = new Array<string>();
        this.visibles = new Map<string, boolean>();
        await this.dbAdapter.setUserDBAdapter(null);

        this.pathInfo = this.basePathInfo;
    }

    /**
     * Signs in to a new DID session.
     */
    public async signIn(sessionLanguage: string) {
        if (this.signIning) {
            this.signIning = false;
            await this.closeDIDSession();
            await this.reInit(sessionLanguage);
        }
    }

    /**
     * Signs out from a DID session. All apps and services are closed, and launcher goes back to the DID session app prompt.
     */
    public async signOut() {
        if (!this.signIning) {
            this.signIning = true;
            await this.closeAllApps();
            await this.clean();
            await this.startDIDSession();
        }
    }

    public isSignIning(): boolean {
        return this.signIning;
    }

    public getDIDSessionId(): string {
        return "org.elastos.trinity.dapp.didsession";
    }

    public isDIDSession(appId: string): boolean {
        return appId == "didsession" || appId == this.getDIDSessionId();
    }

    public async getDIDSessionAppInfo(): Promise<AppInfo> {
        if (this.didSessionInfo == null) {
            this.didSessionInfo = await this.dbAdapter.getAppInfo(this.getDIDSessionId());
        }
        return this.didSessionInfo;
    }

    public async startDIDSession() {
        await this.start(this.getDIDSessionId(), AppManager.STARTUP_APP, null);
    }

    public async closeDIDSession() {
        await this.close(this.getDIDSessionId(), AppManager.STARTUP_APP, null);

        //TODO: need DIDSessionManager
        /*let entry = DIDSessionManager.getSharedInstance().getSignedInIdentity();
        did = entry.didString;*/
    }

    public getDID(): string {
        return this.did;
    }

    public getDIDDir(): string {
        let did = this.getDID();
        if (did != null) {
            did = did.replace(":", "_");
        }
        return did;
    }

    public getDBAdapter(): MergeDBAdapter {
        return this.dbAdapter;
    }

    private getAssetsFile(path: string): Object {
        let input = null;
        let fullPath = pathJoin(app.getAppPath(), path);
        if (existsSync(fullPath)) {
            input = require(fullPath);
        }
        return input;
    }

    private async installBuiltInApp(path: string, id: string, launcher: number) {
        //Log.d("AppManager", "Entering installBuiltInApp relativeRootPath="+path+" id="+id+" launcher="+launcher);

        path = path + id;
        let input = this.getAssetsFile(path + "/manifest.json");
        if (input == null) {
            input = this.getAssetsFile(path + "/assets/manifest.json");
            if (input == null) {
                //Log.e("AppManager", "No manifest found, returning");
                return;
            }
        }
        let builtInInfo = this.shareInstaller.parseManifest(input, launcher);

        let installedInfo = await this.getAppInfo(id);
        let needInstall = true;
        if (installedInfo != null) {
            let versionChanged = PreferenceManager.getSharedInstance().versionChanged;
            if (versionChanged || builtInInfo.version_code > installedInfo.version_code) {
                //Log.d("AppManager", "built in version > installed version: uninstalling installed");
                this.shareInstaller.unInstall(installedInfo, true);
            }
            else {
                //Log.d("AppManager", "Built in version <= installed version, No need to install");
                needInstall = false;
            }
        }
        else {
            //Log.d("AppManager", "No installed info found");
        }

        if (needInstall) {
            //Log.d("AppManager", "Needs install - copying assets and setting built-in to 1");
            this.shareInstaller.copyAssetsFolder(path, this.basePathInfo.appsPath + builtInInfo.app_id);
            builtInInfo.built_in = 1;
            await this.dbAdapter.addAppInfo(builtInInfo, true);
            if (launcher == 1) {
                this.launcherInfo = null;
                await this.getLauncherInfo();
            }
        }
    }

    private async saveLauncher() {
        try {
            let launcher = pathJoin(this.basePathInfo.appsPath, AppManager.LAUNCHER);
            if (existsSync(launcher)) {
                let info = this.shareInstaller.getInfoByManifest(this.basePathInfo.appsPath + AppManager.LAUNCHER + "/", 1);
                info.built_in = 1;
                let count = await this.dbAdapter.removeAppInfo(this.launcherInfo, true);
                if (count < 1) {
                    Log.e("AppManager", "Launcher upgrade -- Can't remove the older DB info.");
                    //TODO:: need remove the files? now, restart will try again.
                    return;
                }
                this.shareInstaller.renameFolder(launcher, this.basePathInfo.appsPath, this.launcherInfo.app_id);
                await this.dbAdapter.addAppInfo(info, true);
                this.launcherInfo = null;
                await this.getLauncherInfo();
            }

            //TODO: diff with java
            this.installBuiltInApp("/", "launcher", 1);
        } catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }
    }
    
    private async checkAndUpateDIDSession() {
        try {
            let didsession = pathJoin(this.basePathInfo.appsPath, AppManager.DIDSESSION);
            if (existsSync(didsession)) {
                let info = this.shareInstaller.getInfoByManifest(this.basePathInfo.appsPath + AppManager.DIDSESSION + "/", 0);
                info.built_in = 1;
                let count = await this.dbAdapter.removeAppInfo(await this.getDIDSessionAppInfo(), true);
                if (count < 1) {
                    Log.e("AppManager", "Launcher upgrade -- Can't remove the older DB info.");
                    return;
                }
                this.shareInstaller.renameFolder(didsession, this.basePathInfo.appsPath, this.getDIDSessionId());
                this.dbAdapter.addAppInfo(info, true);
                this.didSessionInfo = null;
            }
        } catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }
    }

    /**
     * USE CASES:
     *
     * Built-in dapp -> update using trinity CLI:
     *  - Should use the uploaded dapp
     *  - Should not check version_code
     * Built-in dapp -> downloaded dapp + install():
     *  - Should install and use only if version code > existing app
     * Built-in dapp -> downloaded dapp + install() ok -> install new trinity:
     *  - Should install built-in only if version code > installed
     * Built-in dapp -> Removed in next trinity version:
     *  - Do nothing, use can manually uninstall.
     *
     *  ALGORITHM:
     *  - At start:
     *      - For each built-in app:
     *          - if version > installed version => install built-in over installed
     *  - When installing from ADB:
     *      - Don't check versions, just force install over installed, even if version is equal
     *  - When installing from dapp store:
     *      - Install if new version > installed version
     *
     */
    public async saveBuiltInApps(){
        try {
            //TODO: diff with java
            let appdirs = readdirSync(pathJoin(app.getAppPath(), "built-in"));

            for (let appdir of appdirs) {
                await this.installBuiltInApp("built-in/", appdir, 0);
            }

            for (let i = 0; i < this.appList.length; i++) {
                //Log.d(AppManager.LOG_TAG, "save / app "+this.appList[i].app_id+" buildin "+this.appList[i].built_in);
                if (this.appList[i].built_in != 1) {
                    continue;
                }

                let needChange = true;
                for (let appdir of appdirs) {
                    if (appdir == this.appList[i].app_id) {
                        needChange = false;
                        break;
                    }
                }
                if (needChange) {
                    await this.dbAdapter.changeBuiltInToNormal(this.appList[i].app_id);
                }
            }

        } catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }
    }

    public setAppVisible(id: string, visible: string) {
        //Log.d(AppManager.LOG_TAG, "setAppVisible - id: "+id+", visible: "+visible);
        if (visible == "hide") {
            this.visibles.set(id, false);
        }
        else {
            this.visibles.set(id, true);
        }
    }

    public getAppVisible(id: string, startupMode: string): boolean {
        if (startupMode == AppManager.STARTUP_INTENT) {
            return true;
        }
        else if (startupMode == AppManager.STARTUP_SERVICE || startupMode == AppManager.STARTUP_SILENCE) {
            return false;
        }

        let ret = this.visibles.get(id);
        if (ret == null) {
            return true;
        }
        return ret;
    }

    public async getLauncherInfo(): Promise<AppInfo> {
        if (this.launcherInfo == null) {
            this.launcherInfo = await this.dbAdapter.getLauncherInfo();
        }
        return this.launcherInfo;
    }

    public isLauncher(appId: String): boolean {
        if (appId == null || this.launcherInfo == null) {
            return false;
        }

        if (appId == AppManager.LAUNCHER || appId == this.launcherInfo.app_id) {
            return true;
        }
        else {
            return false;
        }
    }

    private async refreashInfos() {
        this.appList = await this.dbAdapter.getAppInfos();
        this.appInfos = new Map<string, AppInfo>();
        for (var i = 0; i < this.appList.length; i++) {
            this.appInfos.set(this.appList[i].app_id, this.appList[i]);
            let visible = this.visibles.get(this.appList[i].app_id);
            if (visible == null) {
                this.setAppVisible(this.appList[i].app_id, this.appList[i].start_visible);
            }
        }
    }

    public async getAppInfo(id: string): Promise<AppInfo> {
        let index = id.indexOf("#");
        if (index != -1) {
            id = id.substring(0, index);
        }

        if (this.isDIDSession(id)) {
            return await this.getDIDSessionAppInfo();
        }
        else if (this.isLauncher(id)) {
            return await this.getLauncherInfo();
        }
        else {
            return this.appInfos.get(id);
        }
    }

    public getAppInfos(): Map<string, AppInfo> {
        return this.appInfos;
    }

    public getStartPath(info: AppInfo): string {
        if (info == null) {
            return null;
        }

        if (info.remote == 0) {
            return this.getAppUrl(info) + info.start_url;
        }
        else {
            return info.start_url;
        }
    }

    public getAppLocalPath(info: AppInfo): string {
        let path = this.basePathInfo.appsPath;
        if (!info.share) {
            path = this.pathInfo.appsPath;
        }
        return path + info.app_id + "/";
    }

    public getAppPath(info: AppInfo): string {
        if (info.remote == 0) {
            return this.getAppLocalPath(info);
        }
        else {
            return info.start_url.substring(0, info.start_url.lastIndexOf("/") + 1);
        }
    }

    public getAppUrl(info: AppInfo): string {
        let url = this.getAppPath(info);
        if (info.remote == 0) {
            //TODO: need to check
            url = /*"file://" + */url;
        }
        return url;
    }

    private checkPath(path: string): string {
        let destDir = path;
        if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
        }
        return path;
    }

    public async getDataPath(id: string): Promise<string> {
        if (id == null) {
            return null;
        }

        if (this.isLauncher(id)) {
            id = (await this.getLauncherInfo()).app_id;
        }

        return this.checkPath(this.pathInfo.dataPath + id + "/");
    }

    public getDataUrl(id: string): string {
        return "file://" + this.getDataPath(id);
    }

    public async getTempPath(id: string): Promise<string> {
        if (id == null) {
            return null;
        }

        if (this.isLauncher(id)) {
            id = (await this.getLauncherInfo()).app_id;
        }
        return this.checkPath(this.pathInfo.tempPath + id + "/");
    }

    public getTempUrl(id: string): string {
        return "file://" + this.getTempPath(id);
    }

    public getConfigPath(): string {
        return this.pathInfo.configPath;
    }

    public getIconUrl(info: AppInfo, iconSrc: string): string {
        //TODO: diff with java
        let url = this.getAppLocalPath(info);
        return this.resetPath(url, iconSrc);
    }

    public getIconUrls(info: AppInfo) {
        let iconPaths: string[] = [];
        for (var i = 0; i < info.icons.length; i++) {
            iconPaths[i] = this.getIconUrl(info, info.icons[i].src);
        }
        return iconPaths;
    }

    public resetPath(dir: string, origin: string): string {
        if (origin.indexOf("http://") != 0 && origin.indexOf("https://") != 0 && origin.indexOf("file:///") != 0) {
            while (origin.startsWith("/")) {
                origin = origin.substring(1);
            }
            origin = dir + origin;
        }
        return origin;
    }

    public install(url: string, update: boolean, fromCLI: boolean) {
        let info = this.shareInstaller.install(url, update);
        if (info != null) {
            this.refreashInfos();

            if (info.launcher == 1) {
                this.sendRefreshList("launcher_upgraded", info, fromCLI);
            }
            else {
                this.sendRefreshList("installed", info, fromCLI);
            }
        }

        return info;
    }

    public unInstall(id: string, update: boolean) {
        this.closeAllModes(id);
        let info = this.appInfos.get(id);
        this.shareInstaller.unInstall(info, update);
        this.refreashInfos();
        if (!update) {
            if (info.built_in == 1) {
                this.installBuiltInApp("built-in", info.app_id, 0);
                this.refreashInfos();
            }
            this.sendRefreshList("unInstalled", info, false);
        }
    }

    public getFragmentById(modeId: string): WebViewFragment {
        if (this.isLauncher(modeId)) {
            modeId = AppManager.LAUNCHER;
        }

        let browserViews = this.window.getBrowserViews();
        for (var i = 0; i < browserViews.length; i++) {
            let browserView = browserViews[i];
            let fragment = this.fragments.get(browserView.id);
            if (fragment instanceof WebViewFragment) {
                let webViewfragment = fragment as WebViewFragment;
                if (webViewfragment.modeId == modeId) {
                    return webViewfragment;
                }
            }
        }

        /*this.fragments.forEach((value: WebViewFragment, key: number) => {
            if (value.modeId == modeId) {
                return value;
            }
        });*/

        

        return null;
    }

    public async switchContent(fragment: WebViewFragment, id: string) {
        console.log("AppManager - switchContent id: "+id);

        /*if (this.curFragment != null) {
            console.log("curFragment: "+this.curFragment.packageId);
            console.log("fragment: "+fragment.packageId);
            console.log("isCurrentFragment: "+this.isCurrentFragment(fragment));
        }*/ 
        if ((this.curFragment != null) && (this.curFragment != fragment)) {
            console.log("AppManager - switchContent - hide curFragment");
            this.curFragment.appView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        }
        if (this.curFragment != fragment) {
            if (fragment.browserViewId == null) {
                console.log("AppManager - switchContent - create view fragment");
                await fragment.createView(this.runtime);
            }
            else if (this.curFragment != fragment) {
                console.log("AppManager - switchContent - show fragment");
                fragment.appView.setBounds({ x: 0, y: 64, width: 500, height: 800 });
                fragment.titleBar.show();
            }
        }

        this.curFragment = fragment;

        this.runningList.splice(this.runningList.indexOf(id), 1);
        this.runningList.unshift(id);
        this.lastList.splice(this.lastList.indexOf(id), 1);
        this.lastList.unshift(id);
    }

    public async hideFragment(fragment: WebViewFragment, startupMode: string, id: string) {
        // TODO - No way to deal with browser views Z-ordering for now - find a solution.
        console.log("AppManager - hideFragment id: "+id);
        if (fragment.browserViewId == null) {
            console.log("AppManager - hideFragment - create view fragment");
            await fragment.createView(this.runtime);
        }
        
        //this.window.removeBrowserView(fragment.appView);
        fragment.appView.setBounds({ x: 0, y: 0, width: 0, height: 0 });
        this.curFragment = this.getFragmentById(AppManager.LAUNCHER);
        //this.sendRefreshList("closed", null, false);
    
        if (startupMode == AppManager.STARTUP_APP) {
            this.runningList.unshift(id);
            this.lastList[1] = id;
        }
        else if (startupMode == AppManager.STARTUP_SERVICE) {
            this.serviceRunningList.unshift(id);
        }
    }

    private isCurrentFragment(fragment: WebViewFragment): boolean {
        return (fragment == this.curFragment);
    }

    public doBackPressed(): boolean {
        if (this.launcherInfo == null || this.curFragment == null || this.isLauncher(this.curFragment.modeId)) {
            return true;
        }
        else {
            this.switchContent(this.getFragmentById(this.launcherInfo.app_id), this.launcherInfo.app_id);
            try {
                AppManager.getSharedInstance().sendLauncherMessageMinimize(this.curFragment.modeId);
            } catch (e) {
                Log.e(AppManager.LOG_TAG, e);
            }
            return false;
        }
    }

    public getIdbyStartupMode(id: string, mode: string, serviceName: String): string {
        if (mode != AppManager.STARTUP_APP) {
            id += "#" + mode;
            if (mode == AppManager.STARTUP_SERVICE && serviceName != null) {
                id += ":" + serviceName;
            }
        }
        return id;
    }

    //TODO: need fragment
    public async start(packageId: string, mode: string, serviceName: string) {
        let info = await this.getAppInfo(packageId);
        if (info == null) {
            throw new Error("No such app ("+packageId+")!");
        }

        if (mode == AppManager.STARTUP_SERVICE && serviceName == null) {
            throw new Error("No service name!");
        }

        let id = this.getIdbyStartupMode(packageId, mode, serviceName);
        console.log("AppManager - start id: "+id);

        let fragment = this.getFragmentById(id);
        if (fragment == null) {
            fragment = await WebViewFragment.newInstance(packageId, mode, serviceName);
            if (!this.isLauncher(packageId)) {
                console.log("AppManager - start - !this.isLauncher(packageId)");
                this.sendRefreshList("started", info, false);
            }

            if (!this.getAppVisible(packageId, mode)) {
                console.log("AppManager - start - !this.getAppVisible(packageId, mode)");
                this.showActivityIndicator(true);
                this.hideFragment(fragment, mode, id);
            }
        }

        if (this.getAppVisible(packageId, mode)) {
            console.log("AppManager - start - this.getAppVisible(packageId, mode)");
            this.switchContent(fragment, id);
            this.showActivityIndicator(false);
        }
    }

    private showActivityIndicator(show: boolean) {
        notImplemented("showActivityIndicator");
    }

    public closeAllModes(packageId: string) {
        for (let mode of AppManager.startupModes) {
            try {
                if (mode == AppManager.STARTUP_SERVICE) {
                    this.closeAppAllServices(packageId);
                }
                else {
                    this.close(packageId, mode, null);
                }
            }
            catch (e) {
                Log.e(AppManager.LOG_TAG, e);
            }
        }
    }

    public closeAppAllServices(packageId: string) {
        let info = this.getAppInfo(packageId);
        if (info == null) {
            throw new Error("No such app!");
        }

        //TODO: migrate from java
        /*FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();
        for (int i = 0; i < fragments.size(); i++) {
            Fragment fragment = fragments.get(i);
            if (fragment instanceof WebViewFragment) {
                WebViewFragment webViewFragment = (WebViewFragment)fragment;
                if (webViewFragment.modeId.startsWith(packageId + "#service:")) {
                    closeFragment(info, webViewFragment);
                }
            }
        }*/
    }

    public closeAllServices() {
        //TODO: implement
    }

    public async close(id: string, mode: string, serivceName: string) {
        if (this.isLauncher(id)) {
            throw new Error("Launcher can't close!");
        }

        let info = await this.getAppInfo(id);
        if (info == null) {
            throw new Error("No such app!");
        }

        if (mode == AppManager.STARTUP_SERVICE && serivceName == null) {
            throw new Error("No service name!");
        }

        if (mode == AppManager.STARTUP_APP) {
            this.setAppVisible(id, info.start_visible);
        }

        //TODO: change to fragment
        /*if (!this.runningApps[id]) {
            return;
        }*/

        //TODO: place in closeFragment
        /*this.window.removeBrowserView(BrowserView.fromId(this.runningApps[id].browserViewID));
        this.lastList.splice(this.lastList.indexOf(id), 1);
        this.runningList.splice(this.lastList.indexOf(id), 1);
        delete this.runningApps[id];*/

        this.window.removeBrowserView(BrowserView.fromId(this.fragmentIds.get(id)));
        this.lastList.splice(this.lastList.indexOf(id), 1);
        this.runningList.splice(this.lastList.indexOf(id), 1);
        this.fragments.delete(this.fragmentIds.get(id));
        this.fragmentIds.delete(id);
        
        this.sendRefreshList("closed", info, false);
    }

    public closeFragment(info: AppInfo, fragment: any) {
        //TODO: implement
    }

    public async loadLauncher() {
        await this.start(AppManager.LAUNCHER, AppManager.STARTUP_APP, null);
    }

    public checkInProtectList(uri: string) {
        let info = this.shareInstaller.getInfoFromUrl(uri);
        if (info != null && info.app_id != "") {
            let protectList: string[] = ConfigManager.getShareInstance().getStringArrayValue("dapp.protectList", []);
            for (let item of protectList) {
                if (item == info.app_id.toLocaleLowerCase()) {
                    throw new Error("Don't allow install '" + info.app_id + "' by the third party app.");
                }
            }
        }
    }

    private installUri(uri: string, dev: boolean) {
        try {
            if (dev && PreferenceManager.getSharedInstance().getDeveloperMode()) {
                this.install(uri, true, dev);
            }
            else {
                this.checkInProtectList(uri);
                this.sendInstallMsg(uri);
            }
        }
        catch (e) {
            //TODO: Utility.alertPrompt("Install Error", e.getLocalizedMessage(), this.activity);
        }
    }

    public setInstallUri(uri: string, dev: boolean) {
        if (uri == null) return;

        if (this.launcherReady || dev) {
            this.installUri(uri, dev);
        }
        else {
            this.installUriList.push(new InstallInfo(uri, dev));
        }
    }

    public setIntentUri(uri: string) {
        if (uri == null) return;

        if (this.launcherReady) {
            //TODO: IntentManager.getShareInstance().doIntentByUri(uri);
        }
        else {
            this.intentUriList.push(uri);
        }
    }

    public isLauncherReady(): boolean {
        return this.launcherReady;
    }

    public setLauncherReady() {
        this.launcherReady = true;

        for (var i = 0; i < this.installUriList.length; i++) {
            let info = this.installUriList[i];
            this.sendInstallMsg(info.uri);
        }

        for (var i = 0; i < this.intentUriList.length; i++) {
            let uri = this.intentUriList[i];
            //TODO: IntentManager.getShareInstance().doIntentByUri(uri);
        }
    }

    public sendLauncherMessage(type: number, msg: string, fromId: string) {
        this.sendMessage(AppManager.LAUNCHER, type, msg, fromId);
    }

    public sendLauncherMessageMinimize(fromId: string) {
        this.sendLauncherMessage(AppManager.MSG_TYPE_INTERNAL, "{\"action\":\"minimize\"}", fromId);
    }

    private sendInstallMsg(uri: string) {
        let msg = "{\"uri\":\"" + uri + "\", \"dev\":\"false\"}";
        try {
            this.sendLauncherMessage(AppManager.MSG_TYPE_EX_INSTALL, msg, "system");
        }
        catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }
    }

    public sendRefreshList(action: string, info: AppInfo, fromCLI: boolean) {
        try {
            if (info != null) {
                this.sendLauncherMessage(AppManager.MSG_TYPE_IN_REFRESH,
                        "{\"action\":\"" + action + "\", \"id\":\"" + info.app_id + "\" , \"name\":\"" + info.name + "\", \"debug\":" + fromCLI + "}", "system");
            }
            else {
                this.sendLauncherMessage( AppManager.MSG_TYPE_IN_REFRESH,
                    "{\"action\":\"" + action + "\"}", "system");
            }
        }
        catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }
    }

    //TODO: diff with java
    public sendMessage(toId: string, type: number, msg: string, fromId: string) {
        if (this.signIning) return;

        //console.log("AppManager", "sendMessage toId: "+toId);

        let fragment = this.fragments.get(this.fragmentIds.get(toId));
        if (fragment) {
            let appManagerPlugin = fragment.pluginInstances["AppManager"] as AppBasePlugin;
            appManagerPlugin.onReceive(msg, type, fromId);
            //fragment.basePlugin.onReceive(msg, type, fromId);
        }
        else {
            throw new Error(toId + " isn't running!");
        }

        
        /*let runningApp = this.runningApps[toId];
        if (runningApp) {
            //console.log("Sending message to app id "+runningApp.appInfo.app_id, msg, fromId);
            let appManagerPlugin = runningApp.pluginInstances["AppManager"] as AppManagerPlugin
            appManagerPlugin.onReceive(msg, type, fromId);
        }
        else {
            throw new Error(toId + " isn't running!");
        }*/

        
    }

    public broadcastMessage(type: number, msg: string, fromId: string) {
        //TODO: implement
    }

    public getPluginAuthority(id: string, plugin: string): number {
        for (let item of AppManager.defaultPlugins) {
            if (item == plugin) {
                return AppInfo.AUTHORITY_ALLOW;
            }
        }

        let info = this.appInfos.get(id);
        if (info != null) {
            for (let pluginAuth of info.plugins) {
                if (pluginAuth.plugin == plugin) {
                    return pluginAuth.authority;
                }
            }
        }
        return AppInfo.AUTHORITY_NOEXIST;
    }

    public getUrlAuthority(id: string, url: string): number {
        let info = this.appInfos.get(id);
        if (info != null) {
            for (let urlAuth of info.urls) {
                if (urlAuth.url == url) {
                    return urlAuth.authority;
                }
            }
        }
        return AppInfo.AUTHORITY_NOEXIST;
    }

    public getIntentAuthority(id: string, url: string): number {
        let info = this.appInfos.get(id);
        if (info != null) {
            for (let urlAuth of info.intents) {
                if (urlAuth.url == url) {
                    return urlAuth.authority;
                }
            }
        }
        return AppInfo.AUTHORITY_NOEXIST;
    }

    public async setPluginAuthority(id: string, plugin: string, authority: number) {
        let info = this.appInfos.get(id);
        if (info == null) {
            throw new Error("No such app!");
        }

        for (let pluginAuth of info.plugins) {
            if (pluginAuth.plugin == plugin) {
                let count = await this.dbAdapter.updatePluginAuth(info.tid, plugin, authority);
                if (count > 0) {
                    pluginAuth.authority = authority;
                    this.sendRefreshList("authorityChanged", info, false);
                }
                return;
            }
        }
        throw new Error("The plugin isn't in list!");
    }

    public async setUrlAuthority(id: string, url: string, authority: number) {
        let info = this.appInfos.get(id);
        if (info == null) {
            throw new Error("No such app!");
        }

        for (let urlAuth of info.urls) {
            if (urlAuth.url == url) {
                let count = await this.dbAdapter.updateURLAuth(info.tid, url, authority);
                if (count > 0) {
                    urlAuth.authority = authority;
                    this.sendRefreshList("authorityChanged", info, false);
                }
                return;
            }
        }
        throw new Error("The plugin isn't in list!");
    }

    private static print(msg: string) {
        //TODO: check if print function required
    }

    private urlLock: LockObj = new LockObj();
    private pluginLock: LockObj = new LockObj();

    public runAlertPluginAuth(info: AppInfo, plugin: string, originAuthority: number): number {
        try {
            this.pluginLock.authority = this.getPluginAuthority(info.app_id, plugin);
            if (this.pluginLock.authority != originAuthority) {
                return this.pluginLock.authority;
            }
            this.alertPluginAuth(info, plugin, this.pluginLock);
            
            if (this.pluginLock.authority == originAuthority) {
                //TODO: pluginLock.wait();
            }
        } catch (e) {
            Log.e(AppManager.LOG_TAG, e);
            return originAuthority;
        }
        return this.pluginLock.authority;
    }

    public alertPluginAuth(info: AppInfo, plugin: string, lock: LockObj) {
        //TODO: implement
    }

    public runAlertUrlAuth(info: AppInfo, url: string, originAuthority: number): number {
        //TODO: implement
        return this.urlLock.authority;
    }

    public alertUrlAuth() {
        //TODO: implement
    }

    public getAppIdList(): string[] {
        let ids: string[] = [];
        for (var i = 0; i < this.appList.length; i++) {
            ids[i] = this.appList[i].app_id;
        }
        return ids;
    }

    public getAppInfoList(): AppInfo[] {
        return this.appList;
    }

    public getRunningList(): string[] {
        return this.runningList;
    }

    public getServiceRunningList(appId: string): string[] {
        let list = new Array<string>();
        let prefix = appId + "#service:";
        for (let id of this.serviceRunningList) {
            if (id.startsWith(prefix)) {
                list.push(id.substring(prefix.length));
            }
        }
        return list;
    }

    public getAllServiceRunningList(): string[] {
        return this.serviceRunningList;
    }

    public getLastList(): string[]  {
        return this.lastList;
    }

    public flingTheme() {
        //TODO: implement
    }

    public onConfigurationChanged() {
        //TODO: check if need in ts
    }

    public onRequestPermissionResult() {
        //TODO: check if need in ts
    }




    public findRunningAppByCallerID(browserViewCallerID: number) {
        /*for (let appId in this.runningApps) {
            if (this.runningApps[appId].browserViewID == browserViewCallerID)
                return this.runningApps[appId];
        }
        return null;*/

        if (this.fragments.has(browserViewCallerID)) {
            return this.fragments.get(browserViewCallerID);
        }
        return null;
    }

    public async handleIPCCall(event: Electron.IpcMainInvokeEvent, pluginName: string, methodName: string, fullMethodName: string, success: SuccessCallback, error: ErrorCallback, args: any) {
        /*console.log("handle "+fullMethodName, args);
        if (fullMethodName == "AppManager-getAppInfos") {
            let array = ConfigManager.getShareInstance().getStringArrayValue("dapp.protectList", []);
            console.log(array);
            console.log(array[0]);
        }*/
    
        let callerWebContents = event.sender;
        let callerBrowserView = BrowserView.fromWebContents(callerWebContents);

        //console.log("Caller ID: "+callerBrowserView.id)

        // Retrieve related running app based on caller id
        let runningApp = this.findRunningAppByCallerID(callerBrowserView.id);
        if (runningApp) {
            //console.log("Found running app to handle IPC "+fullMethodName);
            /*for (let entry of runningApp.pluginEntries) {
                console.log("pluginEntry: "+entry.service);
                if (entry.service == pluginName) {
                    (entry.plugin as any)[methodName](success, error, args);
                }
            }*/
            (runningApp.pluginInstances[pluginName] as any)[methodName](success, error, args);
            
        }
        else {
            let msg = "No running app found to handle this IPC request!";
            console.error();
            error(msg);
        }
    }


    // TODO: Apply all of this android method to interceptFileProtocol()
    remapUri() {
    
    }

}

export class InstallInfo {
    public uri: string;
    public dev: boolean;

    constructor(uri: string, dev: boolean) {
        this.uri = uri;
        this.dev = dev;
    }
}

export class LockObj {
    public authority: number = AppInfo.AUTHORITY_NOINIT;
    public isUiThread: boolean = false;
}

export class AppPathInfo {
    public appsPath: string = null;
    public dataPath: string = null;
    public configPath: string = null;
    public tempPath: string = null;
    public databasePath: string = null;

    constructor(basePath: string) {
        let baseDir = app.getAppPath();
        if (basePath != null) {
            baseDir = baseDir + "/" + basePath;
        }
        this.appsPath = baseDir + "/apps/";
        this.dataPath = baseDir + "/data/";
        this.configPath = baseDir + "/config/";
        this.tempPath = baseDir + "/temp/";
        this.databasePath = baseDir + "/database/";

        if (!existsSync(this.appsPath)) {
            mkdirSync(this.appsPath, { recursive: true });
        }

        if (!existsSync(this.dataPath)) {
            mkdirSync(this.dataPath, { recursive: true });
        }

        if (!existsSync(this.configPath)) {
            mkdirSync(this.configPath, { recursive: true });
        }

        if (!existsSync(this.tempPath)) {
            mkdirSync(this.tempPath, { recursive: true });
        }

        if (!existsSync(this.databasePath)) {
            mkdirSync(this.databasePath, { recursive: true });
        }
    }
}

//TODO: place in other file

/*
export class RunningApp {
    appInfo: AppInfo;
    browserViewID: number;
    runtime: TrinityRuntime;
    pluginInstances: { [key: string] : TrinityPlugin };
    titleBar: TitleBar;

    private constructor(appInfo: AppInfo, browserViewID: number, runtime: TrinityRuntime, titleBar: TitleBar) {
        this.browserViewID = browserViewID;
        this.appInfo = appInfo;
        this.runtime = runtime;
        this.titleBar = titleBar;
    }

    private async createPluginInstances() {
        // Create plugin instances fo this app
        this.pluginInstances = {};
        for (let pluginName of Object.keys(this.runtime.plugins)) {
            //console.log("pluginName", pluginName)
            let plugin = this.runtime.plugins[pluginName];
            let pluginInstance = plugin.instanceCreationCallback(this.appInfo.app_id);
            this.pluginInstances[pluginName] = pluginInstance;

            await pluginInstance.setInfo(this.appInfo)
        }
    }

    public static async create(appInfo: AppInfo, browserViewID: number, runtime: TrinityRuntime, titleBar: TitleBar): Promise<RunningApp> {
        let app = new RunningApp(appInfo, browserViewID, runtime, titleBar);
        await app.createPluginInstances();
        titleBar.setRunningApp(app);
        return app;
    }
}*/