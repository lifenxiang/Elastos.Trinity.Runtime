import { join as pathJoin } from "path";
import { renameSync, statSync } from "fs-extra";
import { app } from "electron";

import { AppInfo} from "./AppInfo";
import { Utility, notImplemented } from "./Utility";
import { Log } from "./Log";
import { AppManager } from "./AppManager";
import { MergeDBAdapter } from "./MergeDBAdapter";
import { existsSync, readdirSync, mkdirSync, fstat, copyFileSync } from 'fs';

export class AppInstaller {
    pluginWhitelist = [
        "device",
        "networkstatus",
        "splashscreen",
    ];

    urlWhitelist = [
        "http://www.elastos.org/*"
    ];

    private appPath: string = null;
    private tempPath: string = null;
    private dbAdapter: MergeDBAdapter = null;
    private appManager: AppManager = null;

    public init(appPath: string, tempPath: string): boolean {
        this.appManager = AppManager.getSharedInstance();
        this.dbAdapter = this.appManager.getDBAdapter();
        this.appPath = appPath;
        this.tempPath = tempPath;

        // TODO random = new Random();

        return true;
    }

    /*
    private boolean unpackZip(InputStream srcZip, String destPath, boolean verifyDigest) throws Exception {
        ZipInputStream zis;
        MessageDigest md = null;
        TreeMap<String, String> digest_map = null;
        String filelist_sha = "";

        try
        {
            if (verifyDigest) {
                md = MessageDigest.getInstance("SHA-256");
                digest_map = new TreeMap<String, String>();
            }
            String filepath;
            zis = new ZipInputStream(new BufferedInputStream(srcZip));
            ZipEntry ze;
            byte[] buffer = new byte[1024];
            int count;

            while ((ze = zis.getNextEntry()) != null) {
                String entry_name = ze.getName();
                filepath = destPath + entry_name;

                if (ze.isDirectory()) {
                    File fmd = new File(filepath);
                    fmd.mkdirs();
                }
                else {
                    File file = new File(filepath);
                    file.getParentFile().mkdirs();

                    FileOutputStream fout = new FileOutputStream(file);

                    if (verifyDigest && !entry_name.startsWith("EPK-SIGN/")) {
                        md.reset();
                    }
                    while ((count = zis.read(buffer)) != -1) {
                        if (verifyDigest) {
                            if (!entry_name.startsWith("EPK-SIGN/")) {
                                md.update(buffer, 0, count);
                            } else if (entry_name.equals("EPK-SIGN/FILELIST.SHA")) {
                                filelist_sha = new String(buffer, 0, count);
                            }
                        }
                        fout.write(buffer, 0, count);
                    }
                    if (verifyDigest && !entry_name.startsWith("EPK-SIGN/")) {
                        byte[] digest = md.digest();
                        StringBuilder sb = new StringBuilder(2 * digest.length);
                        for (byte b : digest) {
                            sb.append("0123456789abcdef".charAt((b & 0xF0) >> 4));
                            sb.append("0123456789abcdef".charAt((b & 0x0F)));
                        }
                        String hex = sb.toString();
                        digest_map.put(entry_name, hex);
                    }

                    fout.close();
                }
                zis.closeEntry();
            }

            zis.close();

            if (verifyDigest) {
                StringBuilder filelist_inf = new StringBuilder();
                md.reset();
                for (String file : digest_map.keySet()) {
                    filelist_inf.append(digest_map.get(file) + " " + file + "\n");
                }
                md.update(filelist_inf.toString().getBytes("UTF-8"));

                byte[] digest = md.digest();
                StringBuilder sb = new StringBuilder(2 * digest.length);
                for (byte b : digest) {
                    sb.append("0123456789abcdef".charAt((b & 0xF0) >> 4));
                    sb.append("0123456789abcdef".charAt((b & 0x0F)));
                }
                String hex = sb.toString();
                if (!hex.equals(filelist_sha)) {
                    // Verify digest failed!
                    throw new Exception("Failed to verify EPK digest!");
                }
            }
        }
        catch(IOException e) {
            e.printStackTrace();
            return false;
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return false;
        }

        return true;
    }

    private boolean downloadDAppPackage(String url, String destFile) throws Exception {
        BufferedInputStream in = new BufferedInputStream(new URL(url).openStream());
        FileOutputStream fileOutputStream = new FileOutputStream(destFile);
        byte dataBuffer[] = new byte[1024];
        int bytesRead;
        while ((bytesRead = in.read(dataBuffer, 0, 1024)) != -1) {
            fileOutputStream.write(dataBuffer, 0, bytesRead);
        }
        return true;
    }

    private void deleteDAppPackage(String packagePath) {
        if (packagePath != null && !packagePath.isEmpty()) {
            File file = new File(packagePath);
            file.delete();
        }
    }
    */

    public copyAssetsFolder(relativeSrcPath: string, dest: string) {   
        //console.log("copyAssetsFolder: "+relativeSrcPath+" ||| "+dest);

        let fullSrcPath = pathJoin(app.getAppPath(), relativeSrcPath);
        let srcInfo = statSync(fullSrcPath);

        if (srcInfo.isDirectory()) {
            let fileNames = readdirSync(fullSrcPath);

            if (fileNames.length > 0) {
                if (existsSync(dest)) {
                    this.deleteAllFiles(dest);
                }
                mkdirSync(dest, {recursive: true});
                for (let fileName of fileNames) {
                    this.copyAssetsFolder(relativeSrcPath + "/" + fileName, dest + "/" + fileName);
                }
            }
        }
        else {
            copyFileSync(pathJoin(app.getAppPath(), relativeSrcPath), dest)
        }
    }

    /*
    private static String convertStreamToString(InputStream is) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(is));
        StringBuilder sb = new StringBuilder();
        final int buffer_size = 1024;
        char[] cstr = new char[buffer_size];
        int read_count;
        while ((read_count = reader.read(cstr, 0, buffer_size)) != -1) {
            sb.append(cstr, 0, read_count);
        }
        reader.close();
        return sb.toString();
    }

    private static String getStringFromFile(String filePath) {
        try {
            File fl = new File(filePath);
            FileInputStream fin = null;
            fin = new FileInputStream(fl);
            String ret = convertStreamToString(fin);
            fin.close();
            return ret;
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private void updateAppInfo(AppInfo info, AppInfo oldInfo) {
        for (AppInfo.PluginAuth auth : info.plugins) {
            for (AppInfo.PluginAuth oldAuth : oldInfo.plugins) {
                if (auth.plugin.equals(oldAuth.plugin)) {
                    auth.authority = oldAuth.authority;
                }
            }
        }

        for (AppInfo.UrlAuth auth : info.urls) {
            for (AppInfo.UrlAuth oldAuth : oldInfo.urls) {
                if (auth.url.equals(oldAuth.url)) {
                    auth.authority = oldAuth.authority;
                }
            }
        }

        info.built_in = oldInfo.built_in;
        info.launcher = oldInfo.launcher;
    }*/

    public renameFolder(fromPath: string, path: string, name: string) {
        let to = pathJoin(path, name);
        if (existsSync(to)) {
            this.deleteAllFiles(to);
            to = pathJoin(path, name);
        }

        renameSync(fromPath, to);
    }

    /*private void sendInstallingMessage(String action, String appId, String url) throws Exception {
        AppManager.getShareInstance().sendLauncherMessage(AppManager.MSG_TYPE_INSTALLING,
                "{\"action\":\"" + action + "\", \"id\":\"" + appId + "\" , \"url\":\"" + url + "\"}", "system");
    }

    public AppInfo getInfoFromUrl(String url) throws Exception {
        InputStream inputStream = null;
        AppInfo info = null;

        if (url.startsWith("asset://")) {
            AssetManager manager = context.getAssets();
            String substr = url.substring(9);
            inputStream = manager.open(substr);
        }
        else if (url.startsWith("content://")) {
            Uri uri = Uri.parse(url);
            inputStream = context.getContentResolver().openInputStream(uri);
        }
        else {
            if (url.startsWith("file://")) {
                url = url.substring(7);
            }
            inputStream = new FileInputStream(url);
        }

        String temp = "tmp_" + random.nextInt();
        String path = tempPath + temp + "/";

        File fmd = new File(path);
        if (fmd.exists()) {
            deleteAllFiles(fmd);
        }
        fmd.mkdirs();

        if (!unpackZip(inputStream, path, false)) {
            throw new Exception("Failed to unpack EPK!");
        }

        info = getInfoByManifest(path, 0);
        deleteAllFiles(fmd);

        if (info == null || info.app_id == null) {
            throw new Exception("Get app info error!");
        }

        return info;
    }

    public AppInfo install(String url, boolean update) throws Exception {
        Log.d("AppInstaller", "Install url="+url+" update="+update);
        InputStream inputStream = null;
        AppInfo info = null;
        String downloadPkgPath = null;
        String originUrl = url;

        sendInstallingMessage("start", "", originUrl);

        if (url.startsWith("asset://")) {
            AssetManager manager = context.getAssets();
            String substr = url.substring(9);
            inputStream = manager.open(substr);
        }
        else if (url.startsWith("content://")) {
            Uri uri = Uri.parse(url);
            inputStream = context.getContentResolver().openInputStream(uri);
        }
        else if (url.startsWith("http://") || url.startsWith("https://")) {
            downloadPkgPath = appPath + "tmp_" + random.nextInt() + ".epk";
            if (downloadDAppPackage(url, downloadPkgPath)) {
                inputStream = new FileInputStream(downloadPkgPath);
            }
        }
        else {
            if (url.startsWith("file://")) {
                url = url.substring(7);
            }
            inputStream = new FileInputStream(url);
        }

        String temp = "tmp_" + random.nextInt();
        String path = appPath + temp + "/";

        File fmd = new File(path);
        if (fmd.exists()) {
            deleteAllFiles(fmd);
        }
        fmd.mkdirs();

        boolean verifyDigest = PreferenceManager.getShareInstance().getDeveloperInstallVerify();
        if (!unpackZip(inputStream, path, verifyDigest)) {
            deleteDAppPackage(downloadPkgPath);
            throw new Exception("Failed to unpack EPK!");
        }

        sendInstallingMessage("unpacked", "", originUrl);

        if (verifyDigest) {
            // Verify the signature of the EPK

            String did_url = getStringFromFile(path + "EPK-SIGN/SIGN.DIDURL");
            String public_key = getStringFromFile(path + "EPK-SIGN/SIGN.PUB");
            String payload = getStringFromFile(path + "EPK-SIGN/FILELIST.SHA");
            String signed_payload = getStringFromFile(path + "EPK-SIGN/FILELIST.SIGN");

            if (did_url != null && public_key != null && payload != null && signed_payload != null &&
                    DIDVerifier.verify(did_url, public_key, payload, signed_payload)) {
                // Successfully verify the DID signature.
                Log.d("AppInstaller", "The EPK was signed by (DID URL): " + did_url);
            }
            else {
                // Failed to verify the DID signature.
                deleteDAppPackage(downloadPkgPath);
                throw new Exception("Failed to verify EPK DID signature!");
            }

            Log.d("AppInstaller", "The EPK was signed by (Public Key): " + public_key);
            sendInstallingMessage("verified", "", originUrl);
        }

        info = getInfoByManifest(path, 0);
        File from = new File(appPath, temp);
        if (info == null || info.app_id == null) {
            deleteAllFiles(from);
            deleteDAppPackage(downloadPkgPath);
            throw new Exception("Get app info error!");
        }

        AppManager appManager = AppManager.getShareInstance();
        AppInfo oldInfo = appManager.getAppInfo(info.app_id);
        if (oldInfo != null) {
            if (update) {
                Log.d("AppInstaller", "install() - uninstalling "+info.app_id+" - update = true");
                if (oldInfo.launcher != 1 && !appManager.isDIDSession(oldInfo.app_id)) {
                    AppManager.getShareInstance().unInstall(info.app_id, true);
                    sendInstallingMessage("uninstalled_old", info.app_id, originUrl);
                }
            }
            else {
                Log.d("AppInstaller", "install() - update = false - deleting all files");
                deleteAllFiles(from);
                deleteDAppPackage(downloadPkgPath);
                throw new Exception("App '" + info.app_id + "' already existed!");
            }
            updateAppInfo(info, oldInfo);
        }
        else {
            Log.d("AppInstaller", "install() - No old info - nothing to uninstall or delete");
            info.built_in = 0;
        }

        if (oldInfo != null && oldInfo.launcher == 1) {
            renameFolder(from, appPath, AppManager.LAUNCHER);
        }
        else if (oldInfo != null && appManager.isDIDSession(oldInfo.app_id)) {
            renameFolder(from, appPath, AppManager.DIDSESSION);
        }
        else {
            renameFolder(from, appPath, info.app_id);
            dbAdapter.addAppInfo(info, true);
        }
        deleteDAppPackage(downloadPkgPath);
        sendInstallingMessage("finish", info.app_id, originUrl);

        return info;
    }*/

    public deleteAllFiles(root: string): boolean {
        //console.log("NOT IMPLEMENTED - deleteAllFiles")
        /*if (!root.exists()) {
            return false;
        }

        Log.d("AppInstaller", "Delete all files at "+root.getAbsolutePath());

        File files[] = root.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isFile() && f.exists()) {
                    f.delete();
                }
                else {
                    deleteAllFiles(f);
                }
            }
        }

        root.delete();
*/
        return true;
    }

    public install(url: string, update: boolean): AppInfo {
        return null;
    }

    public getInfoFromUrl(uri: string): AppInfo {
        return null;
    }

    public unInstall(info: AppInfo, update: boolean) {
        /* TODO if (info == null) {
            throw new Error("No such app!");
        }

        Log.d("AppInstaller", "unInstall for "+info.app_id);

//        if (info.built_in == 1) {
//            throw new Exception("App is a built in!");
//        }
        let count = this.dbAdapter.removeAppInfo(info, true);
        if (count < 1) {
            throw new Error("Databashe error!");
        }

        File root = new File(appPath + info.app_id);
        this.deleteAllFiles(root);
        if (!update) {
            Log.d("AppInstaller", "unInstall() - update = false - deleting all files");
            root = new File(appManager.getDataPath(info.app_id));
            this.deleteAllFiles(root);
            root = new File(appManager.getTempPath(info.app_id));
            this.deleteAllFiles(root);
        }*/
    }

    private isAllowPlugin(name: string): boolean {
        let pluginName = name.toLowerCase();
        for (let item of this.pluginWhitelist) {
            if (item == pluginName) {
                return true;
            }
        }
        return false;
    }

    private isAllowUrl(url: string): boolean {
        url = url.toLowerCase();
        for (let item of this.urlWhitelist) {
            if (item == url) {
                return true;
            }
        }
        return false;
    }

    public getInfoByManifest(path: string, launcher: number): AppInfo {
        let manifestPath = pathJoin(path, "manifest.json");
        if (!existsSync(manifestPath)) {
            path = path + "assets/";
            manifestPath = path + "manifest.json";
            if (!existsSync(manifestPath)) {
                throw new Error("File 'manifest.json' doesn't exist!");
            }
        }
        let input = require(manifestPath);
        let info = this.parseManifest(input, launcher);
        manifestPath = path + "manifest.i18n";
        if (existsSync(manifestPath)) {
            input = require(manifestPath);
            this.parseManifestLocale(input, info);
        }
        return info;
    }

    private getMustStrValue(json: any, name: string): string{
        if (name in json) {
            return json[name] as string;
        } else {
            throw new Error("Parse Manifest.json error: '" + name + "' no exist!");
        }
    }

    private getMustIntValue(json: any, name: string): number {
        if (name in json) {
            return json[name] as number;
        } else {
            throw new Error("Parse Manifest.json error: '" + name + "' no exist!");
        }
    }

    public parseManifest(inputStream: Object, launcher: number): AppInfo {
        let appInfo = new AppInfo();

        let json = Utility.getJsonFromFile(inputStream);

        //Must
        appInfo.app_id = this.getMustStrValue(json, "id");
        appInfo.version = this.getMustStrValue(json, AppInfo.VERSION);
        appInfo.version_code = this.getMustIntValue(json, AppInfo.VERSION_CODE);
        appInfo.name = this.getMustStrValue(json, AppInfo.NAME);
        appInfo.start_url = this.getMustStrValue(json, AppInfo.START_URL);
        if (appInfo.start_url.indexOf("://") != -1) {
            appInfo.remote = 1;
        }
        else {
            appInfo.remote = 0;
        }

        if (!launcher) {
            if ("icons" in json) {
                let array = json["icons"] as any[];
                for (let i = 0; i < array.length; i++) {
                    let icon = array[i];
                    let src = icon[AppInfo.SRC];
                    let sizes = icon[AppInfo.SIZES];
                    let type = icon[AppInfo.TYPE];
                    appInfo.addIcon(src, sizes, type);
                }
            } else {
                throw new Error("Parse Manifest.json error: 'icons' no exist!");
            }
        }

        // Optional
        if (AppInfo.START_VISIBLE in json) {
            appInfo.start_visible = json[AppInfo.START_VISIBLE] as string;
        }
        else {
            appInfo.start_visible = "show";
        }

        if (AppInfo.SHORT_NAME in json) {
            appInfo.short_name = json[AppInfo.SHORT_NAME] as string;
        }

        if (AppInfo.DESCRIPTION in json) {
            appInfo.description = json[AppInfo.DESCRIPTION] as string;
        }

        if (AppInfo.DEFAULT_LOCAL in json) {
            appInfo.default_locale = json[AppInfo.DEFAULT_LOCAL] as string;
        }
        else {
            appInfo.default_locale = "en";
        }

        if (AppInfo.TYPE in json) {
            appInfo.type = json[AppInfo.TYPE] as string;
        }
        else {
            appInfo.type = "app";
        }

        if ("author" in json) {
            let author = json["author"];
            if ("name" in author) {
                appInfo.author_name = author["name"] as string;
            }
            if ("email" in author) {
                appInfo.author_email = author["email"] as string;
            }
        }

        if (AppInfo.CATEGORY in json) {
            appInfo.category = json[AppInfo.CATEGORY] as string;
        }
        else {
            appInfo.category = "other";
        }

        if (AppInfo.KEY_WORDS in json) {
            appInfo.key_words = json[AppInfo.KEY_WORDS] as string;
        }
        else {
            appInfo.key_words = "";
        }

        if ("plugins" in json) {
            let array = json["plugins"] as Array<string>;
            for (let i = 0; i < array.length; i++) {
                let plugin = array[i] as string;
                let authority = AppInfo.AUTHORITY_NOINIT;
                if (this.isAllowPlugin(plugin)) {
                    authority = AppInfo.AUTHORITY_ALLOW;
                }
                appInfo.addPlugin(plugin, authority);
            }
        }

        if ("urls" in json) {
            let array = json["urls"] as Array<string>;
            for (let i = 0; i < array.length; i++) {
                let url = array[i] as string;
                if (!url.toLowerCase().startsWith("file:///*")) {
                    let authority = AppInfo.AUTHORITY_NOINIT;
                    if (this.isAllowUrl(url)) {
                        authority = AppInfo.AUTHORITY_ALLOW;
                    }
                    appInfo.addUrl(url, authority);
                }
            }
        }

        if ("intents" in json) {
            let array = json["intents"];
            for (let i = 0; i < array.length; i++) {
                let intent = array[i] as string;
                let authority = AppInfo.AUTHORITY_ALLOW;
                appInfo.addIntent(intent, authority);
            }
        }

        if ("framework" in json) {
            let array = json["framework"] as Array<string>;
            for (let i = 0; i < array.length; i++) {
                notImplemented("parseManifest - framework")
                /* TODO String framework = array.getString(i);
                String[] element = framework.split("@");

                if (element.length == 1) {
                    appInfo.addFramework(element[0], null);
                }
                else if (element.length > 1) {
                    appInfo.addFramework(element[0], element[1]);
                }*/
            }
        }

        notImplemented("parseManifest - platform")
        /* TODO if (json.has("platform")) {
            JSONArray array = json.getJSONArray("platform");
            for (int i = 0; i < array.length(); i++) {
                String platform = array.getString(i);
                String[] element = platform.split("@");
                if (element.length == 1) {
                    appInfo.addPlatform(element[0], null);
                }
                else if (element.length > 1) {
                    appInfo.addPlatform(element[0], element[1]);
                }
            }
        }*/

        if (AppInfo.BACKGROUND_COLOR in json) {
            appInfo.background_color = json[AppInfo.BACKGROUND_COLOR] as string;
        }

        notImplemented("parseManifest - theme")
        /* TODO if (json.has("theme")) {
            JSONObject theme = json.getJSONObject("theme");
            if (theme.has(AppInfo.THEME_DISPLAY)) {
                appInfo.theme_display = theme.getString(AppInfo.THEME_DISPLAY);
            }
            if (theme.has(AppInfo.THEME_COLOR)) {
                appInfo.theme_color = theme.getString(AppInfo.THEME_COLOR);
            }
            if (theme.has(AppInfo.THEME_FONT_NAME)) {
                appInfo.theme_font_name = theme.getString(AppInfo.THEME_FONT_NAME);
            }
            if (theme.has(AppInfo.THEME_FONT_COLOR)) {
                appInfo.theme_font_color = theme.getString(AppInfo.THEME_FONT_COLOR);
            }
        }*/ 

        if ("intent_filters" in json) {
            let array = json["intent_filters"];
            for (let i = 0; i < array.length; i++) {
                let jobj = array[i];
                if ("action" in jobj) {
                    appInfo.addIntentFilter(jobj["action"] as string, null, null);
                }
            }
        }

        appInfo.install_time = Math.round(new Date().getTime()/1000);
        appInfo.launcher = launcher;

        return appInfo;
    }

    public parseManifestLocale(inputStream: Object, info: AppInfo) {
        let jsonObject = Utility.getJsonFromFile(inputStream);

        let exist: boolean = false;
        for (let key of Object.keys(jsonObject)) {
            let language = jsonObject.get(key) as string;
            let locale = jsonObject.get(language);

            let name = this.getMustStrValue(locale, AppInfo.NAME);
            let short_name = this.getMustStrValue(locale, AppInfo.SHORT_NAME);
            let description = this.getMustStrValue(locale, AppInfo.DESCRIPTION);
            let author_name = this.getMustStrValue(locale, AppInfo.AUTHOR_NAME);

            info.addLocale(language, name, short_name, description, author_name);

            if (language == info.default_locale) {
                exist = true;
            }
        }

        if (!exist) {
            info.addLocale(info.default_locale, info.name, info.short_name, info.description, info.author_name);
        }
    }
}