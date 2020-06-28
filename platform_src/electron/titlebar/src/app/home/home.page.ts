import { Component, NgZone, ChangeDetectorRef } from '@angular/core';

type UpdateStateEvent = {
  appViewId: number,
  state: TitleBarState
}

type TitleBarState = {
  title: string;
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
  state: TitleBarState = {
    title: "elastOS"
  }

  constructor(private zone: NgZone, private cd: ChangeDetectorRef) {
  }

  ionViewDidEnter() {
    this.ipcRenderer = window.require('electron').ipcRenderer;

    this.ipcRenderer.on("updateState", (event, titleBarStateEvent: UpdateStateEvent)=>{
      this.mostRecentAppViewId = titleBarStateEvent.appViewId;
      this.updateState(titleBarStateEvent.state);
    })

    // Initial state display
    this.updateState(this.state);
  }

  updateState(titleBarState: TitleBarState) {
    this.cd.markForCheck();
    this.zone.run(()=>{
      console.log("Refreshing title bar state", titleBarState);
      this.state = titleBarState;
    });
  }

  outerLeftClicked() {
    let event: TitleBarEventToMainProcess = {
      appViewId: this.mostRecentAppViewId,
      method: "iconclicked",
      data: {
        icon: "outerleft"
      }
    }
    this.ipcRenderer.send("titlebarevent", event);
  }

  innerLeftClicked() {

  }
}
