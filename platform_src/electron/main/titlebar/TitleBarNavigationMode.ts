export class TitleBarNavigationMode {
    public static HOME = 0;
    public static CLOSE = 1;

    private static values: number[] = [
        TitleBarNavigationMode.HOME,
        TitleBarNavigationMode.CLOSE
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    public static fromId(value: number): TitleBarNavigationMode {
        for (let t of this.values) {
            if (t == value) {
                return new TitleBarNavigationMode(t);
            }
        }
        return new TitleBarNavigationMode(this.HOME);
    }
}
