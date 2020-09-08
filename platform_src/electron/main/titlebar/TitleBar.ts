import { BrowserView } from "electron";
import { AppManager } from '../AppManager';
import { WebViewFragment } from '../WebViewFragment';
import { TitleBarActivityType } from './TitleBarActivityType';
import { TitleBarForegroundMode } from './TitleBarForegroundMode';
import { TitleBarNavigationMode } from './TitleBarNavigationMode';
import { TitleBarIcon } from './TitleBarIcon';
import { TitleBarIconSlot } from './TitleBarIconSlot';
import { TitleBarMenuItem } from './TitleBarMenuItem';
import { PreferenceManager } from '../PreferenceManager';
import { TitleBarIconView } from './TitleBarIconView';
import { TitleBarPlugin } from '../TitleBarPlugin';


type TitleBarEvent = {
    appViewId: number,
    method: string,
    data: any
}

export type TitleBarEventToMainProcess = {
    appViewId: number,
    method: string,
    data: any
}

export class TitleBar {
    fragment: WebViewFragment;
    titleBarView: BrowserView;

    // Model
    appId: string = null;
    isLauncher: boolean = false;
    appManager: AppManager = null;

    constructor(titleBarView: BrowserView, title: string = "elastOS") {
        this.titleBarView = titleBarView;
    }

    public setFragment(fragment: WebViewFragment) {
        this.fragment = fragment;
    }

    public show() {
        console.log("TitleBar - show appId: "+this.appId+", appViewId: "+this.fragment.browserViewId);
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "show",
            data: {
                appId: this.appId
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public async initialize(appId: string) {
        console.log("TitleBar - initialize appId: "+appId);
        this.appId = appId;
        this.appManager = AppManager.getSharedInstance();
        this.isLauncher = this.appManager.isLauncher(appId);
        console.log("TitleBar - isLauncher: "+this.isLauncher);
        let darkModeUsed = await this.darkModeUsed();
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "initialize",
            data: {
                appId: this.appId,
                isLauncher: this.isLauncher,
                darkModeUsed: darkModeUsed
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    private darkModeUsed(): Promise<boolean> {
        return PreferenceManager.getSharedInstance().getBooleanValue("ui.darkmode", true);
    }

    public showActivityIndicator(activityType: TitleBarActivityType, hintText: string) {
        //console.log("TitleBar - showActivityIndicator");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "showActivityIndicator",
            data: {
                activityType: activityType,
                hintText: hintText
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public hideActivityIndicator(activityType: TitleBarActivityType) {
        //console.log("TitleBar - hideActivityIndicator");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "hideActivityIndicator",
            data: {
                activityType: activityType
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public setBackgroundColor(hexColor: string): boolean {
        //console.log("TitleBar - setBackgroundColor");
        let hexColorExp = /^#[0-9A-F]{6}$/i;
        if (hexColorExp.test(hexColor)) {
            let event: TitleBarEvent = {
                appViewId: this.fragment.browserViewId,
                method: "setBackgroundColor",
                data: {
                    hexColor: hexColor
                }
            };
            this.ipcUpdateTitleBar(event);
            return true;
        }
        return false;
    }

    public setForegroundMode(mode: TitleBarForegroundMode) {
        //console.log("TitleBar - setForegroundMode");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "setForegroundMode",
            data: {
                mode: mode
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public setNavigationMode(navigationMode: TitleBarNavigationMode) {
        //console.log("TitleBar - setNavigationMode");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "setNavigationMode",
            data: {
                navigationMode: navigationMode
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public setNavigationIconVisibility(visible: boolean) {
        //console.log("TitleBar - setNavigationIconVisibility visible: "+visible);
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "setNavigationIconVisibility",
            data: {
                visible: visible
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public async setIcon(iconSlot: TitleBarIconSlot, icon: TitleBarIcon) {
        console.log("TitleBar - setIcon");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "setIcon",
            data: {
                iconSlot: iconSlot,
                icon: {}
            }
        };
        if (icon != null) {
            if (icon.isBuiltInIcon()) {
                event.data.icon = icon;
            }
            else {
                let appInfo = await this.appManager.getAppInfo(this.appId);
                appInfo.remote = 0;
                let iconPath = this.appManager.getAppPath(appInfo) + icon.iconPath;
                
                icon.iconPath = iconPath;
                event.data.icon = icon;
            }
        }
        else {
            event.data.icon = null;
        }
        this.ipcUpdateTitleBar(event);
    }

    public setBadgeCount(iconSlot: TitleBarIconSlot, badgeCount: number) {
        //console.log("TitleBar - setBadgeCount");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "setBadgeCount",
            data: {
                iconSlot: iconSlot,
                badgeCount: badgeCount
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public addOnItemClickedListener(functionString: string) {
        //console.log("TitleBar - addOnItemClickedListener");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "addOnItemClickedListener",
            data: {
                functionString: functionString
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public removeOnItemClickedListener(functionString: string) {
        //console.log("TitleBar - removeOnItemClickedListener");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "removeOnItemClickedListener",
            data: {
                functionString: functionString
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public setupMenuItems(menuItems: Array<TitleBarMenuItem>) {
        //console.log("TitleBar - setupMenuItems");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "setupMenuItems",
            data: {
                menuItems: menuItems
            }
        };
        this.ipcUpdateTitleBar(event);
    }

    public async setTitle(title: string) {
        //console.log("TitleBar - setTitle");
        let event: TitleBarEvent = {
            appViewId: this.fragment.browserViewId,
            method: "setTitle",
            data: {}
        };
        if (title != null) {
            event.data.title = title;
        }
        else {
            event.data.title = (await this.appManager.getAppInfo(this.appId)).name;
        }
        this.ipcUpdateTitleBar(event);
    }

    public setVisible() {
        
    }

    private ipcUpdateTitleBar(event: TitleBarEvent) {
        // TODO: Only send update if the app is the one on top. We don't want background apps to change
        // the active (shared) title bar.
        this.titleBarView.webContents.send("updateState", event);
    }

    public async handleTitleBarEvent(titleBarEvent: TitleBarEventToMainProcess) {
        switch (titleBarEvent.method) {
            case "response": {
                console.log("handleTitleBarEvent - response");
                break;
            }
            case "closeApp": {
                console.log("handleTitleBarEvent - closeApp");
                await this.appManager.close(this.fragment.appInfo.app_id, AppManager.STARTUP_APP, null);
                break;
            }
            case "goToLauncher": {
                console.log("handleTitleBarEvent - goToLauncher isLauncher: "+this.isLauncher);
                let runningList = this.appManager.getRunningList();
                console.log("runningApp size: "+runningList.length);
                for (let runningApp of runningList) {
                    console.log("runningApp: "+runningApp);
                }
                if (!this.isLauncher) {
                    await this.appManager.loadLauncher();
                    this.appManager.sendLauncherMessageMinimize(this.fragment.appInfo.app_id);
                }
                break;
            }
            case "onIconClicked": {
                console.log("handleTitleBarEvent - onIconClicked");
                let runningList = this.appManager.getRunningList();
                console.log("runningApp size: "+runningList.length);
                for (let runningApp of runningList) {
                    console.log("runningApp: "+runningApp);
                }
                let titleBarManagerPlugin = this.fragment.pluginInstances["TitleBarManager"] as TitleBarPlugin;
                titleBarManagerPlugin.onReceive(titleBarEvent.data.menuItem);
                break;
            }
        }
    }
}