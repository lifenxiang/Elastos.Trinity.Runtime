import { AppInfo} from "./AppInfo";
import { Utility } from "./Utility";
import { Log } from "./Log";
import { AppManager } from "./AppManager";
import { MergeDBAdapter } from "./MergeDBAdapter";

export class AppInstaller {
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

    public copyAssetsFolder(src: string, dest: string) {
        /* TODO AssetManager manager = context.getAssets();
        String fileNames[] = manager.list(src);

        if (fileNames.length > 0) {
            File file = new File(dest);
            if (file.exists()) {
                deleteAllFiles(file);
            }
            file.mkdirs();
            for (String fileName : fileNames) {
                copyAssetsFolder(src + "/" + fileName, dest + "/" + fileName);
            }
        }
        else {
            InputStream in = manager.open(src);
            OutputStream out = new FileOutputStream(dest);

            byte[] buffer = new byte[1024];

            int length;

            while ((length = in.read(buffer)) > 0) {
                out.write(buffer, 0, length);
            }
            in.close();
            out.close();
        }*/
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

    public parseManifest(inputStream: Object, isLauncher: boolean): AppInfo {
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

        if (!isLauncher) {
            if ("icons" in json) {
                let array = json["icons"] as any[];
                for (let i = 0; i < array.length; i++) {
                    let icon = array[i];
                    let src = icon.getString(AppInfo.SRC);
                    let sizes = icon.getString(AppInfo.SIZES);
                    let type = icon.getString(AppInfo.TYPE);
                    appInfo.addIcon(src, sizes, type);
                }
            } else {
                throw new Error("Parse Manifest.json error: 'icons' no exist!");
            }
        }

        //Optional
        /* TODO if (json.has(AppInfo.START_VISIBLE)) {
            appInfo.start_visible = json.getString(AppInfo.START_VISIBLE);
        }
        else {
            appInfo.start_visible = "show";
        }

        if (json.has(AppInfo.SHORT_NAME)) {
            appInfo.short_name = json.getString(AppInfo.SHORT_NAME);
        }

        if (json.has(AppInfo.DESCRIPTION)) {
            appInfo.description = json.getString(AppInfo.DESCRIPTION);
        }

        if (json.has(AppInfo.DEFAULT_LOCAL)) {
            appInfo.default_locale = json.getString(AppInfo.DEFAULT_LOCAL);
        }
        else {
            appInfo.default_locale = "en";
        }

        if (json.has(AppInfo.TYPE)) {
            appInfo.type = json.getString(AppInfo.TYPE);
        }
        else {
            appInfo.type = "app";
        }

        if (json.has("author")) {
            JSONObject author = json.getJSONObject("author");
            if (author.has("name")) {
                appInfo.author_name = author.getString("name");
            }
            if (author.has("email")) {
                appInfo.author_email = author.getString("email");
            }
        }

        if (json.has(AppInfo.CATEGORY)) {
            appInfo.category = json.getString(AppInfo.CATEGORY);
        }
        else {
            appInfo.category = "other";
        }

        if (json.has(AppInfo.KEY_WORDS)) {
            appInfo.key_words = json.getString(AppInfo.KEY_WORDS);
        }
        else {
            appInfo.key_words = "";
        }

        if (json.has("plugins")) {
            JSONArray array = json.getJSONArray("plugins");
            for (int i = 0; i < array.length(); i++) {
                String plugin = array.getString(i);
                int authority = AppInfo.AUTHORITY_NOINIT;
                if (isAllowPlugin(plugin)) {
                    authority = AppInfo.AUTHORITY_ALLOW;
                }
                appInfo.addPlugin(plugin, authority);
            }
        }

        if (json.has("urls")) {
            JSONArray array = json.getJSONArray("urls");
            for (int i = 0; i < array.length(); i++) {
                String url = array.getString(i);
                if (!url.toLowerCase().startsWith("file:///*")) {
                    int authority = AppInfo.AUTHORITY_NOINIT;
                    if (isAllowUrl(url)) {
                        authority = AppInfo.AUTHORITY_ALLOW;
                    }
                    appInfo.addUrl(url, authority);
                }
            }
        }

        if (json.has("intents")) {
            JSONArray array = json.getJSONArray("intents");
            for (int i = 0; i < array.length(); i++) {
                String intent = array.getString(i);
                int authority = AppInfo.AUTHORITY_ALLOW;
                appInfo.addIntent(intent, authority);
            }
        }

        if (json.has("framework")) {
            JSONArray array = json.getJSONArray("framework");
            for (int i = 0; i < array.length(); i++) {
                String framework = array.getString(i);
                String[] element = framework.split("@");

                if (element.length == 1) {
                    appInfo.addFramework(element[0], null);
                }
                else if (element.length > 1) {
                    appInfo.addFramework(element[0], element[1]);
                }
            }
        }

        if (json.has("platform")) {
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
        }

        if (json.has(AppInfo.BACKGROUND_COLOR)) {
            appInfo.background_color = json.getString(AppInfo.BACKGROUND_COLOR);
        }

        if (json.has("theme")) {
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
        }


        if (json.has("intent_filters")) {
            JSONArray array = json.getJSONArray("intent_filters");
            for (int i = 0; i < array.length(); i++) {
                JSONObject jobj = array.getJSONObject(i);
                if (jobj.has("action")) {
                    appInfo.addIntentFilter(jobj.getString("action"));
                }
            }
        }

        appInfo.install_time = System.currentTimeMillis() / 1000;*/
        appInfo.isLauncher = isLauncher;

        return appInfo;
    }
}