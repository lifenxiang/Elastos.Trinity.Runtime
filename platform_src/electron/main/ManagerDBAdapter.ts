import { app, BrowserWindow } from "electron";
import { join as pathJoin } from "path";

import { AppInfo, Icon } from "./AppInfo"; 
import { FindConditions, Not, Connection, createConnection } from 'typeorm';
import { AppManager } from './AppManager';
import { Log } from './Log';
import { notImplemented } from './Utility';

export class ManagerDBAdapter {
    private static LOG_TAG = "ManagerDBAdapter";

    // TODO ManagerDBHelper helper;
    context: any;
    connection: Connection;

    private constructor(context: any, dbPath: string = "")
    {
        // TODO helper = new ManagerDBHelper(context, dbPath);
        this.context = context;
    }

    public static async create(window: BrowserWindow, dbRootPath: string = app.getAppPath()): Promise<ManagerDBAdapter> {
        let adapter = new ManagerDBAdapter(window, dbRootPath);
        await adapter.init(dbRootPath);
        return adapter;
    }

    private async init(dbRootPath: string) {
        Log.d(ManagerDBAdapter.LOG_TAG, "Creating DB connection: "+dbRootPath);
        this.connection = await createConnection({
            type: "sqljs",
            name: pathJoin(dbRootPath, "manager.db"), // Use full path as a unique connection name to ensure multiple connections capability, not "default" connection
            location: pathJoin(dbRootPath, "manager.db"),
            entities: [
                AppInfo,
                Icon
            ],
            autoSave: true,
            synchronize: true,
            logging: false
        })
    }

    public clean() {
        // TODO SQLiteDatabase db = helper.getWritableDatabase();
        // TODO helper.onUpgrade(db, 0, 1);
    }

    public async addAppInfo(info: AppInfo): Promise<boolean> {
        if (info == null)
            return false;

        try {
            let appsRepository = this.connection.getRepository(AppInfo);
            let savedAppInfo = await appsRepository.save(info);

            console.log("Adding "+info.icons.length+" icons");
            let iconsRepository = this.connection.getRepository(Icon);
            for (let icon of info.icons) {
                icon.app_tid = savedAppInfo.tid;
                await iconsRepository.save(icon);
            }
        }
        catch (e) {
            // DB error
            return false;
        }

        notImplemented("NOT FINISHED - addAppInfo")
        
        /* TODO 
            for (AppInfo.PluginAuth pluginAuth : info.plugins) {
                contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_TID, tid);
                contentValues.put(AppInfo.PLUGIN, pluginAuth.plugin);
                contentValues.put(AppInfo.AUTHORITY, pluginAuth.authority);
                db.insert(ManagerDBHelper.AUTH_PLUGIN_TABLE, null, contentValues);
            }

            for (AppInfo.UrlAuth urlAuth : info.urls) {
                contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_TID, tid);
                contentValues.put(AppInfo.URL, urlAuth.url);
                contentValues.put(AppInfo.AUTHORITY, urlAuth.authority);
                db.insert(ManagerDBHelper.AUTH_URL_TABLE, null, contentValues);
            }

            for (AppInfo.UrlAuth intent : info.intents) {
                contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_TID, tid);
                contentValues.put(AppInfo.URL, intent.url);
                contentValues.put(AppInfo.AUTHORITY, intent.authority);
                db.insert(ManagerDBHelper.AUTH_INTENT_TABLE, null, contentValues);
            }

            for (AppInfo.Locale locale : info.locales) {
                contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_TID, tid);
                contentValues.put(AppInfo.LANGUAGE, locale.language);
                contentValues.put(AppInfo.NAME, locale.name);
                contentValues.put(AppInfo.SHORT_NAME, locale.short_name);
                contentValues.put(AppInfo.DESCRIPTION, locale.description);
                contentValues.put(AppInfo.AUTHOR_NAME, locale.author_name);
                db.insert(ManagerDBHelper.LACALE_TABLE, null, contentValues);
            }

            for (AppInfo.Framework framework : info.frameworks) {
                contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_TID, tid);
                contentValues.put(AppInfo.NAME, framework.name);
                contentValues.put(AppInfo.VERSION, framework.version);
                db.insert(ManagerDBHelper.FRAMEWORK_TABLE, null, contentValues);
            }

            for (AppInfo.Platform platform : info.platforms) {
                contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_TID, tid);
                contentValues.put(AppInfo.NAME, platform.name);
                contentValues.put(AppInfo.VERSION, platform.version);
                db.insert(ManagerDBHelper.PLATFORM_TABLE, null, contentValues);
            }

            for (AppInfo.IntentFilter intent_filter : info.intentFilters) {
                contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_ID, info.app_id);
                contentValues.put(AppInfo.ACTION, intent_filter.action);
                db.insert(ManagerDBHelper.INTENT_FILTER_TABLE, null, contentValues);
            }

            return true;
        }
        else {
            return false;
        }*/

        return true; // TMP
    }

    private async getInfos(selectionArgs: FindConditions<AppInfo>): Promise<AppInfo[]> {
        let appsRepository = this.connection.getRepository(AppInfo);
        let infos = await appsRepository.find(selectionArgs)

        let iconsRepository = this.connection.getRepository(Icon);
        for (let info of infos) {
            let icons = await iconsRepository.find({
                app_tid: info.tid
            });
            for (let icon of icons) {
                info.addIcon(icon);
            }
        }
        
        notImplemented("NOT FINISHED - getInfos")

        /* DELETE ME String[] columns = {AppInfo.TID, AppInfo.APP_ID, AppInfo.VERSION, AppInfo.VERSION_CODE, AppInfo.NAME, AppInfo.SHORT_NAME,
                AppInfo.DESCRIPTION, AppInfo.START_URL, AppInfo.START_VISIBLE, AppInfo.TYPE,
                AppInfo.AUTHOR_NAME, AppInfo.AUTHOR_EMAIL, AppInfo.DEFAULT_LOCAL, AppInfo.BACKGROUND_COLOR,
                AppInfo.THEME_DISPLAY, AppInfo.THEME_COLOR, AppInfo.THEME_FONT_NAME, AppInfo.THEME_FONT_COLOR,
                AppInfo.INSTALL_TIME, AppInfo.BUILT_IN, AppInfo.REMOTE, AppInfo.LAUNCHER,
                AppInfo.CATEGORY, AppInfo.KEY_WORDS};
        Cursor cursor = db.query(ManagerDBHelper.APP_TABLE, columns,selection, selectionArgs,null,null,null);
        AppInfo infos[] = new AppInfo[cursor.getCount()];
        int count = 0;
        while (cursor.moveToNext()) {*/
            /* TODO String[] args1 = {String.valueOf(info.tid)};

            String[] columns1 = {AppInfo.SRC, AppInfo.SIZES, AppInfo.TYPE};
            Cursor cursor1 = db.query(ManagerDBHelper.ICONS_TABLE, columns1,AppInfo.APP_TID + "=?", args1,null,null,null);
            while (cursor1.moveToNext()) {
                info.addIcon(cursor1.getString(cursor1.getColumnIndex(AppInfo.SRC)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.SIZES)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.TYPE)));
            }

            String[] columns2 = {AppInfo.PLUGIN, AppInfo.AUTHORITY};
            cursor1 = db.query(ManagerDBHelper.AUTH_PLUGIN_TABLE, columns2,AppInfo.APP_TID + "=?", args1,null,null,null);
            while (cursor1.moveToNext()) {
                info.addPlugin(cursor1.getString(cursor1.getColumnIndex(AppInfo.PLUGIN)), cursor1.getInt(cursor1.getColumnIndex(AppInfo.AUTHORITY)));
            }

            String[] columns3 = {AppInfo.URL, AppInfo.AUTHORITY};
            cursor1 = db.query(ManagerDBHelper.AUTH_URL_TABLE, columns3,AppInfo.APP_TID + "=?", args1,null,null,null);
            while (cursor1.moveToNext()) {
                info.addUrl(cursor1.getString(cursor1.getColumnIndex(AppInfo.URL)), cursor1.getInt(cursor1.getColumnIndex(AppInfo.AUTHORITY)));
            }

            String[] intent_columns = {AppInfo.URL, AppInfo.AUTHORITY};
            cursor1 = db.query(ManagerDBHelper.AUTH_INTENT_TABLE, intent_columns,AppInfo.APP_TID + "=?", args1,null,null,null);
            while (cursor1.moveToNext()) {
                info.addIntent(cursor1.getString(cursor1.getColumnIndex(AppInfo.URL)), cursor1.getInt(cursor1.getColumnIndex(AppInfo.AUTHORITY)));
            }

            String[] columns4 = {AppInfo.LANGUAGE, AppInfo.NAME, AppInfo.SHORT_NAME, AppInfo.DESCRIPTION, AppInfo.AUTHOR_NAME};
            cursor1 = db.query(ManagerDBHelper.LACALE_TABLE, columns4,AppInfo.APP_TID + "=?", args1,null,null,null);
            while (cursor1.moveToNext()) {
                info.addLocale(cursor1.getString(cursor1.getColumnIndex(AppInfo.LANGUAGE)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.NAME)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.SHORT_NAME)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.DESCRIPTION)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.AUTHOR_NAME)));
            }

            String[] columns5 = {AppInfo.NAME, AppInfo.VERSION};
            cursor1 = db.query(ManagerDBHelper.FRAMEWORK_TABLE, columns5,AppInfo.APP_TID + "=?", args1,null,null,null);
            while (cursor1.moveToNext()) {
                info.addFramework(cursor1.getString(cursor1.getColumnIndex(AppInfo.NAME)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.VERSION)));
            }

            cursor1 = db.query(ManagerDBHelper.PLATFORM_TABLE, columns5,AppInfo.APP_TID + "=?", args1,null,null,null);
            while (cursor1.moveToNext()) {
                info.addFramework(cursor1.getString(cursor1.getColumnIndex(AppInfo.NAME)),
                        cursor1.getString(cursor1.getColumnIndex(AppInfo.VERSION)));
            }*/
        // DELETE ME }
        return infos;
    }

    public async getAppInfo(id: string): Promise<AppInfo> {
        let infos = await this.getInfos({
            app_id: id,
            isLauncher: false
        });

        if (infos.length > 0) {
            return infos[0];
        }
        else {
            return null;
        }
    }

    public getAppAuthInfo(info: AppInfo) {
        notImplemented("getAppAuthInfo")
        /* TODO SQLiteDatabase db = helper.getWritableDatabase();
        String[] args1 = {String.valueOf(info.tid)};
        String[] columns2 = {AppInfo.PLUGIN, AppInfo.AUTHORITY};
        Cursor cursor = db.query(ManagerDBHelper.AUTH_PLUGIN_TABLE, columns2, AppInfo.APP_TID + "=?", args1, null, null, null);
        while (cursor.moveToNext()) {
            info.addPlugin(cursor.getString(cursor.getColumnIndex(AppInfo.PLUGIN)), cursor.getInt(cursor.getColumnIndex(AppInfo.AUTHORITY)));
        }

        String[] columns3 = {AppInfo.URL, AppInfo.AUTHORITY};
        cursor = db.query(ManagerDBHelper.AUTH_URL_TABLE, columns3, AppInfo.APP_TID + "=?", args1, null, null, null);
        while (cursor.moveToNext()) {
            info.addUrl(cursor.getString(cursor.getColumnIndex(AppInfo.URL)), cursor.getInt(cursor.getColumnIndex(AppInfo.AUTHORITY)));
        }

        String[] intent_columns = {AppInfo.URL, AppInfo.AUTHORITY};
        cursor = db.query(ManagerDBHelper.AUTH_INTENT_TABLE, intent_columns, AppInfo.APP_TID + "=?", args1, null, null, null);
        while (cursor.moveToNext()) {
            info.addIntent(cursor.getString(cursor.getColumnIndex(AppInfo.URL)), cursor.getInt(cursor.getColumnIndex(AppInfo.AUTHORITY)));
        }*/
    }

    public async getAppInfos(): Promise<AppInfo[]> {
        let appInfos = await this.getInfos({
            isLauncher: false,
            app_id: Not(AppManager.getSharedInstance().getDIDSessionId())
        })
        return appInfos;
    }

    public async getLauncherInfo(): Promise<AppInfo> {
        let infos = await this.getInfos({
            isLauncher: true
        });

        if (infos.length > 0) {
            return infos[0];
        }
        else {
            return null;
        }
    }

    public changeBuiltInToNormal(appId: string): number {
        notImplemented("changeBuiltInToNormal");
        /*SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues contentValues = new ContentValues();
        contentValues.put(AppInfo.BUILT_IN, 0);
        String where = AppInfo.APP_ID + "=?";
        String[] whereArgs= {appId};
        int count = db.update(ManagerDBHelper.APP_TABLE, contentValues, where, whereArgs );
        return count;*/

        return 1; // TMP
    }

    /*public long updatePluginAuth(long tid, String plugin, int authority) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues contentValues = new ContentValues();
        contentValues.put(AppInfo.AUTHORITY, authority);
        String where = AppInfo.APP_TID + "=? AND " + AppInfo.PLUGIN + "=?";
        String[] whereArgs= {String.valueOf(tid), plugin};
        long count = db.update(ManagerDBHelper.AUTH_PLUGIN_TABLE, contentValues, where, whereArgs );
        if (count < 1) {
            contentValues = new ContentValues();
            contentValues.put(AppInfo.APP_TID, tid);
            contentValues.put(AppInfo.PLUGIN, plugin);
            contentValues.put(AppInfo.AUTHORITY, authority);
            db.insert(ManagerDBHelper.AUTH_PLUGIN_TABLE, null, contentValues);
        }
        return count;
    }

    public long updateURLAuth(long tid, String url, int authority) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues contentValues = new ContentValues();
        contentValues.put(AppInfo.AUTHORITY, authority);
        String where = AppInfo.APP_TID + "=? AND " + AppInfo.URL + "=?";
        String[] whereArgs= {String.valueOf(tid), url};
        long count = db.update(ManagerDBHelper.AUTH_URL_TABLE, contentValues, where, whereArgs );
        if (count < 1) {
            contentValues = new ContentValues();
            contentValues.put(AppInfo.APP_TID, tid);
            contentValues.put(AppInfo.URL, url);
            contentValues.put(AppInfo.AUTHORITY, authority);
            count = db.insert(ManagerDBHelper.AUTH_URL_TABLE, null, contentValues);
        }
        return count;
    }

    public long updateIntentAuth(long tid, String url, int authority) {
        SQLiteDatabase db = helper.getWritableDatabase();
        ContentValues contentValues = new ContentValues();
        contentValues.put(AppInfo.AUTHORITY, authority);
        String where = AppInfo.APP_TID + "=? AND " + AppInfo.URL + "=?";
        String[] whereArgs= {String.valueOf(tid), url};
        long count = db.update(ManagerDBHelper.AUTH_INTENT_TABLE, contentValues, where, whereArgs );
        if (count < 1) {
            contentValues = new ContentValues();
            contentValues.put(AppInfo.APP_TID, tid);
            contentValues.put(AppInfo.URL, url);
            contentValues.put(AppInfo.AUTHORITY, authority);
            db.insert(ManagerDBHelper.AUTH_INTENT_TABLE, null, contentValues);
        }
        return count;
    }*/

    public removeAppInfo(info: AppInfo): number {
        notImplemented("removeAppInfo")
        /*SQLiteDatabase db = helper.getWritableDatabase();
        String where = AppInfo.APP_TID + "=?";
        String[] whereArgs = {String.valueOf(info.tid)};
        int count = db.delete(ManagerDBHelper.AUTH_URL_TABLE, where, whereArgs);
        db.delete(ManagerDBHelper.AUTH_INTENT_TABLE, where, whereArgs);
        count = db.delete(ManagerDBHelper.AUTH_PLUGIN_TABLE, where, whereArgs);
        db.delete(ManagerDBHelper.ICONS_TABLE, where, whereArgs);
        db.delete(ManagerDBHelper.LACALE_TABLE, where, whereArgs);
        db.delete(ManagerDBHelper.FRAMEWORK_TABLE, where, whereArgs);
        db.delete(ManagerDBHelper.PLATFORM_TABLE, where, whereArgs);
        where = AppInfo.APP_ID + "=?";
        String[] args = {info.app_id};
        db.delete(ManagerDBHelper.INTENT_FILTER_TABLE, where, args);
        db.delete(ManagerDBHelper.SETTING_TABLE, where, args);
        where = AppInfo.TID + "=?";
        count = db.delete(ManagerDBHelper.APP_TABLE, where, whereArgs);
        return count;*/

        return 0; // TMP
    }

    /*public String[] getIntentFilter(String action) {
        SQLiteDatabase db = helper.getWritableDatabase();
        String[] args = {action};
        String[] columns = {AppInfo.APP_ID};
        Cursor cursor = db.query(ManagerDBHelper.INTENT_FILTER_TABLE, columns,AppInfo.ACTION + "=?", args,null,null,null);
        String ids[] = new String[cursor.getCount()];
        int count = 0;
        while (cursor.moveToNext()) {
            ids[count++] = cursor.getString(cursor.getColumnIndex(AppInfo.APP_ID));;
        }

        return ids;
    }

    public long setSetting(String id, String key, Object value) throws Exception {
        SQLiteDatabase db = helper.getWritableDatabase();
        long ret = 0;

        String data = null;
        if (value != null) {
            JSONObject json = new JSONObject();
            json.put("data", value);
            data = json.toString();
        }

        Boolean isExist = getSetting(id, key) != null;
        if (!isExist) {
            if (value != null) {
                ContentValues contentValues = new ContentValues();
                contentValues.put(AppInfo.APP_ID, id);
                contentValues.put(ManagerDBHelper.KEY, key);
                contentValues.put(ManagerDBHelper.VALUE, data);
                ret = db.insert(ManagerDBHelper.SETTING_TABLE, null, contentValues);
            }
        }
        else {
            String where = AppInfo.APP_ID + "=? AND " + ManagerDBHelper.KEY + "=?";
            String[] whereArgs = {id, key};
            if (value != null) {
                ContentValues contentValues = new ContentValues();
                contentValues.put(ManagerDBHelper.VALUE, data);
                ret = db.update(ManagerDBHelper.SETTING_TABLE, contentValues, where, whereArgs );
            }
            else {
                ret = db.delete(ManagerDBHelper.SETTING_TABLE, where, whereArgs);
            }
        }
        return ret;
    }

    public JSONObject getSetting(String id, String key) throws Exception {
        SQLiteDatabase db = helper.getWritableDatabase();
        String where = AppInfo.APP_ID + "=? AND " + ManagerDBHelper.KEY + "=?";
        String[] whereArgs = {id, key};
        String[] columns = {ManagerDBHelper.VALUE};
        Cursor cursor = db.query(ManagerDBHelper.SETTING_TABLE, columns, where, whereArgs,null,null,null);
        if (cursor.moveToNext()) {
            String value = cursor.getString(cursor.getColumnIndex(ManagerDBHelper.VALUE));
            JSONObject dict = new JSONObject(value);
            if (dict != null) {
                JSONObject ret = new JSONObject();
                ret.put("key", key);
                ret.put("value", dict.get("data"));
                return ret;
            }
        }

        return null;
    }

    public JSONObject getSettings(String id) throws Exception {
        SQLiteDatabase db = helper.getWritableDatabase();
        String where = AppInfo.APP_ID + "=?";
        String[] whereArgs = {id};
        String[] columns = {ManagerDBHelper.KEY, ManagerDBHelper.VALUE};
        Cursor cursor = db.query(ManagerDBHelper.SETTING_TABLE, columns, where, whereArgs,null,null,null);
        JSONObject ret = new JSONObject();
        while (cursor.moveToNext()) {
            String key = cursor.getString(cursor.getColumnIndex(ManagerDBHelper.KEY));
            String value = cursor.getString(cursor.getColumnIndex(ManagerDBHelper.VALUE));

            JSONObject dict = new JSONObject(value);
            if (dict != null) {
                ret.put(key, dict.get("data"));
            }
        }
        return ret;
    }

     public long setPreference(String key, Object value) throws Exception {
         SQLiteDatabase db = helper.getWritableDatabase();
         long ret = 0;

         String data = null;
         if (value != null) {
             JSONObject json = new JSONObject();
             json.put("data", value);
             data = json.toString();
         }

         Boolean isExist = getPreference(key) != null;
         if (!isExist) {
             if (value != null) {
                 ContentValues contentValues = new ContentValues();
                 contentValues.put(ManagerDBHelper.KEY, key);
                 contentValues.put(ManagerDBHelper.VALUE, data);
                 ret = db.insert(ManagerDBHelper.PREFERENCE_TABLE, null, contentValues);
             }
         }
         else {
             String where = ManagerDBHelper.KEY + "=?";
             String[] whereArgs = {key};
             if (value != null) {
                 ContentValues contentValues = new ContentValues();
                 contentValues.put(ManagerDBHelper.VALUE, data);
                 ret = db.update(ManagerDBHelper.PREFERENCE_TABLE, contentValues, where, whereArgs );
             }
             else {
                 ret = db.delete(ManagerDBHelper.PREFERENCE_TABLE, where, whereArgs);
             }
         }
         return ret;
     }

     public void resetPreferences() {
         helper.getWritableDatabase().delete(ManagerDBHelper.PREFERENCE_TABLE, null, null);
     }

     public JSONObject getPreference(String key) throws Exception {
         SQLiteDatabase db = helper.getWritableDatabase();
         String where = ManagerDBHelper.KEY + "=?";
         String[] whereArgs = {key};
         String[] columns = {ManagerDBHelper.VALUE};
         Cursor cursor = db.query(ManagerDBHelper.PREFERENCE_TABLE, columns, where, whereArgs,null,null,null);
         if (cursor.moveToNext()) {
             String value = cursor.getString(cursor.getColumnIndex(ManagerDBHelper.VALUE));
             JSONObject dict = new JSONObject(value);
             if (dict != null) {
                 JSONObject ret = new JSONObject();
                 ret.put("key", key);
                 ret.put("value", dict.get("data"));
                 return ret;
             }
         }

         return null;
     }

     public JSONObject getPreferences() throws Exception {
         SQLiteDatabase db = helper.getWritableDatabase();
         String[] columns = {ManagerDBHelper.KEY, ManagerDBHelper.VALUE};
         Cursor cursor = db.query(ManagerDBHelper.PREFERENCE_TABLE, columns, null, null,null,null,null);
         JSONObject ret = new JSONObject();
         while (cursor.moveToNext()) {
             String key = cursor.getString(cursor.getColumnIndex(ManagerDBHelper.KEY));
             String value = cursor.getString(cursor.getColumnIndex(ManagerDBHelper.VALUE));
             JSONObject dict = new JSONObject(value);
             if (dict != null) {
                 ret.put(key, dict.get("data"));
             }
         }
         return ret;
     }

     public int getApiAuth(String appId, String plugin, String api) {

         SQLiteDatabase db = helper.getWritableDatabase();
         String where = AppInfo.APP_ID + "=? AND " + AppInfo.PLUGIN + "=? AND " + AppInfo.API + "=?";
         String[] whereArgs = {appId, plugin, api};
         String[] columns = {AppInfo.AUTHORITY};
         Cursor cursor = db.query(ManagerDBHelper.AUTH_API_TABLE, columns, where, whereArgs,null,null,null);
         if (cursor.moveToNext()) {
             return cursor.getInt(cursor.getColumnIndex(AppInfo.AUTHORITY));
         }

         return AppInfo.AUTHORITY_NOEXIST;
     }

     public long setApiAuth(String appId, String plugin, String api, int auth) {

         SQLiteDatabase db = helper.getWritableDatabase();
         long ret = 0;

         Boolean isExist = getApiAuth(appId, plugin, api) != AppInfo.AUTHORITY_NOEXIST;
         if (!isExist) {
             ContentValues contentValues = new ContentValues();
             contentValues.put(AppInfo.APP_ID, appId);
             contentValues.put(AppInfo.PLUGIN, plugin);
             contentValues.put(AppInfo.API, api);
             contentValues.put(AppInfo.AUTHORITY, auth);
             ret = db.insert(ManagerDBHelper.AUTH_API_TABLE, null, contentValues);
         }
         else {
             String where = AppInfo.APP_ID + "=? AND " + AppInfo.PLUGIN + "=? AND " + AppInfo.API + "=?";
             String[] whereArgs = {appId, plugin, api};
             if (auth != AppInfo.AUTHORITY_NOINIT) {
                 ContentValues contentValues = new ContentValues();
                 contentValues.put(AppInfo.AUTHORITY, auth);
                 ret = db.update(ManagerDBHelper.AUTH_API_TABLE, contentValues, where, whereArgs );
             }
             else {
                 ret = db.delete(ManagerDBHelper.AUTH_API_TABLE, where, whereArgs);
             }
         }

         return ret;
     }

     public void resetApiDenyAuth(String appId)  {
         SQLiteDatabase db = helper.getWritableDatabase();
         String where = AppInfo.APP_ID + "=? AND " + AppInfo.AUTHORITY + "=?";
         String[] whereArgs = {appId, String.valueOf(AppInfo.AUTHORITY_DENY)};
         db.delete(ManagerDBHelper.AUTH_API_TABLE, where, whereArgs);
     }*/
}
