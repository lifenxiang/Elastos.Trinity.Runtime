import { IdentityAvatar } from "./IdentityAvatar";

export class IdentityEntry {
    public didStoreId: string;
    public didString: string;
    public name: string;
    public avatar: IdentityAvatar;

    public constructor(didStoreId: string, didString: string, name: string, avatar: IdentityAvatar = null) {
        this.didStoreId = didStoreId;
        this.didString = didString;
        this.name = name;
        this.avatar = avatar;
    }

    public asJsonObject(): any {
        let jsonObj: any = {
            didStoreId: this.didStoreId,
            didString: this.didString,
            name: this.name
        };

        if (this.avatar != null) {
            jsonObj.avatar = this.avatar.asJsonObject();
        }

        return jsonObj;
    }

    public static fromJsonObject(jsonObj: any): IdentityEntry {
        if (jsonObj.didStoreId == null || jsonObj.didString == null || jsonObj.name == null) {
            return null;
        }
        
        let identity = new IdentityEntry(jsonObj.didStoreId, jsonObj.didString, jsonObj.name);
        if (jsonObj.avatar != null) {
            identity.avatar = IdentityAvatar.fromJsonObject(jsonObj.avatar);
        }

        return identity;
    }

}