export class IntentPermission {
    private name: string;
    private senderList = new Array<string>();
    private receiverList = new Array<string>();

    constructor(name: string) {
        this.name = name;
    }

    public addSender(appId: string) {
        if (this.senderList == null) {
            this.senderList = new Array<string>();
        }
        this.senderList.push(appId);
    }

    public addReceiver(appId: string) {
        if (this.receiverList == null) {
            this.receiverList = new Array<string>();
        }
        this.receiverList.push(appId);
    }

    public senderIsAllow(appId: string): boolean {
        if (this.senderList == null) {
            return true;
        }
        return this.senderList.includes(appId);
    }

    public receiverIsAllow(appId: string): boolean {
        if (this.receiverList == null) {
            return true;
        }
        return this.receiverList.includes(appId);
    }

}