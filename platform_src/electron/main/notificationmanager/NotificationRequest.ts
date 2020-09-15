export class NotificationRequest {
    /** Identification key used to overwrite a previous notification if it has the same key. */
    public key: string = null;
    /** Title to be displayed as the main message on the notification. */
    public title: string = null;
    /** Intent URL emitted when the notification is clicked. */
    public url: string = null;
    /** Contact DID emitting this notification, in case of a remotely received notification. */
    public emitter: string = null;

    public static fromJSONObject(obj: any): NotificationRequest {

        let notif = new NotificationRequest();
        notif.key = obj.key as string;
        notif.title = obj.title as string;

        if (obj.url != null)
            notif.url = obj.url as string;
        if (obj.emitter != null) 
            notif.emitter = obj.emitter as string;
        return notif;
    }
}