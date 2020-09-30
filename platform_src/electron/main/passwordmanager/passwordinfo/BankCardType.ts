export class BankCardType {
    /** Debit card */
    public static DEBIT = 0;
    /** Credit card */
    public static CREDIT = 1;

    private static values: number[] = [
        BankCardType.DEBIT,
        BankCardType.CREDIT
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }
    
    public static fromValue(value: number): BankCardType {
        for(let t of this.values) {
            if (t == value) {
                return new BankCardType(t);
            }
        }
        return new BankCardType(this.DEBIT);
    }
}
