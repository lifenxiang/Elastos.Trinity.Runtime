import { TrinityPlugin, SuccessCallback, ErrorCallback } from './TrinityPlugin';
import { TrinityRuntime } from './Runtime';
import { TitleBar } from './titlebar/TitleBar';
import { TitleBarActivityType } from './titlebar/TitleBarActivityType';
import { TitleBarForegroundMode } from './titlebar/TitleBarForegroundMode';
import { TitleBarNavigationMode } from './titlebar/TitleBarNavigationMode';
import { TitleBarIconSlot } from './titlebar/TitleBarIconSlot';
import { TitleBarIcon } from './titlebar/TitleBarIcon';
import { TitleBarMenuItem } from './titlebar/TitleBarMenuItem';
import { Log } from './Log';
import { AppInfo } from './AppInfo';


type CallbackContext = {
    success: SuccessCallback;
    error: ErrorCallback;
}

export class TitleBarPlugin extends TrinityPlugin {
    private static LOG_TAG = "TitleBarPlugin";

    private itemClickListenerContext: CallbackContext = null;

    constructor(appId: string) {
        super(appId);
    }

    private showActivityIndicator(success: SuccessCallback, error: ErrorCallback, args: any) {
        let activityIndicatoryType = args[0] as number;
        let hintText = args[1] == null ? null : args[1] as string;

        this.getTitleBar().showActivityIndicator(TitleBarActivityType.fromId(activityIndicatoryType), hintText);

        success();
    }

    private hideActivityIndicator(success: SuccessCallback, error: ErrorCallback, args: any) {
        let activityIndicatoryType = args[0] as number;

        this.getTitleBar().hideActivityIndicator(TitleBarActivityType.fromId(activityIndicatoryType));

        success();
    }

    private setTitle(success: SuccessCallback, error: ErrorCallback, args: any) {
        let title;
        if (args[0] == null) {
            title = null;
        }
        else {
            title = args[0] as string;
        }

        this.getTitleBar().setTitle(title);

        success();
    }

    private setBackgroundColor(success: SuccessCallback, error: ErrorCallback, args: any) {
        let hexColor = args[0] as string;

        if (this.getTitleBar().setBackgroundColor(hexColor)) {
            success();
        }
        else {
            error("Invalid color " + hexColor);
        }
    }

    private setForegroundMode(success: SuccessCallback, error: ErrorCallback, args: any) {
        let modeAsInt = args[0] as number;

        this.getTitleBar().setForegroundMode(TitleBarForegroundMode.fromId(modeAsInt));

        success();
    }

    private setNavigationMode(success: SuccessCallback, error: ErrorCallback, args: any) {
        let modeAsInt = args[0] as number;

        this.getTitleBar().setNavigationMode(TitleBarNavigationMode.fromId(modeAsInt));

        success();
    }

    private setNavigationIconVisibility(success: SuccessCallback, error: ErrorCallback, args: any) {
        let visible = args[0] as boolean;

        this.getTitleBar().setNavigationIconVisibility(visible);

        success();
    }

    private addOnItemClickedListener(success: SuccessCallback, error: ErrorCallback, args: any) {
        this.itemClickListenerContext = {
            success: success,
            error: error
        };
        let functionString = args[0] as string;
        this.getTitleBar().addOnItemClickedListener(functionString);

        success();
    }

    private removeOnItemClickedListener(success: SuccessCallback, error: ErrorCallback, args: any) {
        let functionString = args[0] as string;
        this.getTitleBar().removeOnItemClickedListener(functionString);

        success();
    }

    private async setIcon(success: SuccessCallback, error: ErrorCallback, args: any) {
        let iconSlotAsInt = args[0] as number;
        let iconObj = args[1] == null ? null : args[1] as any;

        let iconSlot = TitleBarIconSlot.fromId(iconSlotAsInt);
        let icon = TitleBarIcon.fromJSONObject(iconObj);

        await this.getTitleBar().setIcon(iconSlot, icon);

        success();
    }

    private setBadgeCount(success: SuccessCallback, error: ErrorCallback, args: any) {
        let iconSlotAsInt = args[0] as number;
        let badgeValue = args[1] as number;

        let iconSlot = TitleBarIconSlot.fromId(iconSlotAsInt);

        this.getTitleBar().setBadgeCount(iconSlot, badgeValue);

        success();
    }

    private setupMenuItems(success: SuccessCallback, error: ErrorCallback, args: any) {
        let menuItemsJson = args[0] == null ? null : args[0] as any[];

        let menuItems = Array<TitleBarMenuItem>();
        if (menuItemsJson != null) {
            for (var i = 0; i < menuItemsJson.length; i++) {
                let menuItem = TitleBarMenuItem.fromJSONObject(menuItemsJson[i]);
                if (menuItem != null) {
                    menuItems.push(menuItem);
                }
            }
        }

        this.getTitleBar().setupMenuItems(menuItems);
    }

    //TODO: need TrinityCordovaInterfaceImpl
    private getTitleBar(): TitleBar {
        return this.viewFragment.getTitleBar();
    }

    public onReceive(data: any) {
        console.log("TitleBarPlugin - onReceive - appId: "+this.appId);
        console.log(data);
        this.itemClickListenerContext.success(data);
    }
}

TrinityRuntime.getSharedInstance().registerPlugin("TitleBarManager", (appId: string)=>{
    return new TitleBarPlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("TitleBarManager", [
    "setTitle",
    "setBackgroundColor",
    "setForegroundMode",
    "setNavigationMode",
    "setNavigationIconVisibility",
    "addOnItemClickedListener",
    "removeOnItemClickedListener",
    "setIcon",
    "setBadgeCount",
    "setupMenuItems",
    "showActivityIndicator",
    "hideActivityIndicator"
])