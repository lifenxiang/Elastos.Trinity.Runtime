import { NotificationManager } from './NotificationManager';
import { Entity, PrimaryGeneratedColumn, Column, Repository } from 'typeorm';

@Entity()
export class Notification {
    private notifier: NotificationManager;
    @PrimaryGeneratedColumn() public nid: number;
    @Column() public key: string;
    @Column() public title: string;
    @Column() public appId: string;
    @Column() public url: string;
    @Column() public emitter: string;
    @Column() public sent_date: string;
    @Column() public didsessiondid: string;

    public static fromDatabaseCursor(notifier: NotificationManager, cursor: Notification): Notification {
        let notification = new Notification();
        notification.notifier = notifier;
        notification.nid = cursor.nid;
        notification.key = cursor.key;
        notification.title = cursor.title;
        notification.appId = cursor.appId;
        notification.url = cursor.url;
        notification.emitter = cursor.emitter;
        notification.sent_date = cursor.sent_date;
        notification.didsessiondid = cursor.didsessiondid;
        return notification;
    }

    public toJSONObject(): any {
        let obj: any = {
            notificationId: this.nid,
            key: this.key,
            title: this.title,
            appId: this.appId,
            url: this.url,
            emitter: this.emitter,
            send_date: this.sent_date
        };
        return obj;
    }
}