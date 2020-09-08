import { PasswordInfo } from './PasswordInfo';
import { BankCardType } from './BankCardType';

export class BankCardPasswordInfo extends PasswordInfo {
    private cardType: BankCardType = null;
    private accountOwner: string = null;
    private cardNumber: string = null;
    private expirationDate: string = null;
    private cvv: string = null;
    private bankName: string = null;

    public static fromJsonObject(jsonObject: any): PasswordInfo {
        let info: BankCardPasswordInfo = new BankCardPasswordInfo();

        info.fillWithJsonObject(jsonObject);

        return info;
    }

   
    public asJsonObject(): any {
        try {
            let jsonObject: any = super.asJsonObject();

            jsonObject.cardType = this.cardType.value;
            jsonObject.accountOwner = this.accountOwner;
            jsonObject.cardNumber = this.cardNumber;
            jsonObject.expirationDate = this.expirationDate;
            jsonObject.cvv = this.cvv;
            jsonObject.bankName = this.bankName;

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
        if (jsonObject.type != null) {
            this.cardType = BankCardType.fromValue(jsonObject.cardType);
        }
        this.accountOwner = jsonObject.accountOwner;
        this.cardNumber = jsonObject.cardNumber;
        this.expirationDate = jsonObject.expirationDate;
        this.cvv = jsonObject.cvv;
        this.bankName = jsonObject.bankName;
    }
}
