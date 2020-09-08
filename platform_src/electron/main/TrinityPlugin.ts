import { AppManager } from './AppManager';
import { AppInfo } from './AppInfo';
import { WebViewFragment } from './WebViewFragment';

export type SuccessCallback = (args?: any)=>void;
export type ErrorCallback = (args?: any)=>void;

export class TrinityPlugin {
    public dataPath: string = null;
    public appPath: string = null;
    public tempPath: string = null;
    public configPath: string = null;
    private appInfo: AppInfo = null;
    public appManager: AppManager = null;
    protected appId: string;
    protected did: string;
    protected viewFragment: WebViewFragment = null;
    protected startupMode: string = AppManager.STARTUP_APP;
    protected serviceName: string = null;
    protected modeId: string = null;

    constructor(appId: string) {
        this.appId = appId;
    }

    public setFragment(fragment: WebViewFragment) {
        this.viewFragment = fragment;
        this.startupMode = fragment.startupMode;
        this.serviceName = fragment.serivceName;
        this.setInfo(fragment.appInfo);
        this.modeId = fragment.modeId;
    }

    public async setInfo(info: AppInfo) {
        this.appInfo = info;
        this.appManager = AppManager.getSharedInstance();
        this.appPath = this.appManager.getAppPath(info);
        this.dataPath = await this.appManager.getDataPath(info.app_id);
        this.configPath = this.appManager.getConfigPath();
        this.tempPath = await this.appManager.getTempPath(info.app_id);
        this.appId = info.app_id;
        this.did = this.appManager.getDID();
    }

    public getModeId(): string {
        if (this.modeId == null) {
            this.modeId = this.appId;
        }
        return this.modeId;
    }

    //TODO: imple
    public isAllowAccess(url: string): boolean {
        return true;
    }

    public getDataPath(): string {
        return this.dataPath;
    }

    //TODO: check canonicalPath
    private getCanonicalDir(path: string, header: string): string {
        /*File file = new File(path);
        path = file.getCanonicalPath();*/
        
        if (header == (path + "/")) {
            return "";
        }

        if (!header.startsWith("/")) {
            path = path.substring(1);
        }
        if (!path.startsWith(header)) {
            throw new Error("Dir is invalid!");
        }
        let dir = path.substring(header.length);
        return dir;
    }

    //TODO: finish it
    public async getCanonicalPath(path: string): Promise<string> {
        let ret = null;
        if (path.startsWith("trinity://")) {
            let subPath = path.substring(10);
            let id = null;
            let _appPath = this.appPath, _dataPath = this.dataPath, _tempPath = this.tempPath;
            if (!(path.startsWith("trinity:///"))) {
                let index = subPath.indexOf("/");
                if (index != -1) {
                    id = subPath.substring(0, index);
                    subPath = subPath.substring(index);

                    let info = await this.appManager.getAppInfo(id);
                    if (info == null) {
                        id = null;
                    }
                    else {
                        _appPath = this.appManager.getAppPath(info);
                        _dataPath = await this.appManager.getDataPath(info.app_id);
                        _tempPath = await this.appManager.getTempPath(info.app_id);
                    }
                }
            }
            else {
                id = this.appInfo.app_id;
            }

            if (id != null) {
                if (subPath.startsWith("/asset/")) {
                    let dir = this.getCanonicalDir(subPath, "/asset/");
                    ret = _appPath + dir;
                } else if (subPath.startsWith("/data/")) {
                    let dir = this.getCanonicalDir(subPath, "/data/");
                    ret = _dataPath + dir;
                } else if (subPath.startsWith("/temp/")) {
                    let dir = this.getCanonicalDir(subPath, "/temp/");
                    ret = _tempPath + dir;
                }
            }
        }
        else if ((path.indexOf("://") != -1)) {
            if (!(path.startsWith("asset://")) && this.isAllowAccess(path)) {
                ret = path;
            }
        }
        else if (!path.startsWith("/")) {
            let dir = this.getCanonicalDir("/asset/" + path, "/asset/");
            ret = this.appPath + dir;
        }

        if (ret == null) {
            throw new Error("Dir is invalid!");
        }
        return ret;
    }
}