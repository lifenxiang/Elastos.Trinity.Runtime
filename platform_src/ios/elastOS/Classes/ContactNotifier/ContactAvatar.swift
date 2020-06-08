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

import SQLite

public class ContactAvatar {
    public var contentType: String
    public var base64ImageData: String;
    
    private static let avatarContentTypeField = Expression<String>(CNDatabaseHelper.AVATAR_CONTENTTYPE)
    private static let avatarDataField = Expression<String>(CNDatabaseHelper.AVATAR_DATA)
    
    private init() {
        self.contentType = ""
        self.base64ImageData = ""
    }
    
    public init(contentType: String, base64ImageData: String) {
        self.contentType = contentType
        self.base64ImageData = base64ImageData
    }

    /**
     * Creates a contact avatar object from a CONTACTS_TABLE row.
     */
    public static func fromDatabaseRow(_ row: Row) -> ContactAvatar {
        let avatar = ContactAvatar()
        avatar.contentType = row[avatarContentTypeField]
        avatar.base64ImageData = row[avatarDataField]
        return avatar
    }

    public func asJSONObject() -> NSDictionary {
        let obj = NSMutableDictionary()
        obj["contentType"] = contentType
        obj["base64ImageData"] = base64ImageData
        return obj
    }
    
    public static func fromJsonObject(_ jsonObj: Dictionary<String, Any>) -> ContactAvatar? {
        if !jsonObj.keys.contains("contentType") || !jsonObj.keys.contains("base64ImageData") {
            return nil
        }

        let avatar = ContactAvatar(contentType: jsonObj["contentType"] as! String, base64ImageData: jsonObj["base64ImageData"] as! String)

        return avatar
    }
}
