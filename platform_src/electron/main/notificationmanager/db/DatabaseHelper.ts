import { Connection, Repository, createConnection } from 'typeorm';
import { Notification } from '../Notification';
import { join as pathJoin } from "path";

export class DatabaseHelper {
    private static DATABASE_VERSION = 2;
    private static LOG_TAG = "NotificationDBHelper";

    // Tables
    private static DATABASE_NAME = "notificationmanager.db";
    public static NOTIFICATION_TABLE = "notification";

    // Tables fields
    public static NOTIFICATION_ID = "notificationid";
    public static DID_SESSION_DID = "didsessiondid";
    public static KEY = "notificationkey";
    public static TITLE = "title";
    public static URL = "url";
    public static EMITTER = "emitter";
    public static APP_ID = "appid";
    public static SENT_DATE = "sent";

    private connection: Connection;
    private dbPath: string;
    private repository: Repository<Notification>;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
    }

    public static async newInstance(dbPath: string): Promise<DatabaseHelper> {
        let managerDBHelper = new DatabaseHelper(dbPath);
        await managerDBHelper.init();
        return managerDBHelper;
    }

    private async init() {
        this.connection = await createConnection({
            type: "sqljs",
            name: pathJoin(this.dbPath, DatabaseHelper.DATABASE_NAME),
            location: pathJoin(this.dbPath, DatabaseHelper.DATABASE_NAME),
            entities: [
                Notification
            ],
            autoSave: true,
            synchronize: true,
            logging: false
        });
        this.initRepositories();
    }

    private initRepositories() {
        this.repository = this.connection.getRepository(Notification);
    }

    public getRepository(): Repository<Notification> {
        return this.repository;
    }
}