import { Component, NgZone, ChangeDetectorRef } from '@angular/core';
import { TitleBarActivityType } from '../model/TitleBarActivityType';
import { TitleBarMenuItem } from '../model/TitleBarMenuItem';
import { TitleBarNavigationMode } from '../model/TitleBarNavigationMode';
import { TitleBarIcon } from '../model/TitleBarIcon';
import { TitleBarForegroundMode } from '../model/TitleBarForegroundMode';
import { TitleBarIconView } from '../model/TitleBarIconView';
import { BuiltInIcon } from '../model/BuiltInIcon';
import { TitleBarIconSlot } from '../model/TitleBarIconSlot';
import { TitleBar } from '../model/TitleBar';

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

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})
export class HomePage {
    
    ipcRenderer: any = null;
    mostRecentAppViewId: number;
    titleBarMap = new Map<number, TitleBar>();
    currentTitleBar: TitleBar = new TitleBar(null);

    constructor(private zone: NgZone, private cd: ChangeDetectorRef) {
        this.ipcRenderer = window.require('electron').ipcRenderer;
        this.ipcRenderer.on("updateState", (event, titleBarEvent: TitleBarEvent) => {
            console.log(titleBarEvent);
            this.mostRecentAppViewId = titleBarEvent.appViewId;

            if (titleBarEvent.method == "show") {
                let appId = titleBarEvent.data.appId;
                console.log("show appId: "+appId);
                this.zone.run(() => {
                    this.currentTitleBar = this.titleBarMap.get(this.mostRecentAppViewId);
                });
            }

            if (!this.titleBarMap.has(titleBarEvent.appViewId)) {
                let titleBar = new TitleBar(this.ipcRenderer);
                this.titleBarMap.set(this.mostRecentAppViewId, titleBar);
            }
            this.titleBarMap.get(this.mostRecentAppViewId).onReceiveEvent(titleBarEvent);
            this.zone.run(() => {
                this.currentTitleBar = this.titleBarMap.get(this.mostRecentAppViewId);
            });
        });
    }

    ionViewDidEnter() {
        

        /*this.initialize({appId: "asd", isLauncher: true, darkModeUsed: true});
        this.setTitle({title: "elastOS"});

        let icon = new TitleBarIcon("notifications", "assets/icon/ic_notif.png");
        this.setIcon({
            iconSlot: TitleBarIconSlot.fromId(TitleBarIconSlot.INNER_LEFT),
            icon: icon
        });*/
    }

}
