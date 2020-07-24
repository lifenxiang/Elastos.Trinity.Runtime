import { AppInfo } from "./AppInfo";
import { ManagerDBAdapter } from "./ManagerDBAdapter";
import { BrowserWindow } from 'electron';
import { IntentFilter } from './IntentFilter';
import { Setting } from './Setting';
import { Preference } from './Preference';

export class MergeDBAdapter {
    window: BrowserWindow = null;
    baseDBAdapter: ManagerDBAdapter = null;
    userDBAdapter: ManagerDBAdapter = null;

    constructor(window: BrowserWindow) {
        this.window = window;
        this.baseDBAdapter = new ManagerDBAdapter(window);
    }

    public static async newInstance(window: BrowserWindow): Promise<MergeDBAdapter> {
        let mergeDBAdapter = new MergeDBAdapter(window);
        await mergeDBAdapter.init();
        return mergeDBAdapter;
    }

    private async init() {
        this.baseDBAdapter = await ManagerDBAdapter.newInstance(this.window);
    }

    public async setUserDBAdapter(path: string) {
        if (path != null) {
            this.userDBAdapter = await ManagerDBAdapter.newInstance(this.window, path);
        }
        else {
            this.userDBAdapter = null;
        }
    }

    public async addAppInfo(info: AppInfo, isShare: boolean): Promise<boolean> {
        if (info != null) {
            if (isShare || info.built_in == 1 || this.userDBAdapter == null) {
                //console.log("Adding app info to BASE DB")
                return await this.baseDBAdapter.addAppInfo(info);
            }
            else {
                //console.log("Adding app info to USER DB")
                return await this.userDBAdapter.addAppInfo(info);
            }
        }
        else {
            return false;
        }
    }

    public async getAppInfo(id: string): Promise<AppInfo> {
        let info: AppInfo = null;
        if (this.userDBAdapter != null) {
            info = await this.userDBAdapter.getAppInfo(id);
        }
        if (info == null) {
            info = await this.baseDBAdapter.getAppInfo(id);
            if (info != null && this.userDBAdapter != null) {
                this.userDBAdapter.getAppAuthInfo(info);
            }
        }
        else {
            info.share = false;
        }
        return info;
    }

    public async getAppInfos(): Promise<AppInfo[]> {
        let list = new Array<AppInfo>();
        let infos = new Array<AppInfo>();
        if (this.userDBAdapter != null) {
            infos = await this.userDBAdapter.getAppInfos();
        }
        //console.log("getAppInfos after USER db:", infos.length);

        for (let info of infos) {
            info.share = false;
            list.push(info);
        }

        let baseInfos = await this.baseDBAdapter.getAppInfos();
        //console.log("getAppInfos after BASE db:", baseInfos.length);
        for (let baseInfo of baseInfos) {
            let needAdd = true;
            for (let info of infos) {
                if (baseInfo.app_id == info.app_id) {
                    needAdd = false;
                    break;
                }
            }
            if (needAdd) {
                list.push(baseInfo);
                if (this.userDBAdapter != null) {
                    await this.userDBAdapter.getAppAuthInfo(baseInfo);
                }
            }
        }
 
        return list;
    }

    public async getLauncherInfo(): Promise<AppInfo> {
        return this.baseDBAdapter.getLauncherInfo();
    }

    public async changeBuiltInToNormal(appId: string): Promise<number> {
        return this.baseDBAdapter.changeBuiltInToNormal(appId);
    }

    public async updatePluginAuth(tid: string, plugin: string, authority: number): Promise<number> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.updatePluginAuth(tid, plugin, authority);
        }
        else {
            return 0;
        }
    }

    public async updateURLAuth(tid: string, url: string, authority: number): Promise<number> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.updateURLAuth(tid, url, authority);
        }
        else {
            return 0;
        }
    }

    public async updateIntentAuth(tid: string, url: string, authority: number): Promise<number> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.updateIntentAuth(tid, url, authority);
        }
        else {
            return 0;
        }
    }

    public removeAppInfo(info: AppInfo, isShare: boolean): Promise<number> {
        if (this.userDBAdapter != null && !isShare) {
            return this.userDBAdapter.removeAppInfo(info);
        }
        else {
            return this.baseDBAdapter.removeAppInfo(info);
        }
    }

    public async getIntentFilter(action: string): Promise<IntentFilter[]> {
        let list = new Array<IntentFilter>();
        let filters = null;
        if (this.userDBAdapter != null) {
            filters = await this.userDBAdapter.getIntentFilter(action);
        }

        let baseFilters = await this.baseDBAdapter.getIntentFilter(action);

        for (let filter of filters) {
            list.push(filter);
        }

        for (let baseFilter of baseFilters) {
            let needAdd = true;
            for (let filter of filters) {
                if (baseFilter.packageId == filter.packageId) {
                    needAdd = false;
                    break;
                }
            }
            if (needAdd) {
                list.push(baseFilter);
            }
        }

        return list;
    }

    public async setSetting(id: string, key: string, value: any): Promise<number> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.setSetting(id, key, value);
        }
        else {
            return this.baseDBAdapter.setSetting(id, key, value);
        }
    }

    public async getSetting(id: string, key: string): Promise<Setting> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.getSetting(id, key);
        }
        else {
            return this.baseDBAdapter.getSetting(id, key);
        }
    }

    public async getSettings(id: string): Promise<Setting[]> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.getSettings(id);
        }
        else {
            return this.baseDBAdapter.getSettings(id);
        }
    }

    public async setPreference(key: string, value: any): Promise<number> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.setPreference(key, value);
        }
        else {
            return this.baseDBAdapter.setPreference(key, value);
        }
    }

    public async resetPreferences() {
        if (this.userDBAdapter != null) {
            this.userDBAdapter.resetPreferences();
        }
        else {
            this.baseDBAdapter.resetPreferences();
        }
    }

    public async getPreference(key: string): Promise<any> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.getPreference(key);
        }
        else {
            return this.baseDBAdapter.getPreference(key);
        }
    }

    public async getPreferences(): Promise<any> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.getPreferences();
        }
        else {
            return this.baseDBAdapter.getPreferences();
        }
    }

    public async getApiAuth(appId: string, plugin: string, api: string): Promise<number> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.getApiAuth(appId, plugin, api);
        }
        else {
            return this.baseDBAdapter.getApiAuth(appId, plugin, api);
        }
    }

    public async setApiAuth(appId: string, plugin: string, api: string, auth: number): Promise<number> {
        if (this.userDBAdapter != null) {
            return this.userDBAdapter.setApiAuth(appId, plugin, api, auth);
        }
        else {
            return this.baseDBAdapter.setApiAuth(appId, plugin, api, auth);
        }
    }

    public async resetApiDenyAuth(appId: string) {
        if (this.userDBAdapter != null) {
            this.userDBAdapter.resetApiDenyAuth(appId);
        }
        else {
            this.baseDBAdapter.resetApiDenyAuth(appId);
        }
    }

}
