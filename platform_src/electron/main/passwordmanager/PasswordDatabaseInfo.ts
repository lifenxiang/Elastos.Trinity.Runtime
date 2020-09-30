import { PasswordInfo } from './passwordinfo/PasswordInfo';
import { PasswordInfoBuilder } from './PasswordInfoBuilder';

/**
 * Database JSON format:
 *
 * {
 *     "applications": {
 *          "APPIID1": {
 *              "passwordentries": [
 *                  {
 *                      RAW_USER_OBJECT
 *                  }
 *              ]
 *          }
 *     }
 * }
 *
 * We work directly with raw JSONObjects to make it easier later to maintain the structure, add new fields,
 * handle specific or missing items.
 */
export class PasswordDatabaseInfo {
    private static APPLICATIONS_KEY: string = "applications";
    private static PASSWORD_ENTRIES_KEY: string = "passwordentries";
    rawJson: any;
    activeMasterPassword: string = null;
    openingTime: Date = null;

    constructor() {
        this.openingTime = new Date();
    }

    static createEmpty(): PasswordDatabaseInfo {
        try {
            let info: PasswordDatabaseInfo = new PasswordDatabaseInfo();
            let applications: any = {};
            info.rawJson = {};
            info.rawJson.APPLICATIONS_KEY = applications;
            return info;
        }
        catch (e) {
            console.log(e);
            return null;
        }
    }

    public static fromJson(json: string): PasswordDatabaseInfo {
        let info: PasswordDatabaseInfo = new PasswordDatabaseInfo();
        info.rawJson = JSON.parse(json);
        return info;
    }

    public getPasswordInfo(appID: string, key: string): PasswordInfo{
        let appIDContent: any = this.getAppIDContent(appID);
        if (appIDContent == null) {
            // No entry for this app ID yet, so we can't find the requested key
            return null;
        }

        let passwordEntries: any[] = appIDContent.getJSONArray(PasswordDatabaseInfo.PASSWORD_ENTRIES_KEY);
        let entry: any = this.passwordEntry(passwordEntries, key);
        if (entry == null) {
            // No such entry exists
            return null;
        }

        let info: PasswordInfo = PasswordInfoBuilder.buildFromType(entry);
        if (info != null) {
            info.appID = appID;
        }
        return info;
    }

    public setPasswordInfo(appID: string, info: PasswordInfo) {
        let appIDContent: any = this.getAppIDContent(appID);
        if (appIDContent == null) {
            // No entry for this app ID yet, create one and add it
            appIDContent = this.createdEmptyAppIDContent();
            let applications: any = this.rawJson.getJSONObject(PasswordDatabaseInfo.APPLICATIONS_KEY);
            applications.set(appID, appIDContent);
        }

        let passwordEntries: any = appIDContent.getJSONArray(PasswordDatabaseInfo.PASSWORD_ENTRIES_KEY);
        if (this.keyInPasswordEntries(passwordEntries, info.key)) {
            // This entry already exists. Delete it first before re-adding its updated version.
            this.deletePasswordEntryFromKey(passwordEntries, info.key);
        }
        this.addPasswordEntry(passwordEntries, info);
    }

    public getAllPasswordInfo(): Array<PasswordInfo> {
        let applications: any = this.rawJson.getJSONObject(PasswordDatabaseInfo.APPLICATIONS_KEY);

        let infos: Array<PasswordInfo> = new Array();
        applications.forEach((value: any, key: string) => {
            let appID: string = key;

            let appIDContent: any = this.getAppIDContent(appID);
            if (appIDContent != null) {
                let passwordEntries: any[] = appIDContent[PasswordDatabaseInfo.PASSWORD_ENTRIES_KEY];
                for (let i=0; i<passwordEntries.length; i++) {
                    let entry: any= passwordEntries[i];
                    let info: PasswordInfo = PasswordInfoBuilder.buildFromType(entry);
                    if (info != null) {
                        info.appID = appID;
                        infos.push(info);
                    }
                }
            }

        });
        return infos;
    }

    public deletePasswordInfo(appID: string, key: string) {
        let appIDContent: any = this.getAppIDContent(appID);
        if (appIDContent == null) {
            // No entry for this app ID yet, so we can't find the requested key
            return;
        }

        let passwordEntries: any[] = appIDContent[PasswordDatabaseInfo.PASSWORD_ENTRIES_KEY];
        this.deletePasswordEntryFromKey(passwordEntries, key);
    }

    private getAppIDContent(appID: string): any {
        let applications: any = this.rawJson[PasswordDatabaseInfo.APPLICATIONS_KEY];
        if (applications.appID != null) {
            return applications[appID];
        }
        else {
            return null;
        }
    }

    private createdEmptyAppIDContent(): any {
        let appIDContent: any = {};
        appIDContent.set(PasswordDatabaseInfo.PASSWORD_ENTRIES_KEY, []);
        return appIDContent;
    }

    private passwordEntry(entries: any[], key: string): any {
        for (let i=0; i<entries.length; i++) {
            let info: any = entries[i];
            if (info.key == key)
                return info;
        }
        return null;
    }

    private passwordEntryIndex(entries: any[], key: string): number {
        for (let i=0; i<entries.length; i++) {
            let info: any = entries[i];
            if (info.key == key)
                return i;
        }
        return -1;
    }

    private keyInPasswordEntries(entries: any[], key: string): boolean{
        return this.passwordEntryIndex(entries, key) >= 0;
    }

    private deletePasswordEntryFromKey(entries: any[], key: string) {
        let deletionIndex: number = this.passwordEntryIndex(entries, key);
        if (deletionIndex >= 0)
            entries.splice(deletionIndex, 1);
    }

    private addPasswordEntry(entries: any[], info: PasswordInfo) {
        let json: any = info.asJsonObject();
        if (json == null) {
            throw new DOMException("Unable to create JSON object from password info");
        }

        entries.push(json);
    }

    /**
     * Closes the password database and makes things secure.
     */
    lock() {
        this.rawJson = null;
        this.activeMasterPassword = null;
        // NOTE: nothing else to do for now.
    }
}
