package org.elastos.trinity.runtime.didsessions;

import android.util.Log;

import org.elastos.did.DID;
import org.elastos.did.DIDAdapter;
import org.elastos.did.DIDBackend;
import org.elastos.did.DIDDocument;
import org.elastos.did.DIDStore;
import org.elastos.did.VerifiableCredential;
import org.elastos.did.VerifiablePresentation;
import org.elastos.did.jwt.Claims;
import org.elastos.did.jwt.Header;
import org.elastos.did.jwt.JwsHeader;
import org.elastos.did.jwt.JwtBuilder;
import org.elastos.trinity.runtime.AppManager;
import org.elastos.trinity.runtime.ConfigManager;
import org.elastos.trinity.runtime.DIDVerifier;
import org.elastos.trinity.runtime.IntentInfo;
import org.elastos.trinity.runtime.IntentManager;
import org.elastos.trinity.runtime.PreferenceManager;
import org.elastos.trinity.runtime.WebViewActivity;
import org.elastos.trinity.runtime.didsessions.db.DatabaseAdapter;
import org.elastos.trinity.runtime.passwordmanager.PasswordGetInfoOptions;
import org.elastos.trinity.runtime.passwordmanager.PasswordManager;
import org.elastos.trinity.runtime.passwordmanager.passwordinfo.GenericPasswordInfo;
import org.elastos.trinity.runtime.passwordmanager.passwordinfo.PasswordInfo;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;

public class DIDSessionManager {
    private static final String LOG_TAG = "DIDSessionManager";

    private WebViewActivity activity;
    private static DIDSessionManager instance;
    private AppManager appManager;
    private DatabaseAdapter dbAdapter;

    public interface OnAuthenticationListener {
        void onJWTCreated(String jwtToken);
    }

    public DIDSessionManager() {
        this.appManager = AppManager.getShareInstance();
        this.activity = this.appManager.activity;
        try {
            DIDVerifier.initDidStore(appManager.getBaseDataPath());
        } catch (Exception e) {
            e.printStackTrace();
        }

        dbAdapter = new DatabaseAdapter(activity);
    }

    public static DIDSessionManager getSharedInstance() {
        if (DIDSessionManager.instance == null) {
            DIDSessionManager.instance = new DIDSessionManager();
        }
        return DIDSessionManager.instance;
    }

    public void addIdentityEntry(IdentityEntry entry) throws Exception {
        dbAdapter.addDIDSessionIdentityEntry(entry);
    }

    public void deleteIdentityEntry(String didString) throws Exception {
        dbAdapter.deleteDIDSessionIdentityEntry(didString);
    }

    public ArrayList<IdentityEntry> getIdentityEntries() throws Exception {
        return dbAdapter.getDIDSessionIdentityEntries();
    }

    public IdentityEntry getSignedInIdentity() throws Exception {
        return dbAdapter.getDIDSessionSignedInIdentity();
    }

    public void signIn(IdentityEntry identityToSignIn, SignInOptions options) throws Exception {
        // Make sure there is no signed in identity already
        IdentityEntry signedInIdentity = DIDSessionManager.getSharedInstance().getSignedInIdentity();
        if (signedInIdentity != null) {
            dbAdapter.setDIDSessionSignedInIdentity(null);
        }

        dbAdapter.setDIDSessionSignedInIdentity(identityToSignIn);

        String sessionLanguage = null;
        if (options != null)
            sessionLanguage = options.sessionLanguage;

        // Ask the manager to handle the UI sign in flow.
        appManager.signIn(sessionLanguage);
    }

    public void signOut() throws Exception {
        IdentityEntry signedInIdentity = getSignedInIdentity();
        if (signedInIdentity != null) {
            // Lock password manager session database
            PasswordManager.getSharedInstance().lockMasterPassword(signedInIdentity.didString);
        }

        dbAdapter.setDIDSessionSignedInIdentity(null);

        // Ask the app manager to sign out and redirect user to the right screen
        appManager.signOut();
    }

    public void authenticate(String nonce, String realm, int expiresIn, OnAuthenticationListener listener) throws Exception {
        if (ConfigManager.getShareInstance().isNativeBuild()) {
            // Trinity native has no active DID session context, so we must send an intent to elastOS to realize this.
            String params = "{claims={}, &nonce=\""+nonce+"\", realm=\""+realm+"\"}";
            String fromId = appManager.curFragment.appInfo.app_id;
            long intentId = System.currentTimeMillis();
            IntentInfo info = new IntentInfo("https://did.elastos.net/credaccess", params, fromId, null, intentId, false, (success, data)->{
                try {
                    String responseJWT = data.getString("responseJWT");
                    listener.onJWTCreated(responseJWT);
                } catch (JSONException e) {
                    e.printStackTrace();
                    listener.onJWTCreated(null);
                }
            });
            IntentManager.getShareInstance().doIntent(info);
        }
        else {
            // Make sure there is a signed in user
            IdentityEntry signedInIdentity = DIDSessionManager.getSharedInstance().getSignedInIdentity();
            if (signedInIdentity == null)
                throw new Exception("No signed in user, cannot authenticate");

            // Retrieve the master password
            String passwordInfoKey = "didstore-" + signedInIdentity.didStoreId;
            String appId = "org.elastos.trinity.dapp.didsession"; // act as the did session app to be able to retrieve a DID store password
            PasswordManager.getSharedInstance().getPasswordInfo(passwordInfoKey, signedInIdentity.didString, appId, new PasswordGetInfoOptions(),
                    new PasswordManager.OnPasswordInfoRetrievedListener() {
                        @Override
                        public void onPasswordInfoRetrieved(PasswordInfo info) {
                            GenericPasswordInfo genericPasswordInfo = (GenericPasswordInfo) info;
                            if (genericPasswordInfo == null || genericPasswordInfo.password == null || genericPasswordInfo.password.equals("")) {
                                Log.e(LOG_TAG, "Unable to generate an authentication JWT: no master password");
                                listener.onJWTCreated(null);
                            } else {
                                // Now we have the did store password. Open the did store and sign
                                // Use the same paths as the DID plugin
                                String cacheDir = activity.getFilesDir() + "/data/did/.cache.did.elastos";
                                String resolver = PreferenceManager.getShareInstance().getDIDResolver();

                                try {
                                    // Initialize the DID store
                                    DIDBackend.initialize(resolver, cacheDir);
                                    String dataDir = activity.getFilesDir() + "/data/did/useridentities/" + signedInIdentity.didStoreId;
                                    DIDStore didStore = DIDStore.open("filesystem", dataDir, (payload, memo) -> {
                                    });

                                    // Load the did document
                                    DIDDocument didDocument = didStore.loadDid(signedInIdentity.didString);
                                    if (didDocument == null) {
                                        Log.e(LOG_TAG, "Unable to generate an authentication JWT: unable to load the did");
                                        listener.onJWTCreated(null);
                                    } else {
                                        // Create an empty presentation just to pass the DID string but nothing else
                                        DID did = new DID(signedInIdentity.didString);

                                        // Empty list of credentials
                                        VerifiablePresentation.Builder builder = VerifiablePresentation.createFor(did, didStore);
                                        VerifiableCredential[] credsArray = new VerifiableCredential[0];
                                        VerifiablePresentation presentation = builder.credentials(credsArray)
                                                .nonce(nonce)
                                                .realm(realm)
                                                .seal(genericPasswordInfo.password);

                                        // Generate a JWT payload that holds the same format as the "credaccess" scheme intent
                                        JSONObject presentationAsJsonObj = new JSONObject(presentation.toString());
                                        JSONObject jwtPayloadJson = new JSONObject();
                                        jwtPayloadJson.put("presentation", presentationAsJsonObj);

                                        // Sign as JWT
                                        JwsHeader header = JwtBuilder.createJwsHeader();
                                        header.setType(Header.JWT_TYPE).setContentType("json");

                                        Calendar cal = Calendar.getInstance();
                                        cal.set(Calendar.MILLISECOND, 0);
                                        Date iat = cal.getTime();
                                        cal.add(Calendar.MINUTE, expiresIn);
                                        Date exp = cal.getTime();

                                        Claims body = JwtBuilder.createClaims();
                                        body.setIssuer(signedInIdentity.didString)
                                                .setIssuedAt(iat)
                                                .setExpiration(exp)
                                                .putAllWithJson(jwtPayloadJson.toString());

                                        String jwtToken = didDocument.jwtBuilder()
                                                .setHeader(header)
                                                .setClaims(body)
                                                .sign(genericPasswordInfo.password)
                                                .compact();

                                        listener.onJWTCreated(jwtToken);
                                    }
                                } catch (Exception e) {
                                    Log.e(LOG_TAG, "Unable to generate an authentication JWT: " + e.getLocalizedMessage());
                                    listener.onJWTCreated(null);
                                }
                            }
                        }

                        @Override
                        public void onCancel() {
                            listener.onJWTCreated(null);
                        }

                        @Override
                        public void onError(String error) {
                            Log.e(LOG_TAG, "Unable to access master password database to create an authentication JWT: " + error);
                            listener.onJWTCreated(null);
                        }
                    });
        }
    }
}
