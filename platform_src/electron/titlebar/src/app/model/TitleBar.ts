import { TitleBarActivityType } from '../model/TitleBarActivityType';
import { TitleBarMenuItem } from '../model/TitleBarMenuItem';
import { TitleBarNavigationMode } from '../model/TitleBarNavigationMode';
import { TitleBarIcon } from '../model/TitleBarIcon';
import { TitleBarForegroundMode } from '../model/TitleBarForegroundMode';
import { TitleBarIconView } from '../model/TitleBarIconView';
import { BuiltInIcon } from '../model/BuiltInIcon';
import { TitleBarIconSlot } from '../model/TitleBarIconSlot';

export type SuccessCallback = (menuItem: TitleBarIcon)=>void;

enum View {
    GONE = "none",
    VISIBLE = "block"
}

type tvTitleState = {
    text: string,
    textColor: string
}

type flRootState = {
    backgroundColor: string
}

type tvAnimationHintState = {
    text: string,
    textColor: string,
    visibility: string
}

type TitleBarEvent = {
    appViewId: number,
    method: string,
    data: any;
}

type TitleBarEventToMainProcess = {
    appViewId: number,
    method: string,
    data: any;
}


export class TitleBar {
    ipcRenderer: any = null;
    mostRecentAppViewId: number;

    // UI
    btnOuterLeft: TitleBarIconView = new TitleBarIconView();
    btnInnerLeft: TitleBarIconView = new TitleBarIconView();
    btnInnerRight: TitleBarIconView = new TitleBarIconView();
    btnOuterRight: TitleBarIconView = new TitleBarIconView();
    tvTitle: tvTitleState = {
        text: "elastOS",
        textColor: null
    };
    flRoot: flRootState = {
        backgroundColor: null
    };
    tvAnimationHint: tvAnimationHintState = {
        text: null,
        textColor: null,
        visibility: View.GONE
    };

    // Model
    appId: string = null;
    isLauncher: boolean = false;
    // Reference count for progress bar activity types. An app can start several activities at the same time and the progress bar
    // keeps animating until no one else needs progress animations.
    activityCounters = new Map<TitleBarActivityType, number>();
    activityHintTexts = new Map<TitleBarActivityType, string>();
    menuItems = new Array<TitleBarMenuItem>();
    onIconClickedListenerMap = new Map<string, SuccessCallback>();
    currentNavigationIconIsVisible: boolean = true;
    currentNavigationMode: TitleBarNavigationMode = TitleBarNavigationMode.fromId(TitleBarNavigationMode.HOME);
    outerLeftIcon: TitleBarIcon = null;
    innerLeftIcon: TitleBarIcon = null;
    innerRightIcon: TitleBarIcon = null;
    outerRightIcon: TitleBarIcon = null;

    constructor(ipcRenderer: any) {
        this.ipcRenderer = ipcRenderer;

        this.activityCounters.set(TitleBarActivityType.fromId(TitleBarActivityType.DOWNLOAD), 0);
        this.activityCounters.set(TitleBarActivityType.fromId(TitleBarActivityType.UPLOAD), 0);
        this.activityCounters.set(TitleBarActivityType.fromId(TitleBarActivityType.LAUNCH), 0);
        this.activityCounters.set(TitleBarActivityType.fromId(TitleBarActivityType.OTHER), 0);

        this.activityHintTexts.set(TitleBarActivityType.fromId(TitleBarActivityType.DOWNLOAD), null);
        this.activityHintTexts.set(TitleBarActivityType.fromId(TitleBarActivityType.UPLOAD), null);
        this.activityHintTexts.set(TitleBarActivityType.fromId(TitleBarActivityType.LAUNCH), null);
        this.activityHintTexts.set(TitleBarActivityType.fromId(TitleBarActivityType.OTHER), null);
    }

    onReceiveEvent(titleBarEvent: TitleBarEvent) {
        this.mostRecentAppViewId = titleBarEvent.appViewId;
        if (titleBarEvent.method == "initialize") {
            this.initialize(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "setTitle") {
            this.setTitle(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "setBackgroundColor") {
            this.setBackgroundColor(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "setForegroundMode") {
            this.setForegroundMode(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "setNavigationMode") {
            this.setNavigationMode(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "setNavigationIconVisibility") {
            this.setNavigationIconVisibility(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "setIcon") {
            this.setIcon(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "setBadgeCount") {
            this.setBadgeCount(titleBarEvent.data);
        }
        else if (titleBarEvent.method == "addOnItemClickedListener") {
            this.addOnItemClickedListener(titleBarEvent.data);
        }
    }

    initialize(data: any) {
        console.log("initialize");
        this.appId = data.appId as string;
        this.isLauncher = data.isLauncher as boolean;
        console.log("isLauncher: "+this.isLauncher);

        this.btnOuterLeft = new TitleBarIconView();
        this.btnInnerLeft = new TitleBarIconView();
        this.btnInnerRight = new TitleBarIconView();
        this.btnOuterRight = new TitleBarIconView();

        if (data.darkModeUsed as boolean) {
            this.setBackgroundColor({hexColor: "#191a2f"});
            this.setForegroundMode({mode: TitleBarForegroundMode.fromId(TitleBarForegroundMode.LIGHT)});
        }
        else {
            this.setBackgroundColor({hexColor: "#f8f8ff"});
            this.setForegroundMode({mode: TitleBarForegroundMode.fromId(TitleBarForegroundMode.DARK)});
        }

        this.setAnimationHintText(null);

        this.updateIcons();
    }

    private toggleMenu() {
        //TODO: implement
    }

    setTitle(data: any) {
        console.log("setTitle");
        this.tvTitle.text = data.title;
    }

    setBackgroundColor(data: any) {
        console.log("setBackgroundColor");
        this.flRoot.backgroundColor = data.hexColor;
    }

    setForegroundMode(data: any) {
        console.log("setForegroundMode");
        let color;

        if (data.mode.value == TitleBarForegroundMode.DARK) {
            color = "#444444";
        }
        else {
            color = "#FFFFFF";
        }
        
        this.tvTitle.textColor = color;
        this.tvAnimationHint.textColor = color;
        this.btnOuterLeft.setColorFilter(color);
        this.btnInnerLeft.setColorFilter(color);
        this.btnInnerRight.setColorFilter(color);
        this.btnOuterRight.setColorFilter(color);
    }

    setNavigationMode(data: any) {
        console.log("setNavigationMode");
        let navigationMode = TitleBarNavigationMode.fromId(data.navigationMode);
        this.currentNavigationMode = navigationMode;

        this.updateIcons();
    }

    setNavigationIconVisibility(data: any) {
        console.log("setNavigationIconVisibility");
        this.currentNavigationIconIsVisible = data.visible as boolean;
        this.setNavigationMode(this.currentNavigationMode);
    }

    setIcon(data: any) {
        console.log("setIcon");
        let iconSlot = TitleBarIconSlot.fromId(data.iconSlot.value);
        let icon = TitleBarIcon.fromJSONObject(data.icon);

        switch (iconSlot.value) {
            case TitleBarIconSlot.OUTER_LEFT: {
                this.outerLeftIcon = icon;
                break;
            }
            case TitleBarIconSlot.INNER_LEFT: {
                this.innerLeftIcon = icon;
                break;
            }
            case TitleBarIconSlot.INNER_RIGHT: {
                this.innerRightIcon = icon;
                break;
            }
            case TitleBarIconSlot.OUTER_RIGHT: {
                this.outerRightIcon = icon;
                break;
            }
            default:
                // Nothing to do, wrong info received
        }

        this.updateIcons();
    }

    public setBadgeCount(data: any) {
        console.log("setBadgeCount");
        let iconSlot = TitleBarIconSlot.fromId(data.iconSlot.value);
        let badgeCount = data.badgeCount as number;
        switch (iconSlot.value) {
            case TitleBarIconSlot.OUTER_LEFT: {
                if (!this.currentNavigationIconIsVisible)
                    this.btnOuterLeft.setBadgeCount(badgeCount);
                break;
            }
            case TitleBarIconSlot.INNER_LEFT: {
                this.btnInnerLeft.setBadgeCount(badgeCount);
                break;
            }
            case TitleBarIconSlot.INNER_RIGHT: {
                this.btnInnerRight.setBadgeCount(badgeCount);
                break;
            }
            case TitleBarIconSlot.OUTER_RIGHT: {
                if (this.emptyMenuItems())
                    this.btnOuterRight.setBadgeCount(badgeCount);
                break;
            }
            default:
                // Nothing to do, wrong info received
        }
    }

    addOnItemClickedListener(data: any) {
        console.log("addOnItemClickedListener");
        let functionString = data.functionString as string;
        this.onIconClickedListenerMap.set(functionString, (menuItem) => {
            console.log("asd - menuItem");
            console.log(menuItem.toJSONObject());

            let event: TitleBarEventToMainProcess = {
                appViewId: this.mostRecentAppViewId,
                method: "onIconClicked",
                data: {
                    menuItem: menuItem.toJSONObject()
                }
            };
            this.ipcRenderer.send("titlebarevent", event);
        });
    }

    /**
     * Updates all icons according to the overall configuration
     */
    private updateIcons() {
        // Navigation icon / Outer left
        if (this.currentNavigationIconIsVisible) {
            this.btnOuterLeft.state.visibility = View.VISIBLE;
            if (this.currentNavigationMode.value == TitleBarNavigationMode.CLOSE) {
                this.btnOuterLeft.setImageResource("ic_close");
            }
            else {
                // Default = HOME
                this.btnOuterLeft.setImageResource("ic_elastos_home");
            }
        }
        else {
            // Navigation icon not visible - check if there is a configured outer icon
            if (this.outerLeftIcon != null) {
                this.btnOuterLeft.state.visibility = View.VISIBLE;
                this.setImageViewFromIcon(this.btnOuterLeft, this.outerLeftIcon);
            }
            else {
                this.btnOuterLeft.state.visibility = View.GONE;
            }
        }

        // Inner left
        if (this.innerLeftIcon != null) {
            this.btnInnerLeft.state.visibility = View.VISIBLE;
            this.setImageViewFromIcon(this.btnInnerLeft, this.innerLeftIcon);
        }
        else {
            this.btnInnerLeft.state.visibility = View.GONE;
        }

        // Inner right
        if (this.innerRightIcon != null) {
            this.btnInnerRight.state.visibility = View.VISIBLE;
            this.setImageViewFromIcon(this.btnInnerRight, this.innerRightIcon);
        }
        else {
            this.btnInnerRight.state.visibility = View.GONE;
        }

        // Menu icon / Outer right
        if (this.menuItems.length > 0) {
            this.btnOuterRight.state.visibility = View.VISIBLE;
            this.btnOuterRight.setImageResource("ic_menu");
        }
        else {
            if (this.outerRightIcon != null) {
                this.btnOuterRight.state.visibility = View.VISIBLE;
                this.setImageViewFromIcon(this.btnOuterRight, this.outerRightIcon);
            }
            else {
                this.btnOuterRight.state.visibility = View.GONE;
            }
        }
    }

    private setImageViewFromIcon(iv: TitleBarIconView, icon: TitleBarIcon) {
        if (icon.iconPath == null)
            return;

        if (icon.isBuiltInIcon()) {
            switch (icon.builtInIcon.value) {
                case BuiltInIcon.BACK: {
                    iv.setImageResource("ic_back");
                    break;
                }
                case BuiltInIcon.SCAN: {
                    iv.setImageResource("ic_scan");
                    break;
                }
                case BuiltInIcon.ADD: {
                    iv.setImageResource("ic_add");
                    break;
                }
                case BuiltInIcon.DELETE: {
                    iv.setImageResource("ic_delete");
                    break;
                }
                case BuiltInIcon.SETTINGS: {
                    iv.setImageResource("ic_settings");
                    break;
                }
                case BuiltInIcon.HORIZONTAL_MENU: {
                    iv.setImageResource("ic_menu");
                    break;
                }
                case BuiltInIcon.VERTICAL_MENU: {
                    iv.setImageResource("ic_menu"); // TODO: ic_vertical_menu
                    break;
                }
                case BuiltInIcon.EDIT: {
                    iv.setImageResource("ic_edit");
                    break;
                }
                case BuiltInIcon.FAVORITE: {
                    iv.setImageResource("ic_fav");
                    break;
                }
                case BuiltInIcon.CLOSE: {}
                default: {
                    iv.setImageResource("ic_close");
                }
            }
        }
        else {
            // Custom app image, try to load it
            iv.setImageURI(icon.iconPath);
        }
    }   

    private setAnimationHintText(text: string) {
        if (text == null) {
            this.tvAnimationHint.visibility = View.GONE;
        }
        else {
            this.tvAnimationHint.visibility = View.VISIBLE;
            this.tvAnimationHint.text = text;
        }
    }

    private emptyMenuItems(): boolean {
        return this.menuItems == null || this.menuItems.length == 0;
    }

    private handleIconClicked(icon: TitleBarIcon) {
        console.log("handleIconClicked");
        this.onIconClickedListenerMap.forEach((value: SuccessCallback, key: string) => {
            value(icon);
        });
    }

    handleOuterLeftClicked() {
        console.log("handleOuterLeftClicked");
        if (this.currentNavigationIconIsVisible) {
            let event: TitleBarEventToMainProcess = {
                appViewId: this.mostRecentAppViewId,
                method: "",
                data: {}
            }
            if (this.currentNavigationMode.value == TitleBarNavigationMode.CLOSE) {
                event.method = "closeApp";
            }
            else {
                // Default: HOME
                event.method = "goToLauncher";
            }
            this.ipcRenderer.send("titlebarevent", event);
        }
        else {
            // Action handled by the app
            this.handleIconClicked(this.outerLeftIcon);
        }
    }

    handleInnerLeftClicked() {
        //this.handleIconClicked(this.innerLeftIcon);
    }

    handleInnerRightClicked() {
        //this.handleIconClicked(this.innerRightIcon);
    }

    handleOuterRightClicked() {
        if (!this.emptyMenuItems()) {
            // Title bar has menu items, so we open the menu
            this.toggleMenu();
        }
        else {
            // No menu items: this is a custom icon
            //this.handleIconClicked(this.outerRightIcon);
        }
    }
}