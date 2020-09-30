import { IntentFilter } from './IntentFilter';

export class IntentInfo {

    public static API = 0;
    public static JWT = 1;
    public static URL = 2;

    public static REDIRECT_URL = "redirecturl";
    public static CALLBACK_URL = "callbackurl";
    public static REDIRECT_APP_URL = "redirectappurl";

    action: string;
    params: string;
    fromId: string;
    toId: string;
    intentId: number;
    callbackContext: any; //TODO: change type

    filter: IntentFilter;

    originalJwtRequest: string = null;
    redirecturl: string = null;
    callbackurl: string = null;
    redirectappurl: string = null;
    aud: string = null;
    req: string = null;
    type: number = IntentInfo.API;

    constructor(action: string, params: string, fromId: string, toId: string, intentId: number, callbackContext: any) {
        this.action = action;
        this.params = params;
        this.fromId = fromId;
        this.toId = toId;
        this.intentId = intentId;
        this.callbackContext = callbackContext;
    }
    
}