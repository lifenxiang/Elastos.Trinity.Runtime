import { AppManager } from '../AppManager';
import { IdentityEntry } from './IdentityEntry';
import { SignInOptions } from './SignInOptions';
import { PreferenceManager } from '../PreferenceManager';
import { BrowserWindow } from 'electron';
import { Log } from '../Log';
import { DatabaseAdapter } from './db/DatabaseAdapter';
import { PasswordManager } from '../passwordmanager/PasswordManager';

export type OnAuthenticationListener = (jwtToken: string) => void;

export class DIDSessionManager {
    private static  LOG_TAG: string = "DIDSessionManager";

    private window: BrowserWindow;
    private static instance: DIDSessionManager;
    private appManager: AppManager;
    private dbAdapter: DatabaseAdapter;

    constructor() {
        this.appManager = AppManager.getSharedInstance();
        this.window = this.appManager.window;
        try {
            //DIDVerifier.initDidStore(this.appManager.getBaseDataPath()); //TODO
        } catch (e) {
            e.printStackTrace();
        }
    }

    public static async getSharedInstance(): Promise<DIDSessionManager> {
        if (DIDSessionManager.instance == null) {
            DIDSessionManager.instance = new DIDSessionManager();
            await DIDSessionManager.instance.init();
        }
        return DIDSessionManager.instance;
    }

    private async init() {
        this.dbAdapter = await DatabaseAdapter.newInstance();
    }

    public addIdentityEntry(entry: IdentityEntry) {
        console.log("DIDSessionManager - addIdentityEntry");
        this.dbAdapter.addDIDSessionIdentityEntry(entry);
    }

    public deleteIdentityEntry(didString: string) {
        this.dbAdapter.deleteDIDSessionIdentityEntry(didString);
    }
 
    public async getIdentityEntries(): Promise<Array<IdentityEntry>> {
        return await this.dbAdapter.getDIDSessionIdentityEntries();
    }

    public async getSignedInIdentity(): Promise<IdentityEntry> {
        return await this.dbAdapter.getDIDSessionSignedInIdentity();
    }
    
    public async signIn(identityToSignIn: IdentityEntry, options: SignInOptions) {
        // Make sure there is no signed in identity already
        let signedInIdentity: IdentityEntry = await (await DIDSessionManager.getSharedInstance()).getSignedInIdentity();
        if (signedInIdentity != null) {
            this.dbAdapter.setDIDSessionSignedInIdentity(null);
        }

        this.dbAdapter.setDIDSessionSignedInIdentity(identityToSignIn);

        let sessionLanguage: string = null;
        if (options != null)
            sessionLanguage = options.sessionLanguage;

        // Ask the manager to handle the UI sign in flow.
        this.appManager.signIn(sessionLanguage);
    }

    public async signOut() {
        console.log("DIDSessionManager - signOut");
        let signedInIdentity: IdentityEntry = await this.getSignedInIdentity();
        if (signedInIdentity != null) {
            // Lock password manager session database
            PasswordManager.getSharedInstance().lockMasterPassword(signedInIdentity.didString);
        }

        this.dbAdapter.setDIDSessionSignedInIdentity(null);

        // Ask the app manager to sign out and redirect user to the right screen
        this.appManager.signOut();
    }

    public async authenticate(nonce: string, realm: string, expiresIn: number, listener: OnAuthenticationListener) { //TODO
        // Make sure there is a signed in user
         let signedInIdentity: IdentityEntry = await (await DIDSessionManager.getSharedInstance()).getSignedInIdentity();
        if (signedInIdentity == null)
            console.log("No signed in user, cannot authenticate");

        // Retrieve the master password
        /*let passwordInfoKey: string = "didstore-"+signedInIdentity.didStoreId;
        let appId: string = "org.elastos.trinity.dapp.didsession"; // act as the did session app to be able to retrieve a DID store password
        PasswordManager.getSharedInstance().getPasswordInfo(passwordInfoKey, signedInIdentity.didString, appId, (info) => {
            //let genericPasswordInfo: GenericPasswordInfo = (GenericPasswordInfo)info;
            let genericPasswordInfo = info; //TODO: delete this line
            if (genericPasswordInfo == null || genericPasswordInfo.password == null || genericPasswordInfo.password.equals("")) {
                Log.e(DIDSessionManager.LOG_TAG, "Unable to generate an authentication JWT: no master password");
                listener(null);
            }
            else {
                // Now we have the did store password. Open the did store and sign
                // Use the same paths as the DID plugin
                let cacheDir: string = this.activity.getFilesDir() + "/data/did/.cache.did.elastos";
                let resolver: string = await PreferenceManager.getSharedInstance().getDIDResolver();

                try {
                    // Initialize the DID store
                    DIDBackend.initialize(resolver, cacheDir);
                    let dataDir: string = this.activity.getFilesDir() + "/data/did/useridentities/" + signedInIdentity.didStoreId;
                    let didStore: DIDStore = DIDStore.open("filesystem", dataDir, (payload, memo) -> {});

                    // Load the did document
                    let didDocument: DIDDocument = didStore.loadDid(signedInIdentity.didString);
                    if (didDocument == null) {
                        Log.e(DIDSessionManager.LOG_TAG, "Unable to generate an authentication JWT: unable to load the did");
                        listener(null);
                    }
                    else {
                        // Create an empty presentation just to pass the DID string but nothing else
                        let did: DID = new DID(signedInIdentity.didString);

                        // Empty list of credentials
                        let builder: VerifiablePresentation.Builder = VerifiablePresentation.createFor(did, didStore);
                        let credsArray: VerifiableCredential[] = new VerifiableCredential[0];
                        let presentation: VerifiablePresentation = builder.credentials(credsArray)
                                .nonce(nonce)
                                .realm(realm)
                                .seal(genericPasswordInfo.password);

                        // Generate a JWT payload that holds the same format as the "credaccess" scheme intent
                        let presentationAsJsonObj: any = JSON.parse(presentation.toString());
                        let jwtPayloadJson: any = {};
                        jwtPayloadJson.presentationAsJsonObj = this.presentation;

                        // Sign as JWT
                        let header: JwsHeader = JwtBuilder.createJwsHeader();
                        header.setType(Header.JWT_TYPE).setContentType("json");

                        let cal: Calendar = Calendar.getInstance();
                        cal.set(Calendar.MILLISECOND, 0);
                        let iat: Date = cal.getTime();
                        cal.add(Calendar.MINUTE, expiresIn);
                        let exp: Date = cal.getTime();

                        let body: Claims = JwtBuilder.createClaims();
                        body.setIssuer(signedInIdentity.didString)
                                .setIssuedAt(iat)
                                .setExpiration(exp)
                                .putAllWithJson(jwtPayloadJson.toString());

                        let jwtToken: string = didDocument.jwtBuilder()
                                .setHeader(header)
                                .setClaims(body)
                                .sign(genericPasswordInfo.password)
                                .compact();

                        listener(jwtToken);
                    }
                }
                catch (e) {
                    Log.e(DIDSessionManager.LOG_TAG, "Unable to generate an authentication JWT: "+e);
                    listener(null);
                }
            }
        });*/
    }
}
