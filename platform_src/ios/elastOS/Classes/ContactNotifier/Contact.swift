/*
* Copyright (c) 2020 Elastos Foundation
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import SQLite

public class Contact {
    private var notifier: ContactNotifier? = nil
    
    private static let didSessionDIDField = Expression<String>(CNDatabaseHelper.DID_SESSION_DID)
    private static let didField = Expression<String>(CNDatabaseHelper.DID)
    private static let carrierUserIdField = Expression<String>(CNDatabaseHelper.CARRIER_USER_ID)
    private static let notificationsBlockedField = Expression<Bool>(CNDatabaseHelper.NOTIFICATIONS_BLOCKED)
    private static let addedDateField = Expression<Int64>(CNDatabaseHelper.ADDED_DATE)
    private static let nameField = Expression<String?>(CNDatabaseHelper.NAME)

    public var did: String = ""
    public var carrierUserID: String = ""
    public var name: String? = nil
    public var avatar: ContactAvatar? = nil
    public var notificationsBlocked: Bool = false
    
    private init() {
    }

    /**
     * Creates a contact object from a CONTACTS_TABLE row.
     */
    public static func fromDatabaseRow(notifier: ContactNotifier, row: Row) -> Contact {
        let contact = Contact()
        contact.notifier = notifier
        contact.did = row[didField]
        contact.carrierUserID = row[carrierUserIdField]
        contact.notificationsBlocked = row[notificationsBlockedField]
        contact.name = row[nameField]
        contact.avatar = ContactAvatar.fromDatabaseRow(row)
        return contact
    }

    public func toJSONObject() -> Dictionary<String, Any> {
        var obj = Dictionary<String, Any>()
        obj["did"] = did
        obj["carrierUserID"] = carrierUserID
        obj["notificationsBlocked"] = notificationsBlocked
        obj["name"] = name
        
        if avatar != nil {
            obj["avatar"] = avatar!.asJSONObject()
        }
        else {
            obj["avatar"] = nil
        }
        
        return obj
    }

    /**
     * Sends a notification to the notification manager of a distant friend's Trinity instance.
     *
     * @param notificationRequest The notification content.
     */
    public func sendRemoteNotification(notificationRequest: RemoteNotificationRequest) {
        notifier!.carrierHelper!.sendRemoteNotification(contactCarrierUserID: carrierUserID, notificationRequest: notificationRequest) { succeeded, reason in
            // Nothing to do here for now, no matter if succeeded or not.
        }
    }

    /**
     * Allow or disallow receiving remote notifications from this contact.
     *
     * @param allowNotifications True to receive notifications, false to reject them.
     */
    public func setAllowNotifications(_ allowNotifications: Bool) {
        self.notificationsBlocked = !allowNotifications
        notifier!.dbAdapter!.updateContactNotificationsBlocked(didSessionDID: notifier!.didSessionDID, did: did, shouldBlockNotifications: notificationsBlocked)
    }

    /**
     * Tells whether the contact is currently online or not.
     */
    public func getOnlineStatus() -> OnlineStatus {
        return notifier!.onlineStatusFromCarrierStatus(notifier!.carrierHelper!.getFriendOnlineStatus(friendId: carrierUserID))
    }
    
    public func setName(_ name: String?) {
        self.name = name
        notifier!.dbAdapter!.updateContactName(didSessionDID: notifier!.didSessionDID, did: did, name: name)
    }

    public func setAvatar(_ avatar: ContactAvatar) {
        self.avatar = avatar
        notifier!.dbAdapter!.updateContactAvatar(didSessionDID: notifier!.didSessionDID, did: did, avatar: avatar)
    }
}
