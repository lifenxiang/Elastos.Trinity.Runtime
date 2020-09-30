import { PasswordInfo } from './PasswordInfo';

export class WifiPasswordInfo extends PasswordInfo {
    wifiSSID: string = null;
    wifiPassword: string = null;

    public static fromJsonObject(jsonObject: any): PasswordInfo {
        let info: WifiPasswordInfo = new WifiPasswordInfo();

        info.fillWithJsonObject(jsonObject);

        return info;
    }

    public asJsonObject(): any {
        try {
            let jsonObject: any = super.asJsonObject();

            jsonObject.wifiSSID = this.wifiSSID;
            jsonObject.wifiPassword = this.wifiPassword;

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
        if (jsonObject.wifiSSID != null) {
            this.wifiSSID = jsonObject.wifiSSID;
        }
        if (jsonObject.wifiPassword != null ) {
            this.wifiPassword = jsonObject.wifiPassword;
        }
    }

}


