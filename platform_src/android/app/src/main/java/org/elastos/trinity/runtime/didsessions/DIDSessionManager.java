package org.elastos.trinity.runtime.didsessions;

import org.elastos.trinity.runtime.AppManager;
import org.elastos.trinity.runtime.WebViewActivity;
import org.elastos.trinity.runtime.didsessions.db.DatabaseAdapter;

import java.util.ArrayList;

public class DIDSessionManager {
    private WebViewActivity activity;
    private static DIDSessionManager instance;
    private AppManager appManager;
    private DatabaseAdapter dbAdapter;

    public DIDSessionManager(WebViewActivity activity) {
        this.activity = activity;
        dbAdapter = new DatabaseAdapter(activity);
        DIDSessionManager.instance = this;
    }

    public void setAppManager(AppManager appManager) {
        this.appManager = appManager;
    }

    public static DIDSessionManager getSharedInstance() {
        return instance;
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

    public void signIn(IdentityEntry identityToSignIn) throws Exception {
        // Make sure there is no signed in identity already
        IdentityEntry signedInIdentity = DIDSessionManager.getSharedInstance().getSignedInIdentity();
        if (signedInIdentity != null)
            throw new Exception("Unable to sign in. Please first sign out from the currently signed in identity");

        dbAdapter.setDIDSessionSignedInIdentity(identityToSignIn);

        // Ask the manager to handle the UI sign in flow.
        appManager.signIn();
    }

    public void signOut() throws Exception {
        dbAdapter.setDIDSessionSignedInIdentity(null);

        // Ask the app manager to sign out and redirect user to the right screen
        appManager.signOut();
    }
}