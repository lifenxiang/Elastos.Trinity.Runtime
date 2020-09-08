export class PasswordGetInfoOptions {
    public promptPasswordIfLocked: boolean = true;
    public forceMasterPasswordPrompt: boolean = false;

    public PasswordGetInfoOptions() {
    }

    public static fromJsonObject(jsonObject: any): PasswordGetInfoOptions {
         let options: PasswordGetInfoOptions = new PasswordGetInfoOptions();

        if (jsonObject.promptPasswordIfLocked != null)
            options.promptPasswordIfLocked = jsonObject.promptPasswordIfLocked as boolean;

        if (jsonObject.forceMasterPasswordPrompt != null)
            options.forceMasterPasswordPrompt = jsonObject.forceMasterPasswordPrompt as boolean;

        return options;
    }
}