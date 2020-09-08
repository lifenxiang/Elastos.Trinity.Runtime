export class BuiltInIcon {
    public static BACK = "back";
    public static CLOSE = "close";
    public static SCAN = "scan";
    public static ADD = "add";
    public static DELETE = "delete";
    public static SETTINGS = "settings";
    public static HELP = "help";
    public static HORIZONTAL_MENU = "horizontal_menu";
    public static VERTICAL_MENU = "vertical_menu";
    public static EDIT = "edit";
    public static FAVORITE = "favorite";

    private static values: string[] = [
        BuiltInIcon.BACK,
        BuiltInIcon.CLOSE,
        BuiltInIcon.SCAN,
        BuiltInIcon.ADD,
        BuiltInIcon.DELETE,
        BuiltInIcon.SETTINGS,
        BuiltInIcon.HELP,
        BuiltInIcon.HORIZONTAL_MENU,
        BuiltInIcon.VERTICAL_MENU,
        BuiltInIcon.EDIT,
        BuiltInIcon.FAVORITE
    ];

    public value: string;

    constructor(value: string) {
        this.value = value;
    }

    public static fromString(value: string): BuiltInIcon {
        console.log("fromString - "+value);
        for (let t of this.values) {
            if (t == value) {
                console.log("equal - "+t);
                return new BuiltInIcon(t);
            }
        }
        return null;
    }
}

