import { PasswordType } from '../PasswordType';

export abstract class PasswordInfo {
    /**
     * Unique key, used to identity the password info among other.
     */
    public key: string;

    /**
     * Password type, that defines the format of contained information.
     */
    public type: PasswordType;

    /**
     * Name used while displaying this info. Either set by users in the password manager app
     * or by apps, when saving passwords automatically.
     */
    public displayName: string;

    /**
     * Package ID of the application/capsule that saved this password information.
     * READ-ONLY
     */
    public appID: string;

    /**
     * List of any kind of app-specific additional information for this password entry.
     */
    public custom: any;

    public asJsonObject(): any {
        try {
            let jsonObj: any = {};
            jsonObj.key = this.key;
            jsonObj.type = this.type.value;
            jsonObj.displayName = this.displayName;
            jsonObj.custom = this.custom;
            jsonObj.appID = this.appID;
            return jsonObj;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    public fillWithJsonObject(jsonObj: any) {
        if ((jsonObj.key == null) || (jsonObj.type == null) || (jsonObj.displayName == null))
            throw new Error("Invalid password info, some base fields are missing");

        this.key = jsonObj.key as string;
        this.type = PasswordType.fromValue(jsonObj.type as number);
        this.displayName = jsonObj.displayName as string;

        if (jsonObj.custom != null) {
            this.custom = jsonObj.custom;
        }

        // SECURITY NOTE - Don't fill with appID. AppID is filled automatically.
    }
}