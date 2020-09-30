
export class PasswordType {
    /** Simple password/private key/string info. */
    public static GENERIC_PASSWORD = 0;
    /** Wifi network with SSID and password. */
    public static WIFI = 1;
    /** Bank account, national or international format. */
    public static BANK_ACCOUNT = 2;
    /** Bank card. */
    public static BANK_CARD = 3;
    /** Any kind of account make of an identifier and a password. */
    public static ACCOUNT = 4;

    private static values: number[] = [
        PasswordType.GENERIC_PASSWORD,
        PasswordType.WIFI,
        PasswordType.BANK_ACCOUNT,
        PasswordType.BANK_CARD,
        PasswordType.ACCOUNT
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    public static fromValue(value: number): PasswordType {
        for(let t of this.values) {
            if (t == value) {
                return new PasswordType(t);
            }
        }
        return new PasswordType(this.GENERIC_PASSWORD);
    }
}
