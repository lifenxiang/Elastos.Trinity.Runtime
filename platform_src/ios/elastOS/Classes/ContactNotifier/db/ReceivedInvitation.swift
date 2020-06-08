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

public class ReceivedInvitation {
    public var iid: Int // Invitation unique ID
    public var did: String
    public var carrierUserID: String
    
    public static let invitationIdField = Expression<Int64>(CNDatabaseHelper.INVITATION_ID)
    public static let didField = Expression<String>(CNDatabaseHelper.DID)
    public static let carrierUserIdField = Expression<String>(CNDatabaseHelper.CARRIER_USER_ID)
    
    init() {
        iid = -1
        did = ""
        carrierUserID = ""
    }

    /**
     * Creates a ReceivedInvitation object from a RECEIVED_INVITATIONS row.
     */
    static func fromDatabaseCursor(row: Row) -> ReceivedInvitation {
        let invitation = ReceivedInvitation()
        invitation.iid = Int(row[invitationIdField])
        invitation.did = row[didField]
        invitation.carrierUserID = row[carrierUserIdField]
        return invitation
    }
}
