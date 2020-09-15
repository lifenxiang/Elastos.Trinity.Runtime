import { TitleBarIcon } from './TitleBarIcon';

export class TitleBarMenuItem extends TitleBarIcon {
    title: string;

    constructor(key: string = "", iconPath: string = "", title: string = "") {
        super(key, iconPath);

        this.title = title;
    }

    public static fromJSONObject(jsonObject: any): TitleBarMenuItem {
        let icon = new TitleBarMenuItem();

        try {
            icon.fillFromJSONObject(jsonObject);
            return icon;
        }
        catch (e) {
            return null;
        }
    }

    protected fillFromJSONObject(jsonObject: any) {
        super.fillFromJSONObject(jsonObject);

        this.title = jsonObject.title;
    }

    protected fillJSONObject(jsonObject: any) {
        super.fillJSONObject(jsonObject);
        
        jsonObject.title = this.title;
    }
}