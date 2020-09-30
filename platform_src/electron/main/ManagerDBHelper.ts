import { Connection, createConnection, Repository } from 'typeorm';
import { join as pathJoin } from "path";
import { AppInfo } from './AppInfo';
import { Log } from './Log';
import { IntentFilter } from './IntentFilter';
import { Setting } from './Setting';
import { Preference } from './Preference';
import { ApiAuth } from './ApiAuth';

export class ManagerDBHelper {
    private static LOG_TAG = "ManagerDBHelper";

    private static DATABASE_NAME = "manager.db";
    public static AUTH_PLUGIN_TABLE = "auth_plugin";
    public static AUTH_URL_TABLE = "auth_url";
    public static AUTH_INTENT_TABLE = "auth_intent";
    public static AUTH_API_TABLE = "auth_api";
    public static ICONS_TABLE = "icons";
    public static LACALE_TABLE = "locale";
    public static FRAMEWORK_TABLE = "framework";
    public static PLATFORM_TABLE = "platform";
    public static SETTING_TABLE = "setting";
    public static PREFERENCE_TABLE = "preference";
    public static INTENT_FILTER_TABLE = "intent";
    public static SERVICE_TABLE = "service";
    public static APP_TABLE = "app";

    private connection: Connection;
    private dbPath: string;
    private repositoryMap = new Map<string, Repository<any>>();

    constructor(dbPath: string) {
        //Log.d(ManagerDBHelper.LOG_TAG, "Creating DB connection: "+dbPath);
        this.dbPath = dbPath;
    }

    public static async newInstance(dbPath: string): Promise<ManagerDBHelper> {
        let managerDBHelper = new ManagerDBHelper(dbPath);
        await managerDBHelper.init();
        return managerDBHelper;
    }

    private async init() {
        this.connection = await createConnection({
            type: "sqljs",
            name: pathJoin(this.dbPath, ManagerDBHelper.DATABASE_NAME), // Use full path as a unique connection name to ensure multiple connections capability, not "default" connection
            location: pathJoin(this.dbPath, ManagerDBHelper.DATABASE_NAME),
            entities: [
                AppInfo,
                AppInfo.Icon,
                AppInfo.PluginAuth,
                AppInfo.UrlAuth,
                AppInfo.IntentAuth,
                AppInfo.Locale,
                AppInfo.Framework,
                AppInfo.Platform,
                IntentFilter,
                AppInfo.StartupService,
                Setting,
                Preference,
                ApiAuth
            ],
            autoSave: true,
            synchronize: true,
            logging: false
        });
        this.initRepositories();
    }

    private initRepositories() {
        this.repositoryMap.set(ManagerDBHelper.AUTH_PLUGIN_TABLE, this.connection.getRepository(AppInfo.PluginAuth));
        this.repositoryMap.set(ManagerDBHelper.AUTH_URL_TABLE, this.connection.getRepository(AppInfo.UrlAuth));
        this.repositoryMap.set(ManagerDBHelper.AUTH_INTENT_TABLE, this.connection.getRepository(AppInfo.IntentAuth));
        this.repositoryMap.set(ManagerDBHelper.AUTH_API_TABLE, this.connection.getRepository(ApiAuth));
        this.repositoryMap.set(ManagerDBHelper.ICONS_TABLE, this.connection.getRepository(AppInfo.Icon));
        this.repositoryMap.set(ManagerDBHelper.LACALE_TABLE, this.connection.getRepository(AppInfo.Locale));
        this.repositoryMap.set(ManagerDBHelper.FRAMEWORK_TABLE, this.connection.getRepository(AppInfo.Framework));
        this.repositoryMap.set(ManagerDBHelper.PLATFORM_TABLE, this.connection.getRepository(AppInfo.Platform));
        this.repositoryMap.set(ManagerDBHelper.SETTING_TABLE, this.connection.getRepository(Setting));
        this.repositoryMap.set(ManagerDBHelper.PREFERENCE_TABLE, this.connection.getRepository(Preference));
        this.repositoryMap.set(ManagerDBHelper.INTENT_FILTER_TABLE, this.connection.getRepository(IntentFilter));
        this.repositoryMap.set(ManagerDBHelper.SERVICE_TABLE, this.connection.getRepository(AppInfo.StartupService));
        this.repositoryMap.set(ManagerDBHelper.APP_TABLE, this.connection.getRepository(AppInfo));
    }

    getRepository(table: string): Repository<any> {
        return this.repositoryMap.get(table);
    }

    async closeConnection() {
        await this.connection.close();
        this.connection = null;
    }
}