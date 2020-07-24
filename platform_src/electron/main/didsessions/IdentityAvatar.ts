import { IdentityEntry } from './IdentityEntry';

export class IdentityAvatar {
    public contentType: string;
    public base64ImageData: string;

    public constructor(contentType: string, base64ImageData: string) {
        this.contentType = contentType;
        this.base64ImageData = base64ImageData;
    }

    public asJsonObject() {
        let jsonObj = {
            contentType: this.contentType,
            base64ImageData: this.base64ImageData
        };
        return jsonObj;
    }

    public static fromJsonObject(jsonObj: any): IdentityAvatar {
        if (jsonObj.contentType == null || jsonObj.base64ImageData == null) {
            return null
        }

        let avatar = new IdentityAvatar(jsonObj.contentType, jsonObj.base64ImageData);
        return avatar;
    }

}