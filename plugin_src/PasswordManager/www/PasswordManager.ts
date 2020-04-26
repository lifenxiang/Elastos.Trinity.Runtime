/*
* Copyright (c) 2018 Elastos Foundation
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

let exec = cordova.exec;

enum NativeErrorCode {
    NATIVE_ERROR_CODE_INVALID_PASSWORD = -1,
    NATIVE_ERROR_CODE_INVALID_PARAMETER = -2,
    NATIVE_ERROR_CODE_CANCELLED = -3,
    NATIVE_ERROR_CODE_UNSPECIFIED = -4,
}

class PasswordManagerImpl implements PasswordManagerPlugin.PasswordManager {
    setPasswordInfo(info: PasswordManagerPlugin.PasswordInfo): Promise<PasswordManagerPlugin.BooleanWithReason> {
        return new Promise((resolve, reject)=>{
            exec((result: { couldSet: boolean, reason?: string })=>{
                resolve({
                    value: result.couldSet,
                    reason: result.reason
                });
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.setPasswordInfo()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'setPasswordInfo', [info]);    
        });
    }

    getPasswordInfo(key: string): Promise<PasswordManagerPlugin.PasswordInfo> {
        return new Promise((resolve, reject)=>{
            exec((result: { passwordInfo: PasswordManagerPlugin.PasswordInfo })=>{
                resolve(result.passwordInfo);
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.getPasswordInfo()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'getPasswordInfo', [key]);    
        });
    }

    getAllPasswordInfo(): Promise<PasswordManagerPlugin.PasswordInfo[]> {
        return new Promise((resolve, reject)=>{
            exec((result: { allPasswordInfo: PasswordManagerPlugin.PasswordInfo[] })=>{
                resolve(result.allPasswordInfo);
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.getAllPasswordInfo()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'getAllPasswordInfo', []);    
        });
    }

    deletePasswordInfo(key: string): Promise<PasswordManagerPlugin.BooleanWithReason> {
        return new Promise((resolve, reject)=>{
            exec((result: { couldDelete: boolean, reason?: string })=>{
                resolve({
                    value: result.couldDelete,
                    reason: result.reason
                });
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.deletePasswordInfo()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'deletePasswordInfo', [key]);    
        });
    }

    generateRandomPassword(options?: PasswordManagerPlugin.PasswordCreationOptions): Promise<string> {
        return new Promise((resolve, reject)=>{
            exec((result: { generatedPassword: string })=>{
                resolve(result.generatedPassword);
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.generateRandomPassword()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'generateRandomPassword', [options]);    
        });
    }
    
    setMasterPassword(oldPassword: string, newPassword: string): Promise<PasswordManagerPlugin.BooleanWithReason> {
        return new Promise((resolve, reject)=>{
            exec((result: { couldSet: boolean, reason?: string })=>{
                resolve({
                    value: result.couldSet,
                    reason: result.reason
                });
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.setMasterPassword()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'setMasterPassword', [oldPassword, newPassword]);    
        });
    }

    lockMasterPassword() {
        return new Promise((resolve, reject)=>{
            exec(()=>{
                resolve();
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.lockMasterPassword()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'lockMasterPassword', []);    
        });
    }

    setUnlockMode(mode: PasswordManagerPlugin.PasswordUnlockMode) {
        return new Promise((resolve, reject)=>{
            exec(()=>{
                resolve();
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.setUnlockMode()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'setUnlockMode', [mode]);    
        });
    }

    setAppsPasswordStrategy(strategy: PasswordManagerPlugin.AppsPasswordStrategy) {
        return new Promise((resolve, reject)=>{
            exec(()=>{
                resolve();
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.setAppsPasswordStrategy()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'setAppsPasswordStrategy', [strategy]);    
        });
    }

    getAppsPasswordStrategy(): Promise<PasswordManagerPlugin.AppsPasswordStrategy> {
        return new Promise((resolve, reject)=>{
            exec((result: { strategy: PasswordManagerPlugin.AppsPasswordStrategy }) =>{
                resolve(result.strategy);
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.getAppsPasswordStrategy()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'getAppsPasswordStrategy', []);    
        });
    }

    deleteAppPasswordInfo(targetAppId: string, key: string): Promise<PasswordManagerPlugin.BooleanWithReason> {
        return new Promise((resolve, reject)=>{
            exec((result: { couldDelete: boolean, reason?: string })=>{
                resolve({
                    value: result.couldDelete,
                    reason: result.reason
                });
            }, (err)=>{
                console.error("Error while calling PasswordManagerPlugin.deleteAppPasswordInfo()", err);
                reject(this.nativeToTSException(err));
            }, 'PasswordManagerPlugin', 'deleteAppPasswordInfo', [targetAppId, key]);    
        });
    }

    /**
     * Tries to convert a native error into a better TS error type for app convenience.
     */
    private nativeToTSException(nativeErr) {
        if (!nativeErr.code) {
            // Not our custom format, just return the raw exception
            return nativeErr;
        }

        switch (nativeErr.code) {
            case NativeErrorCode.NATIVE_ERROR_CODE_INVALID_PASSWORD: 
                return new InvalidPasswordExceptionImpl(nativeErr.reason);
            case NativeErrorCode.NATIVE_ERROR_CODE_INVALID_PARAMETER: 
                return new InvalidParameterExceptionImpl(nativeErr.reason);
            case NativeErrorCode.NATIVE_ERROR_CODE_CANCELLED: 
                return new CancellationExceptionImpl();
            case NativeErrorCode.NATIVE_ERROR_CODE_UNSPECIFIED:
                return new UnspecifiedExceptionImpl();
            default:
                return nativeErr;
        }
    }
}

class InvalidPasswordExceptionImpl implements PasswordManagerPlugin.InvalidPasswordException {
    name: string;
    message: string;

    constructor(message?: string) {
        this.message = message;
    }
}

class InvalidParameterExceptionImpl implements PasswordManagerPlugin.InvalidParameterException {
    name: string;
    message: string;

    constructor(message?: string) {
        this.message = message;
    }
}

class CancellationExceptionImpl implements PasswordManagerPlugin.CancellationException {
    name: string;
    message: string;

    constructor(message?: string) {
        this.message = message;
    }
}

class UnspecifiedExceptionImpl implements PasswordManagerPlugin.UnspecifiedException {
    name: string;
    message: string;

    constructor(message?: string) {
        this.message = message;
    }
}

export = new PasswordManagerImpl();