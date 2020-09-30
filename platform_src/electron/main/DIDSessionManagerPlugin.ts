import { TrinityPlugin, SuccessCallback, ErrorCallback } from './TrinityPlugin';
import { IdentityEntry } from './didsessions/IdentityEntry';
import { SignInOptions } from './didsessions/SignInOptions';
import { DIDSessionManager } from './didsessions/DIDSessionManager';
import { TrinityRuntime } from './Runtime';
import { IdentityAvatar } from './didsessions/IdentityAvatar';

type CallbackContext = {
    success: SuccessCallback;
    error: ErrorCallback;
}

export class DIDSessionManagerPlugin extends TrinityPlugin {

    private sendSuccess(success: SuccessCallback, jsonObj: any) {
        success(jsonObj);
    }

    private async addIdentityEntry(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("DIDSessionManagerPlugin - addIdentityEntry");
        if (args.length != 1) {
            error("Wrong number of parameters passed");
            return;
        }

        let identityEntryJson: any = args[0];

        let identityEntry: IdentityEntry = IdentityEntry.fromJsonObject(identityEntryJson);
        (await DIDSessionManager.getSharedInstance()).addIdentityEntry(identityEntry);

        success();
    }

    private async deleteIdentityEntry(success: SuccessCallback, error: ErrorCallback, args: any) {
        if (args.length != 1) {
            error("Wrong number of parameters passed");
            return;
        }

        let didString: string = args[0];

        (await DIDSessionManager.getSharedInstance()).deleteIdentityEntry(didString);

        success();
    }

    private async getIdentityEntries(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("DIDSessionManagerPlugin - getIdentityEntries");
        if (args.length != 0) {
            error("Wrong number of parameters passed");
            return;
        }

        let entries = await (await DIDSessionManager.getSharedInstance()).getIdentityEntries();

        let jsonObj: any = {};
        let jsonEntries: any[] = [];
        for (let entry of entries) {
            let asd = entry.asJsonObject();
            console.log("didString: "+entry.didString);
            console.log(asd);
            console.log("asd end");
            jsonEntries.push(asd);
        }
        jsonObj.entries = jsonEntries;
        console.log(jsonObj);

        this.sendSuccess(success, jsonObj);
    }

    private async getSignedInIdentity(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("DIDSessionManagerPlugin - getSignedInIdentity");
        let signedInIdentity: IdentityEntry = await (await DIDSessionManager.getSharedInstance()).getSignedInIdentity();
        /*console.log("DIDSessionManagerPlugin - signedInIdentity name: "+signedInIdentity.name);
        
        let identity = new IdentityEntry("asdDidStoreId", "asdDidString", "Artur");
        let identityObject = identity.asJsonObject();
        console.log(identityObject);
        success(identityObject);*/
        if (signedInIdentity == null)
            success(); // Not signed in, no data to return
        else
            this.sendSuccess(success, signedInIdentity.asJsonObject());
    }

    private async signIn(success: SuccessCallback, error: ErrorCallback, args: any) {
        let identityEntryJson: any = args[0] == null ? null : args[0];
        if (identityEntryJson == null) {
            error("Invalid identity entry");
            return;
        }

        let identityToSignIn: IdentityEntry = IdentityEntry.fromJsonObject(identityEntryJson);

        let signInOptionsJson: any = args[1] == null ? null : args[1];
        let signInOptions: SignInOptions = null;
        if (signInOptionsJson != null) {
            signInOptions = SignInOptions.fromJsonObject(signInOptionsJson);
        }

        await (await DIDSessionManager.getSharedInstance()).signIn(identityToSignIn, signInOptions);

        success();
    }

    private async signOut(success: SuccessCallback, error: ErrorCallback, args: any) {
        await (await DIDSessionManager.getSharedInstance()).signOut();
        success();
    }

    private async authenticate(success: SuccessCallback, error: ErrorCallback, args: any){
        let nonce: string = args[0] == null ? null : args[0] as string;
        if (nonce == null) {
            error("A nonce string must be provided");
            return;
        }

        let realm: string = args[1] == null ? null : args[1] as string;
        if (realm == null) {
            error("A realm string must be provided");
            return;
        }

        let expiresIn: number = args[2] == null ? 5 : args[2] as number;

        //TODO: not implimentated yet
        await (await DIDSessionManager.getSharedInstance()).authenticate(nonce, realm, expiresIn, (jwtToken) => {
            let jsonObj: any = {};
            jsonObj.jwtToken = jwtToken;
            this.sendSuccess(success, jsonObj);
        });
    }
}

TrinityRuntime.getSharedInstance().registerPlugin("DIDSessionManager", (appId: string)=>{
    return new DIDSessionManagerPlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("DIDSessionManager", [
    "addIdentityEntry",
    "deleteIdentityEntry",
    "getIdentityEntries",
    "getSignedInIdentity",
    "signIn",
    "signOut",
    "authenticate"
]);