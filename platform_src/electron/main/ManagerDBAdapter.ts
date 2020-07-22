import { app, BrowserWindow } from "electron";
import { AppInfo } from "./AppInfo"; 
import { FindConditions, Not, Repository } from 'typeorm';
import { AppManager } from './AppManager';
import { Log } from './Log';
import { ManagerDBHelper } from './ManagerDBHelper';
import { IntentFilter } from './IntentFilter';
import { Setting } from './Setting';
import { Preference } from './Preference';
import { ApiAuth } from './ApiAuth';

export class ManagerDBAdapter {
    private static LOG_TAG = "ManagerDBAdapter";

    helper: ManagerDBHelper;
    window: BrowserWindow;
    
    constructor(window: BrowserWindow, dbPath: string = "") {
        this.window = window;
    }

    public static async newInstance(window: BrowserWindow, dbPath: string = app.getAppPath()): Promise<ManagerDBAdapter> {
        let managerDBAdapter = new ManagerDBAdapter(window, dbPath);
        await managerDBAdapter.init(dbPath);
        return managerDBAdapter;
    }

    private async init(dbPath: string) {
        this.helper = await ManagerDBHelper.newInstance(dbPath);
    }

    public clean() {
        // TODO SQLiteDatabase db = helper.getWritableDatabase();
        // TODO helper.onUpgrade(db, 0, 1);
    }

    public async addAppInfo(info: AppInfo): Promise<boolean> {
        if (info != null) {
            let appRepository = this.helper.getRepository(ManagerDBHelper.APP_TABLE) as Repository<AppInfo>;
            let savedAppInfo = await appRepository.save(info);
            let tid = savedAppInfo.tid;

            if (savedAppInfo == null) {
                return false;
            }
            info.tid = tid;

            let iconRepository = this.helper.getRepository(ManagerDBHelper.ICONS_TABLE) as Repository<AppInfo.Icon>;
            for (let icon of info.icons) {
                icon.app_tid = tid;
                await iconRepository.save(icon);
            }

            let pluginRepository = this.helper.getRepository(ManagerDBHelper.AUTH_PLUGIN_TABLE) as Repository<AppInfo.PluginAuth>;
            for (let plugin of info.plugins) {
                plugin.app_tid = tid;
                await pluginRepository.save(plugin);
            }

            let urlRepository = this.helper.getRepository(ManagerDBHelper.AUTH_URL_TABLE) as Repository<AppInfo.UrlAuth>;
            for (let url of info.urls) {
                url.app_tid = tid;
                await urlRepository.save(url);
            }
            
            let intentRepository = this.helper.getRepository(ManagerDBHelper.AUTH_INTENT_TABLE) as Repository<AppInfo.IntentAuth>;
            for (let intent of info.intents) {
                intent.app_tid = tid;
                await intentRepository.save(intent);
            }

            let localeRepository = this.helper.getRepository(ManagerDBHelper.LACALE_TABLE) as Repository<AppInfo.Locale>;
            for (let locale of info.locales) {
                locale.app_tid = tid;
                await localeRepository.save(locale);
            }

            let frameworkRepository = this.helper.getRepository(ManagerDBHelper.FRAMEWORK_TABLE) as Repository<AppInfo.Framework>;
            for (let framework of info.frameworks) {
                framework.app_tid = tid;
                await frameworkRepository.save(framework);
            }

            let platformRepository = this.helper.getRepository(ManagerDBHelper.PLATFORM_TABLE) as Repository<AppInfo.Platform>;
            for (let platform of info.platforms) {
                platform.app_tid = tid;
                await platformRepository.save(platform);
            }

            let intentFilterRepository = this.helper.getRepository(ManagerDBHelper.INTENT_FILTER_TABLE) as Repository<IntentFilter>;
            for (let intentFilter of info.intentFilters) {
                intentFilter.app_id = info.app_id;
                await intentFilterRepository.save(intentFilter);
            }

            let startupServiceRepository = this.helper.getRepository(ManagerDBHelper.SERVICE_TABLE) as Repository<AppInfo.StartupService>;
            for (let startupService of info.startupServices) {
                startupService.app_id = info.app_id;
                await startupServiceRepository.save(startupService);
            }

            return true;
        }
        else{
            return false;
        }
    }

    private async getInfos(selectionArgs: FindConditions<AppInfo>): Promise<AppInfo[]> {
        let appRepository = this.helper.getRepository(ManagerDBHelper.APP_TABLE) as Repository<AppInfo>;
        let infos = await appRepository.find(selectionArgs);

        let iconRepository = this.helper.getRepository(ManagerDBHelper.ICONS_TABLE) as Repository<AppInfo.Icon>;
        let pluginRepository = this.helper.getRepository(ManagerDBHelper.AUTH_PLUGIN_TABLE) as Repository<AppInfo.PluginAuth>;
        let urlRepository = this.helper.getRepository(ManagerDBHelper.AUTH_URL_TABLE) as Repository<AppInfo.UrlAuth>;
        let intentRepository = this.helper.getRepository(ManagerDBHelper.AUTH_INTENT_TABLE) as Repository<AppInfo.IntentAuth>;
        let localeRepository = this.helper.getRepository(ManagerDBHelper.LACALE_TABLE) as Repository<AppInfo.Locale>;
        let frameworkRepository = this.helper.getRepository(ManagerDBHelper.FRAMEWORK_TABLE) as Repository<AppInfo.Framework>;
        let platformRepository = this.helper.getRepository(ManagerDBHelper.PLATFORM_TABLE) as Repository<AppInfo.Platform>;
        let intentFilterRepository = this.helper.getRepository(ManagerDBHelper.INTENT_FILTER_TABLE) as Repository<IntentFilter>;
        let startupServiceRepository = this.helper.getRepository(ManagerDBHelper.SERVICE_TABLE) as Repository<AppInfo.StartupService>;

        for (let info of infos) {
            let icons = await iconRepository.find({app_tid: info.tid});
            for (let icon of icons) {
                info.addIcon(icon.src, icon.sizes, icon.type);
            }

            let plugins = await pluginRepository.find({app_tid: info.tid});
            for (let plugin of plugins) {
                info.addPlugin(plugin.plugin, plugin.authority);
            }

            let urls = await urlRepository.find({app_tid: info.tid});
            for (let url of urls) {
                info.addUrl(url.url, url.authority);
            }

            let intents = await intentRepository.find({app_tid: info.tid});
            for (let intent of intents) {
                info.addIntent(intent.url, intent.authority);
            }

            let locales = await localeRepository.find({app_tid: info.tid});
            for (let locale of locales) {
                info.addLocale(locale.language, locale.name, locale.short_name, locale.description, locale.author_name);
            }

            let frameworks = await frameworkRepository.find({app_tid: info.tid});
            for (let framework of frameworks) {
                info.addFramework(framework.name, framework.version);
            }

            let platforms = await platformRepository.find({app_tid: info.tid});
            for (let platform of platforms) {
                info.addPlatform(platform.name, platform.version);
            }

            //TODO: check if it is necessary, not implemented in java
            let intentFilters = await intentFilterRepository.find({app_id: info.app_id});
            for (let intentFilter of intentFilters) {
                info.addIntentFilter(intentFilter.action, intentFilter.startupMode, intentFilter.serviceName);
            }

            let startupServices = await startupServiceRepository.find({app_id: info.app_id});
            for (let startupService of startupServices) {
                info.addStartService(startupService.name);
            }
        }
        
        return infos;
    }

    public async getAppInfo(id: string): Promise<AppInfo> {
        let infos = await this.getInfos({
            app_id: id,
            launcher: 0
        });

        if (infos.length > 0) {
            return infos[0];
        }
        else {
            return null;
        }
    }

    public async getAppAuthInfo(info: AppInfo) {
        let pluginRepository = this.helper.getRepository(ManagerDBHelper.AUTH_PLUGIN_TABLE) as Repository<AppInfo.PluginAuth>;
        let urlRepository = this.helper.getRepository(ManagerDBHelper.AUTH_URL_TABLE) as Repository<AppInfo.UrlAuth>;
        let intentRepository = this.helper.getRepository(ManagerDBHelper.AUTH_INTENT_TABLE) as Repository<AppInfo.IntentAuth>;

        let plugins = await pluginRepository.find({app_tid: info.tid});
        for (let plugin of plugins) {
            info.addPlugin(plugin.plugin, plugin.authority);
        }

        let urls = await urlRepository.find({app_tid: info.tid});
        for (let url of urls) {
            info.addUrl(url.url, url.authority);
        }

        let intents = await intentRepository.find({app_tid: info.tid});
        for (let intent of intents) {
            info.addIntent(intent.url, intent.authority);
        }
    }

    public async getAppInfos(): Promise<AppInfo[]> {
        let appInfos = await this.getInfos({
            launcher: 0,
            app_id: Not(AppManager.getSharedInstance().getDIDSessionId())
        })
        return appInfos;
    }

    public async getLauncherInfo(): Promise<AppInfo> {
        let infos = await this.getInfos({
            launcher: 1
        });

        if (infos.length > 0) {
            return infos[0];
        }
        else {
            return null;
        }
    }

    public async changeBuiltInToNormal(appId: string): Promise<number> {
        let appRepository = this.helper.getRepository(ManagerDBHelper.APP_TABLE) as Repository<AppInfo>;
        let infos = await appRepository.find({app_id: appId});
        for (let info of infos) {
            info.built_in = 0;
            await appRepository.save(info);
        }
        let count = infos.length;
        return count;
        return 1;
    }

    public async updatePluginAuth(tid: string, plugin: string, authority: number): Promise<number> {
        let pluginRepository = this.helper.getRepository(ManagerDBHelper.AUTH_PLUGIN_TABLE) as Repository<AppInfo.PluginAuth>;
        let plugins = await pluginRepository.find({
            app_tid: tid,
            plugin: plugin
        });
        let count = plugins.length;
        for (let plugin of plugins) {
            plugin.authority = authority;
            await pluginRepository.save(plugin);
        }
        if (count < 1) {
            let newPlugin = new AppInfo.PluginAuth(plugin, authority);
            newPlugin.app_tid = tid; 
            await pluginRepository.save(newPlugin);
            count = 1;
        }
        return count;
    }

    public async updateURLAuth(tid: string, url: string, authority: number): Promise<number> {
        let urlRepository = this.helper.getRepository(ManagerDBHelper.AUTH_URL_TABLE) as Repository<AppInfo.UrlAuth>;
        let urls = await urlRepository.find({
            app_tid: tid,
            url: url
        });
        let count = urls.length;
        for (let url of urls) {
            url.authority = authority;
            await urlRepository.save(url);
        }
        if (count < 1) {
            let newUrl = new AppInfo.UrlAuth(url, authority);
            newUrl.app_tid = tid; 
            await urlRepository.save(newUrl);
            count = 1;
        }
        return count;
    }

    public async updateIntentAuth(tid: string, url: string, authority: number): Promise<number> {
        let intentRepository = this.helper.getRepository(ManagerDBHelper.AUTH_INTENT_TABLE) as Repository<AppInfo.IntentAuth>;
        let intents = await intentRepository.find({
            app_tid: tid,
            url: url
        });
        let count = intents.length;
        for (let intent of intents) {
            intent.authority = authority;
            await intentRepository.save(intent);
        }
        if (count < 1) {
            let newIntent = new AppInfo.IntentAuth(url, authority);
            newIntent.app_tid = tid;
            await intentRepository.save(newIntent);
            count = 1;
        }
        return count;
    }

    public async removeAppInfo(info: AppInfo): Promise<number> {
        let urlRepository = this.helper.getRepository(ManagerDBHelper.AUTH_URL_TABLE) as Repository<AppInfo.UrlAuth>;
        let urls = await urlRepository.find({app_tid: info.tid});
        await urlRepository.remove(urls);

        let intentRepository = this.helper.getRepository(ManagerDBHelper.AUTH_INTENT_TABLE) as Repository<AppInfo.IntentAuth>;
        let intents = await intentRepository.find({app_tid: info.tid});
        await intentRepository.remove(intents);

        let pluginRepository = this.helper.getRepository(ManagerDBHelper.AUTH_PLUGIN_TABLE) as Repository<AppInfo.PluginAuth>;
        let plugins = await pluginRepository.find({app_tid: info.tid});
        await pluginRepository.remove(plugins);

        let iconRepository = this.helper.getRepository(ManagerDBHelper.ICONS_TABLE) as Repository<AppInfo.Icon>;
        let icons = await iconRepository.find({app_tid: info.tid});
        await iconRepository.remove(icons);

        let localeRepository = this.helper.getRepository(ManagerDBHelper.LACALE_TABLE) as Repository<AppInfo.Locale>;
        let locales = await localeRepository.find({app_tid: info.tid});
        await localeRepository.remove(locales);

        let frameworkRepository = this.helper.getRepository(ManagerDBHelper.FRAMEWORK_TABLE) as Repository<AppInfo.Framework>;
        let frameworks = await frameworkRepository.find({app_tid: info.tid});
        await frameworkRepository.remove(frameworks);

        let platformRepository = this.helper.getRepository(ManagerDBHelper.PLATFORM_TABLE) as Repository<AppInfo.Platform>;
        let platforms = await platformRepository.find({app_tid: info.tid});
        await platformRepository.remove(platforms);
        
        let intentFilterRepository = this.helper.getRepository(ManagerDBHelper.INTENT_FILTER_TABLE) as Repository<IntentFilter>;
        let intentFilters = await intentFilterRepository.find({app_id: info.app_id});
        await intentFilterRepository.remove(intentFilters);

        let settingRepository = this.helper.getRepository(ManagerDBHelper.SETTING_TABLE) as Repository<Setting>;
        let settings = await settingRepository.find({app_id: info.app_id});
        await settingRepository.remove(settings);
        
        let startupServiceRepository = this.helper.getRepository(ManagerDBHelper.SERVICE_TABLE) as Repository<AppInfo.StartupService>;
        let startupServices = await startupServiceRepository.find({app_id: info.app_id});
        await startupServiceRepository.remove(startupServices);

        let appRepository = this.helper.getRepository(ManagerDBHelper.APP_TABLE) as Repository<AppInfo>;
        let apps = await appRepository.find({tid: info.tid});
        let count = apps.length;
        await appRepository.remove(apps);
        return count;
    }

    public async getIntentFilter(action: string): Promise<IntentFilter[]> {
        let intentFilterRepository = this.helper.getRepository(ManagerDBHelper.INTENT_FILTER_TABLE) as Repository<IntentFilter>;
        let savedIntentFilters = await intentFilterRepository.find({action: action});
        let intentFilters = new Array<IntentFilter>();

        for (let savedIntentFilter of savedIntentFilters) {
            let startupMode = savedIntentFilter.startupMode;
            let serviceName = null;
            if (startupMode == null) {
                startupMode = AppManager.STARTUP_APP;
            }
            else if (startupMode == AppManager.STARTUP_SERVICE) {
                serviceName = savedIntentFilter.serviceName;
            }
            let newIntentFilter = new IntentFilter(action, startupMode, serviceName);
            //TODO: check if packageId need instead of app_id
            newIntentFilter.packageId = savedIntentFilter.app_id;
            intentFilters.push(newIntentFilter);
        }

        return intentFilters;
    }

    public async setSetting(id: string, key: string, value: any): Promise<number> {
        let ret = 0;
        
        let data: string = null;
        if (value != null) {
            data = JSON.stringify(value);
        }

        let isExsits: boolean = this.getSetting(id, key) != null;
        if (!isExsits) {
            if (value != null) {
                let settingRepository = this.helper.getRepository(ManagerDBHelper.SETTING_TABLE) as Repository<Setting>;
                let newSetting = new Setting(key, data);
                newSetting.app_id = id;
                await settingRepository.save(newSetting);
                ret = 1;
            }
        }
        else {
            let settingRepository = this.helper.getRepository(ManagerDBHelper.SETTING_TABLE) as Repository<Setting>;
            let settings = await settingRepository.find({
                app_id: id,
                key: key
            });
            if (value != null) {
                if (settings.length > 0) {
                    let setting = settings[0];
                    setting.value = data;
                    await settingRepository.save(setting);
                    ret = 1;
                }
            }
            else {
                await settingRepository.remove(settings);
                ret = 1;
            }
        }
        return ret;
    }

    public async getSetting(id: string, key: string): Promise<Setting> {
        let settingRepository = this.helper.getRepository(ManagerDBHelper.SETTING_TABLE) as Repository<Setting>;
        let settings = await settingRepository.find({
            app_id: id,
            key: key
        });
        if (settings.length > 0) {
            if (settings[0].value != null) {
                return settings[0];
            }
        }
        return null;
    }

    public async getSettings(id: string): Promise<Setting[]> {
        let settingRepository = this.helper.getRepository(ManagerDBHelper.SETTING_TABLE) as Repository<Setting>;
        let savedSettings = await settingRepository.find({app_id: id});
        let settings = new Array<Setting>();
        for (let savedSetting of savedSettings) {
            if (savedSetting.value ! = null) {
                settings.push(savedSetting);
            }
        }
        return settings;
    }

    public async setPreference(key: string, value: any): Promise<number> {
        let ret = 0;
        
        let data: string = null;
        if (value != null) {
            data = JSON.stringify(value);
        }

        let isExsits: boolean = this.getPreference(key) != null;
        if (!isExsits) {
            if (value != null) {
                let preferenceRepository = this.helper.getRepository(ManagerDBHelper.PREFERENCE_TABLE) as Repository<Preference>;
                let newPreference = new Preference(key, data);
                await preferenceRepository.save(newPreference);
                ret = 1;
            }
        }
        else {
            let preferenceRepository = this.helper.getRepository(ManagerDBHelper.PREFERENCE_TABLE) as Repository<Preference>;
            let preferences = await preferenceRepository.find({key: key});
            if (value != null) {
                if (preferences.length > 0) {
                    let preference = preferences[0];
                    preference.value = data;
                    await preferenceRepository.save(preference);
                    ret = 1;
                }
            }
            else {
                await preferenceRepository.remove(preferences);
                ret = 1;
            }
        }
        return ret;
    }

    public async resetPreferences() {
        let preferenceRepository = this.helper.getRepository(ManagerDBHelper.PREFERENCE_TABLE) as Repository<Preference>;
        let preferences = await preferenceRepository.find();
        await preferenceRepository.remove(preferences);
    }

    public async getPreference(key: string): Promise<Preference> {
        let preferenceRepository = this.helper.getRepository(ManagerDBHelper.PREFERENCE_TABLE) as Repository<Preference>;
        let preferences = await preferenceRepository.find({key: key});
        if (preferences.length > 0) {
            if (preferences[0].value != null) {
                return preferences[0];
            }
        }
        return null;
    }

    public async getPreferences(): Promise<Preference[]> {
        let preferenceRepository = this.helper.getRepository(ManagerDBHelper.PREFERENCE_TABLE) as Repository<Preference>;
        let savedPreferences = await preferenceRepository.find();
        let preferences = new Array<Preference>();
        for (let savedPreference of savedPreferences) {
            if (savedPreference.value ! = null) {
                preferences.push(savedPreference);
            }
        }
        return preferences;
    }

    public async getApiAuth(appId: string, plugin: string, api: string): Promise<number> {
        let apiRepository = this.helper.getRepository(ManagerDBHelper.AUTH_API_TABLE) as Repository<ApiAuth>;
        let apis = await apiRepository.find({
            app_id: appId,
            plugin: plugin,
            api: api
        });
        if (apis.length > 0) {
            return apis[0].authority;
        }
        return AppInfo.AUTHORITY_NOEXIST;
    }

    public async setApiAuth(appId: string, plugin: string, api: string, auth: number): Promise<number> {
        let ret = 0;

        let isExsits: boolean = this.getApiAuth(appId, plugin, api) != null;
        if (!isExsits) {
            let apiRepository = this.helper.getRepository(ManagerDBHelper.AUTH_API_TABLE) as Repository<ApiAuth>;
            let newApi = new ApiAuth(plugin, api);
            newApi.app_id = appId;
            await apiRepository.save(newApi);
            ret = 1;
        }
        else {
            let apiRepository = this.helper.getRepository(ManagerDBHelper.AUTH_API_TABLE) as Repository<ApiAuth>;
            let apis = await apiRepository.find({
                app_id: appId,
                plugin: plugin,
                api: api
            });
            if (auth != AppInfo.AUTHORITY_NOINIT) {
                for (let api of apis) {
                    api.authority = auth;
                }
                await apiRepository.save(apis);
                ret = 1;
            }
            else {
                await apiRepository.remove(apis);
                ret = 1;
            }
        }
        return ret;
    }

    public async resetApiDenyAuth(appId: string) {
        let apiRepository = this.helper.getRepository(ManagerDBHelper.AUTH_API_TABLE) as Repository<ApiAuth>;
        let apis = await apiRepository.find({
            app_id: appId,
            authority: AppInfo.AUTHORITY_DENY
        });
        await apiRepository.remove(apis);
    }

}
