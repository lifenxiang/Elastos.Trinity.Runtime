package org.elastos.trinity.runtime;

import org.apache.cordova.CallbackContext;

public class IntentInfo {

    public static final int API = 0;
    public static final int JWT = 1;
    public static final int URL = 2;

    public static final String REDIRECT_URL = "redirecturl";
    public static final String CALLBACK_URL = "callbackurl";
    public static final String REDIRECT_APP_URL = "redirectappurl";

    String action; // Full action as given by the dapp, including domain and action
    String params;
    String fromId;
    String toId;
    long intentId;
    Boolean silent;
    CallbackContext callbackContext;

    IntentFilter filter;

    String responseJwt = null; // JWT output generated by the dapp or service that has handled the intent.
    String originalJwtRequest = null;
    String redirecturl = null;
    String callbackurl = null;
    String redirectappurl = null;
    String aud = null;
    String req = null;
    int type = API;

    IntentInfo(String action, String params, String fromId, String toId,
               long intentId, Boolean silent, CallbackContext callbackContext) {
        this.action = action;
        this.params = params;
        this.fromId = fromId;
        this.toId = toId;
        this.intentId = intentId;
        this.silent = silent;
        this.callbackContext = callbackContext;
    }
}
