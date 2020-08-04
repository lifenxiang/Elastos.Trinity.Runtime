export class TitleBarForegroundMode {
    public static LIGHT = 0;
    public static DARK = 1;

    private static values: number[] = [
        TitleBarForegroundMode.LIGHT,
        TitleBarForegroundMode.DARK
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    public static fromId(value: number): TitleBarForegroundMode {
        for (let t of this.values) {
            if (t == value) {
                return new TitleBarForegroundMode(t);
            }
        }
        return new TitleBarForegroundMode(this.LIGHT);
    }
}