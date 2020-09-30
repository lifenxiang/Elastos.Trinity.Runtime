import { AppManager } from '../AppManager';
import { PasswordInfo } from './passwordinfo/PasswordInfo';
import { PasswordUnlockMode } from './PasswordUnlockMode';
import { PasswordGetInfoOptions } from './PasswordGetInfoOptions';
import { PasswordCreationOptions } from './PasswordCreationOptions';
import { Log } from '../Log';
import { existsSync, removeSync, mkdirSync } from 'fs-extra';
import { PasswordDatabaseInfo } from './PasswordDatabaseInfo';
import { MasterPasswordCreator } from './dialogs/MasterPasswordCreator';
import { MasterPasswordPrompter } from './dialogs/MasterPasswordPrompter';
import { BrowserWindow, app } from 'electron';

export interface BasePasswordManagerListener {
    cancel: () => void;
    error: (error: string) => void;
    onCancel(cancel: () => void): any;
    onError(error: (error: string) => void): any;
}

export class OnDatabaseLoadedListener implements BasePasswordManagerListener {
    databaseLoaded: () => void;
    cancel: () => void;
    error: (error: string) => void;
    onDatabaseLoaded(databaseLoaded: () => void) { this.databaseLoaded = databaseLoaded; return this; }
    onCancel(cancel: () => void): OnDatabaseLoadedListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnDatabaseLoadedListener { this.error = error; return this; }
}

export class OnDatabaseSavedListener implements BasePasswordManagerListener {
    databaseSaved: () => void;
    cancel: () => void;
    error: (error: string) => void;
    onDatabaseSaved(databaseSaved: () => void) { this.databaseSaved = databaseSaved; return this; }
    onCancel(cancel: () => void): OnDatabaseSavedListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnDatabaseSavedListener { this.error = error; return this; }
}

export class OnMasterPasswordCreationListener implements BasePasswordManagerListener {
    masterPasswordCreated: () => void;
    cancel: () => void;
    error: (error: string) => void;
    onMasterPasswordCreated(masterPasswordCreated: () => void) { this.masterPasswordCreated = masterPasswordCreated; return this; }
    onCancel(cancel: () => void): OnMasterPasswordCreationListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnMasterPasswordCreationListener { this.error = error; return this; }
}

export class OnMasterPasswordChangeListener implements BasePasswordManagerListener {
    masterPasswordChanged: () => void;
    cancel: () => void;
    error: (error: string) => void;
    onMasterPasswordChanged(masterPasswordChanged: () => void) { this.masterPasswordChanged = masterPasswordChanged; return this; }
    onCancel(cancel: () => void): OnMasterPasswordChangeListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnMasterPasswordChangeListener { this.error = error; return this; }
}

export class OnMasterPasswordRetrievedListener implements BasePasswordManagerListener {
    masterPasswordRetrieved: (password: string) => void;
    cancel: () => void;
    error: (error: string) => void;
    onMasterPasswordRetrieved(masterPasswordRetrieved: (password: string) => void) { this.masterPasswordRetrieved = masterPasswordRetrieved; return this; }
    onCancel(cancel: () => void): OnMasterPasswordRetrievedListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnMasterPasswordRetrievedListener { this.error = error; return this; }
}

export class OnPasswordInfoRetrievedListener implements BasePasswordManagerListener {
    passwordInfoRetrieved: (info: PasswordInfo) => void;
    cancel: () => void;
    error: (error: string) => void;
    onPasswordInfoRetrieved(passwordInfoRetrieved: (info: PasswordInfo) => void) { this.passwordInfoRetrieved = passwordInfoRetrieved; return this; }
    onCancel(cancel: () => void): OnPasswordInfoRetrievedListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnPasswordInfoRetrievedListener { this.error = error; return this; }
}

export class OnAllPasswordInfoRetrievedListener implements BasePasswordManagerListener {
    allPasswordInfoRetrieved: (info: Array<PasswordInfo>) => void;
    cancel: () => void;
    error: (error: string) => void;
    onAllPasswordInfoRetrieved(allPasswordInfoRetrieved: (info: Array<PasswordInfo>) => void) { this.allPasswordInfoRetrieved = allPasswordInfoRetrieved; return this; }
    onCancel(cancel: () => void): OnAllPasswordInfoRetrievedListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnAllPasswordInfoRetrievedListener { this.error = error; return this; }
}

export class OnPasswordInfoDeletedListener implements BasePasswordManagerListener {
    passwordInfoDeleted: () => void;
    cancel: () => void;
    error: (error: string) => void;
    onPasswordInfoDeleted(passwordInfoDeleted: () => void) { this.passwordInfoDeleted = passwordInfoDeleted; return this; }
    onCancel(cancel: () => void): OnPasswordInfoDeletedListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnPasswordInfoDeletedListener { this.error = error; return this; }
}

export class OnPasswordInfoSetListener implements BasePasswordManagerListener {
    passwordInfoSet: () => void;
    cancel: () => void;
    error: (error: string) => void;
    onPasswordInfoSet(passwordInfoSet: () => void) { this.passwordInfoSet = passwordInfoSet; return this; }
    onCancel(cancel: () => void): OnPasswordInfoSetListener { this.cancel = cancel; return this; }
    onError(error: (error: string) => void): OnPasswordInfoSetListener { this.error = error; return this; }
}

export class PasswordManager {
    private static LOG_TAG: string = "PWDManager";
    private static SHARED_PREFS_KEY: string = "PWDMANAGERPREFS";
    private static PASSWORD_MANAGER_APP_ID: string = "org.elastos.trinity.dapp.passwordmanager";
    private static DID_APPLICATION_APP_ID: string = "org.elastos.trinity.dapp.did";
    private static DID_SESSION_APPLICATION_APP_ID: string = "org.elastos.trinity.dapp.didsession";

    public static FAKE_PASSWORD_MANAGER_PLUGIN_APP_ID: string = "fakemasterpasswordpluginappid";
    public static MASTER_PASSWORD_BIOMETRIC_KEY: string = "masterpasswordkey";

    private static PREF_KEY_UNLOCK_MODE: string = "unlockmode";
    private static PREF_KEY_APPS_PASSWORD_STRATEGY: string = "appspasswordstrategy";

    private window: BrowserWindow;
    private static instance: PasswordManager;
    private appManager: AppManager;
    private databasesInfo: Map<String, PasswordDatabaseInfo> = new Map();
    private virtualDIDContext: string = null;
    private activeMasterPasswordPrompt: MasterPasswordPrompter.Builder = null;

    constructor() {
        this.appManager = AppManager.getSharedInstance();
        this.window = this.appManager.window;
    }

    public static getSharedInstance(): PasswordManager {
        if (PasswordManager.instance == null) {
            PasswordManager.instance = new PasswordManager();
        }
        return PasswordManager.instance;
    }

    /**
     * Saves or updates a password information into the secure database.
     * The passwordInfo's key field is checked to match existing content. Existing content
     * is overwritten.
     *
     * Password info could fail to be saved in case user cancels the master password creation or enters
     * a wrong master password then cancels.
     */
    public setPasswordInfo(info: PasswordInfo, did: string, appID: string, listener: OnPasswordInfoSetListener) { //TODO nested functions
        console.log("PasswordManager - setPasswordInfo");
        let actualDID: string = this.getActualDIDContext(did);
        let actualAppID: string = this.getActualAppID(appID);

        this.checkMasterPasswordCreationRequired(actualDID, new OnMasterPasswordCreationListener().onMasterPasswordCreated(() => {
            this.loadDatabase(actualDID, new OnDatabaseLoadedListener().onDatabaseLoaded(() => {
                try {
                    this.setPasswordInfoReal(info, actualDID, actualAppID);
                    listener.passwordInfoSet();
                }
                catch (e) {
                    listener.error(e);
                }
            }).onCancel(() => {
                listener.cancel();
            }).onError((error) => {
                listener.error(error);
            }), false);
        }).onCancel(() => {
            listener.cancel();
        }).onError((error) => {
            listener.error(error);
        }));
    }
    
    /*
     * Using a key identifier, returns a previously saved password info.
     *
     * A regular application can only access password info that it created itself.
     * The password manager application is able to access information from all applications.
     *
     * @param key Unique key identifying the password info to retrieve.
     *
     * @returns The password info, or null if nothing was found.
     */
    public getPasswordInfo(key: string, did: string, appID: string, options: PasswordGetInfoOptions, listener: OnPasswordInfoRetrievedListener) {
        let actualDID: string = this.getActualDIDContext(did);
        let actualAppID: string = this.getActualAppID(appID);

        this.checkMasterPasswordCreationRequired(actualDID, new OnMasterPasswordCreationListener().onMasterPasswordCreated(() => {
            // In case caller doesn't want to show the password prompt if the database is locked, we return a cancellation exception.
            if (!this.isDatabaseLoaded(actualDID) && !options.promptPasswordIfLocked) {
                listener.cancel();
                return;
            }
            this.loadDatabase(actualDID, new OnDatabaseLoadedListener().onDatabaseLoaded(() => {
                try {
                    let info: PasswordInfo = this.getPasswordInfoReal(key, actualDID, actualAppID);
                    listener.passwordInfoRetrieved(info);
                }
                catch (e) {
                    listener.error(e);
                }
            }).onCancel(() => {
                listener.cancel();
            }).onError((error) => {
                listener.error(error);
            }), false);
        }).onCancel(() => {
            listener.cancel();
        }).onError((error) => {
            listener.error(error);
        }));
    }
    
     /*
     * Returns the whole list of password information contained in the password database.
     *
     * Only the password manager application is allowed to call this API.
     *
     * @returns The list of existing password information.
     */
    public getAllPasswordInfo(did: string, appID: string, listener: OnAllPasswordInfoRetrievedListener) {
        let actualDID: string = this.getActualDIDContext(did);
        let actualAppID: string = this.getActualAppID(appID);

        if (!this.appIsPasswordManager(actualAppID)) {
            listener.error("Only the password manager application can call this API");
            return;
        }

        this.checkMasterPasswordCreationRequired(actualDID, new OnMasterPasswordCreationListener().onMasterPasswordCreated(() => {
            this.loadDatabase(actualDID, new OnDatabaseLoadedListener().onDatabaseLoaded(() => {
                try {
                    let infos: Array<PasswordInfo> = this.getAllPasswordInfoReal(actualDID);
                    listener.allPasswordInfoRetrieved(infos);
                }
                catch (e) {
                    listener.error(e);
                }
            }).onCancel(() => {
                listener.cancel();
            }).onError((error) => {
                listener.error(error);
            }), false);
        }).onCancel(() => {
            listener.cancel();
        }).onError((error) => {
            listener.error(error);
        }));
    }
     /*
     * Deletes an existing password information from the secure database.
     *
     * A regular application can only delete password info that it created itself.
     * The password manager application is able to delete information from all applications.
     *
     * @param key Unique identifier for the password info to delete.
     */
    public deletePasswordInfo(key: string, did: string, appID: string, targetAppID: string, listener: OnPasswordInfoDeletedListener) {
        let actualDID: string = this.getActualDIDContext(did);
        let actualAppID: string = this.getActualAppID(appID);
        let actualTargetAppID: string = this.getActualAppID(targetAppID);

        // Only the password manager app can delete content that is not its own content.
        if ((!this.appIsPasswordManager(actualAppID)) && (actualAppID != actualTargetAppID)) {
            listener.error("Only the application manager application can delete password info that does not belong to it.");
            return;
        }

        this.loadDatabase(actualDID, new OnDatabaseLoadedListener().onDatabaseLoaded(() => {
            try {
                this.deletePasswordInfoReal(key, actualDID, actualTargetAppID);
                listener.passwordInfoDeleted();
            }
            catch (e) {
                listener.error(e);
            }
        }).onCancel(() => {
            listener.cancel();
        }).onError((error) => {
            listener.error(error);
        }), false);
    }

    /** 
     * Convenience method to generate a random password based on given criteria (options).
     * Used by applications to quickly generate new user passwords.
     *
     * @param options unused for now
     */
    public generateRandomPassword(options: PasswordCreationOptions): string {
        let sizeOfRandomString: number = 8;

        let allowedCharacters: string = "";
            allowedCharacters += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            allowedCharacters += "abcdefghijklmnopqrstuvwxyz";
            allowedCharacters += "0123456789";
            allowedCharacters += "!@#$%^&*()_-+=<>?/{}~|";

        let sb: string = "";

        for(let i=sb.length;i < sizeOfRandomString;++i){
            sb += allowedCharacters.charAt(Math.floor(Math.random() * Math.floor(allowedCharacters.length)));
        }

        return sb.toString();
    }


    /**
     * Sets the new master password for the current DID session. This master password locks the whole
     * database of password information.
     *
     * In case of a master password change, the password info database is re-encrypted with this new password.
     *
     * Only the password manager application is allowed to call this API.
     */
    public changeMasterPassword(did: string, appID: string, listener: OnMasterPasswordChangeListener) {
        let actualDID: string = this.getActualDIDContext(did);
        let actualAppID: string = this.getActualAppID(appID);

        if (!this.appIsPasswordManager(actualAppID)) {
            Log.e(PasswordManager.LOG_TAG, "Only the password manager application can call this API");
            return;
        }

        this.loadDatabase(actualDID, new OnDatabaseLoadedListener().onDatabaseLoaded(() => {
             // No database exists. Start the master password creation flow
            new MasterPasswordCreator.Builder(this.window, this)
                .setOnNextClickedListener((password) => {
                    // Master password was provided and confirmed. Now we can use it.

                    try {
                        let dbInfo: PasswordDatabaseInfo = this.databasesInfo.get(actualDID);

                        // Changing the master password means re-encrypting the database with a different password
                        this.encryptAndSaveDatabase(actualDID, password);

                        // Remember the new password locally
                        dbInfo.activeMasterPassword = password;

                        // Disable biometric auth to force re-activating it, as the password has changed.
                        this.setBiometricAuthEnabled(actualDID, false);

                        listener.masterPasswordChanged();
                    }
                    catch (e) {
                        listener.error(e);
                    }
                })
                .setOnCancelClickedListener(() => listener.cancel())
                .setOnErrorListener((error) => listener.error(error))
                .prompt();
        }), false);
    }

    /*
     * If the master password has ben unlocked earlier, all passwords are accessible for a while.
     * This API re-locks the passwords database and further requests from applications to this password
     * manager will require user to provide his master password again.
     */
    public lockMasterPassword(did: string) {
        let actualDID: string = this.getActualDIDContext(did);

        this.lockDatabase(actualDID);
    }

    /**
     * Deletes all password information for the active DID session. The encrypted passwords database
     * is deleted without any way to recover it.
     */
    public deleteAll(did: string) {
        let actualDID: string = this.getActualDIDContext(did);

        // Lock currently opened database
        this.lockDatabase(actualDID);

        // Delete the permanent storage
        this.deleteDatabase(actualDID);
    }

    /**
     * Sets the unlock strategy for the password info database. By default, once the master password
     * if provided once by the user, the whole database is unlocked for a while, until elastOS exits,
     * or if one hour has passed, or if it's manually locked again.
     *
     * For increased security, user can choose to get prompted for the master password every time using
     * this API.
     *
     * This API can be called only by the password manager application.
     *
     * @param unlockMode Unlock strategy to use.
     */
    public setUnlockMode(unlockMode: PasswordUnlockMode, did: string, appID: string) {
        let actualDID: string = this.getActualDIDContext(did);
        let actualAppID: string = this.getActualAppID(appID);

        if (!this.appIsPasswordManager(actualAppID)) {
            Log.e(PasswordManager.LOG_TAG, "Only the password manager application can call this API");
            return;
        }

        //TODO: SharedPreferences?
        //this.getPrefs(actualDID).edit().putInt(PasswordManager.PREF_KEY_UNLOCK_MODE, unlockMode.ordinal()).apply();

        // if the mode becomes UNLOCK_EVERY_TIME, we lock the database
        if ((this.getUnlockMode(actualDID).value != PasswordUnlockMode.UNLOCK_EVERY_TIME) && (unlockMode.value == PasswordUnlockMode.UNLOCK_EVERY_TIME)) {
            this.lockDatabase(actualDID);
        }
    }

    private getUnlockMode(did: string): PasswordUnlockMode {
        let actualDID: string = this.getActualDIDContext(did);

        //TODO: check ordinal for enum, SharedPreferences?
        /*let savedUnlockModeAsInt: number = this.getPrefs(actualDID).getInt(PasswordManager.PREF_KEY_UNLOCK_MODE, PasswordUnlockMode.UNLOCK_FOR_A_WHILE);
        return PasswordUnlockMode.fromValue(savedUnlockModeAsInt);*/
        return PasswordUnlockMode.fromValue(PasswordUnlockMode.UNLOCK_FOR_A_WHILE);
    }

    /**
     * RESTRICTED
     *
     * Used by the DID session application to toggle DID contexts and deal with DID creation, sign in,
     * sign out. When a virtual context is set, api call such as getPasswordInfo() don't use the currently
     * signed in DID, but they use this virtual DID instead.
     *
     * @param didString The DID context to use for all further api calls. Pass null to clear the virtual context.
     */
    public setVirtualDIDContext(didString: string) {
        this.virtualDIDContext = didString;
    }

    private getActualDIDContext(currentDIDContext: string): string {
        if (this.virtualDIDContext != null) {
            return this.virtualDIDContext;
        }
        else {
            if (currentDIDContext != null) {
                return currentDIDContext;
            }
            else {
                throw new Error("No signed in DID or virtual DID context exist. Need at least one of them!");
            }
        }
    }
    
    private getActualAppID(baseAppID: string): string {
        // Share the same appid for did session and did apps, to be able to share passwords. Use a real app id, not a random
        // string, for security reasons.
        if (baseAppID == PasswordManager.DID_SESSION_APPLICATION_APP_ID ) {
            return PasswordManager.DID_APPLICATION_APP_ID;
        }
        return baseAppID;
    }
    

    private appIsPasswordManager(appId: string):boolean {
        return appId == PasswordManager.PASSWORD_MANAGER_APP_ID;
    }

    private loadDatabase(did: string, listener: OnDatabaseLoadedListener, isPasswordRetry: boolean) {
        try {
            if (this.isDatabaseLoaded(did) && !this.sessionExpired(did)) {
                listener.databaseLoaded();
            } else {
                if (this.sessionExpired(did)) {
                    this.lockDatabase(did);
                }
            }

            // Master password is locked - prompt it to user
            new MasterPasswordCreator.Builder(this.window, this)
                    .setOnNextClickedListener((passowrd, shouldSavePasswordToBiometric) => {
                        try {
                            this.loadEncryptedDatabase(did, passowrd);
                            if (this.isDatabaseLoaded(did)) {
                                // User chose to enable biometric authentication (was not enabled before). So we save the
                                // master password to the biometric crypto space.
                                if (shouldSavePasswordToBiometric) {
                                    //TODO: check if biometric password is needed
                                } else {
                                    listener.databaseLoaded();
                                }
                            } else
                                listener.error("Unknown error while trying to load the passwords database");
                        } catch (e) {
                            // In case of wrong password exception, try again
                            if ((e as string).includes("BAD_DECRYPT")) {
                                this.loadDatabase(did, listener, true);
                            } else {
                                // Other exceptions are passed raw
                                listener.error(e);
                            }
                        }
                    });
        }
        catch (e) {
            console.log(e);
        }
    }

    /**
     * A "session" is when a database is unlocked. This session can be considered as expired for further calls,
     * in case user wants to unlock the database every time, or in case it's been first unlocked a too long time ago (auto relock
     * for security).
     */
    private sessionExpired(did: string): boolean {
        if (this.getUnlockMode(did).value == PasswordUnlockMode.UNLOCK_EVERY_TIME)
            return true;

        let dbInfo: PasswordDatabaseInfo = this.databasesInfo.get(did);
        if (dbInfo == null)
            return true;

        // Last opened more than 1 hour ago? -> Expired
        let oneHourMs: number = (60*60*1000);
        return dbInfo.openingTime.getTime() < (new Date().getTime() - oneHourMs);
    }

    private isDatabaseLoaded(did: string): boolean {
        return (this.databasesInfo.get(did) != null);
    }

    private lockDatabase(did: string) {
        let dbInfo: PasswordDatabaseInfo = this.databasesInfo.get(did);
        if (dbInfo != null) {
            dbInfo.lock();
            this.databasesInfo.delete(did);
        }
    }

    private getDatabaseFilePath(did: string): string {
        let dataDir: string = app.getAppPath() + "/data/pwm/" + did;
        return dataDir + "/store.db";
    }

    private ensureDbPathExists(dbPath: string) {
        mkdirSync(dbPath, {recursive: true});
    }

    private databaseExists(did: string): boolean {
        return existsSync(did);
    }

    private createEmptyDatabase(did: string, masterPassword: string) {
        // No database exists yet. Return an empty database info.
        let dbInfo: PasswordDatabaseInfo = PasswordDatabaseInfo.createEmpty();
        this.databasesInfo.set(did, dbInfo);

        // Save the master password
        dbInfo.activeMasterPassword = masterPassword;
    }

    private deleteDatabase(did: string) {
        let dbPath: string = this.getDatabaseFilePath(did);
        if (existsSync(dbPath)) {
            removeSync(dbPath);
        }
    }

    /**
     * Using user's master password, decrypt the passwords list from disk and load it into memory.
     */
    private loadEncryptedDatabase(did: string, masterPassword: string) {
        if (masterPassword == null || masterPassword == "") {
            throw new Error("Empty master password is not allowed");
        }

        let dbPath: string = this.getDatabaseFilePath(did);
        this.ensureDbPathExists(dbPath);

        if (!existsSync(dbPath)) {
            this.createEmptyDatabase(did, masterPassword);
        }
        else {
            // Read the saved serialized hashmap as object
            
            //TODO: implement
            /*let fis: any = readJsonSync(dbPath);
           
            let map: Map<String, any[]> = (Map<String, any[]>) ois.readObject();

            // Now that we've loaded the file, try to decrypt it
            let decrypted: any[] = null;
            try {
                decrypted = decryptData(map, masterPassword);

                // We can now load the database content as a JSON object
                try {
                    let jsonData: string = new String(decrypted, StandardCharsets.UTF_8);
                    let dbInfo: PasswordDatabaseInfo = PasswordDatabaseInfo.fromJson(jsonData);
                    this.databasesInfo.set(did, dbInfo);

                    // Decryption was successful, saved master password in memory for a while.
                    dbInfo.activeMasterPassword = masterPassword;
                } catch ( e) {
                    throw new Error("Passwords database JSON content for did " + did + " is corrupted");
                }
            } catch (e) {
                throw new Error("Passwords database file for did " + did + " is corrupted");
            }*/
        }
    }

    private decryptData(map: Map<String, any[]>, masterPassword: string): any[] {
        let decrypted: any[] = null;

        //TODO: implement
        /*let salt: any[] = map.get("salt");
        let iv: any[] = map.get("iv");
        let encrypted: any[] = map.get("encrypted");

        // Regenerate key from password
        let passwordChar: any[] = Array.from(masterPassword); // Array.from(yourString);
        let pbKeySpec: PBEKeySpec = new PBEKeySpec(passwordChar, salt, 1324, 256);
        let secretKeyFactory:  SecretKeyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
        let keyBytes = secretKeyFactory.generateSecret(pbKeySpec).getEncoded();
        let keySpec: SecretKeySpec = new SecretKeySpec(keyBytes, "AES");

        // Decrypt
        let cipher: Cipher = Cipher.getInstance("AES/CBC/PKCS7Padding");
        let ivSpec: IvParameterSpec = new IvParameterSpec(iv);
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        decrypted = cipher.final(encrypted);*/

        return decrypted;
    }

    private encryptAndSaveDatabase(did: string, masterPassword: string) {
        //TODO: implement
        /*let dbPath: string = this.getDatabaseFilePath(did);
        this.ensureDbPathExists(dbPath);

        // Make sure the database is open
        let dbInfo: PasswordDatabaseInfo = this.databasesInfo.get(did);
        if (dbInfo == null) {
            throw new Error("Can't save a closed database");
        }

        // Convert JSON data into bytes
       let data:  any[] = dbInfo.rawJson.toString().getBytes();

        // Encrypt and get result
        let result: Map<String, any[]> = this.encryptData(data, masterPassword);

        // Save Salt, IV and encrypted data as serialized hashmap object in the database file.
        let fos: FileOutputStream = new FileOutputStream(new File(dbPath));
        let oos: ObjectOutputStream = new ObjectOutputStream(fos);
        oos.writeObject(result);
        oos.close();*/
    }

    private encryptData(plainTextBytes: any[], masterPassword: string): Map<String, any[]> {
       let map: Map<String, any[]> = new Map<String, any[]>();

        //TODO: implement
        // Random salt for next step
        /*let random: SecureRandom = new SecureRandom();
        let salt: any[] = new ArrayBuffer(256);
        random.nextBytes(salt);

        // PBKDF2 - derive the key from the password, don't use passwords directly
        let passwordChar: char[] = masterPassword.toCharArray(); // Turn password into char[] array
        let pbKeySpec: PBEKeySpec = new PBEKeySpec(passwordChar, salt, 1324, 256);
        let secretKeyFactory: SecretKeyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
        let keyBytes: any[] = secretKeyFactory.generateSecret(pbKeySpec).getEncoded();
        let keySpec: SecretKeySpec = new SecretKeySpec(keyBytes, "AES");

        // Create initialization vector for AES
        let ivRandom: SecureRandom = new SecureRandom(); // Not caching previous seeded instance of SecureRandom
        let iv: any[] = new ArrayBuffer(16);
        ivRandom.nextBytes(iv);
        let ivSpec: IvParameterSpec = new IvParameterSpec(iv);

        // Encrypt
        let cipher: Cipher = Cipher.getInstance("AES/CBC/PKCS7Padding");
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
        let encrypted: any[] = cipher.doFinal(plainTextBytes);

        map.set("salt", salt);
        map.set("iv", iv);
        map.set("encrypted", encrypted);*/

        return map;
    }

    private setPasswordInfoReal(info: PasswordInfo, did: string, appID: string) {
        let dbInfo: PasswordDatabaseInfo = this.databasesInfo.get(did);
        dbInfo.setPasswordInfo(appID, info);
        this.encryptAndSaveDatabase(did, dbInfo.activeMasterPassword);
    }

    private getPasswordInfoReal(key: string, did: string, appID: string): PasswordInfo {
        return this.databasesInfo.get(did).getPasswordInfo(appID, key);
    }

    private getAllPasswordInfoReal(did: string): Array<PasswordInfo> {
        return this.databasesInfo.get(did).getAllPasswordInfo();
    }

    private deletePasswordInfoReal(key: string, did: string, targetAppID: string) {
        let dbInfo: PasswordDatabaseInfo = this.databasesInfo.get(did);
        this.databasesInfo.get(did).deletePasswordInfo(targetAppID, key);
        this.encryptAndSaveDatabase(did, dbInfo.activeMasterPassword);
    }

    //TODO: check SharedPreferences
    /*private getPrefs(did: string): SharedPreferences {
        return this.activity.getSharedPreferences(PasswordManager.SHARED_PREFS_KEY+did, Context.MODE_PRIVATE);
    }*/

    private checkMasterPasswordCreationRequired(did: string, listener: OnMasterPasswordCreationListener) {
        console.log("PasswordManager - checkMasterPasswordCreationRequired");
        if (this.databaseExists(did)) {
            listener.masterPasswordCreated();
        }
        else {
            // No database exists. Start the master password creation flow
            new MasterPasswordCreator.Builder(this.window, this)
                .setOnNextClickedListener((password) => {
                    // Master password was provided and confirmed. Now we can use it.

                    // Create an empty database
                    this.createEmptyDatabase(did, password);

                    try {
                        // Save this empty database to remember that we have defined a master password
                        this.encryptAndSaveDatabase(did, password);

                        listener.masterPasswordCreated();
                    }
                    catch (e) {
                        listener.error(e);
                    }
                })
                .setOnCancelClickedListener(() => listener.cancel())
                .setOnErrorListener((error) => listener.error(error))
                .prompt();
        }
    }

    public isBiometricAuthEnabled(did: string): boolean {
        //TODO
        //return this.getPrefs(did).getBoolean("biometricauth", false);
        return false;
    }

    public setBiometricAuthEnabled(did: string, useBiometricAuth: boolean) {
        //TODO
        //this.getPrefs(did).edit().putBoolean("biometricauth", useBiometricAuth).apply();
        return false;
    }
    



}
