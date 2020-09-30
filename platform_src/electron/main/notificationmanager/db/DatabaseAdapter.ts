import { BrowserWindow, app } from 'electron';
import { DatabaseHelper } from './DatabaseHelper';
import { NotificationManager } from '../NotificationManager';
import { Notification } from '../Notification';

export class DatabaseAdapter {
    helper: DatabaseHelper;
    window: BrowserWindow;
    notifier: NotificationManager;

    constructor(notifier: NotificationManager, window: BrowserWindow) {
        this.notifier = notifier;
        this.window = window;
    }

    public static async newInstance(notifier: NotificationManager, window: BrowserWindow, dbPath: string = app.getAppPath()): Promise<DatabaseAdapter> {
        let dbAdapter = new DatabaseAdapter(notifier, window);
        await dbAdapter.init(dbPath);
        return dbAdapter;
    }

    private async init(dbPath: string) {
        this.helper = await DatabaseHelper.newInstance(dbPath);
    }

    public async addNotification(didSessionDID: string, key: string, title: string, url: string, emitter: string, appId: string): Promise<Notification> {
        // Overwrite previous notification if it has the same key and appId
        let needUpdate = this.isNotificationExist(didSessionDID, key, appId);
        if (needUpdate) {
            this.updateNotification(didSessionDID, key, title, url, emitter, appId);
        } else {
            this.insertNotification(didSessionDID, key, title, url, emitter, appId);
        }

        return this.getNotificationByKeyAndAppId(didSessionDID, key, appId);
    }

    public insertNotification(didSessionDID: string, key: string, title: string, url: string, emitter: string, appId: string) {
        let notificationRepository = this.helper.getRepository();
        let notification = new Notification();
        notification.didsessiondid = didSessionDID;
        notification.key = key;
        notification.title = title;
        notification.url = url;
        notification.emitter = emitter;
        notification.appId = appId;
        notification.sent_date = new Date().getTime().toString();
        notificationRepository.save(notification);
    }

    public async updateNotification(didSessionDID: string, key: string, title: string, url: string, emitter: string, appId: string) {
        let notificationRepository = this.helper.getRepository();
        let notifications = await notificationRepository.find({
            didsessiondid: didSessionDID,
            key: key,
            appId: appId
        });

        for (let notification of notifications) {
            notification.title = title;
            notification.url = url;
            notification.emitter = emitter;
            notification.sent_date = new Date().getTime().toString();
            await notificationRepository.save(notification);
        }
    }

    public async getNotificationByKeyAndAppId(didSessionDID: string, key: string, appId: string): Promise<Notification> {
        let notificationRepository = this.helper.getRepository();
        let notifications = await notificationRepository.find({
            didsessiondid: didSessionDID,
            key: key,
            appId: appId
        });

        if (notifications.length != 0) {
            return Notification.fromDatabaseCursor(this.notifier, notifications[0]);
        }

        return null;
    }

    private async isNotificationExist(didSessionDID: string, key: string, appId: string): Promise<boolean> {
        let notificationRepository = this.helper.getRepository();
        let notifications = await notificationRepository.find({
            didsessiondid: didSessionDID,
            key: key,
            appId: appId
        });

        for (let notification of notifications) {
            return true;
        }

        return false;
    }

    public async clearNotification(didSessionDID: string, notificationId: string) {
        let notificationRepository = this.helper.getRepository();
        let notifications = await notificationRepository.find({
            didsessiondid: didSessionDID,
            nid: Number(notificationId)
        });
        await notificationRepository.remove(notifications);
    }

    public async getNotifications(didSessionDID: string): Promise<Array<Notification>> {
        let notificationRepository = this.helper.getRepository();
        let notificationList = await notificationRepository.find({
            didsessiondid: didSessionDID
        });

        let notifications = new Array<Notification>();
        for (let cursor of notificationList) {
            let notification = Notification.fromDatabaseCursor(this.notifier, cursor);
            notifications.push(notification);
        }
        
        return notifications;
    }
}