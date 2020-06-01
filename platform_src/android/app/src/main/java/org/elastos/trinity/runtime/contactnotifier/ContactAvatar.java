package org.elastos.trinity.runtime.contactnotifier;

import android.database.Cursor;

import org.elastos.trinity.runtime.contactnotifier.db.DatabaseHelper;
import org.json.JSONException;
import org.json.JSONObject;

public class ContactAvatar {
    public String contentType;
    public String base64ImageData;

    protected ContactAvatar() {
    }

    public ContactAvatar(String contentType, String base64ImageData) {
        this.contentType = contentType;
        this.base64ImageData = base64ImageData;
    }

    /**
     * Creates a contact avatar object from a CONTACTS_TABLE row.
     */
    public static ContactAvatar fromDatabaseCursor(Cursor cursor) {
        ContactAvatar avatar = new ContactAvatar();
        avatar.contentType = cursor.getString(cursor.getColumnIndex(DatabaseHelper.AVATAR_CONTENTTYPE));
        avatar.base64ImageData = cursor.getString(cursor.getColumnIndex(DatabaseHelper.AVATAR_DATA));
        return avatar;
    }

    public JSONObject asJsonObject() {
        try {
            JSONObject jsonObj = new JSONObject();
            jsonObj.put("contentType", contentType);
            jsonObj.put("base64ImageData", base64ImageData);
            return jsonObj;
        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static ContactAvatar fromJsonObject(JSONObject jsonObj) {
        if (!jsonObj.has("contentType") || !jsonObj.has("base64ImageData"))
            return null;

        try {
            ContactAvatar avatar = new ContactAvatar(
                    jsonObj.getString("contentType"),
                    jsonObj.getString("base64ImageData"));

            return avatar;
        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }
}