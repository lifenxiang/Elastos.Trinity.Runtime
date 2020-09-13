package org.elastos.trinity.runtime.contactnotifier;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Random;

public class RemoteNotificationRequest {
    /** Identification key used to overwrite a previous notification if it has the same key. */
    public String key = null;
    /** Package ID of the sending app. */
    public String appId = null;
    /** Title that highlights the notification main purpose. */
    public String title = null;
    /** Main message content  */
    public String message = null;
    /** Intent URL emitted when the notification is clicked. */
    public String url = null;

    public static RemoteNotificationRequest fromJSONObject(JSONObject obj, String appId) {
        try {
            RemoteNotificationRequest notif = new RemoteNotificationRequest();

            if (obj.has("key"))
                notif.key = obj.getString("key");
            else {
                // If no key is provided, generate a random key. This way, notification will not override each other.
                Random random = new Random();
                notif.key = ""+random.nextInt();
            }

            if (appId != null)
                notif.appId = appId;
            else if (obj.has("appId"))
                notif.appId = obj.getString("appId");
            if (obj.has("title"))
                notif.title = obj.getString("title");
            if (obj.has("message"))
                notif.message = obj.getString("message");
            if (obj.has("url"))
                notif.url = obj.getString("url");

            return notif;
        }
        catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }
}
