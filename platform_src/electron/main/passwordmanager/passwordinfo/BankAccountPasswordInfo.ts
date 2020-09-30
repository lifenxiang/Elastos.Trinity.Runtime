import { PasswordInfo } from "./PasswordInfo";

export class BankAccountPasswordInfo extends PasswordInfo {
    accountOwner: string = null;
    iban: string = null;
    swift: string = null;
    bic: string = null;

    public static fromJsonObject(jsonObject: any): PasswordInfo {
        let info: BankAccountPasswordInfo = new BankAccountPasswordInfo();

        info.fillWithJsonObject(jsonObject);

        return info;
    }

    public asJsonObject(): any {
        try {
            let jsonObject: any = super.asJsonObject();

            jsonObject.accountOwner = this.accountOwner;
            jsonObject.iban = this.iban;
            jsonObject.swift = this.swift;
            jsonObject.bic = this.bic;

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
        if (jsonObject.accountOwner != null) {
            this.accountOwner = jsonObject.accountOwner;
        }
        if (jsonObject.iban != null) {
            this.iban = jsonObject.iban;
        }
        if (jsonObject.swift != null) {
            this.swift = jsonObject.swift;
        }
        if (jsonObject.bic != null) {
            this.bic = jsonObject.bic;
        }
    }
}
