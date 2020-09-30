export class SignInOptions {
    public sessionLanguage: string = null;

    constructor() {
    }

    public asJsonObject(): any {
        let jsonObj: any = {};
        jsonObj.sessionLanguage = this.sessionLanguage;
        return jsonObj;
    }

    public static fromJsonObject(jsonObj: any): SignInOptions {
        let options: SignInOptions = new SignInOptions();
        
        if (jsonObj.sessionLanguage != null)
            options.sessionLanguage = jsonObj.sessionLanguage as string;

        return options;
    }


}