import { IntentInfo } from './IntentInfo';
import { IntentPermission } from './IntentPermission';
import { BrowserWindow } from 'electron';
import { AppManager } from './AppManager';
import { join as pathJoin } from "path";
import { app } from 'electron';
import { Utility } from './Utility';
import { Log } from './Log';
import { IntentFilter } from './IntentFilter';
import { AppBasePlugin } from './AppBasePlugin';

export class IntentManager {
    public static MAX_INTENT_NUMBER = 20;
    private static LOG_TAG = "IntentManager";
    //public static JWT_SECRET = "secret";

    private intentList = new Map<string, Array<IntentInfo>>();
    private intentContextList = new Map<number, IntentInfo>();
    private intentIdList = new Map<string, Array<number>>();

    private permissionList = new Map<string, IntentPermission>();
    private window: BrowserWindow = null;

    private appManager: AppManager;

    private static intentManager: IntentManager;

    private static trinitySchemes: string[] = [
        "elastos://",
        "https://scheme.elastos.org/",
        "https://launcher.elastos.net/",
        "https://did.elastos.net/",
        "https://wallet.elastos.net/",
        "https://hive.elastos.net/",
        "https://contact.elastos.net"
    ];

    constructor() {
        this.appManager = AppManager.getSharedInstance();
        this.window = this.appManager.window;

        try {
            this.parseIntentPermission();
        } catch (e) {
            Log.e(IntentManager.LOG_TAG, e);
        }
        IntentManager.intentManager = this;
    }

    public static getShareInstance(): IntentManager {
        if (IntentManager.intentManager == null) {
            IntentManager.intentManager = new IntentManager();
        }
        return IntentManager.intentManager;
    }

    public static checkTrinityScheme(url: string) {
        for (var i = 0; i < this.trinitySchemes.length; i++) {
            if (url.startsWith(this.trinitySchemes[i])) {
                return true;
            }
        }
        return false;
    }

    private getIdbyFilter(filter: IntentFilter): string {
        return this.appManager.getIdbyStartupMode(filter.packageId, filter.startupMode, filter.serviceName);
    }

    private addIntentToList(info: IntentInfo) {
        let id = this.getIdbyFilter(info.filter);
        let infos = this.intentList.get(id);
        if (infos == null) {
            infos = new Array<IntentInfo>();
            this.intentList.set(id, infos);
        }
        infos.push(info);
    }

    public setIntentReady(id: string) {
        let infos = this.intentList.get(id);
        if ((infos == null) || (infos.length < 1)) {
            return;
        }

        for (var i = 0; i < infos.length; i++) {
            let info = infos[i];
            this.doIntent(info);
        }
        infos = [];
        this.intentList.delete(id);
    }

    public getIntentCount(id: string): number {
        let infos = this.intentList.get(id);
        if ((infos == null) || (infos.length < 1)) {
            return 0;
        }

        return infos.length;
    }

    private putIntentContext(info: IntentInfo) {
        let intentInfo = this.intentContextList.get(info.intentId);
        while (intentInfo != null) {
            info.intentId++;
            intentInfo = this.intentContextList.get(info.intentId);
        }

        this.intentContextList.set(info.intentId, info);
        let ids = this.intentIdList.get(info.fromId);
        if (ids != null) {
            while (ids.length > IntentManager.MAX_INTENT_NUMBER) {
                let intentId = ids[0];
                ids.splice(0, 1);
                this.intentContextList.delete(intentId);
            }
        }
        else {
            ids = new Array<number>();
            this.intentIdList.set(info.fromId, ids);
        }
        ids.push(info.intentId);
    }

    public removeAppFromIntentList(id: string) {
        this.intentContextList.forEach((value: IntentInfo, key: number) => {
            let info = value;
            let modeId = this.getIdbyFilter(info.filter);
            //TODO: implement
        });
    }

    /**
     * Returns the list of package IDs able to handle the given intent action.
     */
    public async getIntentFilter(action: string): Promise<IntentFilter[]> {
        let filters = await this.appManager.dbAdapter.getIntentFilter(action);
        let list = new Array<IntentFilter>();

        for (var i = 0; i < filters.length; i++) {
            if (this.getIntentReceiverPermission(action, filters[i].packageId)) {
                list.push(filters[i]);
            }
        }

        return list;
    }

    private popupIntentChooser(info: IntentInfo, filters: IntentFilter[]) {
        //TODO: implement
    }

    async doIntent(info: IntentInfo) {
        if (info.toId == null) {
            let filters = await this.getIntentFilter(info.action);

            // Throw an error in case no one can handle the action.
            // Special case for the "share" action that is always handled by the native OS too.
            if (info.action != "share") {
                if (filters.length == 0) {
                    throw new Error("Intent action "+info.action+" isn't supported!");
                }
            }

            if (!this.getIntentSenderPermission(info.action, info.fromId)) {
                throw new Error("Application "+info.fromId+" doesn't have the permission to send an intent with action "+info.action);
            }

            // If there is only one application able to handle this intent, we directly use it.
            // Otherwise, we display a prompt so that user can pick the right application.
            // "share" action is special, as it must deal with the native share action.
            if (info.action != "share") {
                if (filters.length == 1) {
                    info.toId = this.getIdbyFilter(filters[0]);
                    info.filter = filters[0];
                    this.sendIntent(info);
                } else {
                    this.popupIntentChooser(info, filters);
                }
            }
            else {
                // Action is "share"
                if (filters.length == 0) {
                    // No dapp can handle share. Directly send the native action
                    this.sendNativeShareAction(info);
                }
                else {
                    // Show a popup chooser. It will add the native share action.
                    this.popupIntentChooser(info, filters);
                }
            }
        }
        else {
            this.sendIntent(info);
        }
    }

    public sendIntent(info: IntentInfo) {
        let id = this.getIdbyFilter(info.filter);
        //TODO: migrate from java
    }

    public static parseJWT(jwt: string): any {
        //TODO: implement
    }

    removeJWTParams: string[] = [
        "appid",
        "iss",
        "iat",
        "exp",
        "redirecturl",
        "callbackurl"
    ];

    public getParamsByJWT(jwt: string, info: IntentInfo) {
        let jwtPayload = IntentManager.parseJWT(jwt);

        jwtPayload.type = "jwt";
        info.params = JSON.stringify(jwtPayload);

        if (jwtPayload.iss != null) {
            info.aud = jwtPayload.iss;
        }
        if (jwtPayload.appid != null) {
            info.req = jwtPayload.appid;
        }
        if (jwtPayload[IntentInfo.REDIRECT_URL] != null) {
            info.redirecturl = jwtPayload[IntentInfo.REDIRECT_URL];
        }
        else if (jwtPayload[IntentInfo.CALLBACK_URL] != null) {
            info.callbackurl = jwtPayload[IntentInfo.CALLBACK_URL];
        }
        info.type = IntentInfo.JWT;
        info.originalJwtRequest = jwt;
    }

    public getParamsByUri(uri: any, info: IntentInfo) {
        //TODO: implement
    }

    public parseIntentUri(uri: any, fromId: string): IntentInfo {
        //TODO: implement
        return null;
    }

    public sendIntentByUri(uri: any, fromId: string) {
        let info = this.parseIntentUri(uri, fromId);
        if (info != null && info.params != null) {
            this.doIntent(info);
        }
    }

    public doIntentByUri(uri: any) {
        try {
            this.sendIntentByUri(uri, "system");
        } catch (e) {
            Log.e(IntentManager.LOG_TAG, e);
        }
    }

    public createUnsignedJWTResponse(info: IntentInfo, result: string): string {
        //TODO: implement
        return null;
    }

    public createUrlResponse(info: IntentInfo, result: string): string {
        let ret = JSON.parse(result);
        if (info.req != null) {
            ret.req = info.req;
        }
        if (info.aud != null) {
            ret.aud = info.aud;
        }
        ret.iat = (new Date().getMilliseconds() / 1000) as number;
        ret.method = info.action;
        return JSON.stringify(ret);
    }

    public postCallback(name: string, value: string, callbackurl: string) {
        //TODO: implement
    }

    private getResultUrl(url: string, result: string): string {
        let param = "?result=";
        if (url.includes("?")) {
            param = "&result=";
        }
        return url + param + encodeURI(result);
    }

    public sendIntentResponse(basePlugin: AppBasePlugin, result: string, intentId: number, fromId: string) {
        //TODO: implement
    }

    public parseIntentPermission() {
        let permissionFile = require(pathJoin(app.getAppPath(), "config", "permission", "intent.json"));
        let json = Utility.getJsonMapFromFile(permissionFile);

        json.forEach((value: any, key: string) => {
            let intent = value;
            let intentPermission = new IntentPermission(intent);

            let jintent = json.get(intent);
            let array: any[] = jintent.sender;
            for (var i = 0; i < array.length; i++) {
                let appId = array[i] as string;
                intentPermission.addSender(appId);
            }
            array = jintent.receiver;
            for (var i = 0; i < array.length; i++) {
                let appId = array[i] as string;
                intentPermission.addReceiver(appId);
            }

            this.permissionList.set(intent, intentPermission);
        });
    }


    public getIntentSenderPermission(intent: string, appId: string): boolean {
        let intentPermission = this.permissionList.get(intent);
        if (intentPermission == null) {
            return true;
        }

        return intentPermission.senderIsAllow(appId);
    }

    public getIntentReceiverPermission(intent: string, appId: string): boolean {
        let intentPermission = this.permissionList.get(intent);
        if (intentPermission == null) {
            return true;
        }

        return intentPermission.receiverIsAllow(appId);
    }

    private extractShareIntentParams(info: IntentInfo): ShareIntentParams {
        // Extract JSON params from the share intent. Expected format is {title:"", url:""} but this
        // could be anything as this is set by users.
        if (info.params == null) {
            console.log("Share intent params are not set!");
            return null;
        }

        let jsonParams = null;
        try {
            jsonParams = JSON.parse(info.params);
        } catch (e) {
            console.log("Share intent parameters are not JSON format");
            return null;
        }

        let shareIntentParams = new ShareIntentParams();

        shareIntentParams.title = (jsonParams.title != null) ? jsonParams.title : "";

        let url = (jsonParams.url != null) ? jsonParams.url : "";
        if (url != null) {
            //TODO: parse URI
            //shareIntentParams.url = Uri.parse(url);
        }

        return shareIntentParams;
    }

    sendNativeShareAction(info: IntentInfo) {
        //TODO: implement
    }
}


export class ShareIntentParams {
    title: string = null;
    url: any = null;
}


/**
 * Helper class to deal with app intent result types that can be either JSON objects with raw data,
 * or JSON objects with "jwt" special field.
 */
export class IntentResult {
    rawResult: string;
    payload: any;
    jwt: string = null;

    constructor(result: string) {
        this.rawResult = result;

        let resultAsJson = JSON.parse(result);
        if (resultAsJson.jwt != null) {
            // The result is a single field named "jwt", that contains an already encoded JWT token
            this.jwt = resultAsJson.jwt as string;
            this.payload = IntentManager.parseJWT(this.jwt);
        }
        else {
            // The result is a simple JSON object
            this.payload = resultAsJson;
        }
    }

    payloadAsString(): string {
        return JSON.stringify(this.payload);
    }

    isAlreadyJWT(): boolean {
        return this.jwt != null;
    }

}