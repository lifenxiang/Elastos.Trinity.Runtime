import { IdentityAvatar } from "./IdentityAvatar";
import { Entity, Column, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IdentityEntry {
    @PrimaryGeneratedColumn() public tid: string;
    @Column({ nullable: true }) public didStoreId: string = "";
    @Column({ nullable: true }) public didString: string = "";
    @Column({ nullable: true }) public name: string = "";
    @Column({ nullable: true }) public signedIn: number = 0;

    @OneToOne(type => IdentityAvatar, avatar => avatar.entry, {cascade: true})
    public avatar: IdentityAvatar;

    constructor(didStoreId: string = "", didString: string = "", name: string = "", avatar: IdentityAvatar = null) {
        this.didStoreId = didStoreId;
        this.didString = didString;
        this.name = name;
        this.avatar = avatar;
    }

    public asJsonObject(): any {
        let jsonObj: any = {};
        jsonObj.didStoreId = this.didStoreId;
        jsonObj.didString = this.didString;
        jsonObj.name = this.name;

        if (this.avatar != null) {
            jsonObj.avatar = this.avatar;
        }

        return jsonObj;
    }

    public static fromJsonObject(jsonObj: any): IdentityEntry {
        if ((jsonObj.didStoreId == null) || (jsonObj.didString == null) || (jsonObj.name == null))
            return null;

        let identity: IdentityEntry = new IdentityEntry(
                jsonObj.didStoreId,
                jsonObj.didString,
                jsonObj.name);

        if (jsonObj.avatar != null) {
            identity.avatar = IdentityAvatar.fromJsonObject(jsonObj.avatar);
        }

        return identity;
    }

}