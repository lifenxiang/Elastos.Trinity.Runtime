package org.elastos.trinity.runtime.notificationmanager;

import android.database.Cursor;

import org.elastos.trinity.runtime.notificationmanager.db.DatabaseHelper;
import org.json.JSONException;
import org.json.JSONObject;

public class Notification {
    private NotificationManager notifier;
    public Integer nid;
    public String key;
    public String title;
    public String message;
    public String appId;
    public String url;
    public String emitter;
    public String sent_date;

    /**
     * Creates a notification object from a NOTIFICATION_TABLE row.
     */
    public static Notification fromDatabaseCursor(NotificationManager notifier, Cursor cursor) {
        Notification notification = new Notification();
        notification.notifier = notifier;
        notification.nid = cursor.getInt(cursor.getColumnIndex(DatabaseHelper.NOTIFICATION_ID));
        notification.key = cursor.getString(cursor.getColumnIndex(DatabaseHelper.KEY));
        notification.title = cursor.getString(cursor.getColumnIndex(DatabaseHelper.TITLE));
        notification.message = cursor.getString(cursor.getColumnIndex(DatabaseHelper.MESSAGE));
        notification.appId = cursor.getString(cursor.getColumnIndex(DatabaseHelper.APP_ID));
        notification.url = cursor.getString(cursor.getColumnIndex(DatabaseHelper.URL));
        notification.emitter = cursor.getString(cursor.getColumnIndex(DatabaseHelper.EMITTER));
        notification.sent_date = cursor.getString(cursor.getColumnIndex(DatabaseHelper.SENT_DATE));
        return notification;
    }

    public JSONObject toJSONObject() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("notificationId", nid);
            obj.put("key", key);
            obj.put("title", title);
            obj.put("message", message);
            obj.put("appId", appId);
            obj.put("url", url);
            obj.put("emitter", emitter);
            obj.put("sent_date", sent_date);
            return obj;
        }
        catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }
}
