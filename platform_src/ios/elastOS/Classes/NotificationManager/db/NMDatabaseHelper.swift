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

public class NMDatabaseHelper : SQLiteOpenHelper {
    private static let DATABASE_VERSION = 1

    // Tables
    private static let DATABASE_NAME = "notificationmanager.db"
    public static let NOTIFICATION_TABLE = "notification"

    // Tables fields
    public static let NOTIFICATION_ID = "notificationid"
    public static let KEY = "notificationkey"
    public static let TITLE = "title";
    public static let URL = "url"
    public static let EMITTER = "emitter"
    public static let APP_ID = "appid"
    public static let SENT_DATE = "sent"

    public init() {
        let dataPath = NSHomeDirectory() + "/Documents/data/"
        super.init(dbFullPath: "\(dataPath)/\(NMDatabaseHelper.DATABASE_NAME)", dbNewVersion: NMDatabaseHelper.DATABASE_VERSION)
    }

    public override func onCreate(db: Connection) {
        // notification
        let notificationSQL = "create table " +
            NMDatabaseHelper.NOTIFICATION_TABLE + "(" + NMDatabaseHelper.NOTIFICATION_ID + " integer primary key autoincrement, " +
            NMDatabaseHelper.KEY + " varchar(128), " +
            NMDatabaseHelper.TITLE + " varchar(128), " +
            NMDatabaseHelper.URL + " varchar(128), " +
            NMDatabaseHelper.EMITTER + " varchar(128), " +
            NMDatabaseHelper.APP_ID + " varchar(128), " +
            NMDatabaseHelper.SENT_DATE + " TIMESTAMP)"
        try! db.execute(notificationSQL)
    }

    public override func onUpgrade(db: Connection, oldVersion: Int, newVersion: Int) {
    }

    public override func onDowngrade(db: Connection, oldVersion: Int, newVersion: Int) {
    }
}
