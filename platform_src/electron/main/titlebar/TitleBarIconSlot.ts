export class TitleBarIconSlot {
    /** Icon on title bar's left edge. */
    public static OUTER_LEFT = 0;
    /** Icon between the outer left icon and the title. */
    public static INNER_LEFT = 1;
    /** Icon between the title and the outer right icon. */
    public static INNER_RIGHT = 2;
    /** Icon on title bar's right edge. */
    public static OUTER_RIGHT = 3;

    private static values: number[] = [
        TitleBarIconSlot.OUTER_LEFT,
        TitleBarIconSlot.INNER_LEFT,
        TitleBarIconSlot.INNER_RIGHT,
        TitleBarIconSlot.OUTER_RIGHT
    ];

    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    public static fromId(value: number): TitleBarIconSlot {
        for (let t of this.values) {
            if (t == value) {
                return new TitleBarIconSlot(t);
            }
        }
        return new TitleBarIconSlot(this.INNER_LEFT);
    }
}