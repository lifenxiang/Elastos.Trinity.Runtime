import { PasswordInfo } from './passwordinfo/PasswordInfo';
import { PasswordType } from './PasswordType';
import { GenericPasswordInfo } from './passwordinfo/GenericpasswordInfo';
import { WifiPasswordInfo } from './passwordinfo/WifiPasswordInfo';
import { BankAccountPasswordInfo } from './passwordinfo/BankAccountPasswordInfo';
import { BankCardPasswordInfo } from './passwordinfo/BankCardPasswordInfo';
import { AccountPasswordInfo } from './passwordinfo/AccountPasswordInfo';

export class PasswordInfoBuilder {
    public static buildFromType(jsonObject: any): PasswordInfo {
        if (jsonObject.type == null) {
            throw new Error("JSON object has no type information");
        }

        let type = PasswordType.fromValue(jsonObject.type as number).value;
        switch (type) {
            case PasswordType.GENERIC_PASSWORD:
                return GenericPasswordInfo.fromJsonObject(jsonObject);
            case PasswordType.WIFI:
                return WifiPasswordInfo.fromJsonObject(jsonObject);
            case PasswordType.BANK_ACCOUNT:
                return BankAccountPasswordInfo.fromJsonObject(jsonObject);
            case PasswordType.BANK_CARD:
                return BankCardPasswordInfo.fromJsonObject(jsonObject);
            case PasswordType.ACCOUNT:
                return AccountPasswordInfo.fromJsonObject(jsonObject);
            default:
                throw new Error("Unknown password info type "+type);
        }
    }
}
