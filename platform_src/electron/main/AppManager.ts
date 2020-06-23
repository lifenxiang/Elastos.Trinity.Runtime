import { existsSync, mkdirSync } from 'fs-extra';
import { app, BrowserWindow } from 'electron';

import { Log } from "./Log";
import { AppInstaller } from './AppInstaller';
import { AppInfo } from "./AppInfo";
import { MergeDBAdapter } from "./MergeDBAdapter";
import { PreferenceManager } from "./PreferenceManager";
import { IdentityEntry } from "./didsessions/IdentityEntry";

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

    public static LAUNCHER = "launcher";
    public static DIDSESSION = "didsession";

    private static appManager: AppManager;
    private window: BrowserWindow = null
    dbAdapter: MergeDBAdapter = null;

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

    constructor(window: BrowserWindow) {
        AppManager.appManager = this;
        this.window = window;

        this.basePathInfo = new AppPathInfo(null);
        this.pathInfo = this.basePathInfo;

        this.dbAdapter = new MergeDBAdapter(window);

        this.shareInstaller.init(this.basePathInfo.appsPath, this.basePathInfo.tempPath);

        this.init();
    }

    private async init() {
        await this.refreshInfos();
        this.getLauncherInfo();
        this.saveLauncher();
        this.checkAndUpateDIDSession();
        this.saveBuiltInApps();
        await this.refreshInfos();

        let entry: IdentityEntry = null;
        /* TODO try {
            entry = DIDSessionManager.getSharedInstance().getSignedInIdentity();
        }
        catch (Exception e){
            e.printStackTrace();
        }*/

        if (entry != null) {
            this.signIning = false;
            this.did = entry.didString;
            await this.reInit(null);
        }
        else {
            try {
                this.startDIDSession();
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

    private getAssetsFile(path: string): Object {
        let input = null;

        /* TODO let manager = activity.getAssets();
        try {
            input = manager.open(path);
        }
        catch (e) {
            Log.e(AppManager.LOG_TAG, e);
        }*/

        return input;
    }

    private installBuiltInApp(path: string, id: string, isLauncher: boolean) {
        Log.d("AppManager", "Entering installBuiltInApp path="+path+" id="+id+" launcher="+isLauncher);

        path = path + id;
        let input = this.getAssetsFile(path + "/manifest.json");
        if (input == null) {
            input = this.getAssetsFile(path + "/assets/manifest.json");
            if (input == null) {
                Log.e("AppManager", "No manifest found, returning");
                return;
            }
        }
        let builtInInfo = this.shareInstaller.parseManifest(input, isLauncher);

        let installedInfo = this.getAppInfo(id);
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
            this.shareInstaller.copyAssetsFolder(path, this.basePathInfo.appsPath + builtInInfo.app_id);
            builtInInfo.built_in = true;
            this.dbAdapter.addAppInfo(builtInInfo, true);
            if (isLauncher) {
                this.launcherInfo = null;
                this.getLauncherInfo();
            }
        }
    }

    public getLauncherInfo(): AppInfo {
        if (this.launcherInfo == null) {
            this.launcherInfo = this.dbAdapter.getLauncherInfo();
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

    public getDIDSessionAppInfo(): AppInfo {
        if (this.didSessionInfo == null) {
            this.didSessionInfo = this.dbAdapter.getAppInfo(this.getDIDSessionId());
        }
        return this.didSessionInfo;
    }

    public getBaseDataPath(): string {
        return this.basePathInfo.dataPath;
    }

    private async reInit(sessionLanguage: string) {
        // TODO curFragment = null;

        this.pathInfo = new AppPathInfo(this.getDIDDir());

        this.dbAdapter.setUserDBAdapter(this.pathInfo.databasePath);

        // If we have received an optional language info, we set the DID session language preference with it.
        // This is normally passed by the DID session app to force the initial session language
        if (sessionLanguage != null) {
            try {
                PreferenceManager.getSharedInstance().setPreference("locale.language", sessionLanguage);
            } catch (e) {
                Log.e(AppManager.LOG_TAG, e);
            }
        }

        await this.refreshInfos();
        this.getLauncherInfo();
        try {
            this.loadLauncher();
        }
        catch (e){
            Log.e(AppManager.LOG_TAG, e);
        }
        await this.refreshInfos();
        this.sendRefreshList("initiated", null, false);
    }

    private closeAll() {
        for (let appId of this.getRunningList()) {
            if (!this.isLauncher(appId)) {
                this.close(appId);
            }

        }

        /* TODO FragmentManager manager = activity.getSupportFragmentManager();
        for (Fragment fragment : manager.getFragments()) {
            manager.beginTransaction().remove(fragment).commit();
        }*/
    }

    private clean() {
        this.did = null;
        // TOOD this.curFragment = null;
        this.appList = null;
        this.lastList = new Array<string>();
        this.runningList = new Array<string>();
        this.visibles = new Map<string, boolean>();
        this.dbAdapter.setUserDBAdapter(null);

        this.pathInfo = this.basePathInfo;
    }
    /**
     * Signs in to a new DID session.
     */
    /*public signIn(sessionLanguage: string) {
        if (this.signIning) {
            this.signIning = false;
            this.closeDIDSession();
            await this.reInit(sessionLanguage);
        }
    }

    /**
     * Signs out from a DID session. All apps and services are closed, and launcher goes back to the DID session app prompt.
     */
    public signOut() {
        if (!this.signIning) {
            this.signIning = true;
            this.closeAll();
            this.clean();
            this.startDIDSession();
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

    public AppInfo getDIDSessionAppInfo() {
        if (diddessionInfo == null) {
            diddessionInfo = dbAdapter.getAppInfo(getDIDSessionId());
        }
        return diddessionInfo;
    }
*/
    public startDIDSession() {
        this.start(this.getDIDSessionId());
    }

    public closeDIDSession() {
        this.close(this.getDIDSessionId());

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
    }

    private void installBuiltInApp(String path, String id, int launcher) throws Exception {
        Log.d("AppManager", "Entering installBuiltInApp path="+path+" id="+id+" launcher="+launcher);

        path = path + id;
        InputStream input = getAssetsFile(path + "/manifest.json");
        if (input == null) {
            input = getAssetsFile(path + "/assets/manifest.json");
            if (input == null) {
                Log.e("AppManager", "No manifest found, returning");
                return;
            }
        }
        AppInfo builtInInfo = shareInstaller.parseManifest(input, launcher);

        AppInfo installedInfo = getAppInfo(id);
        Boolean needInstall = true;
        if (installedInfo != null) {
            boolean versionChanged = PreferenceManager.getShareInstance().versionChanged;
            if (versionChanged || builtInInfo.version_code > installedInfo.version_code) {
                Log.d("AppManager", "built in version > installed version: uninstalling installed");
                shareInstaller.unInstall(installedInfo, true);
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
            shareInstaller.copyAssetsFolder(path, basePathInfo.appsPath + builtInInfo.app_id);
            builtInInfo.built_in = 1;
            dbAdapter.addAppInfo(builtInInfo, true);
            if (launcher == 1) {
                launcherInfo = null;
                getLauncherInfo();
            }
        }
    }*/

    private saveLauncher() {
        /* TODO try {
            File launcher = new File(basePathInfo.appsPath, AppManager.LAUNCHER);
            if (launcher.exists()) {
                AppInfo info = shareInstaller.getInfoByManifest(basePathInfo.appsPath + AppManager.LAUNCHER + "/", 1);
                info.built_in = 1;
                int count = dbAdapter.removeAppInfo(launcherInfo, true);
                if (count < 1) {
                    Log.e("AppManager", "Launcher upgrade -- Can't remove the older DB info.");
                    //TODO:: need remove the files? now, restart will try again.
                    return;
                }
                shareInstaller.renameFolder(launcher, basePathInfo.appsPath, launcherInfo.app_id);
                dbAdapter.addAppInfo(info, true);
                launcherInfo = null;
                getLauncherInfo();
            }

            installBuiltInApp("www/", "launcher", 1);
        } catch (Exception e) {
            e.printStackTrace();
        }*/
    }

    private checkAndUpateDIDSession() {
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
                dbAdapter.addAppInfo(info, true);
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
    public saveBuiltInApps(){
        /* TODO AssetManager manager = activity.getAssets();
        try {
            String[] appdirs= manager.list("www/built-in");

            for (String appdir : appdirs) {
                installBuiltInApp("www/built-in/", appdir, 0);
            }

            for (int i = 0; i < appList.length; i++) {
                System.err.println("save / app "+appList[i].app_id+" buildin "+appList[i].built_in);
                if (appList[i].built_in != 1) {
                    continue;
                }

                boolean needChange = true;
                for (String appdir : appdirs) {
                    if (appdir.equals(appList[i].app_id)) {
                        needChange = false;
                        break;
                    }
                }
                if (needChange) {
                    dbAdapter.changeBuiltInToNormal(appList[i].app_id);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }*/
    }


    public setAppVisible(id: string, visible: string) {
        if (visible == "hide") {
            this.visibles.set(id, false);
        }
        else {
            this.visibles.set(id, true);
        }
    }
/*
    public Boolean getAppVisible(String id) {
        Boolean ret = visibles.get(id);
        if (ret == null) {
            return true;
        }
        return ret;
    }

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
        this.appInfos = new Map();
        for (let i = 0; i < this.appList.length; i++) {
            this.appInfos.set(this.appList[i].app_id, this.appList[i]);
            let visible = this.visibles.get(this.appList[i].app_id);
            if (visible == null) {
                this.setAppVisible(this.appList[i].app_id, this.appList[i].start_visible);
            }
        }
    }

    public getAppInfo(id: string): AppInfo {
        if (this.isDIDSession(id)) {
            return this.getDIDSessionAppInfo();
        }
        else if (this.isLauncher(id)) {
            return this.getLauncherInfo();
        }
        else {
            return this.appInfos.get(id);
        }
    }

   /* public HashMap<String, AppInfo> getAppInfos() {
        return appInfos;
    }

    public String getStartPath(AppInfo info) {
        if (info == null) {
            return null;
        }

        if (info.remote == 0) {
            return getAppUrl(info) + info.start_url;
        }
        else {
            return info.start_url;
        }
    }

    private String getAppLocalPath(AppInfo info) {
        String path = basePathInfo.appsPath;
        if (!info.share) {
            path = pathInfo.appsPath;
        }
        return path + info.app_id + "/";
    }

    public String getAppPath(AppInfo info) {
        if (info.remote == 0) {
            return getAppLocalPath(info);
        }
        else {
            return info.start_url.substring(0, info.start_url.lastIndexOf("/") + 1);
        }
    }

    public String getAppUrl(AppInfo info) {
        String url = getAppPath(info);
        if (info.remote == 0) {
            url = "file://" + url;
        }
        return url;
    }

    private String checkPath(String path) {
        File destDir = new File(path);
        if (!destDir.exists()) {
            destDir.mkdirs();
        }
        return path;
    }

    public String getDataPath(String id) {
        if (id == null) {
            return null;
        }

        if (isLauncher(id)) {
            id = getLauncherInfo().app_id;
        }

        return checkPath(pathInfo.dataPath + id + "/");
    }

    public String getDataUrl(String id) {
        return "file://" + getDataPath(id);
    }


    public String getTempPath(String id) {
        if (id == null) {
            return null;
        }

        if (isLauncher(id)) {
            id = getLauncherInfo().app_id;
        }
        return checkPath(pathInfo.tempPath + id + "/");
    }

    public String getTempUrl(String id) {
        return "file://" + getTempPath(id);
    }

    public String getConfigPath() {
        return pathInfo.configPath;
    }


    public String getIconUrl(AppInfo info, String iconSrc) {
        String url = "file://" + getAppLocalPath(info);
        return resetPath(url, iconSrc);
    }

    public String[] getIconUrls(AppInfo info) {
        String[] iconPaths = new String[info.icons.size()];
        for (int i = 0; i < info.icons.size(); i++) {
            iconPaths[i] = getIconUrl(info, info.icons.get(i).src);
        }
        return iconPaths;
    }

    public String resetPath(String dir, String origin) {
        if (origin.indexOf("http://") != 0 && origin.indexOf("https://") != 0
                && origin.indexOf("file:///") != 0) {
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
        close(id);
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

    public void switchContent(WebViewFragment fragment, String id) {
        FragmentManager manager = activity.getSupportFragmentManager();
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
        lastList.add(0, id);
    }

    private void hideFragment(WebViewFragment fragment, String id) {
        FragmentManager manager = activity.getSupportFragmentManager();
        FragmentTransaction transaction = manager.beginTransaction();
        if (!fragment.isAdded()) {
            transaction.add(R.id.content, fragment, id);
        }
        transaction.hide(fragment);
        transaction.commit();

        runningList.add(0, id);
        lastList.add(1, id);
    }

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
    public start(id: string) {
        let info = this.getAppInfo(id);
        if (info == null) {
            throw new Error("No such app!");
        }

        /* TODO WebViewFragment fragment = getFragmentById(id);
        if (fragment == null) {
            fragment = WebViewFragment.newInstance(id);
            if (!isLauncher(id)) {
                sendRefreshList("started", info, false);
            }

            if (!getAppVisible(id)) {
                showActivityIndicator(true);
                hideFragment(fragment, id);
            }
        }

        if (getAppVisible(id)) {
            switchContent(fragment, id);
            showActivityIndicator(false);
        }*/
    }

  /*  private void showActivityIndicator(boolean show) {
        activity.runOnUiThread((Runnable) () -> {
            if (curFragment.titlebar != null) {
                if (show) {
                    curFragment.titlebar.showActivityIndicator(TitleBarActivityType.LAUNCH, activity.getResources().getString(R.string.app_starting));
                } else {
                    curFragment.titlebar.hideActivityIndicator(TitleBarActivityType.LAUNCH);
                }
            }
        });
    }*/

    public close(id: string) {
        if (this.isLauncher(id)) {
            throw new Error("Launcher can't close!");
        }

        let info = this.getAppInfo(id);
        if (info == null) {
            throw new Error("No such app!");
        }

        this.setAppVisible(id, info.start_visible);

        /* TODO FragmentManager manager = activity.getSupportFragmentManager();
        WebViewFragment fragment = getFragmentById(id);
        if (fragment == null) {
            return;
        }

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

        FragmentTransaction transaction = manager.beginTransaction();
        transaction.remove(fragment);
        transaction.commit();
        lastList.remove(id);
        runningList.remove(id);

        sendRefreshList("closed", info, false);*/
    }

    public loadLauncher() {
        this.start(AppManager.LAUNCHER);
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
    }

    public void setLauncherReady() {
        launcherReady = true;

        for (int i = 0; i < installUriList.size(); i++) {
            InstallInfo info = installUriList.get(i);
            sendInstallMsg(info.uri);
        }

        for (int i = 0; i < intentUriList.size(); i++) {
            Uri uri = intentUriList.get(i);
            IntentManager.getShareInstance().doIntentByUri(uri);
        }
    }
*/
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

        /* TODO WebViewFragment fragment = getFragmentById(toId);
        if (fragment != null) {
            fragment.basePlugin.onReceive(msg, type, fromId);
        }
        else if (!isLauncher(toId)){
            throw new Exception(toId + " isn't running!");
        }*/
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