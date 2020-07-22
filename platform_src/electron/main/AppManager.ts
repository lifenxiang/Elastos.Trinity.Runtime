import { existsSync, mkdirSync, readdirSync } from 'fs-extra';
import { app, BrowserWindow, session, BrowserView, Session, Request } from 'electron';
import { join as pathJoin } from "path";

import { Log } from "./Log";
import { AppInstaller } from './AppInstaller';
import { AppInfo } from "./AppInfo";
import { MergeDBAdapter } from "./MergeDBAdapter";
import { PreferenceManager } from "./PreferenceManager";
import { IdentityEntry } from "./didsessions/IdentityEntry";
import { TrinityPlugin, SuccessCallback, ErrorCallback } from './TrinityPlugin';
import { TrinityRuntime } from './Runtime';
import { TitleBar } from './TitleBar';
import { notImplemented } from './Utility';
import { AppManagerPlugin } from './plugins_main/AppManagerPluginMain';

class AppPathInfo {
    public appsPath: string = null;
    public dataPath: string = null;
    public configPath: string = null;
    public tempPath: string = null;
    public databasePath: string = null;

    constructor(basePath: string) {
        let baseDir = app.getAppPath(); // TODO CHECK String baseDir = activity.getFilesDir().toString();
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
            console.log("pluginName", pluginName)
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
}

export class AppManager {
    private static LOG_TAG = "AppManager";

     /** The internal message */
     public static MSG_TYPE_INTERNAL = 1;
     /** The internal return message. */
     public static MSG_TYPE_IN_RETURN = 2;
     /** The internal refresh message. */
     public static MSG_TYPE_IN_REFRESH = 3;
     /** The installing message. */
     public static MSG_TYPE_INSTALLING = 4;
 
     /** The external message */
     public static MSG_TYPE_EXTERNAL = 11;
     /** The external launcher message */
     public static MSG_TYPE_EX_LAUNCHER = 12;
     /** The external install message */
     public static MSG_TYPE_EX_INSTALL = 13;
     /** The external return message. */
     public static MSG_TYPE_EX_RETURN = 14;

    public static LAUNCHER = "org.elastos.trinity.launcher";
    public static DIDSESSION = "didsession";

    public static STARTUP_APP = "app";
    public static STARTUP_SERVICE = "service";

    private static appManager: AppManager;
    private runtime: TrinityRuntime;
    private window: BrowserWindow = null
    dbAdapter: MergeDBAdapter = null;
    runningApps: { [key:string]: RunningApp };

    private basePathInfo: AppPathInfo = null;
    private pathInfo: AppPathInfo = null;

    private signIning = true;
    private did: string = null;

    shareInstaller: AppInstaller = new AppInstaller();;

    protected appInfos: Map<string, AppInfo>;
    private lastList = new Array<string>();
    private runningList = new Array<string>();
    public appList: AppInfo[];
    protected visibles = new Map<string, boolean>();

    private launcherInfo: AppInfo = null;
    private didSessionInfo: AppInfo = null;

    constructor(window: BrowserWindow, runtime: TrinityRuntime) {
        AppManager.appManager = this;

        this.window = window;
        this.runtime = runtime;
        this.runningApps = {};

        this.basePathInfo = new AppPathInfo(null);
        this.pathInfo = this.basePathInfo;


        this.shareInstaller.init(this.basePathInfo.appsPath, this.basePathInfo.tempPath);

        this.init();
    }

    private async init() {
        //this.dbAdapter = await MergeDBAdapter.create(this.window);
        this.dbAdapter = await MergeDBAdapter.newInstance(this.window);

        await this.refreshInfos();
        await this.getLauncherInfo();
        await this.saveLauncher();
        await this.checkAndUpateDIDSession();
        await this.saveBuiltInApps();
        await this.refreshInfos();

        let entry: IdentityEntry = null;
        /* TODO try {
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

        /* TODO if (PreferenceManager.getSharedInstance().getDeveloperMode()) {
//            CLIService.getShareInstance().start();
        }

        try {
            ContactNotifier.getSharedInstance(activity, did);
        } catch (CarrierException e) {
            e.printStackTrace();
        }*/
    }

    public static getSharedInstance(): AppManager {
        return AppManager.appManager;
    }

    private getAssetsFile(path: string, warnIfNotFound = true): Object {
        let fullPath = pathJoin(app.getAppPath(), path);
        if (existsSync(fullPath))
            return require(fullPath);
        else {
            if (warnIfNotFound)
                Log.w(AppManager.LOG_TAG, "File "+path+" doesn't exist");
            return null;
        }
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

    public getBaseDataPath(): string {
        return this.basePathInfo.dataPath;
    }

    private async reInit(sessionLanguage: string) {
        // TODO curFragment = null;

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

        Log.d(AppManager.LOG_TAG, "Refreshing info after reinit");
        await this.refreshInfos();
        await this.getLauncherInfo();
        try {
            await this.loadLauncher();
        }
        catch (e){
            Log.e(AppManager.LOG_TAG, e);
        }
        await this.refreshInfos();
        this.sendRefreshList("initiated", null, false);
    }

    private async closeAll() {
        for (let appId of this.getRunningList()) {
            if (!this.isLauncher(appId)) {
                await this.close(appId);
            }

        }

        console.log("NOT IMPLEMENTED - closeAll")

        /* TODO FragmentManager manager = activity.getSupportFragmentManager();
        for (Fragment fragment : manager.getFragments()) {
            manager.beginTransaction().remove(fragment).commit();
        }*/
    }

    private async clean() {
        this.did = null;
        // TOOD this.curFragment = null;
        this.appList = null;
        this.lastList = new Array<string>();
        this.runningList = new Array<string>();
        this.visibles = new Map<string, boolean>();
        await this.dbAdapter.setUserDBAdapter(null);

        this.pathInfo = this.basePathInfo;
    }
    /**
     * Signs in to a new DID session.
     */
    /*public signIn(sessionLanguage: string) {
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
            await this.closeAll();
            await this.clean();
            await this.startDIDSession();
        }
    }

    /*public boolean isSignIning() {
        return signIning;
    }

    public String getDIDSessionId() {
        return "org.elastos.trinity.dapp.didsession";
    }
    public boolean isDIDSession(String appId) {
        return appId.equals("didsession") || appId.equals(getDIDSessionId());
    }
*/
    public async startDIDSession() {
        await this.start(this.getDIDSessionId());
    }

    public async closeDIDSession() {
        await this.close(this.getDIDSessionId());

        // TODO let entry = DIDSessionManager.getSharedInstance().getSignedInIdentity();
        // TODO did = entry.didString;
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

   /* private InputStream getAssetsFile(String path) {
        InputStream input = null;

        AssetManager manager = activity.getAssets();
        try {
            input = manager.open(path);
        }
        catch (IOException e) {
            e.printStackTrace();
        }

        return input;
    }*/

    private async installBuiltInApp(relativeRootPath: string, id: string, isLauncher: boolean) {
        Log.d("AppManager", "Entering installBuiltInApp relativeRootPath="+relativeRootPath+" id="+id+" launcher="+isLauncher);

        relativeRootPath = relativeRootPath + id;
        let input = this.getAssetsFile(relativeRootPath + "/manifest.json", false);
        if (input == null) {
            input = this.getAssetsFile(relativeRootPath + "/assets/manifest.json", false);
            if (input == null) {
                Log.e("AppManager", "No manifest found, returning");
                return;
            }
        }
        let builtInInfo = this.shareInstaller.parseManifest(input, isLauncher);

        let installedInfo = await this.getAppInfo(id);
        let needInstall = true;
        if (installedInfo != null) {
            let versionChanged = PreferenceManager.getSharedInstance().versionChanged;
            if (versionChanged || builtInInfo.version_code > installedInfo.version_code) {
                Log.d("AppManager", "built in version > installed version: uninstalling installed");
                this.shareInstaller.unInstall(installedInfo, true);
            }
            else {
                Log.d("AppManager", "Built in version <= installed version, No need to install");
                needInstall = false;
            }
        }
        else {
            Log.d("AppManager", "No installed info found");
        }

        if (needInstall) {
            Log.d("AppManager", "Needs install - copying assets and setting built-in to 1");
            this.shareInstaller.copyAssetsFolder(relativeRootPath, this.basePathInfo.appsPath + builtInInfo.app_id);
            builtInInfo.built_in = 1;
            await this.dbAdapter.addAppInfo(builtInInfo, true);
            if (isLauncher) {
                this.launcherInfo = null;
                this.getLauncherInfo();
            }
        }
    }

    private async saveLauncher() {
        try {
            let launcherPath = pathJoin(this.basePathInfo.appsPath, AppManager.LAUNCHER);
            if (existsSync(launcherPath)) {
                let info = this.shareInstaller.getInfoByManifest(this.basePathInfo.appsPath + AppManager.LAUNCHER + "/", true);
                info.built_in = 1;
                let count = await this.dbAdapter.removeAppInfo(this.launcherInfo, true);
                if (count < 1) {
                    Log.e("AppManager", "Launcher upgrade -- Can't remove the older DB info.");
                    //TODO:: need remove the files? now, restart will try again.
                    return;
                }
                this.shareInstaller.renameFolder(launcherPath, this.basePathInfo.appsPath, this.launcherInfo.app_id);
                await this.dbAdapter.addAppInfo(info, true);
                this.launcherInfo = null;
                this.getLauncherInfo();
            }

            this.installBuiltInApp("/", "launcher", true);
        } catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }
    }

    private checkAndUpateDIDSession() {
        console.log("NOT IMPLEMENTED - checkAndUpateDIDSession")
        /* TODO try {
            File didsession = new File(basePathInfo.appsPath, AppManager.DIDSESSION);
            if (didsession.exists()) {
                AppInfo info = shareInstaller.getInfoByManifest(basePathInfo.appsPath + AppManager.DIDSESSION + "/", 0);
                info.built_in = 1;
                int count = dbAdapter.removeAppInfo(getDIDSessionAppInfo(), true);
                if (count < 1) {
                    Log.e("AppManager", "Launcher upgrade -- Can't remove the older DB info.");
                    return;
                }
                shareInstaller.renameFolder(didsession, basePathInfo.appsPath, getDIDSessionId());
                await dbAdapter.addAppInfo(info, true);
                diddessionInfo = null;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }*/
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
            let appdirs = readdirSync(pathJoin(app.getAppPath(), "built-in"));

            for (let appdir of appdirs) {
                await this.installBuiltInApp("built-in/", appdir, false);
            }

            for (let i = 0; i < this.appList.length; i++) {
                Log.d(AppManager.LOG_TAG, "save / app "+this.appList[i].app_id+" buildin "+this.appList[i].built_in);
                if (!this.appList[i].built_in) {
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
        if (visible == "hide") {
            this.visibles.set(id, false);
        }
        else {
            this.visibles.set(id, true);
        }
    }

    public getAppVisible(id: string): boolean {
        let ret = this.visibles.get(id);
        if (ret == null) {
            return true;
        }
        return ret;
    }
/*
    public AppInfo getLauncherInfo() {
        if (launcherInfo == null) {
            launcherInfo = dbAdapter.getLauncherInfo();
        }
        return launcherInfo;
    }

    public boolean isLauncher(String appId) {
        if (appId == null || launcherInfo == null) {
            return false;
        }

        if (appId.equals(LAUNCHER) || appId.equals(launcherInfo.app_id)) {
            return true;
        }
        else {
            return false;
        }
    }*/

    private async refreshInfos() {
        this.appList = await this.dbAdapter.getAppInfos();
        //console.log("refreshInfos: got "+this.appList.length+" app infos", this.appList);
        this.appInfos = new Map();
        for (let i = 0; i < this.appList.length; i++) {
            this.appInfos.set(this.appList[i].app_id, this.appList[i]);
            let visible = this.visibles.get(this.appList[i].app_id);
            if (visible == null) {
                this.setAppVisible(this.appList[i].app_id, this.appList[i].start_visible);
            }
        }
    }

    public async getAppInfo(id: string): Promise<AppInfo> {
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

        if (!info.remote) {
            return this.getAppUrl(info) + info.start_url;
        }
        else {
            return info.start_url;
        }
    }

    private getAppLocalPath(info: AppInfo): string {
        let path = this.basePathInfo.appsPath;
        if (!info.share) {
            path = this.pathInfo.appsPath;
        }
        return path + info.app_id + "/";
    }

    public getAppPath(info: AppInfo): string {
        if (!info.remote) {
            return this.getAppLocalPath(info);
        }
        else {
            return info.start_url.substring(0, info.start_url.lastIndexOf("/") + 1);
        }
    }

    public getAppUrl(info: AppInfo): string {
        let url = this.getAppPath(info);
        if (!info.remote) {
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
            let launcherInfo = await this.getLauncherInfo();
            id = launcherInfo.app_id;
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
            let launcherInfo = await this.getLauncherInfo();
            id = launcherInfo.app_id;
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
        let url = this.getAppLocalPath(info);
        return this.resetPath(url, iconSrc);
    }

    /*public String[] getIconUrls(AppInfo info) {
        String[] iconPaths = new String[info.icons.size()];
        for (int i = 0; i < info.icons.size(); i++) {
            iconPaths[i] = getIconUrl(info, info.icons.get(i).src);
        }
        return iconPaths;
    }*/

    public resetPath(dir: string, origin: string): string {
        if (origin.indexOf("http://") != 0 && origin.indexOf("https://") != 0 && origin.indexOf("file:///") != 0) {
            while (origin.startsWith("/")) {
                origin = origin.substring(1);
            }
            origin = dir + origin;
        }
        return origin;
    }

    /*
     * debug: from CLI to debug dapp
     */
    /*public AppInfo install(String url, boolean update, boolean fromCLI) throws Exception  {
        AppInfo info = shareInstaller.install(url, update);
        if (info != null) {
            refreashInfos();

            if (info.launcher == 1) {
                sendRefreshList("launcher_upgraded", info, fromCLI);
            }
            else {
                sendRefreshList("installed", info, fromCLI);
            }
        }

        return info;
    }

    public void unInstall(String id, boolean update) throws Exception {
        await close(id);
        AppInfo info = appInfos.get(id);
        shareInstaller.unInstall(info, update);
        refreashInfos();
        if (!update) {
           if (info.built_in == 1) {
               installBuiltInApp("www/built-in/", info.app_id, 0);
               refreashInfos();
           }
           sendRefreshList("unInstalled", info, false);
        }
    }

    public WebViewFragment getFragmentById(String id) {
        if (isLauncher(id)) {
            id = LAUNCHER;
        }

        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();
        for (int i = 0; i < fragments.size(); i++) {
            Fragment fragment = fragments.get(i);
            if (fragment instanceof WebViewFragment) {
                WebViewFragment webViewFragment = (WebViewFragment)fragment;
                if (webViewFragment.id.equals(id)) {
                    return webViewFragment;
                }
            }
        }
        return null;
    }
*/
    public switchContent(fragment: any, id: string) {
        notImplemented("switchContent");
        /*FragmentManager manager = activity.getSupportFragmentManager();
        FragmentTransaction transaction = manager.beginTransaction();
        if ((curFragment != null) && (curFragment != fragment)) {
            transaction.hide(curFragment);
        }
        if (curFragment != fragment) {
            if (!fragment.isAdded()) {
                transaction.add(R.id.content, fragment, id);
            }
            else if (curFragment != fragment) {
                transaction.setCustomAnimations(android.R.animator.fade_in, android.R.animator.fade_out)
                        .show(fragment);
            }
//            transaction.addToBackStack(null);
            transaction.commit();
        }

        curFragment = fragment;

        runningList.remove(id);
        runningList.add(0, id);
        lastList.remove(id);
        lastList.add(0, id);*/
    }

    private hideFragment(fragment: any, id: string) {
        // TODO - No way to deal with browser views Z-ordering for now - find a solution.
        notImplemented("hideFragment")

        /*FragmentManager manager = activity.getSupportFragmentManager();
        FragmentTransaction transaction = manager.beginTransaction();
        if (!fragment.isAdded()) {
            transaction.add(R.id.content, fragment, id);
        }
        transaction.hide(fragment);
        transaction.commit();

        runningList.add(0, id);
        lastList.add(1, id);*/
    }
/*
    Boolean isCurrentFragment(WebViewFragment fragment) {
        return (fragment == curFragment);
    }

    public boolean doBackPressed() {
        if (launcherInfo == null || curFragment == null || isLauncher(curFragment.id) || isDIDSession(curFragment.id)) {
            return true;
        }
        else {
            switchContent(getFragmentById(launcherInfo.app_id), launcherInfo.app_id);
            try {
                AppManager.getShareInstance().sendLauncherMessageMinimize(curFragment.id);
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
    }
*/

    public findRunningAppByCallerID(browserViewCallerID: number) {
        //console.debug("Looking for running app with browser view id "+browserViewCallerID);
        //console.debug("Running apps:", this.runningApps);

        for (let appId in this.runningApps) {
            if (this.runningApps[appId].browserViewID == browserViewCallerID)
                return this.runningApps[appId];
        }
        return null;
    }

    public handleIPCCall(event: Electron.IpcMainInvokeEvent, pluginName: string, methodName: string, fullMethodName: string, success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("handle "+fullMethodName, args);
    
        let callerWebContents = event.sender;
        let callerBrowserView = BrowserView.fromWebContents(callerWebContents)

        console.log("Caller ID: "+callerBrowserView.id)

        // Retrieve related running app based on caller id
        let runningApp = this.findRunningAppByCallerID(callerBrowserView.id);
        if (runningApp) {
            console.log("Found running app to handle IPC "+fullMethodName);

            (runningApp.pluginInstances[pluginName] as any)[methodName](success, error, args);
        }
        else {
            let msg = "No running app found to handle this IPC request!";
            console.error();
            error(msg);
        }
    }

    private setupSessionProtocolHandlers(ses: Session, appId: string, dappFilesPath: string) {
        let wwwFilesPath = `${__dirname}`

        ses.protocol.registerFileProtocol("trinityapp", async (request: Request, callback: (filePath: string)=>void) => {
            //console.log("Handle FILE trinityapp:", request);

            // Ex: request.url = trinityapp://index.html/
            let redirectedFilePath: string;
            if (request.url == "trinityapp://index.html/")
                redirectedFilePath = dappFilesPath + "/index.html"
            else {
                redirectedFilePath = request.url.replace("trinityapp://index.html", "");
                if (!redirectedFilePath.startsWith(dappFilesPath)) {
                    let info = await this.getAppInfo(appId);
                    redirectedFilePath = this.getAppUrl(info) + redirectedFilePath.substring(1);
                }
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

        ses.protocol.registerFileProtocol("icon", async (request: Request, callback: (filePath: string)=>void) => {
            //console.log("Intercepting ASSET request:", request.url);

            // Ex: request.url = icon://appid/iconindex
            // TODO? if (isChangeIconPath && url.startsWith("icon://")) {
                let str = request.url.substring(7);
                let index = str.indexOf("/");
                if (index > 0) {
                    let app_id = str.substring(0, index);
                    let info = await this.getAppInfo(app_id);
                    if (info != null) {
                        index = parseInt(str.substring(index + 1));
                        let icon = info.icons[index];
                        let url = this.getIconUrl(info, icon.src);
                        callback(url);
                        return;
                    }
                }

                callback(null);
            //}
        }, (err)=>{
            if (err)
                console.error("Icon intercept error:", err);
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

    private async createAppForLaunch(appInfo: AppInfo) {
        const partition = 'TODO-TEST-persist:example'+appInfo.app_id // TODO: SANDBOX PER DID/APPID
        const ses = session.fromPartition(partition)

        let dappFilesPath = this.getAppLocalPath(appInfo);

        this.setupSessionProtocolHandlers(ses, appInfo.app_id, dappFilesPath);

        let appView = new BrowserView({
            webPreferences: {
                nodeIntegration: false, // is default value after Electron v5
                contextIsolation: true, // protect against prototype pollution
                enableRemoteModule: false, // turn off remote
                preload: pathJoin(app.getAppPath(), 'dapp_preload.js'),
                partition: partition
            }
        })
        this.window.addBrowserView(appView)
        appView.setBounds({ x: 0, y: 64, width: 500, height: 800 })

        // Create a title bar model to contol the shared title bar view
        let runningApp = await RunningApp.create(appInfo, appView.id, this.runtime, new TitleBar(this.runtime.titleBarView));
        this.runningApps[appInfo.app_id] = runningApp;
        //console.log("runningApps:", this.runningApps)
        Log.d(AppManager.LOG_TAG, "Started app "+appInfo.app_id+" with browser view id "+ runningApp.browserViewID);

        appView.webContents.loadURL('trinityapp://index.html')
        //appView.webContents.openDevTools({mode: "detach"});

        runningApp.titleBar.setVisible();
    }

    public async start(id: string) {
        let info = await this.getAppInfo(id);
        if (info == null) {
            throw new Error("No such app ("+id+")!");
        }

        let runningApp = this.runningApps[id];
        if (runningApp == null) {
            await this.createAppForLaunch(info);
            if (!this.isLauncher(id)) {
                this.sendRefreshList("started", info, false);
            }

            if (!this.getAppVisible(id)) {
                this.showActivityIndicator(true);
                this.hideFragment(runningApp, id);
            }
        }

        if (this.getAppVisible(id)) {
            this.switchContent(runningApp, id);
            this.showActivityIndicator(false);
        }
    }

    private showActivityIndicator(show: boolean) {
        notImplemented("showActivityIndicator");
        /*activity.runOnUiThread((Runnable) () -> {
            if (curFragment.titlebar != null) {
                if (show) {
                    curFragment.titlebar.showActivityIndicator(TitleBarActivityType.LAUNCH, activity.getResources().getString(R.string.app_starting));
                } else {
                    curFragment.titlebar.hideActivityIndicator(TitleBarActivityType.LAUNCH);
                }
            }
        });*/
    }

    public async close(id: string) {
        if (this.isLauncher(id)) {
            throw new Error("Launcher can't close!");
        }

        let info = await this.getAppInfo(id);
        if (info == null) {
            throw new Error("No such app!");
        }

        if (!this.runningApps[id]) {
            return;
        }

        this.setAppVisible(id, info.start_visible);

        console.log("PARTIALLY IMPLEMENTED - close")

        /* TODO
        IntentManager.getShareInstance().removeAppFromIntentList(id);

        if (fragment == curFragment) {
            if (lastList.size() > 1) {
                String id2 = lastList.get(1);
                WebViewFragment fragment2 = getFragmentById(id2);
                if (fragment2 == null) {
                    fragment2 = getFragmentById(LAUNCHER);
                    if (fragment2 == null) {
                        throw new Exception("RT inner error!");
                    }
                }
                switchContent(fragment2, id2);
            }
        }
        */

        this.window.removeBrowserView(BrowserView.fromId(this.runningApps[id].browserViewID));
        this.lastList.splice(this.lastList.indexOf(id), 1);
        this.runningList.splice(this.lastList.indexOf(id), 1);
        delete this.runningApps[id];

        this.sendRefreshList("closed", info, false);
    }

    public async loadLauncher() {
        await this.start(AppManager.LAUNCHER);
    }

   /* public void checkInProtectList(String uri) throws Exception {
        AppInfo info = shareInstaller.getInfoFromUrl(uri);
        if (info != null && info.app_id != "" ) {
            String[] protectList = ConfigManager.getShareInstance().getStringArrayValue(
                    "dapp.protectList", new String[0]);
            for (String item : protectList) {
                if (item.equalsIgnoreCase(info.app_id)) {
                    throw new Exception("Don't allow install '" + info.app_id + "' by the third party app.");
                }
            }
        }
    }

    private void installUri(String uri, boolean dev) {
        try {
            if (dev && PreferenceManager.getShareInstance().getDeveloperMode()) {
                install(uri, true, dev);
            }
            else {
                checkInProtectList(uri);
                sendInstallMsg(uri);
            }
        }
        catch (Exception e) {
            Utility.alertPrompt("Install Error", e.getLocalizedMessage(), this.activity);
        }
    }

    public void setInstallUri(String uri, boolean dev) {
        if (uri == null) return;

        if (launcherReady || dev) {
            installUri(uri, dev);
        }
        else {
            installUriList.add(new InstallInfo(uri, dev));
        }
    }

    public void setIntentUri(Uri uri) {
        if (uri == null) return;

        if (launcherReady) {
            IntentManager.getShareInstance().doIntentByUri(uri);
        }
        else {
            intentUriList.add(uri);
        }
    }

    public boolean isLauncherReady() {
        return launcherReady;
    }*/

    public setLauncherReady() {
        notImplemented("setLauncherReady");
        /*launcherReady = true;

        for (int i = 0; i < installUriList.size(); i++) {
            InstallInfo info = installUriList.get(i);
            sendInstallMsg(info.uri);
        }

        for (int i = 0; i < intentUriList.size(); i++) {
            Uri uri = intentUriList.get(i);
            IntentManager.getShareInstance().doIntentByUri(uri);
        }*/
    }

    public sendLauncherMessage(type: number, msg: string, fromId: string) {
        this.sendMessage(AppManager.LAUNCHER, type, msg, fromId);
    }

    /*public void sendLauncherMessageMinimize(String fromId) throws Exception {
        sendLauncherMessage(AppManager.MSG_TYPE_INTERNAL,
                "{\"action\":\"minimize\"}", fromId);
    }

    private void sendInstallMsg(String uri) {
        String msg = "{\"uri\":\"" + uri + "\", \"dev\":\"false\"}";
        try {
            sendLauncherMessage(MSG_TYPE_EX_INSTALL, msg, "system");
        }
        catch (Exception e) {
            e.printStackTrace();
        }
    }*/

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

    public sendMessage(toId: string, type: number, msg: string, fromId: string) {
        if (this.signIning) return;

        let runningApp = this.runningApps[toId];
        if (runningApp) {
            console.log("Sending message to app id "+runningApp.appInfo.app_id, msg, fromId);
            let appManagerPlugin = runningApp.pluginInstances["AppManager"] as AppManagerPlugin
            appManagerPlugin.onReceive(msg, type, fromId);
        }
        else {
            throw new Error(toId + " isn't running!");
        }
    }

    /*public void broadcastMessage(int type, String msg, String fromId) {
        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();

        for (int i = 0; i < fragments.size(); i++) {
            WebViewFragment fragment = (WebViewFragment)fragments.get(i);
            if (fragment != null && fragment.appView != null) {
                fragment.basePlugin.onReceive(msg, type, fromId);
            }
        }
    }

    public int getPluginAuthority(String id, String plugin) {
        for (String item : defaultPlugins) {
            if (item.equals(plugin)) {
                return AppInfo.AUTHORITY_ALLOW;
            }
        }

        AppInfo info = appInfos.get(id);
        if (info != null) {
            for (AppInfo.PluginAuth pluginAuth : info.plugins) {
                if (pluginAuth.plugin.equals(plugin)) {
                    return pluginAuth.authority;
                }
            }
        }
        return AppInfo.AUTHORITY_NOEXIST;
    }

    public int getUrlAuthority(String id, String url) {
        AppInfo info = appInfos.get(id);
        if (info != null) {
            for (AppInfo.UrlAuth urlAuth : info.urls) {
                if (urlAuth.url.equals(url)) {
                    return urlAuth.authority;
                }
            }
        }
        return AppInfo.AUTHORITY_NOEXIST;
    }

    public int getIntentAuthority(String id, String url) {
        AppInfo info = appInfos.get(id);
        if (info != null) {
            for (AppInfo.UrlAuth urlAuth : info.intents) {
                if (urlAuth.url.equals(url)) {
                    return urlAuth.authority;
                }
            }
        }
        return AppInfo.AUTHORITY_NOEXIST;
    }

    public void setPluginAuthority(String id, String plugin, int authority) throws Exception {
        AppInfo info = appInfos.get(id);
        if (info == null) {
            throw new Exception("No such app!");
        }

        for (AppInfo.PluginAuth pluginAuth : info.plugins) {
            if (pluginAuth.plugin.equals(plugin)) {
                long count = dbAdapter.updatePluginAuth(info.tid, plugin, authority);
                if (count > 0) {
                    pluginAuth.authority = authority;
                    sendRefreshList("authorityChanged", info, false);
                }
                return;
            }
        }
        throw new Exception("The plugin isn't in list!");
    }

    public void setUrlAuthority(String id, String url, int authority)  throws Exception {
        AppInfo info = appInfos.get(id);
        if (info == null) {
            throw new Exception("No such app!");
        }

        for (AppInfo.UrlAuth urlAuth : info.urls) {
            if (urlAuth.url.equals(url)) {
                long count = dbAdapter.updateURLAuth(info.tid, url, authority);
                if (count > 0) {
                    urlAuth.authority = authority;
                    sendRefreshList("authorityChanged", info, false);
                }
                return ;
            }
        }
        throw new Exception("The plugin isn't in list!");
    }

    private static void print(String msg) {
        String name = Thread.currentThread().getName();
        System.out.println(name + ": " + msg);
    }

    private class LockObj {
        int authority = AppInfo.AUTHORITY_NOINIT;
        boolean isUiThread = false;
    }
    private LockObj urlLock = new LockObj();
    private LockObj pluginLock = new LockObj();

    public synchronized int runAlertPluginAuth(AppInfo info, String plugin, int originAuthority) {
        try {
            synchronized (pluginLock) {
                pluginLock.authority = getPluginAuthority(info.app_id, plugin);
                if (pluginLock.authority != originAuthority) {
                    return pluginLock.authority;
                }
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        alertPluginAuth(info, plugin, pluginLock);
                    }
                });

                if (pluginLock.authority == originAuthority) {
                    pluginLock.wait();
                }
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
            return originAuthority;
        }
        return pluginLock.authority;
    }

    public void alertPluginAuth(AppInfo info, String plugin, LockObj lock) {
        AlertDialog.Builder ab = new AlertDialog.Builder(activity);
        ab.setTitle("Plugin authority request");
        ab.setMessage("App:'" + info.name + "' request plugin:'" + plugin + "' access authority.");
        ab.setIcon(android.R.drawable.ic_dialog_info);
        ab.setCancelable(false);

        ab.setPositiveButton("Allow", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                try {
                    setPluginAuthority(info.app_id, plugin, AppInfo.AUTHORITY_ALLOW);
                }
                catch (Exception e) {
                    e.printStackTrace();
                }
                synchronized (lock) {
                    lock.authority = AppInfo.AUTHORITY_ALLOW;
                    lock.notify();
                }
            }
        });
        ab.setNegativeButton("Refuse", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                try {
                    setPluginAuthority(info.app_id, plugin, AppInfo.AUTHORITY_DENY);
                }
                catch (Exception e) {
                    e.printStackTrace();
                }
                synchronized (lock) {
                    lock.authority = AppInfo.AUTHORITY_DENY;
                    lock.notify();
                }
            }
        });
        ab.show();
    }

    public synchronized int runAlertUrlAuth(AppInfo info, String url, int originAuthority) {
        try {
            synchronized (urlLock) {
                urlLock.authority = getUrlAuthority(info.app_id, url);
                if (urlLock.authority != originAuthority) {
                    return urlLock.authority;
                }

                urlLock.isUiThread = Looper.myLooper() == Looper.getMainLooper();

                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        alertUrlAuth(info, url, urlLock);
                    }
                });

                if (!urlLock.isUiThread && urlLock.authority == originAuthority) {
                    urlLock.wait();
                }
            }

        } catch (InterruptedException e) {
            e.printStackTrace();
            return originAuthority;
        }
        return urlLock.authority;
    }

    public void alertUrlAuth(AppInfo info, String url, LockObj lock) {
        new UrlAuthorityDialog.Builder(activity)
                .setData(url, info)
                .setOnAcceptClickedListener(() -> {
                    try {
                        setUrlAuthority(info.app_id, url, AppInfo.AUTHORITY_ALLOW);
                    }
                    catch (Exception e) {
                        e.printStackTrace();
                    }
                    synchronized (lock) {
                        lock.authority = AppInfo.AUTHORITY_ALLOW;
                        lock.notify();
                    }
                })
                .setOnDenyClickedListener(() -> {
                    try {
                        setUrlAuthority(info.app_id, url, AppInfo.AUTHORITY_DENY);
                    }
                    catch (Exception e) {
                        e.printStackTrace();
                    }
                    synchronized (lock) {
                        lock.authority = AppInfo.AUTHORITY_DENY;
                        lock.notify();
                    }
                })
                .show();
    }

    public String[] getAppIdList() {
        String[] ids = new String[appList.length];
        for (int i = 0; i < appList.length; i++) {
            ids[i] = appList[i].app_id;
        }
        return ids;
    }
*/
    public getAppInfoList(): AppInfo[] {
        return this.appList;
    }

    public getRunningList(): string[] {
        return this.runningList;
    }

    public getLastList(): string[]  {
        return this.lastList;
    }

/*
    public void flingTheme() {
        if (curFragment == null) {
            return;
        }

        if (curFragment.titlebar.getVisibility() == View.VISIBLE) {
            curFragment.titlebar.setVisibility(View.GONE);
        } else {
//            fragment.titlebar.bringToFront();//for qrscanner
            curFragment.titlebar.setVisibility(View.VISIBLE);
        }
    }

    public void onConfigurationChanged(Configuration newConfig) {
        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();

        for (int i = 0; i < fragments.size(); i++) {
            WebViewFragment fragment = (WebViewFragment)fragments.get(i);
            if (fragment != null && fragment.appView != null) {
                PluginManager pm = fragment.appView.getPluginManager();
                if (pm != null) {
                    pm.onConfigurationChanged(newConfig);
                }
            }
        }
    }

    public void onRequestPermissionResult(int requestCode, String permissions[],
                                           int[] grantResults) throws JSONException {
        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();

        for (int i = 0; i < fragments.size(); i++) {
            WebViewFragment fragment = (WebViewFragment)fragments.get(i);
            if (fragment != null) {
                fragment.onRequestPermissionResult(requestCode, permissions, grantResults);
            }
        }
    }*/
}