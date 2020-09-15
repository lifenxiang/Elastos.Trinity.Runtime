import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity()
export class IntentFilter {
    @PrimaryGeneratedColumn() public tid: string;
    @Column() app_id: string;
    @Column({ nullable: true }) public packageId: string = null;
    @Column({ nullable: true }) public action: string;
    @Column({ nullable: true }) public startupMode: string;
    @Column({ nullable: true }) public serviceName: string;

    constructor(action: string, startupMode: string, serviceName: string) {
        this.action = action;
        this.startupMode = startupMode;
        this.serviceName = serviceName;
    }
}