export class AppsPasswordStrategy {
    /** Use a master password to save and encrypt all app password info. Default. */
    public static LOCK_WITH_MASTER_PASSWORD = 0;
    /** Don't store app password info in the password manager. Users manually input in-app passwords every time. */
    public static DONT_USE_MASTER_PASSWORD = 1;

    private static values: number[] = [
        AppsPasswordStrategy.LOCK_WITH_MASTER_PASSWORD,
        AppsPasswordStrategy.DONT_USE_MASTER_PASSWORD
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }
    public static fromValue(value: number): AppsPasswordStrategy {
        for(let t of this.values) {
            if (t == value) {
                return new AppsPasswordStrategy(t);
            }
        }
        return new AppsPasswordStrategy(this.LOCK_WITH_MASTER_PASSWORD);
    }
}