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

import ElastosDIDSDK

public class DIDSessionManager {
    private static let LOG_TAG = "DIDSessionManager"
    private static var instance: DIDSessionManager? = nil
    
    private let dbAdapter: DIDSessionDatabaseAdapter
    private var appManager: AppManager? = nil

    init() {
        dbAdapter = DIDSessionDatabaseAdapter()
        DIDSessionManager.instance = self
    }

    public static func getSharedInstance() -> DIDSessionManager {
        return instance!
    }

    func setAppManager(_ appManager: AppManager) {
        self.appManager = appManager
    }
    
    func addIdentityEntry(entry: IdentityEntry) throws {
        _ = try dbAdapter.addDIDSessionIdentityEntry(entry: entry)
    }

    func deleteIdentityEntry(didString: String) throws {
        try dbAdapter.deleteDIDSessionIdentityEntry(didString: didString)
    }

    func getIdentityEntries() throws -> Array<IdentityEntry> {
        return try dbAdapter.getDIDSessionIdentityEntries()
    }

    func getSignedInIdentity() throws -> IdentityEntry? {
        return try dbAdapter.getDIDSessionSignedInIdentity()
    }

    func signIn(identityToSignIn: IdentityEntry, options: SignInOptions?) throws {
        // Make sure there is no signed in identity already
        guard (try DIDSessionManager.getSharedInstance().getSignedInIdentity()) == nil else {
            throw "Unable to sign in. Please first sign out from the currently signed in identity"
        }

        try dbAdapter.setDIDSessionSignedInIdentity(entry: identityToSignIn)
        
        let sessionLanguage = options?.sessionLanguage
      
        // Ask the manager to handle the UI sign in flow.
        try appManager!.signIn(sessionLanguage: sessionLanguage)
    }

    public func signOut() throws {
        try dbAdapter.setDIDSessionSignedInIdentity(entry: nil)

        // Ask the app manager to sign out and redirect user to the right screen
        try appManager!.signOut()
    }
    
    public func authenticate(nonce: String, realm: String, expiresIn: Int, onJWTCreated: @escaping (String?)->Void) throws {
        // Make sure there is a signed in user
        guard let signedInIdentity = try? DIDSessionManager.getSharedInstance().getSignedInIdentity() else {
            throw "No signed in user, cannot authenticate"
        }

        // Retrieve the master password
        let passwordInfoKey = "didstore-"+signedInIdentity.didStoreId
        let appId = "org.elastos.trinity.dapp.didsession" // act as the did session app to be able to retrieve a DID store password
        try PasswordManager.getSharedInstance().getPasswordInfo(key: passwordInfoKey, did: signedInIdentity.didString, appID: appId, onPasswordInfoRetrieved: { info in
            
            let genericPasswordInfo = info as? GenericPasswordInfo
            if genericPasswordInfo == nil || genericPasswordInfo!.password == nil || genericPasswordInfo!.password == "" {
                Log.e(DIDSessionManager.LOG_TAG, "Unable to generate an authentication JWT: no master password")
                onJWTCreated(nil)
            }
            else {
                // Now we have the did store password. Open the did store and sign
                // Use the same paths as the DID plugin
                let cacheDir = NSHomeDirectory() + "/Documents/data/did/.cache.did.elastos"
                let resolver = PreferenceManager.getShareInstance().getDIDResolver()

                do {
                    class AuthDIDAdapter : DIDAdapter {
                        func createIdTransaction(_ payload: String, _ memo: String?, _ confirms: Int, _ callback: @escaping TransactionCallback) {
                        }
                    }
                    
                    // Initialize the DID store
                    try DIDBackend.initializeInstance(resolver, cacheDir)
                    let dataDir = NSHomeDirectory() + "/Documents/data/did/useridentities/" + signedInIdentity.didStoreId
                    let didStore = try DIDStore.open(atPath: dataDir, withType: "filesystem", adapter: AuthDIDAdapter())

                    // Load the did document
                    guard let didDocument = try? didStore.loadDid(signedInIdentity.didString) else {
                        Log.e(DIDSessionManager.LOG_TAG, "Unable to generate an authentication JWT: unable to load the did")
                        onJWTCreated(nil)
                        return
                    }
                        
                    // Create an empty presentation just to pass the DID string but nothing else
                    let did = try DID(signedInIdentity.didString)

                    // Empty list of credentials
                    let builder = try VerifiablePresentation.editingVerifiablePresentation(for: did, using: didStore)
                    let presentation = try builder.withCredentials(Array())
                        .withNonce(nonce)
                        .withRealm(realm)
                        .sealed(using: genericPasswordInfo!.password!)

                    // Generate a JWT payload that holds the same format as the "credaccess" scheme intent
                    var jwtPayloadJson = Dictionary<String, Any>()
                    jwtPayloadJson["presentation"] = presentation.description.toDict()
                    
                    // Sign as JWT
                    let header = JwtBuilder.createHeader()
                    _ = header.setType(Header.JWT_TYPE).setContentType("json")

                    let iat = Date()
                    let expire = Calendar.current.date(byAdding: .minute, value: expiresIn, to: iat)!

                    let body = JwtBuilder
                        .createClaims()
                        // TODO .claimWithJson(value: jwtPayloadJson.description)
                        .setIssuer(issuer: signedInIdentity.didString)
                        .setIssuedAt(issuedAt: iat)
                        .setExpiration(expiration: expire)


                    let jwtToken = try didDocument.jwtBuilder()
                        .setHeader(header)
                        .setClaims(body)
                        .sign(using: genericPasswordInfo!.password!)
                        .compact()

                    onJWTCreated(jwtToken)
                }
                catch (let error) {
                    Log.e(DIDSessionManager.LOG_TAG, "Unable to generate an authentication JWT: "+error.localizedDescription)
                    onJWTCreated(nil)
                }
            }
        }, onCancel: {
            onJWTCreated(nil)
        }, onError: { error in
            Log.e(DIDSessionManager.LOG_TAG, "Unable to access master password database to create an authentication JWT: "+error)
            onJWTCreated(nil)
        })
    }
}
