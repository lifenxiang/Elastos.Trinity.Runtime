import { DatabaseAdapter } from './db/DatabaseAdapter';
import { BrowserWindow, app } from 'electron';
import { AppManager } from '../AppManager';
import { Log } from '../Log';
import { NotificationRequest } from './NotificationRequest';
import { Notification } from './Notification';

export type NotificationListener = (notifcation: Notification) => void;

export class NotificationManager {
    public static LOG_TAG = "NotificationManager";

    private window: BrowserWindow;
    dbAdapter: DatabaseAdapter;
    didSessionDID: string;

    private static instances = new Map<string, NotificationManager>(); // Sandbox DIDs - One did session = one instance

    private onNotificationListeners = new Array<NotificationListener>();

    constructor(didSessionDID: string) {
        this.window = AppManager.getSharedInstance().window;
        this.didSessionDID = didSessionDID;

        Log.d(NotificationManager.LOG_TAG, "Creating NotificationManager ");
    }

    public static async getSharedInstance(did: string): Promise<NotificationManager> {
        if (this.instances.has(did))
            return this.instances.get(did);
        else {
            let instance = new NotificationManager(did);
            await instance.init();
            this.instances.set(did, instance);
            return instance;
        }
    }

    private async init() {
        this.dbAdapter = await DatabaseAdapter.newInstance(this, this.window);
    }

    /**
     * Remove an existing notification.
     *
     * @param notificationId Notification ID to remove
     */
    public clearNotification(notificationId: string) {
        this.dbAdapter.clearNotification(this.didSessionDID, notificationId);
    }

    /**
     * Get all notifications.
     */
    public async getNotifications(): Promise<Array<Notification>> {
        return await this.dbAdapter.getNotifications(this.didSessionDID);
    }

    /**
     * Sends a notification.
     * @param notificationRequest
     * @param appId
     */
    public async sendNotification(notificationRequest: NotificationRequest, appId: string) {
        let notification = await this.dbAdapter.addNotification(this.didSessionDID, notificationRequest.key, notificationRequest.title,
                            notificationRequest.url, notificationRequest.emitter, appId);
        this.notifyNotification(notification);

        //TODO: implement toast message
        //activity.runOnUiThread(() -> Toast.makeText(activity, notificationRequest.title, Toast.LENGTH_SHORT).show());
    }

    /**
     * Registers a listener to know when a notification has been accepted.
     *
     * @param onNotificationListener Called whenever an notification has been sent.
     */
    public setNotificationListener(onNotificationListener: NotificationListener) {
        this.onNotificationListeners.push(onNotificationListener);
    }

    private notifyNotification(notification: Notification) {
        if (this.onNotificationListeners.length == 0)
            return;

        if (notification != null) {
            for (let listener of this.onNotificationListeners) {
                listener(notification);
            }
        }
    }
}