package org.elastos.trinity.runtime.passwordmanager;

import org.json.JSONObject;

public class PasswordGetInfoOptions {
    public boolean promptPasswordIfLocked = true;

    public PasswordGetInfoOptions() {
    }

    public static PasswordGetInfoOptions fromJsonObject(JSONObject jsonObject) throws Exception {
        PasswordGetInfoOptions options = new PasswordGetInfoOptions();

        if (jsonObject.has("promptPasswordIfLocked"))
            options.promptPasswordIfLocked = jsonObject.getBoolean("promptPasswordIfLocked");

        return options;
    }
}