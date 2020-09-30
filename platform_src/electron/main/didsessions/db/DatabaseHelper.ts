import { IdentityEntry } from '../IdentityEntry';
import { IdentityAvatar } from '../IdentityAvatar';
import { Connection, Repository, createConnection } from 'typeorm';
import { join as pathJoin } from "path";

export class DatabaseHelper{
    private static DATABASE_VERSION = 2;
    private static LOG_TAG = "DIDSessDBHelper";

    // Tables
    private static DATABASE_NAME = "didsessions.db";
    public static DIDSESSIONS_TABLE = "didsessions";

    // Tables fields
    public static DIDSESSION_DIDSTOREID = "didstoreid";
    public static DIDSESSION_DIDSTRING = "didstring";
    public static DIDSESSION_NAME = "name";
    public static DIDSESSION_SIGNEDIN = "signedin";
    public static DIDSESSION_AVATAR_CONTENTTYPE = "avatar_contenttype";
    public static DIDSESSION_AVATAR_DATA = "avatar_data";


    private connection: Connection;
    private dbPath: string;
    private repositoryMap = new Map<string, Repository<any>>();

    constructor(dbPath: string) {
        //Log.d(ManagerDBHelper.LOG_TAG, "Creating DB connection: "+dbPath);
        this.dbPath = dbPath;
    }

    public static async newInstance(dbPath: string): Promise<DatabaseHelper> {
        let databaseHelper = new DatabaseHelper(dbPath);
        await databaseHelper.init();
        return databaseHelper;
    }
    
    private async init() {
        this.connection = await createConnection({
            type: "sqljs",
            name: pathJoin(this.dbPath, DatabaseHelper.DATABASE_NAME), // Use full path as a unique connection name to ensure multiple connections capability, not "default" connection
            location: pathJoin(this.dbPath, DatabaseHelper.DATABASE_NAME),
            entities: [
                IdentityEntry,
                IdentityAvatar
            ],
            autoSave: true,
            synchronize: true,
            logging: false
        });
        this.initRepositories();
    }

    private initRepositories() {
        this.repositoryMap.set(DatabaseHelper.DIDSESSIONS_TABLE, this.connection.getRepository(IdentityEntry));
    }

    getRepository(table: string): Repository<any> {
        return this.repositoryMap.get(table);
    }


}