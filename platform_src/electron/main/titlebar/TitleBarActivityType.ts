export class TitleBarActivityType {
    /** There is an on going download. */
    public static DOWNLOAD = 0;
    /** There is an on going upload. */
    public static UPLOAD = 1;
    /** There is on going application launch. */
    public static LAUNCH = 2;
    /** There is another on going operation of an indeterminate type. */
    public static OTHER = 3;

    private static values: number[] = [
        TitleBarActivityType.DOWNLOAD,
        TitleBarActivityType.UPLOAD,
        TitleBarActivityType.LAUNCH,
        TitleBarActivityType.OTHER
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    public static fromId(value: number): TitleBarActivityType {
        for (let t of this.values) {
            if (t == value) {
                return new TitleBarActivityType(t);
            }
        }
        return new TitleBarActivityType(this.OTHER);
    }
}
