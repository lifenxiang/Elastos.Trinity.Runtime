package org.elastos.trinity.runtime.contactnotifier.comm;

import android.util.Log;

import org.elastos.carrier.FriendMessageReceiptHandler;
import org.elastos.carrier.ReceiptState;
import org.elastos.trinity.runtime.contactnotifier.ContactNotifier;
import org.elastos.trinity.runtime.contactnotifier.RemoteNotificationRequest;
import org.json.JSONObject;

public class RemoteNotificationCommand implements CarrierCommand {
    private CarrierHelper helper;
    private String contactCarrierUserID;
    private RemoteNotificationRequest notificationRequest;
    private CarrierHelper.OnCommandExecuted completionListener;

    RemoteNotificationCommand(CarrierHelper helper, String contactCarrierUserID, RemoteNotificationRequest notificationRequest, CarrierHelper.OnCommandExecuted completionListener) {
        this.helper = helper;
        this.contactCarrierUserID = contactCarrierUserID;
        this.notificationRequest = notificationRequest;
        this.completionListener = completionListener;
    }

    @Override
    public void executeCommand() {
        Log.i(ContactNotifier.LOG_TAG, "Executing remote contact notification command - contactCarrierUserID="+contactCarrierUserID);
        try {
            // Package our remote command
            JSONObject request = new JSONObject();
            request.put("command", "remotenotification");
            request.put("source", "contact_notifier_plugin"); // purely informative
            request.put("key", notificationRequest.key);
            request.put("title", notificationRequest.title);
            request.put("message", notificationRequest.message);
            request.put("appId", notificationRequest.appId);

            if (notificationRequest.url != null)
                request.put("url", notificationRequest.url);

            // IMPORTANT NOTE: We must use a empty handler otherwise current carrier version (5.6.0) doesn't handle offline
            // message support well if using the API without a handler.
            helper.carrierInstance.sendFriendMessage(contactCarrierUserID, request.toString(), new FriendMessageReceiptHandler() {
                @Override
                public void onReceipt(long messageid, ReceiptState state) {
                    // Nothing
                }
            });

            completionListener.onCommandExecuted(true, null);
        }
        catch (Exception e) {
            e.printStackTrace();
            completionListener.onCommandExecuted(false, e.getLocalizedMessage());
        }
    }
}