import { AppInfo } from "./AppInfo";
import { ManagerDBAdapter } from "./ManagerDBAdapter";
import { BrowserWindow } from 'electron';

export class MergeDBAdapter {
    window: BrowserWindow = null;
    baseDBAdapter: ManagerDBAdapter = null;
    userDBAdapter: ManagerDBAdapter = null;

    public constructor(window: BrowserWindow) {
        this.window = window;
        this.baseDBAdapter = new ManagerDBAdapter(window);
    }

    public setUserDBAdapter(path: string) {
        if (path != null) {
            this.userDBAdapter = new ManagerDBAdapter(this.window, path);
        }
        else {
            this.userDBAdapter = null;
        }
    }

    public addAppInfo(info: AppInfo, isShare: boolean): boolean {
        if (info != null) {
            if (isShare || info.built_in || this.userDBAdapter == null) {
                return this.baseDBAdapter.addAppInfo(info);
            }
            else {
                return this.userDBAdapter.addAppInfo(info);
            }
        }
        else {
            return false;
        }
    }

    public getAppInfo(id: string): AppInfo {
        let info: AppInfo = null;
        if (this.userDBAdapter != null) {
            info = this.userDBAdapter.getAppInfo(id);
        }
        if (info == null) {
            info = this.baseDBAdapter.getAppInfo(id);
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

        for (let info of infos) {
            info.share = false;
            list.push(info);
        }

        let baseInfos = await this.baseDBAdapter.getAppInfos();
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
                    this.userDBAdapter.getAppAuthInfo(baseInfo);
                }
            }
        }

        return list;
    }

    public getLauncherInfo(): AppInfo {
        return this.baseDBAdapter.getLauncherInfo();
    }

    /*public int changeBuiltInToNormal(String appId) {
        return baseDBAdapter.changeBuiltInToNormal(appId);
    }

    public long updatePluginAuth(long tid, String plugin, int authority) {
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
    }

    public int removeAppInfo(AppInfo info, Boolean isShare) {
        if (userDBAdapter != null && !isShare) {
            return userDBAdapter.removeAppInfo(info);
        }
        else {
            return baseDBAdapter.removeAppInfo(info);
        }
    }

    public String[] getIntentFilter(String action) {
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
