import { BuiltInIcon } from './BuiltInIcon';

export class TitleBarIcon {
    key: string;
    iconPath: string;
    builtInIcon: BuiltInIcon;

    constructor(key: string = "", iconPath: string = "") {
        this.key = key;
        this.iconPath = iconPath;
    }

    public static fromJSONObject(jsonObject: any): TitleBarIcon {
        if (jsonObject == null)
            return null;

        let icon = new TitleBarIcon();

        try {
            icon.fillFromJSONObject(jsonObject);
            return icon;
        }
        catch (e) {
            return null;
        }
    }

    protected fillFromJSONObject(jsonObject: any) {
        this.key = jsonObject.key;
        this.iconPath = jsonObject.iconPath;

        // Try to convert it to a built in icon
        this.builtInIcon = BuiltInIcon.fromString(this.iconPath);
    }

    public toJSONObject(): any {
        let jsonObject = {};

        this.fillJSONObject(jsonObject);

        return jsonObject;
    }

    protected fillJSONObject(jsonObject: any) {
        jsonObject.key = this.key;
        jsonObject.iconPath = this.iconPath;
    }

    public isBuiltInIcon(): boolean {
        return this.builtInIcon ! = null;
    }
}