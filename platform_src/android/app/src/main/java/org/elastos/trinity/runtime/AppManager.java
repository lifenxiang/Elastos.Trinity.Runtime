 /*
  * Copyright (c) 2018 Elastos Foundation
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in all
  * copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  * SOFTWARE.
  */

package org.elastos.trinity.runtime;

import android.app.AlertDialog;
//import android.app.FragmentManager;
//import android.app.FragmentTransaction;
import android.content.DialogInterface;
import android.content.res.AssetManager;
import android.content.res.Configuration;
import android.net.Uri;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;

import org.apache.cordova.LOG;
import org.apache.cordova.PluginManager;
import org.elastos.trinity.runtime.contactnotifier.ContactNotifier;
import org.elastos.trinity.runtime.didsessions.DIDSessionManager;
import org.elastos.trinity.runtime.didsessions.IdentityEntry;
import org.elastos.trinity.runtime.titlebar.TitleBarActivityType;
import org.json.JSONException;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;

public class AppManager {
    private static final String TAG = "AppManager";

    /**
     * The internal message
     */
    public static final int MSG_TYPE_INTERNAL = 1;
    /**
     * The internal return message.
     */
    public static final int MSG_TYPE_IN_RETURN = 2;
    /**
     * The internal refresh message.
     */
    public static final int MSG_TYPE_IN_REFRESH = 3;
    /**
     * The installing message.
     */
    public static final int MSG_TYPE_INSTALLING = 4;

    /**
     * The external message
     */
    public static final int MSG_TYPE_EXTERNAL = 11;
    /**
     * The external launcher message
     */
    public static final int MSG_TYPE_EX_LAUNCHER = 12;
    /**
     * The external install message
     */
    public static final int MSG_TYPE_EX_INSTALL = 13;
    /**
     * The external return message.
     */
    public static final int MSG_TYPE_EX_RETURN = 14;


    public static final String LAUNCHER = "launcher";
    public static final String DIDSESSION = "didsession";

    /** The app mode. */
    public static final String STARTUP_APP = "app";
    /** The service mode. */
    public static final String STARTUP_SERVICE = "service";
    /** The intent mode. It will be closed after sendIntentResponse */
    public static final String STARTUP_INTENT = "intent";
    /** The silence intent mode. It will be closed after sendIntentResponse */
    public static final String STARTUP_SILENCE = "silence";

    final static String[] startupModes = {
            STARTUP_APP,
            STARTUP_SERVICE,
            STARTUP_INTENT,
            STARTUP_SILENCE
    };

    private static AppManager appManager;
    public WebViewActivity activity;
    public WebViewFragment curFragment = null;
    MergeDBAdapter dbAdapter = null;


    private AppPathInfo basePathInfo = null;
    private AppPathInfo pathInfo = null;

    //    private AppInfo didsessionAppInfo = null;
    private Boolean signIning = true;
    private String did = null;

    private AppInstaller shareInstaller = new AppInstaller();

    protected LinkedHashMap<String, AppInfo> appInfos;
    private ArrayList<String> lastList = new ArrayList<String>();
    private ArrayList<String> runningList = new ArrayList<String>();
    private ArrayList<String> serviceRunningList = new ArrayList<String>();
    public AppInfo[] appList;
    protected LinkedHashMap<String, Boolean> visibles = new LinkedHashMap<String, Boolean>();

    private AppInfo launcherInfo;
    private AppInfo diddessionInfo;
    private AppInfo nativeAppInfo;

    private class InstallInfo {
        String uri;
        boolean dev;

        InstallInfo(String uri, boolean dev) {
            this.uri = uri;
            this.dev = dev;
        }
    }

    private ArrayList<InstallInfo> installUriList = new ArrayList<InstallInfo>();
    private ArrayList<Uri> intentUriList = new ArrayList<Uri>();
    private boolean launcherReady = false;

    final static String[] defaultPlugins = {
            "AppManager",
            "StatusBar",
            "Clipboard",
            "TitleBarPlugin"
    };

    class AppPathInfo {
        public String appsPath = null;
        public String dataPath = null;
        public String configPath = null;
        public String tempPath = null;
        public String databasePath = null;

        AppPathInfo(String basePath) {
            String baseDir = activity.getFilesDir().toString();
            if (basePath != null) {
                baseDir = baseDir + "/" + basePath;
            }
            appsPath = baseDir + "/apps/";
            dataPath = baseDir + "/data/";
            configPath = baseDir + "/config/";
            tempPath = baseDir + "/temp/";
            databasePath = baseDir + "/database/";

            File destDir = new File(appsPath);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
            destDir = new File(dataPath);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
            destDir = new File(configPath);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
            destDir = new File(tempPath);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
            destDir = new File(databasePath);
            if (!destDir.exists()) {
                destDir.mkdirs();
            }
        }
    }

    AppManager(WebViewActivity activity) {
        AppManager.appManager = this;
        this.activity = activity;

        // Define a better cordova log level during development of core features
        LOG.setLogLevel(LOG.DEBUG);

        basePathInfo = new AppPathInfo(null);
        pathInfo = basePathInfo;

        dbAdapter = new MergeDBAdapter(activity);

        shareInstaller.init(basePathInfo.appsPath, basePathInfo.tempPath);

        refreashInfos();
        getLauncherInfo();
        saveLauncher();
        checkAndUpateDIDSession();
        saveBuiltInApps();
        refreashInfos();

        // Apply theming for native popups
        boolean darkMode = PreferenceManager.getShareInstance().getBooleanValue("ui.darkmode", false);
        UIStyling.prepare(darkMode);

        if (!ConfigManager.getShareInstance().isNativeBuild()) {
            IdentityEntry entry = null;
            try {
                entry = DIDSessionManager.getSharedInstance().getSignedInIdentity();
            } catch (Exception e) {
                e.printStackTrace();
            }

            if (entry != null) {
                signIning = false;
                did = entry.didString;
                reInit(null);
            } else {
                try {
                    startDIDSession();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
        else {
            did = "dappasnativedid"; // Simulate a DID context for the native app

            try {
                // Will start the native app
                reInit(null);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        if (PreferenceManager.getShareInstance().getDeveloperMode()) {
//            CLIService.getShareInstance().start();
        }
    }

    public static AppManager getShareInstance() {
        return AppManager.appManager;
    }

    public static boolean isStartupMode(String startupMode) {
        for(String mode:startupModes) {
            if (mode.equals(startupMode)) {
                return true;
            }
        }
        return false;
    }

    public String getBaseDataPath() {
        return basePathInfo.dataPath;
    }

    private void reInit(String sessionLanguage) {
        curFragment = null;

        pathInfo = new AppPathInfo(getDIDDir(did));

        dbAdapter.setUserDBAdapter(pathInfo.databasePath);

        // If we have received an optional language info, we set the DID session language preference with it.
        // This is normally passed by the DID session app to force the initial session language
        if (sessionLanguage != null) {
            try {
                PreferenceManager.getShareInstance().setPreference("locale.language", sessionLanguage);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        refreashInfos();
        getLauncherInfo();
        try {
            if (!ConfigManager.getShareInstance().isNativeBuild())
                loadLauncher();
            else
                start(getNativeAppPackageId(), STARTUP_APP, null);
        }
        catch (Exception e){
            e.printStackTrace();
        }
        refreashInfos();
        startStartupServices();
        sendRefreshList("initiated", null, false);

        // No contact notifier in native mode.
        if (!ConfigManager.getShareInstance().isNativeBuild()) {
            try {
                ContactNotifier.getSharedInstance(activity, did);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void startStartupServices() {
        final int FIRST_SERVICE_START_DELAY = 5000;
        final int DELAY_BETWEEN_EACH_SERVICE = 5000;

        Log.d(TAG, "Starting startup services");

        // Start services one after another, with an arbitrary (for now, to keep things simple) delay between starts
        int nextDelay = FIRST_SERVICE_START_DELAY;
        for (AppInfo info : appList) {
            Log.d(TAG, "Startup service - checking if app "+info.app_id+" has services to start");
            for (AppInfo.StartupService service : info.startupServices) {
                Log.d(TAG, "Startup service - App "+info.app_id+" - starting service "+service.name);
                new Handler().postDelayed(() -> {
                    try {
                        Log.d(TAG, "Startup service - App "+info.app_id+" - service "+service.name + " - before start");
                        start(info.app_id, STARTUP_SERVICE, service.name);
                        Log.d(TAG, "Startup service - App "+info.app_id+" - service "+service.name + " - after start");
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }, nextDelay);
                nextDelay += DELAY_BETWEEN_EACH_SERVICE;
            }
        }

        Log.d(TAG, "Finished starting startup services");
    }

    private void closeAllApps() throws Exception {
        for (String appId : getRunningList()) {
            if (!isLauncher(appId)) {
                closeAllModes(appId);
            }
        }

        FragmentManager manager = activity.getSupportFragmentManager();
        for (Fragment fragment : manager.getFragments()) {
            manager.beginTransaction().remove(fragment).commit();
        }
    }

    private void clean() {
        did = null;
        curFragment = null;
        appList = null;
        lastList = new ArrayList<String>();
        runningList = new ArrayList<String>();
        serviceRunningList = new ArrayList<String>();
        visibles = new LinkedHashMap<String, Boolean>();
        dbAdapter.setUserDBAdapter(null);

        pathInfo = basePathInfo;
    }
    /**
     * Signs in to a new DID session.
     */
    public void signIn(String sessionLanguage) throws Exception {
        if (signIning) {
            signIning = false;
            closeDIDSession();
            reInit(sessionLanguage);
        }
    }

    /**
     * Signs out from a DID session. All apps and services are closed, and launcher goes back to the DID session app prompt.
     */
    public void signOut() throws Exception {
        if (!signIning) {
            signIning = true;
            closeAllApps();
            clean();
            startDIDSession();
        }
    }

    public boolean isSignIning() {
        return signIning;
    }

    public String getDIDSessionId() {
        return "org.elastos.trinity.dapp.didsession";
    }
    public boolean isDIDSession(String appId) {
        return appId.equals("didsession") || appId.equals(getDIDSessionId());
    }

    public String getNativeAppPackageId() {
        return ConfigManager.getShareInstance().getStringValue("native.startup.dapppackage", "");
        //return "org.elastos.trinity.dapp.wallet";
        //return "org.elastos.trinity.dapp.did";
        //return "org.elastos.trinity.dapp.passwordmanager";
        //return "org.elastos.trinity.dapp.settings";
        //return "tech.tuum.academy";
        //return "com.hyper.messenger";
        //return "org.elastos.trinity.launcher";
        //return "org.elastos.trinity.dapp.didsession";
    }

    public AppInfo getNativeAppInfo() {
        if (nativeAppInfo == null)
            nativeAppInfo = dbAdapter.getAppInfo(getNativeAppPackageId());
        return nativeAppInfo;
    }

    public AppInfo getDIDSessionAppInfo() {
        if (diddessionInfo == null) {
            diddessionInfo = dbAdapter.getAppInfo(getDIDSessionId());
        }
        return diddessionInfo;
    }

    public void startDIDSession() throws Exception{
        start(getDIDSessionId(), STARTUP_APP, null);
    }

    public void closeDIDSession() throws Exception {
        close(getDIDSessionId(), STARTUP_APP, null);

        IdentityEntry entry = DIDSessionManager.getSharedInstance().getSignedInIdentity();
        did = entry.didString;
    }

    public String getDID() {
        return did;
    }

    public String getDIDDir(String did) {
        if (did != null) {
            did = did.replace(":", "_");
        }
        return did;
    }

    public AppPathInfo getPathInfo(String did) {
        return new AppPathInfo(getDIDDir(did));
    }

    public MergeDBAdapter getDBAdapter() {
        return dbAdapter;
    }

    private InputStream getAssetsFile(String path) {
        InputStream input = null;

        AssetManager manager = activity.getAssets();
        try {
            input = manager.open(path);
        }
        catch (IOException e) {
            Log.e(TAG, "open " + path + " error: " + e.getLocalizedMessage());
        }

        return input;
    }

    private void installBuiltInApp(String path, String id, int launcher) throws Exception {
        Log.d(TAG, "Entering installBuiltInApp path="+path+" id="+id+" launcher="+launcher);

        path = path + id;
        InputStream input = getAssetsFile(path + "/assets/manifest.json");
        if (input == null) {
            input = getAssetsFile(path + "/manifest.json");
            if (input == null) {
                Log.e(TAG, "Can't find manifest.json in / or /assets/, do not install this dapp");
                return;
            }
        }
        AppInfo builtInInfo = shareInstaller.parseManifest(input, launcher);

        AppInfo installedInfo = getAppInfo(id);
        Boolean needInstall = true;
        if (installedInfo != null) {
            boolean versionChanged = PreferenceManager.getShareInstance().versionChanged;
            if (versionChanged || builtInInfo.version_code > installedInfo.version_code) {
                Log.d(TAG, "built in version > installed version: uninstalling installed");
                shareInstaller.unInstall(installedInfo, true);
            }
            else {
                Log.d(TAG, "Built in version <= installed version, No need to install");
                needInstall = false;
            }
        }
        else {
            Log.d(TAG, "No installed info found");
        }

        if (needInstall) {
            Log.d(TAG, "Needs install - copying assets and setting built-in to 1");
            shareInstaller.copyAssetsFolder(path, basePathInfo.appsPath + builtInInfo.app_id);
            builtInInfo.built_in = 1;
            dbAdapter.addAppInfo(builtInInfo, true);
            if (launcher == 1) {
                launcherInfo = null;
                getLauncherInfo();
            }
        }
    }

    private void saveLauncher() {
        try {
            File launcher = new File(basePathInfo.appsPath, AppManager.LAUNCHER);
            if (launcher.exists()) {
                AppInfo info = shareInstaller.getInfoByManifest(basePathInfo.appsPath + AppManager.LAUNCHER + "/", 1);
                info.built_in = 1;
                int count = dbAdapter.removeAppInfo(launcherInfo, true);
                if (count < 1) {
                    Log.e(TAG, "Launcher upgrade -- Can't remove the older DB info.");
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
        }
    }

    private void checkAndUpateDIDSession() {
        try {
            File didsession = new File(basePathInfo.appsPath, AppManager.DIDSESSION);
            if (didsession.exists()) {
                AppInfo info = shareInstaller.getInfoByManifest(basePathInfo.appsPath + AppManager.DIDSESSION + "/", 0);
                info.built_in = 1;
                int count = dbAdapter.removeAppInfo(getDIDSessionAppInfo(), true);
                if (count < 1) {
                    Log.e(TAG, "Launcher upgrade -- Can't remove the older DB info.");
                    return;
                }
                shareInstaller.renameFolder(didsession, basePathInfo.appsPath, getDIDSessionId());
                dbAdapter.addAppInfo(info, true);
                diddessionInfo = null;
            }
        } catch (Exception e) {
            e.printStackTrace();
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
    public void saveBuiltInApps(){
        AssetManager manager = activity.getAssets();
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
        }
    }


    public void setAppVisible(String id, String visible) {
        if (visible.equals("hide")) {
            visibles.put(id, false);
        }
        else {
            visibles.put(id, true);
        }
    }

    public Boolean getAppVisible(String id, String startupMode) {
        if (startupMode.equals(STARTUP_SERVICE) || startupMode.equals(STARTUP_SILENCE)) {
            return false;
        }

        // In native mode, the native app is forced to start visible.
        if (id.equals(getNativeAppPackageId())) {
            return true;
        }

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
    }

    private void refreashInfos() {
        appList = dbAdapter.getAppInfos();
        appInfos = new LinkedHashMap();
        for (int i = 0; i < appList.length; i++) {
            appInfos.put(appList[i].app_id, appList[i]);
            Boolean visible = visibles.get(appList[i].app_id);
            if (visible == null) {
                setAppVisible(appList[i].app_id, appList[i].start_visible);
            }
        }
    }

    public AppInfo getAppInfo(String id) {
	    int index = id.indexOf("#");
        if (index != -1) {
            id = id.substring(0, index);
        }

        if (isDIDSession(id)) {
            return getDIDSessionAppInfo();
        }
        else if (isLauncher(id)) {
            return getLauncherInfo();
        }
        else {
            return appInfos.get(id);
        }
    }

    public HashMap<String, AppInfo> getAppInfos() {
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
        return getDataPath(id, pathInfo);
    }

    public String getDataPath(String id, AppPathInfo pathInfo) {
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
        return getTempPath(id, pathInfo);
    }

    public String getTempPath(String id, AppPathInfo pathInfo) {
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
    public AppInfo install(String url, boolean update, boolean fromCLI) throws Exception  {
        AppInfo info = shareInstaller.install(url, update);
        if (info != null) {
            refreashInfos();

            if (info.launcher == 1) {
                sendRefreshList("launcher_upgraded", info, fromCLI);
            }
            else {
                sendRefreshList("installed", info, fromCLI);

                // Trinity CLI: We have to inform user that he must restart to see his changes live.
                if (ConfigManager.getShareInstance().isNativeBuild())
                    Utility.alertPrompt("dApp updated", "dApp was updated from the CLI. Please kill and restart the native app.", activity);
            }
        }

        return info;
    }

    public void unInstall(String id, boolean update) throws Exception {
        closeAllModes(id);
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

    public WebViewFragment getFragmentById(String modeId) {
        if (isLauncher(modeId)) {
            modeId = LAUNCHER;
        }

        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();
        for (int i = 0; i < fragments.size(); i++) {
            Fragment fragment = fragments.get(i);
            if (fragment instanceof WebViewFragment) {
                WebViewFragment webViewFragment = (WebViewFragment)fragment;
                if (webViewFragment.modeId.equals(modeId)) {
                    return webViewFragment;
                }
            }
        }
        return null;
    }

    public void switchContent(WebViewFragment fragment, String id)  throws Exception {
        FragmentManager manager = activity.getSupportFragmentManager();
        FragmentTransaction transaction = manager.beginTransaction();
        if ((curFragment != null) && (curFragment != fragment)) {
            transaction.hide(curFragment);
            sendPackageIdMessage(curFragment.packageId, AppManager.MSG_TYPE_INTERNAL,
                    "{\"action\":\"hidden\"}", curFragment.modeId);
        }
        if (curFragment != fragment) {
            if (!fragment.isAdded()) {
                transaction.add(R.id.content, fragment, id);
            }
            else {
                transaction.setCustomAnimations(android.R.animator.fade_in, android.R.animator.fade_out)
                        .show(fragment);
                sendPackageIdMessage(fragment.packageId, AppManager.MSG_TYPE_INTERNAL,
                        "{\"action\":\"visible\"}", fragment.modeId);
            }
//            transaction.addToBackStack(null);
            transaction.commitAllowingStateLoss();
        }

        curFragment = fragment;

        runningList.remove(id);
        runningList.add(0, id);
        lastList.remove(id);
        lastList.add(0, id);
    }

    private void hideFragment(WebViewFragment fragment, String startupMode, String id) {
        FragmentManager manager = activity.getSupportFragmentManager();
        FragmentTransaction transaction = manager.beginTransaction();
        if (!fragment.isAdded()) {
            transaction.add(R.id.content, fragment, id);
        }
        transaction.hide(fragment);
        transaction.commitAllowingStateLoss();

        if (startupMode.equals(STARTUP_APP)) {
            runningList.add(0, id);
            lastList.add(1, id);
        }
        else if (startupMode.equals(STARTUP_SERVICE)) {
            serviceRunningList.add(0, id);
        }
    }

    Boolean isCurrentFragment(WebViewFragment fragment) {
        return (fragment == curFragment);
    }

    public boolean doBackPressed() {
        if (launcherInfo == null || curFragment == null || isLauncher(curFragment.modeId) || isDIDSession(curFragment.modeId)) {
            return true;
        }
        else {
            if ((curFragment != null)  && (curFragment.titlebar != null)) {
                curFragment.titlebar.handleOuterLeftClicked();
            } else {
                try {
                    switchContent(getFragmentById(launcherInfo.app_id), launcherInfo.app_id);
                    AppManager.getShareInstance().sendLauncherMessageMinimize(curFragment.modeId);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            return false;
        }
    }

    public String getIdbyStartupMode(String id, String mode, String serviceName) {
        if (!mode.equals(STARTUP_APP)) {
            id += "#" + mode;
            if (mode.equals(STARTUP_SERVICE) && (serviceName != null)) {
                id += ":" + serviceName;
            }
        }
        return id;
    }

    public void start(String packageId, String mode, String serviceName) throws Exception {
        AppInfo info = getAppInfo(packageId);
        if (info == null) {
            throw new Exception("No such app!");
        }

        if (mode.equals(STARTUP_SERVICE) && serviceName == null) {
            throw new Exception("No service name!");
        }

        String id = getIdbyStartupMode(packageId, mode, serviceName);
        WebViewFragment fragment = getFragmentById(id);
        if (fragment == null) {
            fragment = WebViewFragment.newInstance(packageId, mode, serviceName);
            if (!isLauncher(packageId)) {
                sendRefreshList("started", info, false);
            }

            if (mode.equals(STARTUP_INTENT)) {
                setAppVisible(id, "hide");
            }

            if (!getAppVisible(id, mode)) {
                if (mode.equals(STARTUP_APP) || mode.equals(STARTUP_INTENT)) {
                    showActivityIndicator(true);
                }
                hideFragment(fragment, mode, id);
            }
        }

        if (getAppVisible(id, mode)) {
            switchContent(fragment, id);
            showActivityIndicator(false);
        }
    }

    private void showActivityIndicator(boolean show) {
        activity.runOnUiThread((Runnable) () -> {
            if (curFragment != null && curFragment.titlebar != null) {
                if (show) {
                    curFragment.titlebar.showActivityIndicator(TitleBarActivityType.LAUNCH, activity.getResources().getString(R.string.app_starting));
                } else {
                    curFragment.titlebar.hideActivityIndicator(TitleBarActivityType.LAUNCH);
                }
            }
        });
    }

    public void closeAllModes(String packageId) {
        for(String mode: startupModes) {
            try {
                if (mode.equals(STARTUP_SERVICE)) {
                    closeAppAllServices(packageId);
                }
                else {
                    close(packageId, mode, null);
                }
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public void closeAppAllServices(String packageId) throws Exception {
        AppInfo info = getAppInfo(packageId);
        if (info == null) {
            throw new Exception("No such app!");
        }

        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();
        for (int i = 0; i < fragments.size(); i++) {
            Fragment fragment = fragments.get(i);
            if (fragment instanceof WebViewFragment) {
                WebViewFragment webViewFragment = (WebViewFragment)fragment;
                if (webViewFragment.modeId.startsWith(packageId + "#service:")) {
                    closeFragment(info, webViewFragment);
                }
            }
        }
    }

    public void closeAllServices() throws Exception {
        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();
        for (int i = 0; i < fragments.size(); i++) {
            Fragment fragment = fragments.get(i);
            if (fragment instanceof WebViewFragment) {
                WebViewFragment webViewFragment = (WebViewFragment)fragment;
                if (webViewFragment.modeId.contains("#service:")) {
                    String packageId = webViewFragment.packageId;
                    AppInfo info = getAppInfo(packageId);
                    closeFragment(info, webViewFragment);
                }
            }
        }
    }

    public void close(String id, String mode, String serviceName) throws Exception {
        if (isLauncher(id)) {
            throw new Exception("Launcher can't close!");
        }

        AppInfo info = getAppInfo(id);
        if (info == null) {
            throw new Exception("No such app!");
        }

        if (mode.equals(STARTUP_SERVICE) && serviceName == null) {
            throw new Exception("No service name!");
        }

        id = getIdbyStartupMode(id, mode, serviceName);
        if (mode.equals(STARTUP_APP)) {
            setAppVisible(id, info.start_visible);
        }
        else if (mode.equals(STARTUP_INTENT)) {
            setAppVisible(id, "hide");
        }

        WebViewFragment fragment = getFragmentById(id);
        if (fragment == null) {
            return;
        }
        closeFragment(info, fragment);
    }

    public void closeFragment(AppInfo info, WebViewFragment fragment) throws Exception {
        String id = fragment.modeId;
        String mode = fragment.startupMode;

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

        sendPackageIdMessage(fragment.packageId, AppManager.MSG_TYPE_INTERNAL,
                "{\"action\":\"closed\"}", fragment.modeId);

        FragmentManager manager = activity.getSupportFragmentManager();
        FragmentTransaction transaction = manager.beginTransaction();
        transaction.remove(fragment);
        transaction.commit();

        if (mode.equals(STARTUP_APP)) {
            lastList.remove(id);
            runningList.remove(id);
        }
        else if (mode.equals(STARTUP_SERVICE)) {
            serviceRunningList.remove(id);
        }

        sendRefreshList("closed", info, false);
    }

    public void loadLauncher() throws Exception {
        start(LAUNCHER, STARTUP_APP, null);
    }

    public void checkInProtectList(String uri) throws Exception {
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
            // Trinity native apps can update their EPKs directly if trinity is built in debug
            boolean forceTrinityNativeInstall = ConfigManager.getShareInstance().isNativeBuild() && BuildConfig.DEBUG;

            if (forceTrinityNativeInstall || (dev && PreferenceManager.getShareInstance().getDeveloperMode())) {
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

        if (launcherReady || ConfigManager.getShareInstance().isNativeBuild()) {
            // Did we receive an intent response? (contains "intentresponse" in the path, but no redirecturl, otherwise this could be the request intent, not the response)
            if (!uri.toString().contains("redirecturl") && uri.toString().contains("/intentresponse"))
                IntentManager.getShareInstance().onExternalIntentResponseReceived(uri);
            else
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

    public void sendPackageIdMessage(String packageId, int type, String msg, String fromId) throws Exception {
        FragmentManager manager = activity.getSupportFragmentManager();
        List<Fragment> fragments = manager.getFragments();
        for (int i = 0; i < fragments.size(); i++) {
            Fragment fragment = fragments.get(i);
            if (fragment instanceof WebViewFragment) {
                WebViewFragment webViewFragment = (WebViewFragment)fragment;
                if (webViewFragment.packageId.equals(packageId)) {
                    sendMessage(webViewFragment.modeId, type, msg, fromId);
                }
            }
        }
    }

    public void sendLauncherMessage(int type, String msg, String fromId) throws Exception {
        sendMessage(LAUNCHER, type, msg, fromId);
    }

    public void sendLauncherMessageMinimize(String fromId) throws Exception {
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
    }

    public void sendRefreshList(String action, AppInfo info, boolean fromCLI) {
        try {
            if (info != null) {
                sendLauncherMessage(MSG_TYPE_IN_REFRESH,
                        "{\"action\":\"" + action + "\", \"id\":\"" + info.app_id + "\" , \"name\":\"" + info.name + "\", \"debug\":" + fromCLI + "}", "system");
            }
            else {
                sendLauncherMessage( MSG_TYPE_IN_REFRESH,
                    "{\"action\":\"" + action + "\"}", "system");
            }
        }
        catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void sendMessage(String toId, int type, String msg, String fromId) throws Exception {
        if (signIning) return;

        WebViewFragment fragment = getFragmentById(toId);
        if (fragment != null) {
            fragment.basePlugin.onReceive(msg, type, fromId);
        }
        else if (!isLauncher(toId)){
            throw new Exception(toId + " isn't running!");
        }
    }

    public void broadcastMessage(int type, String msg, String fromId) {
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

    public AppInfo[] getAppInfoList() {
        return appList;
    }

    public String[] getRunningList() {
        String[] ids = new String[runningList.size()];
        return runningList.toArray(ids);
    }

    public String[] getServiceRunningList(String appId) {
        ArrayList<String> list = new ArrayList<String>();
        String prefix = appId + "#service:";
        for (String id: serviceRunningList) {
            if (id.startsWith(prefix)) {
                list.add(id.substring(prefix.length()));
            }
        }
        String[] ids = new String[list.size()];
        return list.toArray(ids);
    }

    public String[] getAllServiceRunningList() {
        String[] ids = new String[serviceRunningList.size()];
        return serviceRunningList.toArray(ids);
    }

    public String[] getLastList() {
        String[] ids = new String[lastList.size()];
        return lastList.toArray(ids);
    }

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
    }
}
