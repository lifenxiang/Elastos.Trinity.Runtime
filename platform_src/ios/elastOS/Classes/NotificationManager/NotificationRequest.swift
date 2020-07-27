
public class NotificationRequest {
    /** Identification key used to overwrite a previous notification if it has the same key. */
    public var key: String? = nil
    /** Title to be displayed as the main message on the notification. */
    public var title: String? = nil
    /** Detailed message for this notification. */
    public var message: String? = nil
    /** Intent URL emitted when the notification is clicked. */
    public var url: String? = nil
    /** Contact DID emitting this notification, in case of a remotely received notification. */
    public var emitter: String? = nil;

    public static func fromJSONObject(_ obj: Dictionary<String, Any>) -> NotificationRequest? {
        guard obj.keys.contains("key") && obj.keys.contains("title") else {
            return nil
        }

        let notif = NotificationRequest()

        notif.key = obj["key"] as? String
        notif.title = obj["title"] as? String
        
        if obj.keys.contains("message") {
            notif.message = obj["message"] as? String
        }

        if obj.keys.contains("url") {
            notif.url = obj["url"] as? String
        }

        if obj.keys.contains("emitter") {
            notif.emitter = obj["emitter"] as? String
        }

        return notif
    }
}
