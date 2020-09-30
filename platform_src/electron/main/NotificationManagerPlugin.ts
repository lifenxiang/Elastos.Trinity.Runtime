import { TrinityPlugin, SuccessCallback, ErrorCallback } from './TrinityPlugin';
import { NotificationManager } from './notificationmanager/NotificationManager';
import { NotificationRequest } from './notificationmanager/NotificationRequest';
import { TrinityRuntime } from './Runtime';

type CallbackContext = {
    success: SuccessCallback;
    error: ErrorCallback;
}

export class NotificationManagerPlugin extends TrinityPlugin {
    private static NATIVE_ERROR_CODE_INVALID_PARAMETER: number = -1;

    private sendSuccess(success: SuccessCallback, jsonObj: any) {
        success(jsonObj);
    }

    private sendError(error: ErrorCallback, jsonObj: any) {
        error(jsonObj);
    }

    private sendError2(error: ErrorCallback, method: string, message: string) {
        error(method + ": " + message);
    }

    private buildInvalidParameterError(): any {
        let result: any = {
            code: NotificationManagerPlugin.NATIVE_ERROR_CODE_INVALID_PARAMETER
        };
        return result;
    }

    private async getNotifier(): Promise<NotificationManager> {
        return await NotificationManager.getSharedInstance(this.did);
    }
    
    private async clearNotification(success: SuccessCallback, error: ErrorCallback, args: any) {
        let notificationId = args[0] as string;
        (await this.getNotifier()).clearNotification(notificationId);

        let result: any = {};
        this.sendSuccess(success, result);
    }

    private async getNotifications(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("NotificationManagerPlugin - getNotifications");
        let notifications = await (await this.getNotifier()).getNotifications();

        let array: any[] = [];
        for (let entry of notifications) {
            array.push(entry.toJSONObject());
        }

        let result: any = {
            notifications: array
        };
        this.sendSuccess(success, result);
    }

    private async sendNotification(success: SuccessCallback, error: ErrorCallback, args: any) {
        let notificationRequestAsJson: any = args[0] as any;

        let notificationRequest = NotificationRequest.fromJSONObject(notificationRequestAsJson);
        if (null == notificationRequest) {
            this.sendError(error, this.buildInvalidParameterError());
            return;
        }

        (await this.getNotifier()).sendNotification(notificationRequest, this.appId);

        let result: any = {};
        this.sendSuccess(success, result);
    }

    private async setNotificationListener(success: SuccessCallback, error: ErrorCallback, args: any) {
        (await this.getNotifier()).setNotificationListener((notification) => {
            let listenerResult: any = {
                notification: notification.toJSONObject()
            };

            success(listenerResult);
        });
    }
}

TrinityRuntime.getSharedInstance().registerPlugin("NotificationManager", (appId: string)=>{
    return new NotificationManagerPlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("NotificationManager", [
    "clearNotification",
    "getNotifications",
    "sendNotification",
    "setNotificationListener"
]);