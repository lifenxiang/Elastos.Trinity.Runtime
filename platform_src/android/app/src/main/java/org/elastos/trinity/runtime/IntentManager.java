package org.elastos.trinity.runtime;

import android.content.Context;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Handler;
import android.text.TextUtils;
import android.util.Base64;
import android.util.Log;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Date;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
//import org.apache.tomcat.util.codec.binary.Base64;

import org.apache.http.client.HttpClient;
import org.json.JSONTokener;

public class IntentManager {
    public static final int MAX_INTENT_NUMBER = 20;
    private static final String LOG_TAG = "IntentManager";
    //public static final String JWT_SECRET = "secret";

    private LinkedHashMap<String, ArrayList<IntentInfo>> intentList = new LinkedHashMap();
    private LinkedHashMap<Long, IntentInfo> intentContextList = new LinkedHashMap();
    private LinkedHashMap<String, ArrayList<Long>> intentIdList = new LinkedHashMap();

    private LinkedHashMap<String, IntentPermission> permissionList = new LinkedHashMap();
    private Context context = null;

    private AppManager appManager;

    private static IntentManager intentManager;

    final static String[] trinitySchemes = {
            "elastos://",
            "https://scheme.elastos.org/",
            "https://did.trinity-tech.io/",
            "https://wallet.trinity-tech.io/",
    };

    public class ShareIntentParams {
        String title = null;
        Uri url = null;
    }

    public class OpenUrlIntentParams {
        Uri url = null;
    }

    IntentManager() {
        this.appManager = AppManager.getShareInstance();
        this.context = appManager.activity;

        try {
            parseIntentPermission();
        } catch (Exception e) {
            e.printStackTrace();
        }
        IntentManager.intentManager = this;
    }

    public static IntentManager getShareInstance() {
        if (IntentManager.intentManager == null) {
            IntentManager.intentManager = new IntentManager();
        }
        return IntentManager.intentManager;
    }

    public static boolean checkTrinityScheme(String url) {
        for (int i = 0; i < trinitySchemes.length; i++) {
            if (url.startsWith(trinitySchemes[i])) {
                return true;
            }
        }

        // For trinity native, also use native.scheme from config.json as a "trinity scheme" to handle incoming intents
        if (ConfigManager.getShareInstance().isNativeBuild()) {
            try {
                JSONObject nativeSchemeConfig = ConfigManager.getShareInstance().getJSONObjectValue("native.scheme");
                String nativeScheme = nativeSchemeConfig.getString("scheme") + "://" + nativeSchemeConfig.getString("path");
                if (url.startsWith(nativeScheme)) {
                    return true;
                }
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        }

        return false;
    }

    private String getIdbyFilter(IntentFilter filter) {
        return appManager.getIdbyStartupMode(filter.packageId, filter.startupMode, filter.serviceName);
    }

    private void addIntentToList(IntentInfo info) {
        String id = getIdbyFilter(info.filter);
        ArrayList<IntentInfo> infos = intentList.get(id);
        if (infos == null) {
            infos = new ArrayList<IntentInfo>();
            intentList.put(id, infos);
        }
        infos.add(info);
    }

    public void setIntentReady(String id)  throws Exception {
        ArrayList<IntentInfo> infos = intentList.get(id);
        if ((infos == null) || (infos.size() < 1)) {
            return;
        }

        for (int i = 0; i < infos.size(); i++) {
            IntentInfo info = infos.get(i);
            doIntent(info);
        }
        infos.clear();
        intentList.remove(id);
    }

    public int getIntentCount(String id)  {
        ArrayList<IntentInfo> infos = intentList.get(id);
        if ((infos == null) || (infos.size() < 1)) {
            return 0;
        }

        return infos.size();
    }

    private synchronized void putIntentContext(IntentInfo info) {
        IntentInfo intentInfo = intentContextList.get(info.intentId);
        while (intentInfo != null) {
            info.intentId++;
            intentInfo = intentContextList.get(info.intentId);
        }

        intentContextList.put(info.intentId, info);
        ArrayList<Long> ids = intentIdList.get(info.fromId);
        if (ids != null) {
            while (ids.size() > MAX_INTENT_NUMBER) {
                long intentId = ids.get(0);
                ids.remove(0);
                intentContextList.remove(intentId);
            }
        }
        else {
            ids = new ArrayList<Long>();
            intentIdList.put(info.fromId, ids);
        }
        ids.add(info.intentId);
    }

    public synchronized void removeAppFromIntentList(String id) throws Exception {
        Iterator<Map.Entry<Long, IntentInfo>> iterator = intentContextList.entrySet().iterator();

        while (iterator.hasNext()) {
            Map.Entry entry = iterator.next();
            IntentInfo info = (IntentInfo) entry.getValue();
            String modeId = getIdbyFilter(info.filter);
            if (modeId != null && modeId.equals(id) ) {
                if (info.type == IntentInfo.API && info.fromId != null) {
                    WebViewFragment fragment = appManager.getFragmentById(info.fromId);
                    if (fragment != null) {
                        if (info.filter.startupMode.equals(AppManager.STARTUP_APP)) {
                            appManager.start(info.fromId, AppManager.STARTUP_APP, null);
                        }
                        info.params = null;
                        fragment.basePlugin.onReceiveIntentResponse(info);
                    }
                }
                iterator.remove();
//                intentContextList.remove(entry.getKey());
            }
            else if (info.fromId.equals((id))) {
                iterator.remove();
//                intentContextList.remove(entry.getKey());
                if (info.filter.startupMode.equals(AppManager.STARTUP_INTENT)
                        || info.filter.startupMode.equals(AppManager.STARTUP_SILENCE)) {
                    appManager.close(info.filter.packageId, info.filter.startupMode, info.filter.serviceName);
                }
            }
        }
    }

    /**
     * Returns the list of package IDs able to handle the given intent action.
     */
    public IntentFilter[] getIntentFilter(String action) throws Exception {
        IntentFilter[] filters = appManager.dbAdapter.getIntentFilter(action);
        ArrayList<IntentFilter>list = new ArrayList<IntentFilter>();

        for (int i = 0; i < filters.length; i++) {
            if (this.getIntentReceiverPermission(action, filters[i].packageId)) {
                list.add(filters[i]);
            }
        }

        filters = new IntentFilter[list.size()];
        return list.toArray(filters);
    }

    private void popupIntentChooser(IntentInfo info, IntentFilter[] filters) {
        // More than one possible handler, show a chooser and pass it the selectable apps info.
        ArrayList<AppInfo> appInfos = new ArrayList();
        for (IntentFilter filter : filters) {
            appInfos.add(appManager.getAppInfo(filter.packageId));
        }

        IntentActionChooserFragment actionChooserFragment = new IntentActionChooserFragment(appManager, appInfos);

        // Special "share" case: add a specific entry for native OS "share" action
        if (info.action.equals("share")) {
            actionChooserFragment.useNativeShare(extractShareIntentParams(info));
        }

        actionChooserFragment.setListener(appInfo -> {
            actionChooserFragment.dismiss();

            // Now we know the real app that should receive the intent.
            for (IntentFilter filter : filters) {
                if (filter.packageId.equals(appInfo.app_id)) {
                    info.filter = filter;
                    info.toId = getIdbyFilter(info.filter);
                    break;
                }
            }
            try {
                sendIntent(info);
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        });

        if (info.action.equals("share")) {
            actionChooserFragment.setNativeShareListener(() -> {
                actionChooserFragment.dismiss();
                sendNativeShareAction(info);
            });
        }

        actionChooserFragment.show(appManager.activity.getFragmentManager(), "dialog");
    }

    public void doIntent(IntentInfo info) throws Exception {
        if (info.toId == null) {
            IntentFilter[] filters = getIntentFilter(info.action);

            // Throw an error in case no one can handle the action.
            // Special case for some specific actions that is always handled by the native OS too.
            if (!info.action.equals("share") && !info.action.equals("openurl")) {
                if (filters.length == 0) {
                    if (!ConfigManager.getShareInstance().isNativeBuild()) {
                        // Not a native build - so 0 filter means no one can handle the action
                        throw new Exception("Intent action " + info.action + " isn't supported!");
                    }
                    else {
                        // We are a trinity native build - launch that action as native intent
                        sendIntentToNativeOS(info);
                        return;
                    }
                }
            }

            if (!this.getIntentSenderPermission(info.action, info.fromId)) {
                throw new Exception("Application "+info.fromId+" doesn't have the permission to send an intent with action "+info.action);
            }

            if (info.action.equals("openurl")) {
                // We don't let apps handle the openurl intent. It's always a native call.
                sendNativeOpenUrlAction(info);
            }
            else if (!info.action.equals("share")) {
                // If there is only one application able to handle this intent, we directly use it.
                // Otherwise, we display a prompt so that user can pick the right application.
                // "share" action is special, as it must deal with the native share action.
                if (filters.length == 1) {
                    info.toId = getIdbyFilter(filters[0]);
                    info.filter = filters[0];
                    sendIntent(info);
                } else {
                    popupIntentChooser(info, filters);
                }
            }
            else {
                // Action is "share"
                if (filters.length == 0) {
                    // No dapp can handle share. Directly send the native action
                    sendNativeShareAction(info);
                }
                else {
                    // Show a popup chooser. It will add the native share action.
                    popupIntentChooser(info, filters);
                }
            }
        }
        else if (info.filter == null) {
            IntentFilter[] filters = getIntentFilter(info.action);
            for (IntentFilter filter : filters) {
                if (info.toId.startsWith(filter.packageId)) {
                    info.filter = filter;
                    sendIntent(info);
                    return;
                }
            }
            throw new Exception("The appid[" + info.toId +"]'s intent action '"+ info.action + "' isn't supported!");
        }
        else {
            sendIntent(info);
        }
    }

    public void sendIntent(IntentInfo info) throws Exception {
        String id =  getIdbyFilter(info.filter);
        WebViewFragment fragment = appManager.getFragmentById(id);
        if ((fragment != null) && (fragment.basePlugin.isIntentReady())) {
            putIntentContext(info);
            if (!appManager.isCurrentFragment(fragment)) {
                appManager.start(info.filter.packageId, info.filter.startupMode, info.filter.serviceName);
                appManager.sendLauncherMessageMinimize(info.fromId);
            }

            fragment.basePlugin.onReceiveIntent(info);
        }
        else {
            addIntentToList(info);
            appManager.start(info.filter.packageId, info.filter.startupMode, info.filter.serviceName);
            appManager.sendLauncherMessageMinimize(info.fromId);
        }
    }

    public static JSONObject parseJWT(String jwt) throws Exception {
        // Remove the Signature from the received JWT for now, we don't handle this.
        // TODO: extract the JWT issuer field from the JWT, resolve its DID from the DID sidechain, and
        // verify the JWT using the public key. JWT will have to be signed by the app developer's DID's private key.
        String[] splitToken = jwt.split("\\.");
        String unsignedToken = splitToken[0] + "." + splitToken[1] + ".";

        /*DefaultJwtParser parser = new DefaultJwtParser();
        Jwt<?, ?> parsedJwt = parser.parse(unsignedToken);
        Claims claims = (Claims) parsedJwt.getBody();*/

        String jwtPayload = splitToken[1];
        byte[] b64PayloadBytes = Base64.decode(jwtPayload, Base64.URL_SAFE);
        String b64Payload = new String(b64PayloadBytes, "UTF-8");

        JSONObject jwtPayloadJson = new JSONObject(b64Payload);

        return jwtPayloadJson;
    }

    final String[] removeJWTParams = {
            "appid",
            "iss",
            "iat",
            "exp",
            "redirecturl",
            "callbackurl"
    };

    public void getParamsByJWT(String jwt, IntentInfo info) throws Exception {
        JSONObject jwtPayload = parseJWT(jwt);

        jwtPayload.put("type", "jwt");
        info.params = jwtPayload.toString();

        if (jwtPayload.has("iss")) {
            info.aud = jwtPayload.getString("iss").toString();
        }
        if (jwtPayload.has("appid")) {
            info.req = jwtPayload.getString("appid").toString();
        }
        if (jwtPayload.has(IntentInfo.REDIRECT_URL)) {
            info.redirecturl = jwtPayload.getString(IntentInfo.REDIRECT_URL).toString();
        }
        else if (jwtPayload.has(IntentInfo.CALLBACK_URL)) {
            info.callbackurl = jwtPayload.getString(IntentInfo.CALLBACK_URL).toString();
        }
        info.type = IntentInfo.JWT;
        info.originalJwtRequest = jwt;
    }


    public void getParamsByUri(Uri uri, IntentInfo info) throws Exception {
        Set<String> set = uri.getQueryParameterNames();
        JSONObject json = new JSONObject();
        for (String key : set) {
            String value = uri.getQueryParameter(key);
            if (key.equals(IntentInfo.REDIRECT_URL)) {
                info.redirecturl = value;
            }
            else if (key.equals(IntentInfo.CALLBACK_URL)) {
                info.callbackurl = value;
            }
            else if (key.equals(IntentInfo.REDIRECT_APP_URL)) {
                info.redirectappurl = value;
            }
            else {
                if (key.equals("iss")) {
                    info.aud = value;
                }
                else if (key.equals("appid")) {
                    info.req = value;
                }

                if (Utility.isJSONType(value)) {
                    Object obj = new JSONTokener(value).nextValue();
                    json.put(key, obj);
                }
                else {
                    json.put(key, value);
                }
            }
        }
        info.type = IntentInfo.URL;
        info.params = json.toString();
    }

    public IntentInfo parseIntentUri(Uri uri, String fromId) throws Exception {
        IntentInfo info = null;
        String url = uri.toString();
        if (url.startsWith("elastos://") && !url.startsWith("elastos:///")) {
            url = "elastos:///" + url.substring(10);
            uri = Uri.parse(url);
        }
        List<String> list = uri.getPathSegments();
        if (list.size() > 0) {
            String[] paths = new String[list.size()];
            list.toArray(paths);
            String action = paths[0];
            Set<String> set = uri.getQueryParameterNames();
            long currentTime = System.currentTimeMillis();

            info = new IntentInfo(action, null, fromId, null, currentTime, false, null);

            // TMP BPI TEST
            // Quick and dirty way to remove the intent action scheme domain name from received urls
            // END TMP BPI TEST


            if (set.size() > 0) {
                getParamsByUri(uri, info);
            }
            else if (list.size() == 2) {
                getParamsByJWT(paths[1], info);
            }
        }
        return info;
    }

    /**
     * Returns the native app scheme that allows opening this app from native intents.
     * For example for elastOS, the main app scheme would be https://elastos.trinity-tech.io.
     * For a DID demo packaged by trinity native, this would be https://diddemo.trinity-tech.io.
     * Hyper IM would have https://app.hyperim.org, etc.
     */
    private String getNativeAppScheme() throws Exception {
        JSONObject schemeConfig = ConfigManager.getShareInstance().getJSONObjectValue("native.scheme");
        if (schemeConfig == null) {
            throw new Exception("No native app scheme found in config.json !");
        }

        return schemeConfig.getString("scheme") + "://" + schemeConfig.getString("path");
    }

    // Opposite of parseIntentUri().
    // From intent info params to url params.
    // Ex: info.params = "{a:1, b:{x:1}}" returns url?a=1&b={x:1}
    private String createUriParamsFromIntentInfo(String url, IntentInfo info) throws Exception {
        if (!Utility.isJSONType(info.params)) {
            throw new Exception("Intent parameters must be a JSON object");
        }

        if (url.contains("?")) {
            url += "&";
        }
        else {
            url += "?";
        }

        JSONObject jsonObject = new JSONObject(info.params);
        Iterator<String> firstLevelKeys = jsonObject.keys();
        while (firstLevelKeys.hasNext()) {
            String key = firstLevelKeys.next();
            url += key + "=" + Uri.encode(jsonObject.get(key).toString()) + "&";
        }

        // If there is no redirect url, we add one to be able to receive responses
        if (!jsonObject.has("redirecturl")) {
            // "intentresponse" is added For trinity native. NOTE: we should maybe move this out of this method
            url += "&redirecturl="+getNativeAppScheme()+"/intentresponse"; // Ex: https://diddemo.elastos.org/intentresponse
        }

        System.out.println("INTENT DEBUG: " + url);
        return url;
    }

    public void sendIntentByUri(Uri uri, String fromId) throws Exception {
        IntentInfo info = parseIntentUri(uri, fromId);
        if (info != null && info.params != null) {
            doIntent(info);
        }
    }

    public void doIntentByUri(Uri uri) {
        try {
            sendIntentByUri(uri, "system");
        } catch (Exception e) {
//            try {
//                IntentInfo info = parseIntentUri(uri);
//                String err = "{\"jwt\":\"Error:" + e.getLocalizedMessage() + "\"";
//                sendJWTResponse(null, info, err);
//            } catch (Exception ex) {
//                ex.printStackTrace();
//            }
            e.printStackTrace();
        }
    }


    public String createUnsignedJWTResponse(IntentInfo info, String result) throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> claims = mapper.readValue(result, Map.class);

        JwtBuilder builder = Jwts.builder()
                .setHeaderParam("type", "JWT")
                .addClaims(claims)
                .claim("req", info.req)
                .claim("method", info.action)
                .setIssuedAt(new Date())
                .setAudience(info.aud);

        return builder.compact();
    }

    public String createUrlResponse(IntentInfo info, String result) throws Exception {
        JSONObject ret = new JSONObject(result);
        if (info.req != null) {
            ret.put("req", info.req);
        }
        if (info.aud != null) {
            ret.put("aud", info.aud);
        }
        ret.put("iat", (int)(System.currentTimeMillis()/1000));
        ret.put("method", info.action);
        return ret.toString();
    }

    public void postCallback(String name, String value, String callbackurl) throws Exception {
        HttpClient httpClient = new DefaultHttpClient();
        HttpPost httpPost = new HttpPost(callbackurl);
        httpPost.addHeader("Content-Type", "application/json;charset=UTF-8");

        JSONObject json = new JSONObject();
        json.put(name, value);
        StringEntity entity = new StringEntity(json.toString(), "UTF-8");
        entity.setContentType("application/json");
        httpPost.setEntity(entity);

        HttpResponse httpResponse = httpClient.execute(httpPost);
        if (httpResponse != null
                && httpResponse.getStatusLine().getStatusCode() == 200) {
            Log.d(LOG_TAG, "Intent callback url called and returned with success");
        }
        else {
            String err = "Send callbackurl error";
            if (httpResponse != null) {
                err += ": " + httpResponse.getStatusLine().getStatusCode();
            }
            err += ". ";

            // Try to get a more specific error message from the page body
            {
                int n;
                char[] buffer = new char[1024 * 4];
                InputStreamReader reader = new InputStreamReader(httpResponse.getEntity().getContent(), "utf8");
                StringWriter writer = new StringWriter();
                while (-1 != (n = reader.read(buffer))) writer.write(buffer, 0, n);

                err += writer.toString();
            }

            throw new Exception(err);
        }
    }

    private String getResultUrl(String url, String result) {
        String param = "?result=";
        if (url.contains("?")) {
            param = "&result=";
        }
        return url + param + Uri.encode(result);
    }

    /**
     * Helper class to deal with app intent result types that can be either JSON objects with raw data,
     * or JSON objects with "jwt" special field.
     */
    private class IntentResult {
        String rawResult;
        JSONObject payload;
        String jwt = null;

        IntentResult(String result) throws Exception {
            this.rawResult = result;

            JSONObject resultAsJson = new JSONObject(result);
            if (resultAsJson.has("jwt")) {
                // The result is a single field named "jwt", that contains an already encoded JWT token
                jwt = resultAsJson.getString("jwt");
                payload = parseJWT(jwt);
            }
            else {
                // The result is a simple JSON object
                payload = resultAsJson;
            }
        }

        String payloadAsString() {
            return payload.toString();
        }

        boolean isAlreadyJWT() {
            return jwt != null;
        }
    }

    public void sendIntentResponse(AppBasePlugin basePlugin, String result, long intentId, String fromId) throws Exception {
        // Retrieve intent context information for the given intent id
        IntentInfo info = intentContextList.get(intentId);
        if (info == null) {
            throw new Exception("Intent information for intent ID "+intentId + " doesn't exist!");
        }

        WebViewFragment fragment = null;
        if (info.fromId != null) {
            fragment = appManager.getFragmentById(info.fromId);
            if (!info.silent && fragment != null && fragment.startupMode.equals(AppManager.STARTUP_APP)) {
                appManager.start(info.fromId, AppManager.STARTUP_APP, null);
            }
        }

        // The result object can be either a standard json object, or a {jwt:JWT} object.
        IntentResult intentResult = new IntentResult(result);

        if (info.type == IntentInfo.API) {
            // The intent was sent by a trinity dapp, inside trinity, so we call the intent response callback
            if (fragment != null) {
                info.params = intentResult.payloadAsString();
                // If the called dapp has generated a JWT as output, we pass the decoded payload to the calling dapp
                // for convenience, but we also forward the raw JWT as this is required in some cases.
                if (intentResult.isAlreadyJWT())
                    info.responseJwt = intentResult.jwt;
                fragment.basePlugin.onReceiveIntentResponse(info);
            }
        }
        else if (info.redirectappurl != null && fragment != null && fragment.basePlugin.isUrlApp()) {
            String url = getResultUrl(info.redirectappurl, result);
            fragment.loadUrl(url);
        }
        else {
            String url = info.redirecturl;
            if (url == null) {
                url = info.callbackurl;
            }

            // If there is a provided URL callback for the intent, we want to send the intent response to that url
            if (url != null) {
                String jwt;
                if (intentResult.isAlreadyJWT())
                    jwt = intentResult.jwt;
                else {
                    // App did not return a JWT, so we return an unsigned JWT instead
                    jwt = createUnsignedJWTResponse(info, result);
                }

                if (IntentManager.checkTrinityScheme(url)) {
                    // Response url is a trinity url that we can handle internally
                    if (intentResult.isAlreadyJWT())
                        url = url + "/" + jwt; // Pass the JWT directly
                    else {
                        url = getResultUrl(url, intentResult.payloadAsString()); // Pass the raw data as a result= field
                    }
                    sendIntentByUri(Uri.parse(url), info.fromId);
                } else {
                    // Response url can't be handled by trinity. So we either call an intent to open it, or HTTP POST data
                    if (info.redirecturl != null) {
                        if (intentResult.isAlreadyJWT())
                            url = info.redirecturl + "/" + jwt;
                        else
                            url = getResultUrl(url, intentResult.payloadAsString()); // Pass the raw data as a result= field
                        Utility.showWebPage(appManager.activity, url);
                    } else if (info.callbackurl != null) {
                        if (intentResult.isAlreadyJWT())
                            postCallback("jwt", jwt, info.callbackurl);
                        else
                            postCallback("result", intentResult.payloadAsString(), info.callbackurl);
                    }
                }
            }
        }

        intentContextList.remove(intentId);
        if (info.filter != null && info.filter.startupMode != null && (info.filter.startupMode.equals(AppManager.STARTUP_INTENT)
                || info.filter.startupMode.equals(AppManager.STARTUP_SILENCE))) {
            appManager.close(info.filter.packageId, info.filter.startupMode, info.filter.serviceName);
        }
    }

    public void parseIntentPermission() throws Exception {
        AssetManager manager = context.getAssets();
        InputStream inputStream = manager.open("www/config/permission/intent.json");

        JSONObject json = Utility.getJsonFromFile(inputStream);

        Iterator intents = json.keys();
        while (intents.hasNext()) {
            String intent = (String) intents.next();
            IntentPermission intentPermission = new IntentPermission(intent);

            JSONObject jintent = json.getJSONObject(intent);
            JSONArray array = jintent.getJSONArray("sender");
            for (int i = 0; i < array.length(); i++) {
                String appId = array.getString(i);
                intentPermission.addSender(appId);
            }
            array = jintent.getJSONArray("receiver");
            for (int i = 0; i < array.length(); i++) {
                String appId = array.getString(i);
                intentPermission.addReceiver(appId);
            }

            permissionList.put(intent, intentPermission);
        }
    }

    public boolean getIntentSenderPermission(String intent, String appId) {
        IntentPermission intentPermission = permissionList.get(intent);
        if (intentPermission == null) {
            return true;
        }

        return intentPermission.senderIsAllow(appId);
    }

    public boolean getIntentReceiverPermission(String intent, String appId) {
        IntentPermission intentPermission = permissionList.get(intent);
        if (intentPermission == null) {
            return true;
        }

        return intentPermission.receiverIsAllow(appId);
    }

    private ShareIntentParams extractShareIntentParams(IntentInfo info) {
        // Extract JSON params from the share intent. Expected format is {title:"", url:""} but this
        // could be anything as this is set by users.
        if (info.params == null) {
            System.out.println("Share intent params are not set!");
            return null;
        }

        JSONObject jsonParams = null;
        try {
             jsonParams = new JSONObject(info.params);
        } catch (JSONException e) {
            System.out.println("Share intent parameters are not JSON format");
            return null;
        }

        ShareIntentParams shareIntentParams = new ShareIntentParams();

        shareIntentParams.title  = jsonParams.optString("title");

        String url = jsonParams.optString("url");
        if (url != null) {
            shareIntentParams.url = Uri.parse(url);
        }

        return shareIntentParams;
    }

    void sendNativeShareAction(IntentInfo info) {
        ShareIntentParams extractedParams = extractShareIntentParams(info);
        if (extractedParams != null)  {
            // Can't send an empty share action
            if (extractedParams.title == null && extractedParams.url == null)
                return;

            android.content.Intent sendIntent = new android.content.Intent();
            sendIntent.setAction(android.content.Intent.ACTION_SEND);

            ArrayList<String> extraTextParams = new ArrayList();
            if (extractedParams.title != null)
                extraTextParams.add(extractedParams.title);

            if (extractedParams.url != null)
                extraTextParams.add(extractedParams.url.toString());

            sendIntent.putExtra(android.content.Intent.EXTRA_TEXT,  TextUtils.join(" ", extraTextParams));

            sendIntent.setType("text/plain");

            android.content.Intent shareIntent = android.content.Intent.createChooser(sendIntent, null);
            appManager.activity.startActivity(shareIntent);
        }
    }

    private OpenUrlIntentParams extractOpenUrlIntentParams(IntentInfo info) {
        // Extract JSON params from the open url intent. Expected format is {url:""}.
        if (info.params == null) {
            System.out.println("Openurl intent params are not set!");
            return null;
        }

        JSONObject jsonParams = null;
        try {
            jsonParams = new JSONObject(info.params);
        } catch (JSONException e) {
            System.out.println("Openurl intent parameters are not JSON format");
            return null;
        }

        OpenUrlIntentParams openUrlIntentParams = new OpenUrlIntentParams();

        String url = jsonParams.optString("url");
        if (openUrlIntentParams != null) {
            openUrlIntentParams.url = Uri.parse(url);
        }

        return openUrlIntentParams;
    }

    void sendNativeOpenUrlAction(IntentInfo info) {
        OpenUrlIntentParams extractedParams = extractOpenUrlIntentParams(info);
        if (extractedParams != null)  {
            // Can't send an empty open url action
            if (extractedParams.url == null)
                return;

            android.content.Intent sendIntent = new android.content.Intent();
            sendIntent.setAction(Intent.ACTION_VIEW);
            sendIntent.setData(extractedParams.url);

            android.content.Intent shareIntent = android.content.Intent.createChooser(sendIntent, null);
            appManager.activity.startActivity(shareIntent);
        }
    }

    private IntentInfo tmpOnGoingNativeIntentInfo = null;

    // TODO - QUICK AND DIRTY ATTEMPT - FULL IMPROVEMENT NEEDED
    public void onExternalIntentResponseReceived(Uri uri) {
        System.out.println("RECEIVED: "+uri.toString());

        String resultStr = null;
        if (uri.toString().contains("result=")) {
            // result received as a raw string / raw json string
            resultStr = uri.getQueryParameter("result");
        }
        else {
            // Consider the received result as a JWT token
            resultStr = "{jwt:\""+uri.getLastPathSegment()+"\"}";
        }
        System.out.println(resultStr);
        WebViewFragment fragment = appManager.getFragmentById(tmpOnGoingNativeIntentInfo.fromId);

        try {
            sendIntentResponse(fragment.basePlugin, resultStr, tmpOnGoingNativeIntentInfo.intentId, tmpOnGoingNativeIntentInfo.fromId);
            tmpOnGoingNativeIntentInfo = null;
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Serializes a sendIntent(info) command info into a url such as https://domain/action/?stringifiedJsonResponseParams
    // And sends that url to the native OS.
    void sendIntentToNativeOS(IntentInfo info) throws Exception {
        android.content.Intent sendIntent = new android.content.Intent();
        sendIntent.setAction(Intent.ACTION_VIEW);

        // TMP - move to config.json mapping maybe (dongxiao).
        // Backward compatibility: converts old style "credaccess"-like intent calls to full domain
        // calls such as https://https://did.trinity-tech.io/credaccess.
        switch (info.action) {
            case "credaccess":
            case "appidcredissue":
            case "credimport":
            case "credissue":
            case "didsign":
            case "promptpublishdid":
            case "registerapplicationprofile":
            case "sethiveprovider":
                info.action = "https://did.trinity-tech.io/"+info.action;
                break;
            case "pay":
            case "walletaccess":
            case "crmembervote":
            case "dposvotetransaction":
            case "didtransaction":
            case "esctransaction":
                info.action = "https://wallet.trinity-tech.io/"+info.action;
                break;
        }
        // END TMP

        // Convert intent info params into a serialized json string for the target url
        String url = createUriParamsFromIntentInfo(info.action, info); // info.action must be a full action url such as https://did.trinity-tech.io/credaccess

        sendIntent.setData(Uri.parse(url));

        try {
            tmpOnGoingNativeIntentInfo = info; // TODO - TMP DIRTY
            putIntentContext(info); // TODO - TMP DIRTY

            appManager.activity.startActivity(sendIntent);
        }
        catch (Exception e) {
            Log.d(LOG_TAG, "No native application able to open this intent");
        }
    }
}
