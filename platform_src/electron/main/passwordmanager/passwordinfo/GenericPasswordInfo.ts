import { PasswordInfo } from './PasswordInfo';

export class GenericPasswordInfo extends PasswordInfo {
    public password: string = null;

    public static fromJsonObject(jsonObject: any): PasswordInfo {
        let info: GenericPasswordInfo = new GenericPasswordInfo();

        info.fillWithJsonObject(jsonObject);

        return info;
    }

    
    public asJsonObject(): any {
        try {
            let jsonObject: any = super.asJsonObject();

            jsonObject.password = this.password;

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
        if (jsonObject.password != null) {
            this.password = jsonObject.password;
        }
    }
}
