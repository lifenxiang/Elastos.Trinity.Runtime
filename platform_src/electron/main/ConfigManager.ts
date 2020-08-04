import { BrowserWindow } from 'electron';
import { AppManager } from './AppManager';
import { join as pathJoin } from "path";
import { Utility } from './Utility';
import { app } from 'electron';
import { Log } from './Log';

export class ConfigManager {
    private static LOG_TAG = "ConfigManager";

    private static configManager: ConfigManager;

    private configPreferences: Map<string, any>;
    private window: BrowserWindow = null;

    constructor() {
        this.window = AppManager.getSharedInstance().window;

        try {
            this.parseConfig();
        } catch (e) {
            Log.e(ConfigManager.LOG_TAG, e);
        }

        ConfigManager.configManager = this;
    }

    public static getShareInstance(): ConfigManager {
        if (ConfigManager.configManager == null) {
            ConfigManager.configManager = new ConfigManager();
        }
        return ConfigManager.configManager;
    }

    public parseConfig() {
        let configFile = require(pathJoin(app.getAppPath(), "config", "config.json"));
        this.configPreferences = Utility.getJsonMapFromFile(configFile);
    }

    public getStringValue(key: string, defaultValue: string): string {
        try{
            let value = this.configPreferences.get(key) as string;
            if (value == null) {
                value = defaultValue;
            }
            return value;
        } catch (e) {
            return defaultValue;
        }
    }

    public getBooleanValue(key: string, defaultValue: boolean): boolean {
        try{
            let value = this.configPreferences.get(key) as boolean;
            return value;
        } catch (e) {
            return defaultValue;
        }
    }

    public getStringArrayValue(key: string, defaultValue: string[]): string[] {
        try {
            let array: any[] = this.configPreferences.get(key);
            if (array == null) {
                return defaultValue;
            }

            let value: string[] = [];
            for (var i = 0; i < array.length; i++) {
                value[i] = array[i] as string;
            }
            return value;
        } catch (e) {
            return defaultValue;
        }
    }

    public stringArrayContains(key: string, value: string): boolean {
        try {
            let array: any[] = this.configPreferences.get(key);
            if (array == null) {
                for (var i = 0; i < array.length; i++) {
                    if (value == array[i]) {
                        return true;
                    }
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    }
}