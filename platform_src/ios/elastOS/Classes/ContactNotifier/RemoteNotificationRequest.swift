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

public class RemoteNotificationRequest {
    /** Identification key used to overwrite a previous notification if it has the same key. */
    public var key: String? = nil
    /** Package ID of the sending app. */
    public var appId: String? = nil
    /** Title to be displayed as the main message on the notification. */
    public var title: String? = nil
    /** Intent URL emitted when the notification is clicked. */
    public var url: String? = nil

    public static func fromJSONObject(_ obj: Dictionary<String, Any>) -> RemoteNotificationRequest? {
        let notif = RemoteNotificationRequest()
        
        notif.key = obj["key"] as? String
        if notif.key == nil {
            // If no key is provided, generate a random key. This way, notification will not override each other.
            notif.key = "\(Int.random(in: 1...Int.max))"
        }
        
        if obj.keys.contains("appId") {
            notif.appId = obj["appId"] as? String
        }
        
        notif.title = obj["title"] as? String
        
        if obj.keys.contains("url") {
            notif.url = obj["url"] as? String
        }
        
        return notif
    }
}
