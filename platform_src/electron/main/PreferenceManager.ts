import { app } from 'electron';

import { MergeDBAdapter } from "./MergeDBAdapter";
import { AppManager } from "./AppManager";
import { Log } from './Log';
import { Utility } from './Utility';
import { join as pathJoin } from "path";
import { UIStyling } from './UIStyling';

export class PreferenceManager {
    private static LOG_TAG = "PreferenceManager";
    private static preferenceManager: PreferenceManager;

    private defaultPreferences = new Map<string, any>();
    dbAdapter: MergeDBAdapter = null;
    public versionChanged = false;

    constructor() {
        this.dbAdapter = AppManager.getSharedInstance().getDBAdapter();
        try {
            this.parsePreferences();
        } catch (e) {
            Log.e(PreferenceManager.LOG_TAG, e);
        }
        PreferenceManager.preferenceManager = this;
    }

    public static getSharedInstance(): PreferenceManager {
        if (PreferenceManager.preferenceManager == null) {
            PreferenceManager.preferenceManager = new PreferenceManager();
        }
        return PreferenceManager.preferenceManager;
    }

    public async parsePreferences() {
        let preferencesFile = require(pathJoin(app.getAppPath(), "config", "preferences.json"));
        this.defaultPreferences = Utility.getJsonMapFromFile(preferencesFile);
        this.defaultPreferences.set("version", await this.getNativeSystemVersion());
    }

    private getDefaultValue(key: string): any {
        let value = null;
        if (this.defaultPreferences.has(key)) {
            value = this.defaultPreferences.get(key);
        }
        return value;
    }

    public async getPreference(key: string): Promise<any> {
        let defaultValue = this.getDefaultValue(key);
        if (defaultValue == null) {
            Log.e(PreferenceManager.LOG_TAG, "getPreference error: no such preference!");
        }

        let ret = await this.dbAdapter.getPreference(key);

        if (ret == null) {
            ret = {
                key: key,
                value: defaultValue
            };
        }

        if (key == "locale.language" && ret.value == "native system") {
            //TODO: use en for dev
            //ret.value = app.getLocale();
            ret.value = "en";
        }

        return ret;
    }

    public async getPreferences(): Promise<any> {
        let values = await this.dbAdapter.getPreferences();

        this.defaultPreferences.forEach((value: any, key: string) => {
            if (values[key] == null) {
                values[key] = value;
            }

            if (key == "locale.language" && values.key == "native system") {
                //TODO: use en for dev
                //values[key] = app.getLocale();
                values[key] = "en";
            }
        });

        return values;
    }

    public static refuseSetPreferences: string[] = [
        "version"
    ];

    private isAllowSetPreference(key: string): boolean {
        for (let item of PreferenceManager.refuseSetPreferences) {
            if (item == key) {
                return false;
            }
        }
        return true;
    }

    public setPreference(key: string, value: any) {
        console.log("setPreference key: "+key+", value: "+value);
        if (!this.isAllowSetPreference(key)) {
            Log.e(PreferenceManager.LOG_TAG, "setPreference error: " + key + " can't be set!");
            return;
        }

        let defaultValue = this.getDefaultValue(key);
        if (defaultValue) {
            Log.e(PreferenceManager.LOG_TAG, "setPreference error: no such preference!");
            return;
        }

        if (key == "ui.darkmode") {
            this.prepareUIStyling(value);
        }

        let data = {
            key: key,
            value: value
        };
        let json = {
            action: "preferenceChanged",
            data: data
        };

        //TODO: need implementation in AppManager
        //AppManager.getSharedInstance();
    }

    /**
     * From a given base context (ex: activity), returns a new context on which the default locale/language has been
     * modified to match trinity's language, so that native screens and dialogs can show native strings in the right language.
     */
    public getLocalizedContext(): any {
        //TODO: check if need implementation in typescript
    }

    public async getDeveloperMode(): Promise<boolean> {
        return await this.getBooleanValue("developer.mode", false);
    }

    public setDeveloperMode(value: boolean) {
        this.setPreference("developer.mode", value);
    }

    public async getCurrentLocale(): Promise<string> {
        let value = await this.getPreference("locale.language");
        let ret = value.value;
        if (ret == "native system") {
            //TODO: use en for dev
            //ret = app.getLocale();
            ret = "en";
        }

        return ret;
    }

    public setCurrentLocale(code: string) {
        this.setPreference("locale.language", code);
        let json = {
            action: "currentLocaleChanged",
            data: code
        };
        //TODO: need implementation in AppManager
        //AppManager.getSharedInstance();
    }

    public async getNativeSystemVersion(): Promise<string> {
        //TODO: get app version from electron context
        let versionName = "0.0.1";

        let json = await this.dbAdapter.getPreference("version");
        let version = null;
        if (json != null) {
            version = json.value;
        }

        if (json == null || versionName != version) {
            this.dbAdapter.setPreference("version", versionName);
            this.versionChanged = true;
        }

        return versionName;
    }

    public getVersion(): string {
        let version = "";
        if (this.defaultPreferences.has("version")) {
            version = this.defaultPreferences.get("version");
        }
        return version;
    }

    public getNetworkType(): Promise<string> {
        return this.getStringValue("chain.network.type", "MainNet");
    }

    public getNetworkConfig(): Promise<string> {
        return this.getStringValue("chain.network.config", "");
    }

    public getDIDResolver(): Promise<string> {
        return this.getStringValue("did.resolver", "http://api.elastos.io:20606");
    }

    public async getStringValue(key: string, defaultValue: string): Promise<string> {
        let value: string = null;
        let item = await this.getPreference(key);
        value = item.value;

        if (value == null) {
            value = defaultValue;
        }

        return value;
    }

    public async getBooleanValue(key: string, defaultValue: boolean): Promise<boolean> {
        let value: boolean = null;
        let item = await this.getPreference(key);
        value = item.value;

        if (value == null) {
            value = defaultValue;
        }

        return value;
    }

    public async getStringArrayValue(key: string, defaultValue: string[]): Promise<string[]> {
        let value: string[] = null;
        let item = await this.getPreference(key);
        let array = item.value;
        if (array != null) {
            value = [];
            for (var i = 0; i < array.length; i++) {
                value[i] = array[i];
            }
        }

        if (value == null) {
            value = defaultValue;
        }

        return value;
    }

    private prepareUIStyling(useDarkMode: boolean) {
        UIStyling.prepare(useDarkMode);
    }

    public getDeveloperInstallVerify(): Promise<boolean> {
        if (this.getDeveloperMode()) {
            return this.getBooleanValue("developer.install.verifyDigest", true);
        }
    }
}
