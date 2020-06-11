package org.elastos.trinity.runtime.contactnotifier;

import android.database.Cursor;

import org.elastos.trinity.runtime.contactnotifier.db.DatabaseHelper;
import org.json.JSONException;
import org.json.JSONObject;

public class Contact {
    private ContactNotifier notifier;

    public String did;
    public String carrierUserID;
    public String name;
    public ContactAvatar avatar;
    public boolean notificationsBlocked;

    /**
     * Creates a contact object from a CONTACTS_TABLE row.
     */
    public static Contact fromDatabaseCursor(ContactNotifier notifier, Cursor cursor) {
        Contact contact = new Contact();
        contact.notifier = notifier;
        contact.did = cursor.getString(cursor.getColumnIndex(DatabaseHelper.DID));
        contact.carrierUserID = cursor.getString(cursor.getColumnIndex(DatabaseHelper.CARRIER_USER_ID));
        contact.notificationsBlocked = cursor.getInt(cursor.getColumnIndex(DatabaseHelper.NOTIFICATIONS_BLOCKED)) == 1;
        contact.name = cursor.getString(cursor.getColumnIndex(DatabaseHelper.NAME));
        contact.avatar = ContactAvatar.fromDatabaseCursor(cursor);
        return contact;
    }

    public JSONObject toJSONObject() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("did", did);
            obj.put("carrierUserID", carrierUserID);
            obj.put("notificationsBlocked", notificationsBlocked);
            obj.put("name", name);

            if (avatar != null)
                obj.put("avatar", avatar.asJsonObject());
            else
                obj.put("avatar", null);

            return obj;
        }
        catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Sends a notification to the notification manager of a distant friend's Trinity instance.
     *
     * @param notificationRequest The notification content.
     */
    public void sendRemoteNotification(RemoteNotificationRequest notificationRequest) {
        notifier.carrierHelper.sendRemoteNotification(carrierUserID, notificationRequest, (succeeded, reason)->{
            // Nothing to do here for now, no matter if succeeded or not.
        });
    }

    /**
     * Allow or disallow receiving remote notifications from this contact.
     *
     * @param allowNotifications True to receive notifications, false to reject them.
     */
    public void setAllowNotifications(boolean allowNotifications) {
        this.notificationsBlocked = !allowNotifications;
        notifier.dbAdapter.updateContactNotificationsBlocked(notifier.didSessionDID, did, this.notificationsBlocked);
    }

    /**
     * Tells whether the contact is currently online or not.
     */
    public OnlineStatus getOnlineStatus() {
        return notifier.onlineStatusFromCarrierStatus(notifier.carrierHelper.getFriendOnlineStatus(carrierUserID));
    }

    public void setName(String name) {
        this.name = name;
        notifier.dbAdapter.updateContactName(notifier.didSessionDID, did, this.name);
    }

    public void setAvatar(ContactAvatar avatar) {
        this.avatar = avatar;
        notifier.dbAdapter.updateContactAvatar(notifier.didSessionDID, did, this.avatar);
    }
}
