import { PasswordInfo } from './PasswordInfo';

export class AccountPasswordInfo extends PasswordInfo {
    identifier: string = null;
    password: string = null;
    twoFactorKey: string = null;

    public static fromJsonObject(jsonObject: any): PasswordInfo {
        let info: AccountPasswordInfo = new AccountPasswordInfo();

        info.fillWithJsonObject(jsonObject);

        return info;
    }
    public asJsonObject(): any {
        try {
            let jsonObject: any = super.asJsonObject();

            jsonObject.identifier = this.identifier;
            jsonObject.password = this.password;
            jsonObject.twoFactorKey = this.twoFactorKey;

            return jsonObject;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    public fillWithJsonObject(jsonObject: any) {
        // Fill base fields
        super.fillWithJsonObject(jsonObject);

        // Fill specific fields
        if (jsonObject.identifier != null) {
            this.identifier = jsonObject.identifier;
        }
        if (jsonObject.password != null) {
            this.password = jsonObject.password;
        }
        if (jsonObject.twoFactorKey != null) {
            this.twoFactorKey = jsonObject.twoFactorKey;
        }
    }
}