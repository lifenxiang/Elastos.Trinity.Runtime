export class PasswordUnlockMode {
    /**
     * After been unlocked once, password manager access is open during some time and until
     * elastOS exits. Users don't have to provide their master password again during this time,
     * and all apps can get their password information directly.
     */
    public static UNLOCK_FOR_A_WHILE = 0;

    /**
     * Users have to provide their master password every time an application requests a password.
     * This provides higher security in case the device is stolen, but this is less convenient
     * for users.
     */
    public static UNLOCK_EVERY_TIME = 1;

    private static values: number[] = [
        PasswordUnlockMode.UNLOCK_FOR_A_WHILE,
        PasswordUnlockMode.UNLOCK_EVERY_TIME
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    public static fromValue(value: number): PasswordUnlockMode {
        for(let t of this.values) {
            if (t == value) {
                return new PasswordUnlockMode(t);
            }
        }
        return new PasswordUnlockMode(this.UNLOCK_FOR_A_WHILE);
    }
}