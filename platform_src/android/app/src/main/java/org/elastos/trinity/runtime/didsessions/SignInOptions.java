package org.elastos.trinity.runtime.didsessions;

import org.json.JSONException;
import org.json.JSONObject;

public class SignInOptions {
    public String sessionLanguage = null;

    public SignInOptions() {
    }

    public JSONObject asJsonObject() {
        try {
            JSONObject jsonObj = new JSONObject();
            jsonObj.put("sessionLanguage", sessionLanguage);
            return jsonObj;
        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static SignInOptions fromJsonObject(JSONObject jsonObj) {
        try {
            SignInOptions options = new SignInOptions();

            if (jsonObj.has("sessionLanguage"))
                options.sessionLanguage = jsonObj.getString("sessionLanguage");

            return options;
        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }
}