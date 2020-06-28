import { BrowserView } from "electron";
import { RunningApp, AppManager } from './AppManager';

type UpdateStateEvent = {
    appViewId: number,
    state: TitleBarState
}

type TitleBarState = {
    title: string;
}

export type TitleBarEventToMainProcess = {
    appViewId: number,
    method: string,
    data: any;
}

export class TitleBar {
    runningApp: RunningApp;
    titleBarView: BrowserView;
    titleBarState: TitleBarState;

    constructor(titleBarView: BrowserView, title: string = "elastOS") {
        this.titleBarView = titleBarView;
        this.titleBarState = {
            title: title
        }
    }

    public setRunningApp(app: RunningApp) {
        this.runningApp = app;
    }

    public setTitle(title: string) {
        this.titleBarState.title = title;
        this.ipcUpdateTitleBar();
    }

    public setVisible() {
        this.ipcUpdateTitleBar();
    }

    private ipcUpdateTitleBar() {
        // TODO: Only send update if the app is the one on top. We don't want background apps to change
        // the active (shared) title bar.

        //console.log("Sending IPC update for title bar")
        let event: UpdateStateEvent = {
            appViewId: this.runningApp.browserViewID,
            state: this.titleBarState
        };

        this.titleBarView.webContents.send("updateState", event);
    }

    public handleTitleBarEvent(titleBarEvent: TitleBarEventToMainProcess) {
        switch (titleBarEvent.method) {
            case "iconclicked":
                AppManager.getSharedInstance().close(this.runningApp.appInfo.app_id);
                break;
        }
    }
}