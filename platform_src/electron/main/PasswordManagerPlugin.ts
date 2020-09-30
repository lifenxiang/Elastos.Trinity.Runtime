import { TrinityPlugin, SuccessCallback, ErrorCallback } from './TrinityPlugin';
import { PasswordInfoBuilder } from './passwordmanager/PasswordInfoBuilder';
import { PasswordManager, OnPasswordInfoSetListener, OnPasswordInfoRetrievedListener, OnAllPasswordInfoRetrievedListener, OnPasswordInfoDeletedListener, OnMasterPasswordChangeListener } from './passwordmanager/PasswordManager';
import { PasswordGetInfoOptions } from './passwordmanager/PasswordGetInfoOptions';
import { PasswordUnlockMode } from './passwordmanager/PasswordUnlockMode';
import { TrinityRuntime } from './Runtime';
import { PasswordInfo } from './passwordmanager/passwordinfo/PasswordInfo';
import { GenericPasswordInfo } from './passwordmanager/passwordinfo/GenericpasswordInfo';
import { PasswordType } from './passwordmanager/PasswordType';

export class BooleanWithReason {
    public value: boolean;
    public reason: string;

    constructor(value: boolean, reason: string) {
        this.value = value;
        this.reason = reason;
    }
}

export class PasswordManagerPlugin extends TrinityPlugin {
    private static NATIVE_ERROR_CODE_INVALID_PASSWORD = -1;
    private static NATIVE_ERROR_CODE_INVALID_PARAMETER = -2;
    private static NATIVE_ERROR_CODE_CANCELLED = -3;
    private static NATIVE_ERROR_CODE_UNSPECIFIED = -4;

    private sendSuccess(success: SuccessCallback, jsonObj: any) {
        success(jsonObj);
    }

    private sendError(error: ErrorCallback, jsonObj: any) {
        error(jsonObj);
    }

    private sendError2(error: ErrorCallback, method: string, message: string) {
        error(method + ": " + message);
    }

    private buildCancellationError(): any {
        try {
            let result: any = {
                code: PasswordManagerPlugin.NATIVE_ERROR_CODE_CANCELLED,
                reason: "MasterPasswordCancellation"
            };
            return result;
        }
        catch (e) {
            return null;
        }
    }

    private buildGenericError(error: string): any {
        try {
            let result: any = {};
            if (error.includes("BAD_DECRYPT") || error.includes("Authentication failed") || error.includes("Authentication error"))
                result.code = PasswordManagerPlugin.NATIVE_ERROR_CODE_INVALID_PASSWORD;
            else
                result.code = PasswordManagerPlugin.NATIVE_ERROR_CODE_UNSPECIFIED;
            result.reason = error;
            return result;
        }
        catch (e) {
            return null;
        }
    }

    private setPasswordInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("PasswordManagerPlugin - setPasswordInfo");
        let info = args[0] as any;

        let passwordInfo = PasswordInfoBuilder.buildFromType(info);
        if (passwordInfo == null) {
            this.sendError2(error, "setPasswordInfo", "Invalid JSON object for password info");
            return;
        }

        console.log(passwordInfo.asJsonObject());

        let result: any = {};
        //TODO: hardcoded, remove this
        result.couldSet = true;
        this.sendSuccess(success, result);
        /*PasswordManager.getSharedInstance().setPasswordInfo(passwordInfo, this.did, this.appId, new OnPasswordInfoSetListener().onPasswordInfoSet(() => {
            try {
                console.log("setPasswordInfo - couldSet: true");
                result.couldSet = true;
            }
            catch (e) {}
            this.sendSuccess(success, result);
        }).onCancel(() => {
            this.sendError(error, this.buildCancellationError());
        }).onError((errorMsg) => {
            this.sendError(error, this.buildGenericError(errorMsg));
        }));*/
    }

    private getPasswordInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("PasswordManagerPlugin - getPasswordInfo");
        let key = args[0] as string;
        let optionsJson = args[1] == null ? null : args[1] as any;
        let options: PasswordGetInfoOptions = null;

        try {
            if (optionsJson != null) {
                options = PasswordGetInfoOptions.fromJsonObject(options);
            }
        }
        catch (e) {
            // Invalid options passed? We'll use default options
        }

        if (options == null) {
            options = new PasswordGetInfoOptions(); // default options
        }

        let result: any = {};
        //TODO: hardcoded, remove this
        let passwordInfo = new GenericPasswordInfo();
        passwordInfo.key = "didstore-CB0545";
        passwordInfo.type = PasswordType.fromValue(0);
        passwordInfo.displayName = "DID store password";
        passwordInfo.appID = "org.elastos.trinity.dapp.did";
        passwordInfo.password = "password";
        //result.passwordInfo = null;
        result.passwordInfo = passwordInfo.asJsonObject();
        this.sendSuccess(success, result);
        //TODO: hardcoded, remove this
        /*PasswordManager.getSharedInstance().getPasswordInfo(key, this.did, this.appId, options, new OnPasswordInfoRetrievedListener().onPasswordInfoRetrieved((info) => {
            try {
                if (info != null)
                    result.passwordInfo = info.asJsonObject();
                else
                    result.passwordInfo = null;
            }
            catch (ignored) {}
            console.log("getPasswordInfo");
            console.log(result);
            this.sendSuccess(success, result);
        }).onCancel(() => {
            this.sendError(error, this.buildCancellationError());
        }).onError((errorMsg) => {
            this.sendError(error, this.buildGenericError(errorMsg));
        }));*/
    }

    private getAllPasswordInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        let result: any = {};
        PasswordManager.getSharedInstance().getAllPasswordInfo(this.did, this.appId, new OnAllPasswordInfoRetrievedListener().onAllPasswordInfoRetrieved((infos) => {
            try {
                let allPasswordInfo: any[] = [];
                for (let info of infos) {
                    allPasswordInfo.push(info.asJsonObject());
                }

                result.allPasswordInfo = allPasswordInfo;

                this.sendSuccess(success, result);
            }
            catch (e) {
                this.sendError2(success, "getAllPasswordInfo", e);
            }
        }).onCancel(() => {
            this.sendError(error, this.buildCancellationError());
        }).onError((errorMsg) => {
            this.sendError(error, this.buildGenericError(errorMsg));
        }));
    }

    private deletePasswordInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        let key = args[0] as string;

        let result: any = {};
        PasswordManager.getSharedInstance().deletePasswordInfo(key, this.did, this.appId, this.appId, new OnPasswordInfoDeletedListener().onPasswordInfoDeleted(() => {
            try {
                result.couldDelete = true;
            }
            catch (ignored) {}
            this.sendSuccess(success, result);
        }).onCancel(() => {
            this.sendError(error, this.buildCancellationError());
        }).onError((errorMsg) => {
            this.sendError(error, this.buildGenericError(errorMsg));
        }));
    }

    private deleteAppPasswordInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        let targetAppID = args[0] as string;
        let key = args[1] as string;

        let result: any = {};
        PasswordManager.getSharedInstance().deletePasswordInfo(key, this.did, this.appId, targetAppID, new OnPasswordInfoDeletedListener().onPasswordInfoDeleted(() => {
            try {
                result.couldDelete = true;
            }
            catch (ignored) {}
            this.sendSuccess(success, result);
        }).onCancel(() => {
            this.sendError(error, this.buildCancellationError());
        }).onError((errorMsg) => {
            this.sendError(error, this.buildGenericError(errorMsg));
        }));
    }

    private generateRandomPassword(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("PasswordManagerPlugin - generateRandomPassword");
        let options = args[0] == null ? null : args[0] as any;

        let password = PasswordManager.getSharedInstance().generateRandomPassword(null);

        let result: any = {};
        result.generatedPassword = password;
        console.log(result);

        this.sendSuccess(success, result);
    }

    private changeMasterPassword(success: SuccessCallback, error: ErrorCallback, args: any) {
        let result: any = {};

        PasswordManager.getSharedInstance().changeMasterPassword(this.did, this.appId, new OnMasterPasswordChangeListener().onMasterPasswordChanged(() => {
            try {
                result.couldDelete = true;
            }
            catch (ignored) {}
            this.sendSuccess(success, result);
        }).onCancel(() => {
            this.sendError(error, this.buildCancellationError());
        }).onError((errorMsg) => {
            this.sendError(error, this.buildGenericError(errorMsg));
        }));
    }

    private lockMasterPassword(success: SuccessCallback, error: ErrorCallback, args: any) {
        PasswordManager.getSharedInstance().lockMasterPassword(this.did);

        let result: any = {};

        this.sendSuccess(success, result);
    }

    private deleteAll(success: SuccessCallback, error: ErrorCallback, args: any) {
        PasswordManager.getSharedInstance().deleteAll(this.did);

        let result: any = {};

        this.sendSuccess(success, result);
    }

    private setUnlockMode(success: SuccessCallback, error: ErrorCallback, args: any) {
        let unlockModeAsInt = args[0] as number;

        let unlockMode = PasswordUnlockMode.fromValue(unlockModeAsInt);

        PasswordManager.getSharedInstance().setUnlockMode(unlockMode, this.did, this.appId);

        let result: any = {};
        this.sendSuccess(success, result);
    }

    private setVirtualDIDContext(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("PasswordManagerPlugin - setVirtualDIDContext");
        let virtualDIDStringContext = args[0] == null ? null : args[0] as string;

        PasswordManager.getSharedInstance().setVirtualDIDContext(virtualDIDStringContext);

        let result: any = {};
        console.log(result);
        this.sendSuccess(success, result);
    }
}

TrinityRuntime.getSharedInstance().registerPlugin("PasswordManager", (appId: string)=>{
    return new PasswordManagerPlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("PasswordManager", [
    "setPasswordInfo",
    "getPasswordInfo",
    "getAllPasswordInfo",
    "deletePasswordInfo",
    "deleteAppPasswordInfo",
    "generateRandomPassword",
    "changeMasterPassword",
    "lockMasterPassword",
    "deleteAll",
    "setUnlockMode",
    "setVirtualDIDContext"
]);