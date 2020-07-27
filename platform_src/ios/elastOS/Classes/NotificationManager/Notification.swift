import SQLite

public class Notification {
    private var notifier: NotificationManager? = nil

    private static let notificationIdField = Expression<Int64>(NMDatabaseHelper.NOTIFICATION_ID)
    private static let notificationkeyField = Expression<String>(NMDatabaseHelper.KEY)
    private static let titleField = Expression<String>(NMDatabaseHelper.TITLE)
    private static let messageField = Expression<String>(NMDatabaseHelper.MESSAGE)
    private static let urlField = Expression<String>(NMDatabaseHelper.URL)
    private static let emitterField = Expression<String>(NMDatabaseHelper.EMITTER)
    private static let appIdField = Expression<String>(NMDatabaseHelper.APP_ID)
    private static let sentDateField = Expression<Int64>(NMDatabaseHelper.SENT_DATE)

    public var nId: Int64 = 0
    public var key: String = ""
    public var title: String = ""
    public var message: String = ""
    public var appId: String = ""
    public var url: String = ""
    public var emitter: String = ""
    public var sent_date: Int64 = 0

    private init() {
    }

    /**
     * Creates a Notification object from a NOTIFICATION_TABLE row.
     */
    public static func fromDatabaseRow(notifier: NotificationManager, row: Row) -> Notification {
        let notification = Notification()
        notification.notifier = notifier
        notification.nId = row[notificationIdField]
        notification.key = row[notificationkeyField]
        notification.title = row[titleField]
        notification.message = row[messageField]
        notification.appId = row[appIdField]
        notification.url = row[urlField]
        notification.emitter = row[emitterField]
        notification.sent_date = row[sentDateField]
        return notification
    }

    public func toJSONObject() -> NSDictionary {
        let obj = NSMutableDictionary()
        obj["notificationId"] = nId
        obj["key"] = key
        obj["title"] = title
        obj["message"] = message
        obj["appId"] = appId
        obj["url"] = url
        obj["emitter"] = emitter
        obj["sent_date"] = sent_date
        return obj
    }
}
