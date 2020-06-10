 /*
  * Copyright (c) 2020 Elastos Foundation
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

import Foundation
import SQLite

class MergeDBAdapter {
    let baseDBAdapter: ManagerDBAdapter;
    var userDBAdapter: ManagerDBAdapter? = nil;
    
    init(_ dataPath: String) {
        baseDBAdapter = ManagerDBAdapter(dataPath);
    }
    
    func setUserDBAdapter(_ databasePath: String?) {
        if (databasePath != nil) {
            userDBAdapter = ManagerDBAdapter(databasePath!);
        }
        else {
            userDBAdapter = nil;
        }
    }

    func addAppInfo(_ info: AppInfo, _ isShare: Bool) throws {
        if (isShare || info.built_in || userDBAdapter == nil) {
            return try baseDBAdapter.addAppInfo(info);
        }
        else {
            return try userDBAdapter!.addAppInfo(info);
        }
    }

    func getAppInfo(_ id: String) throws -> AppInfo? {
        var info: AppInfo? = nil;
        if (userDBAdapter != nil) {
            info = try userDBAdapter!.getAppInfo(id);
        }
        if (info == nil) {
            info = try baseDBAdapter.getAppInfo(id);
            if (info != nil && userDBAdapter != nil) {
                try userDBAdapter!.getAppAuthInfo(info!);
            }
        }
        else {
            info!.share = false;
        }
        return info;
    }

    func getAppInfos() throws -> [AppInfo] {
        var list = [AppInfo]();

        var infos: [AppInfo] = [AppInfo]();
        if (userDBAdapter != nil) {
            infos = try userDBAdapter!.getAppInfos();
        }
        for info in infos {
            info.share = false;
            list.append(info);
        }

        let baseInfos = try baseDBAdapter.getAppInfos();
        for baseInfo in baseInfos {
            var needAdd = true;
            for info in infos {
                if (baseInfo.app_id == info.app_id) {
                    needAdd = false;
                    break;
                }
            }
            if (needAdd) {
                list.append(baseInfo);
                if (userDBAdapter != nil) {
                    try userDBAdapter!.getAppAuthInfo(baseInfo);
                }
            }
        }
        
        return list;
    }

    func getLauncherInfo() throws -> AppInfo? {
        return try baseDBAdapter.getLauncherInfo();
    }

    func changeBuiltInToNormal(_ appId: String) throws {
        return try baseDBAdapter.changeBuiltInToNormal(appId);
    }

    func updatePluginAuth(_ item: PluginAuth, _ auth: Int) throws {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.updatePluginAuth(item, auth);
        }
    }

    func updateUrlAuth(_ tid: Int64, _ url: String, _ auth: Int) throws {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.updateUrlAuth(tid, url, auth);
        }
    }

    func removeAppInfo(_ info: AppInfo, _ isShare: Bool) throws {
        if (userDBAdapter != nil && !isShare) {
            return try userDBAdapter!.removeAppInfo(info);
        }
        else {
            return try baseDBAdapter.removeAppInfo(info);
        }
    }

    func getIntentFilter(_ act: String) throws -> [String] {
        var list = [String]();

        var ids: [String] = [String]();
        if (userDBAdapter != nil) {
            ids = try userDBAdapter!.getIntentFilter(act);
        }
        for id in ids {
            list.append(id);
        }

        let baseIds = try baseDBAdapter.getIntentFilter(act);
        for baseId in baseIds {
            var needAdd = true;
            for id in ids {
                if (baseId == id) {
                    needAdd = false;
                    break;
                }
            }
            if (needAdd) {
                list.append(baseId);
            }
        }
        
        return list;
    }

    func setSetting(_ id: String, _ k: String, _ v: Any?) throws {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.setSetting(id, k, v);
        }
        else {
            return try baseDBAdapter.setSetting(id, k, v);
        }
    }

    func getSetting(_ id: String, _ k: String) throws -> [String: Any]? {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.getSetting(id, k);
        }
        else {
            return try baseDBAdapter.getSetting(id, k);
        }
    }

    func getSettings(_ id: String) throws -> [String: Any] {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.getSettings(id);
        }
        else {
            return try baseDBAdapter.getSettings(id);
        }
    }

    func setPreference(_ k: String, _ v: Any?) throws {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.setPreference(k, v);
        }
        else {
            return try baseDBAdapter.setPreference(k, v);
        }
    }

    func resetPreferences() throws {
        if (userDBAdapter != nil) {
            try userDBAdapter!.resetPreferences();
        }
        else {
            try baseDBAdapter.resetPreferences();
        }
    }

    func getPreference(_ k: String) throws -> [String: Any]? {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.getPreference(k);
        }
        else {
            return try baseDBAdapter.getPreference(k);
        }
    }

    func getPreferences() throws -> [String: Any] {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.getPreferences();
        }
        else {
            return try baseDBAdapter.getPreferences();
        }
    }
    
    func getApiAuth(_ appId: String, _ plugin: String, _ api: String) throws -> Int? {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.getApiAuth(appId, plugin, api);
        }
        else {
            return try baseDBAdapter.getApiAuth(appId, plugin, api);
        }
    }
    
    func setApiAuth(_ appId: String, _ plugin: String, _ api: String, _ auth: Int?) throws {
        if (userDBAdapter != nil) {
            return try userDBAdapter!.setApiAuth(appId, plugin, api, auth);
        }
        else {
            return try baseDBAdapter.setApiAuth(appId, plugin, api, auth);
        }
    }
    
    func resetApiDenyAuth(_ appId: String)  {
        if (userDBAdapter != nil) {
            userDBAdapter!.resetApiDenyAuth(appId);
        }
        else {
            baseDBAdapter.resetApiDenyAuth(appId);
        }
    }
 }
