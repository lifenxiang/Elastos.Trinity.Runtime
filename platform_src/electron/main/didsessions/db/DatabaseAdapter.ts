import { DatabaseHelper } from './DatabaseHelper';
import { BrowserWindow, app } from 'electron';
import { IdentityEntry } from '../IdentityEntry';
import { Long, Cursor, Repository } from 'typeorm';
import { IdentityAvatar } from '../IdentityAvatar';

export class DatabaseAdapter {

    helper: DatabaseHelper;
    
    constructor(dbPath: string) {
        this.helper = new DatabaseHelper(dbPath);
    }

    public static async newInstance(dbPath: string = app.getAppPath()): Promise<DatabaseAdapter> {
        let dbAdapter = new DatabaseAdapter(dbPath);
        await dbAdapter.init(dbPath);
        return dbAdapter;
    }

    private async init(dbPath: string) {
        this.helper = await DatabaseHelper.newInstance(dbPath);
    }

    public async addDIDSessionIdentityEntry(entry: IdentityEntry) {
        console.log("DatabaseAdapter - addDIDSessionIdentityEntry");
        // No upsert in sqlite-android. Check if we have this identity entry already or not (a bit slow but ok, not many DID entries)
        let existingEntries: Array<IdentityEntry> = await this.getDIDSessionIdentityEntries();

        // Check if the given entry exists in the list or not. If it exists, update it. Otherwise, insert it
        let entryExists: boolean = false;
        for (let e of existingEntries) {
            if ((e.didStoreId == entry.didStoreId) && (e.didString == entry.didString)) {
                // Already exists - so we update it
                entryExists = true;
                break;
            }
        }
        let db = this.helper.getRepository(DatabaseHelper.DIDSESSIONS_TABLE) as Repository<IdentityEntry>;
        if (entryExists) {
            console.log("DatabaseAdapter - addDIDSessionIdentityEntry - update");
            // Update
            let entries = await db.find({
                didStoreId: entry.didStoreId,
                didString: entry.didString  
            });
            for (let elem of entries) {
                // For now only NAME can change, as STORE ID and DID STRING are used as unique IDs
                elem.name = entry.name;
                if (entry.avatar != null) {
                    elem.avatar.contentType = entry.avatar.contentType;
                    elem.avatar.base64ImageData = entry.avatar.base64ImageData;
                }
                else {
                    elem.avatar.contentType = null;
                    elem.avatar.base64ImageData = null;
                }
                await db.save(elem);
            }
            return 1;
        }
        else {
            console.log("DatabaseAdapter - addDIDSessionIdentityEntry - insert");
            // Insert
            let db = this.helper.getRepository(DatabaseHelper.DIDSESSIONS_TABLE) as Repository<IdentityEntry>;
            entry.signedIn = 0;
            await db.save(entry);
            return 1;
        }

    }

    public async deleteDIDSessionIdentityEntry(didString: string) {
        let db = this.helper.getRepository(DatabaseHelper.DIDSESSIONS_TABLE) as Repository<IdentityEntry>;
        let urls = await db.find({didString: didString});
        await db.remove(urls);
    }

    public async getDIDSessionIdentityEntries(): Promise<IdentityEntry[]> {
        let db = this.helper.getRepository(DatabaseHelper.DIDSESSIONS_TABLE) as Repository<IdentityEntry>;
        let cursor = await db.find();

        let entries: Array<IdentityEntry> = new Array();
        for (let entry of cursor) {
            entries.push(this.didSessionIdentityFromCursor(entry));
        }
        return entries;
    }

    public async getDIDSessionSignedInIdentity(): Promise<IdentityEntry> {
        let db = this.helper.getRepository(DatabaseHelper.DIDSESSIONS_TABLE) as Repository<IdentityEntry>;
        let urls = await db.find({signedIn: 1});
        //TODO: compare
        /*await db.save(urls);
        let didRepo = this.helper.getRepository(DatabaseHelper.DIDSESSIONS_TABLE);
        let entries = await didRepo.find({didsessions: null});

        for (let entry of entries) {
            return this.didSessionIdentityFromCursor(entry);
        }*/
        for (let entry of urls) {
            return this.didSessionIdentityFromCursor(entry);
        }
        return null;
    }

    public async setDIDSessionSignedInIdentity(entry: IdentityEntry) {
        let db = this.helper.getRepository(DatabaseHelper.DIDSESSIONS_TABLE) as Repository<IdentityEntry>;

        // Clear signed in flag from all entries
        let entries = await db.find();
        for (let elem of entries) {
            elem.signedIn = 0;
            await db.save(elem);
        }
        
        // Mark the given entry as signed in
        if (entry != null) {
            let entries = await db.find({
                didStoreId: entry.didStoreId,
                didString: entry.didString  
            });

            for (let elem of entries) {
                elem.signedIn = 1;
                await db.save(elem);
            }
        }
    }

    private didSessionIdentityFromCursor(cursor: IdentityEntry): IdentityEntry {
        return cursor;
    }



}