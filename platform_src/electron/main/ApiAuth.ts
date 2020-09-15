import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

//CUSTOM: pojo need to save in repository
@Entity()
export class ApiAuth {
    @PrimaryGeneratedColumn() public tid: string;
    @Column() public app_id: string;
    @Column({ nullable: true }) public plugin: string;
    @Column({ nullable: true }) public api: string;
    @Column({ nullable: true }) public authority: number;

    constructor(plugin: string, api: string) {
        this.plugin = plugin;
        this.api = api;
        this.authority = this.authority;
    }
}