import { Entity, Column, OneToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IdentityEntry } from './IdentityEntry';

@Entity()
export class IdentityAvatar {
    @PrimaryGeneratedColumn() public tid: string;
    @Column({ nullable: true }) public contentType: string = "";
    @Column({ nullable: true }) public base64ImageData: string = "";
    @OneToOne(type => IdentityEntry)
    @JoinColumn()
    public entry: IdentityEntry;

    constructor(contentType: string, base64ImageData: string) {
        this.contentType = contentType;
        this.base64ImageData = base64ImageData;
    }

    public asJsonObject(): any {
        let jsonObj: any = {};
        jsonObj.contentType = this.contentType;
        jsonObj.base64ImageData = this.base64ImageData;
        return jsonObj;
    }

    public static fromJsonObject(jsonObj: any): IdentityAvatar {
        if ((jsonObj.contentType == null) || (jsonObj.base64ImageData == null))
            return null;
          
        let avatar: IdentityAvatar = new IdentityAvatar(
                jsonObj.contentType,
                jsonObj.base64ImageData);

        return avatar;
    }
}
