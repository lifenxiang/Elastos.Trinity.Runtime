import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

//CUSTOM: pojo need to save in repository
@Entity()
export class Setting {
    @PrimaryGeneratedColumn() public tid: string;
    @Column() public app_id: string;
    @Column({ nullable: true }) public key: string;
    @Column({ nullable: true }) public value: string;

    constructor(key: string, value: string) {
        this.key = key;
        this.value = value;
    }
}