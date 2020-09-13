
public typealias onNotification = (_ notification: Notification) -> Void

public protocol NotificationListener {
    func onNotification(notification: Notification)
}

public class NotificationManager {
    public static let LOG_TAG = "NotificationManager"

    private static var instances = Dictionary<String, NotificationManager>()  // Sandbox DIDs - One did session = one instance

    var didSessionDID: String
    private let mainViewController: MainViewController
    private var dbAdapter: NMDatabaseAdapter? = nil

    private var onNotificationListeners = Array<onNotification>()


    init(didSessionDID: String) {
        self.didSessionDID = didSessionDID
        self.mainViewController = AppManager.getShareInstance().mainViewController
        self.dbAdapter = NMDatabaseAdapter(notifier: self)

        Log.i(NotificationManager.LOG_TAG, "Creating NotificationManager")
    }

    public static func getSharedInstance(did: String) throws -> NotificationManager {
        if (instances.keys.contains(did)) {
            return instances[did]!
        }
        else {
            let instance = NotificationManager(didSessionDID: did)
            instances[did] = instance
            return instance
        }
    }

    /**
     * Remove an existing notification.
     *
     * @param notificationId Notification ID to remove
     */
    public func clearNotification(notificationId: Int64?) -> Void {
        // Remove from database
        self.dbAdapter!.clearNotification(didSessionDID: self.didSessionDID, notificationId: notificationId!)
    }

    /**
     * Get all notifications.
     */
    public func getNotifications() -> Array<Notification> {
        return self.dbAdapter!.getNotifications(didSessionDID: self.didSessionDID);
    }

    /**
     * Sends a notification.
     * @param notificationRequest
     * @param appId
     */
    public func sendNotification(notificationRequest: NotificationRequest, appId: String) throws {
        let notification: Notification = try self.dbAdapter!.addNotification(didSessionDID: self.didSessionDID,
                                            key: notificationRequest.key!,
                                            title: notificationRequest.title!,
                                            message: notificationRequest.message!,
                                            url: notificationRequest.url ?? "",
                                            emitter:notificationRequest.emitter ?? "",
                                            appId: appId)

        notifyNotification(notification: notification)

        showToast(message: notification.title, seconds: 1)
    }

    /**
     * Registers a listener to know when a notification has been accepted.
     *
     * @param onNotificationListener Called whenever an notification has been sent.
     */
    public func setNotificationListener(onOnNotification: @escaping onNotification) {
        self.onNotificationListeners.append(onOnNotification)
    }

    private func notifyNotification(notification: Notification?) {
        guard onNotificationListeners.count > 0 else {
            return
        }

        if notification != nil {
            for listener in onNotificationListeners {
                listener(notification!)
            }
        }
    }

    func showToast(message: String, seconds: Double) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.view.backgroundColor = UIColor.black
        // alert.view.alpha = 0.8
        alert.view.layer.cornerRadius = 15

        // Make sure we run on the UI thread
        DispatchQueue.main.async {
            self.mainViewController.present(alert, animated: true)
        }

        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + seconds) {
            alert.dismiss(animated: true)
        }
    }
}
