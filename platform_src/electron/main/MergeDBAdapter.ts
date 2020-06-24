import { AppInfo } from "./AppInfo";
import { ManagerDBAdapter } from "./ManagerDBAdapter";
import { BrowserWindow } from 'electron';

export class MergeDBAdapter {
    window: BrowserWindow = null;
    baseDBAdapter: ManagerDBAdapter = null;
    userDBAdapter: ManagerDBAdapter = null;

    private constructor(window: BrowserWindow) {
        this.window = window;
    }

    public static async create(window: BrowserWindow): Promise<MergeDBAdapter> {
        let adapter = new MergeDBAdapter(window)
        adapter.baseDBAdapter = await ManagerDBAdapter.create(window);
        return adapter;
    }

    public async setUserDBAdapter(path: string) {
        if (path != null) {
            this.userDBAdapter = await ManagerDBAdapter.create(this.window, path);
        }
        else {
            this.userDBAdapter = null;
        }
    }

    public async addAppInfo(info: AppInfo, isShare: boolean): Promise<boolean> {
        if (info != null) {
            if (isShare || info.isBuiltIn || this.userDBAdapter == null) {
                console.log("Adding app info to BASE DB")
                return await this.baseDBAdapter.addAppInfo(info);
            }
            else {
                console.log("Adding app info to USER DB")
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
        console.log("getAppInfos after USER db:", infos.length);

        for (let info of infos) {
            info.share = false;
            list.push(info);
        }

        let baseInfos = await this.baseDBAdapter.getAppInfos();
        console.log("getAppInfos after BASE db:", baseInfos.length);
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

    public changeBuiltInToNormal(appId: string): number {
        return this.baseDBAdapter.changeBuiltInToNormal(appId);
    }

    /*public long updatePluginAuth(long tid, String plugin, int authority) {
        if (userDBAdapter != null) {
            return userDBAdapter.updatePluginAuth(tid, plugin, authority);
        }
        else {
            return 0;
        }
    }

    public long updateURLAuth(long tid, String url, int authority) {
        if (userDBAdapter != null) {
            return userDBAdapter.updateURLAuth(tid, url, authority);
        }
        else {
            return 0;
        }
    }

    public long updateIntentAuth(long tid, String url, int authority) {
        if (userDBAdapter != null) {
            return userDBAdapter.updateIntentAuth(tid, url, authority);
        }
        else {
            return 0;
        }
    }*/

    public removeAppInfo(info: AppInfo, isShare: boolean): number {
        if (this.userDBAdapter != null && !isShare) {
            return this.userDBAdapter.removeAppInfo(info);
        }
        else {
            return this.baseDBAdapter.removeAppInfo(info);
        }
    }

    /*public String[] getIntentFilter(String action) {
        ArrayList<String> list = new ArrayList<String>();
        String[] ids = null;
        if (userDBAdapter != null) {
            ids = userDBAdapter.getIntentFilter(action);
        }

        String[] baseIds = baseDBAdapter.getIntentFilter(action);

        for (String id: ids) {
            list.add(id);
        }

        for (String baseId: baseIds) {
            Boolean needAdd = true;
            for (String id: ids) {
                if (baseId.equals(id)) {
                    needAdd = false;
                    break;
                }
            }
            if (needAdd) {
                list.add(baseId);
            }
        }

        ids = new String[list.size()];
        return list.toArray(ids);
    }

    public long setSetting(String id, String key, Object value) throws Exception {
        if (userDBAdapter != null) {
            return userDBAdapter.setSetting(id, key, value);
        }
        else {
            return baseDBAdapter.setSetting(id, key, value);
        }
    }

    public JSONObject getSetting(String id, String key) throws Exception {
        if (userDBAdapter != null) {
            return userDBAdapter.getSetting(id, key);
        }
        else {
            return baseDBAdapter.getSetting(id, key);
        }
    }

    public JSONObject getSettings(String id) throws Exception {
        if (userDBAdapter != null) {
            return userDBAdapter.getSettings(id);
        }
        else {
            return baseDBAdapter.getSettings(id);
        }
    }

    public long setPreference(String key, Object value) throws Exception {
        if (userDBAdapter != null) {
            return userDBAdapter.setPreference(key, value);
        }
        else {
            return baseDBAdapter.setPreference(key, value);
        }
    }

    public void resetPreferences() {
        if (userDBAdapter != null) {
            userDBAdapter.resetPreferences();
        }
        else {
            baseDBAdapter.resetPreferences();
        }
    }

    public JSONObject getPreference(String key) throws Exception {
        if (userDBAdapter != null) {
            return userDBAdapter.getPreference(key);
        }
        else {
            return baseDBAdapter.getPreference(key);
        }
    }

    public JSONObject getPreferences() throws Exception {
        if (userDBAdapter != null) {
            return userDBAdapter.getPreferences();
        }
        else {
            return baseDBAdapter.getPreferences();
        }
    }

    public int getApiAuth(String appId, String plugin, String api) {
        if (userDBAdapter != null) {
            return userDBAdapter.getApiAuth(appId, plugin, api);
        }
        else {
            return baseDBAdapter.getApiAuth(appId, plugin, api);
        }
    }

    public long setApiAuth(String appId, String plugin, String api, int auth) {
        if (userDBAdapter != null) {
            return userDBAdapter.setApiAuth(appId, plugin, api, auth);
        }
        else {
            return baseDBAdapter.setApiAuth(appId, plugin, api, auth);
        }
    }

    public void resetApiDenyAuth(String appId)  {
        if (userDBAdapter != null) {
            userDBAdapter.resetApiDenyAuth(appId);
        }
        else {
            baseDBAdapter.resetApiDenyAuth(appId);
        }
    }*/
}
