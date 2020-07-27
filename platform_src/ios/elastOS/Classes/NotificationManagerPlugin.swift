/*
 * Copyright (c) 2020 Elastos Foundation
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

import Foundation

@objc(NotificationManagerPlugin)
class NotificationManagerPlugin : TrinityPlugin {
    func success(_ command: CDVInvokedUrlCommand) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK)

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func success(_ command: CDVInvokedUrlCommand, _ retAsDict: Dictionary<String, Any>) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: retAsDict)
        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func success(_ command: CDVInvokedUrlCommand, _ retAsDict: NSDictionary) {
        let result = CDVPluginResult(status: CDVCommandStatus_OK,
                                     messageAs: (retAsDict as! [AnyHashable : Any]));

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func error(_ command: CDVInvokedUrlCommand, _ retAsString: String) {
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR,
                                     messageAs: retAsString);

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    func error(_ command: CDVInvokedUrlCommand, _ method: String, _ retAsString: String) {
        let result = CDVPluginResult(status: CDVCommandStatus_ERROR,
                                     messageAs: "\(method): \(retAsString)");

        self.commandDelegate.send(result, callbackId: command.callbackId)
    }

    private func getNotifier() throws -> NotificationManager {
        return try NotificationManager.getSharedInstance(did: did)
    }

    @objc func clearNotification(_ command: CDVInvokedUrlCommand) {
        do {
            if let notificationID = command.arguments[0] as? Int64 {
                try getNotifier().clearNotification(notificationId: notificationID)
                self.success(command)
            }
            else {
                self.error(command, "clearNotification", "Invlaid notification ID")
            }
        }
        catch (let error) {
            print(error)
            self.error(command, "clearNotification", error.localizedDescription)
        }
    }

    @objc func getNotifications(_ command: CDVInvokedUrlCommand) {
        do {
            let notifications = try getNotifier().getNotifications()

            let array = NSMutableArray()
            for entry in notifications {
                array.add(entry.toJSONObject())
            }

            let ret = NSMutableDictionary()
            ret.setValue(array, forKey: "notifications")
            self.success(command, ret)
        }
        catch (let error) {
            print(error)
            self.error(command, "getNotifications", error.localizedDescription)
        }
    }

    @objc func sendNotification(_ command: CDVInvokedUrlCommand) {
        do {
            let notificationRequestAsJson = command.arguments[0] as! Dictionary<String, Any>

            if let notificationRequest = NotificationRequest.fromJSONObject(notificationRequestAsJson) {
                try getNotifier().sendNotification(notificationRequest: notificationRequest, appId: appId)
                self.success(command)
            }
            else {
                self.error(command, "sendNotification", "Invalid notification object")
            }
        }
        catch (let error) {
            print(error)
            self.error(command, "sendNotification", error.localizedDescription)
        }
    }

    @objc func setNotificationListener(_ command: CDVInvokedUrlCommand) {
        do {
            try getNotifier().setNotificationListener() { notification in
                    var listenerResult = Dictionary<String, Any>()
                    listenerResult["notification"] = notification.toJSONObject()

                    let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: listenerResult)
                    result?.setKeepCallbackAs(true)
                    self.commandDelegate.send(result, callbackId: command.callbackId)
            }

            let result = CDVPluginResult(status: CDVCommandStatus_NO_RESULT)
            result?.setKeepCallbackAs(true)
            self.commandDelegate.send(result, callbackId: command.callbackId)
        }
        catch (let error) {
            print(error)
            self.error(command, "setNotificationListener", error.localizedDescription)
        }
    }
}
