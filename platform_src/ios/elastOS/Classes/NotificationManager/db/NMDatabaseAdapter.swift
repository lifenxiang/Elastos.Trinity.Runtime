/*
* Copyright (c) 2018 Elastos Foundation
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

public class NMDatabaseAdapter {
    let helper: NMDatabaseHelper
    let notifier: NotificationManager

    // Tables
    let notifications = Table(NMDatabaseHelper.NOTIFICATION_TABLE)

    // Fields
    public let notificationIdField = Expression<Int64>(NMDatabaseHelper.NOTIFICATION_ID)
    public let didsessionField = Expression<String>(NMDatabaseHelper.DID_SESSION_DID)
    public let notificationkeyField = Expression<String>(NMDatabaseHelper.KEY)
    public let titleField = Expression<String>(NMDatabaseHelper.TITLE)
    public let messageField = Expression<String>(NMDatabaseHelper.MESSAGE)
    public let urlField = Expression<String>(NMDatabaseHelper.URL)
    public let emitterField = Expression<String>(NMDatabaseHelper.EMITTER)
    public let appIdField = Expression<String>(NMDatabaseHelper.APP_ID)
    public let sentDateField = Expression<Int64>(NMDatabaseHelper.SENT_DATE)

    public init(notifier: NotificationManager)
    {
        self.notifier = notifier
        helper = NMDatabaseHelper()
    }

    public func addNotification(didSessionDID: String, key: String, title: String, message: String, url: String, emitter: String, appId: String) throws -> Notification {
        let needUpdate = isNotificationExist(didSessionDID: didSessionDID, key: key, appId: appId)
        if (needUpdate) {
            try updateNotifications(didSessionDID: didSessionDID, key: key, title: title, message: message, url: url, emitter: emitter, appId: appId)
        } else {
            try insertNotification(didSessionDID: didSessionDID, key: key, title: title, message: message, url: url, emitter: emitter, appId: appId)
        }

        return getNotificationByKeyAndAppId(didSessionDID: didSessionDID, key: key, appId: appId)!
     }

    public func insertNotification(didSessionDID: String, key: String, title: String, message: String, url: String, emitter: String, appId: String) throws -> Void {
        let db = try helper.getDatabase()

        try db.transaction {
            try db.run(notifications.insert(
                didsessionField <- didSessionDID,
                notificationkeyField <- key,
                titleField <- title,
                messageField <- message,
                urlField <- url,
                emitterField <- emitter,
                appIdField <- appId,
                sentDateField <- Int64(Date().timeIntervalSince1970 * 1000)
            ))
        }
     }

    public func updateNotifications(didSessionDID: String, key: String, title: String, message: String, url: String, emitter: String, appId: String) throws -> Void {

        do {
            let db = try helper.getDatabase()
            try db.transaction {
                try db.run(notifications
                    .filter(didsessionField == didSessionDID && notificationkeyField == key && appIdField == appId)
                    .update(
                        titleField <- title,
                        messageField <- message,
                        urlField <- url,
                        emitterField <- emitter,
                        sentDateField <- Int64(Date().timeIntervalSince1970 * 1000)
                    ))
            }
        }
        catch (let error) {
            print(error)
        }
     }

    public func getNotificationByKeyAndAppId(didSessionDID: String, key: String, appId: String) -> Notification? {
        do {
            let db = try helper.getDatabase()
            var notification: Notification? = nil
            try db.transaction {
                let query = notifications.select(*)
                    .filter(didsessionField == didSessionDID && notificationkeyField == key && appIdField == appId)
                let notificationRows = try! db.prepare(query)
                for row in notificationRows {
                    notification = Notification.fromDatabaseRow(notifier: notifier, row: row)
                    break
                }
            }

            return notification
        }
        catch (let error) {
            print(error)
            return nil
        }
     }

    public func isNotificationExist(didSessionDID: String, key: String, appId: String) -> Bool {
        do {
            let db = try helper.getDatabase()
            var isExist = false
            try db.transaction {
                let query = notifications.select(*)
                    .filter(didsessionField == didSessionDID && notificationkeyField == key && appIdField == appId)
                let notificationRows = try! db.prepare(query)
                for _ in notificationRows {
                    isExist = true
                    break
                }
            }
            return isExist
        }
        catch (let error) {
            print(error)
        }

        return false
     }

    public func clearNotification(didSessionDID: String, notificationId: Int64) {
        do {
            let db = try helper.getDatabase()
            let row = notifications.filter(didsessionField == didSessionDID && notificationIdField == notificationId)
            try? db.transaction {
                _ = try? db.run(row.delete())
            }
        }
        catch (let error) {
            print(error)
        }
     }

    public func getNotifications(didSessionDID: String) -> Array<Notification> {
        var allNotifications = Array<Notification>()
        do {
            let db = try helper.getDatabase()
            try db.transaction {
                let query = notifications.select(*).filter(didsessionField == didSessionDID).order(sentDateField.desc)
                let rows = try! db.prepare(query)

                for row in rows {
                    let notification = Notification.fromDatabaseRow(notifier: notifier, row: row)
                    allNotifications.append(notification)
                }
            }

            return allNotifications
        }
        catch (let error) {
            print(error)
            return allNotifications
        }
     }
}
