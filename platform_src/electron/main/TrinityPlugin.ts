import { AppManager } from './AppManager';
import { AppInfo } from './AppInfo';

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

    constructor(appId: string) {
        this.appId = appId;
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
}