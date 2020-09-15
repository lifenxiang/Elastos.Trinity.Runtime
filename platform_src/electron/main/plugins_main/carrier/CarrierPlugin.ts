import { TrinityPlugin, SuccessCallback, ErrorCallback } from '../../TrinityPlugin';
import { TrinityRuntime } from '../../Runtime';
import { PluginCarrierHandler } from './PluginCarrierHandler';
import { Log } from '../../Log';

type CallbackContext = {
    success: SuccessCallback;
    error: ErrorCallback;
}

export class CarrierPlugin extends TrinityPlugin {
    private static LOG_TAG = "CarrierPlugin";

    private static OK = 0;
    private static CARRIER = 1;
    private static SESSION = 2;
    private static STREAM = 3;
    private static FRIEND_INVITE = 4;
    private static GROUP = 5;
    private static FILE_TRANSFER = 6;
    private static MESSAGE_RECEIPT = 7;

    private static SUCCESS = "Success!";
    private static INVALID_ID = "Id invalid!";

    private mCarrierMap: Map<number, PluginCarrierHandler>;
    //TODO: replace any to specific objects
    private mSessionMap: Map<number, any>;
    private mStreamMap: Map<number, any>;
    private mGroupMap: Map<string, any>;
    private mFileTransferHandlerMap: Map<number, any>;

    private mCarrierCallbackContext: CallbackContext = null;
    private mSessionCallbackContext: CallbackContext = null;
    private mStreamCallbackContext: CallbackContext = null;
    private mFIRCallbackContext: CallbackContext = null;
    private mReceiptCallbackContext: CallbackContext = null;
    private mGroupCallbackContext: CallbackContext = null;
    private mFileTransferCallbackContext: CallbackContext = null;

    constructor(appId: string) {
        super(appId);
        this.mCarrierMap = new Map<number, PluginCarrierHandler>();
        this.mSessionMap = new Map<number, any>();
        this.mStreamMap = new Map<number, any>();
        this.mGroupMap = new Map<string, any>();
        this.mFileTransferHandlerMap = new Map<number, any>();
    }

    private test(success: SuccessCallback, error: ErrorCallback, args: any) {
        let data = args[0] as string;
        //byte[] rawData = Base64.decode(data, Base64.DEFAULT);
    }

    //TODO: implement
    private getVersion(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getIdFromAddress(success: SuccessCallback, error: ErrorCallback, args: any) {

    }

    //TODO: implement
    private isValidAddress(success: SuccessCallback, error: ErrorCallback, args: any) {
        let address = args[0] as string;
        if (address != null && address.length > 0) {
            let ret = "true";
            success(ret);
        } else {
            error("Expected one non-empty string argument.");
        }
    }

    //TODO: implement
    private isValidId(success: SuccessCallback, error: ErrorCallback, args: any) {

    }

    private setListener(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("CarrierPlugin ts - setListener");
        let type = args[0] as number;
        console.log("type: "+type);
        switch (type) {
            case CarrierPlugin.CARRIER:
                this.mCarrierCallbackContext = {success: success, error: error};
                break;
            case CarrierPlugin.SESSION:
                this.mSessionCallbackContext = {success: success, error: error};
                break;
            case CarrierPlugin.STREAM:
                this.mStreamCallbackContext = {success: success, error: error};
                break;
            case CarrierPlugin.FRIEND_INVITE:
                this.mFIRCallbackContext = {success: success, error: error};
                break;
            case CarrierPlugin.MESSAGE_RECEIPT:
                this.mReceiptCallbackContext = {success: success, error: error};
                break;
            case CarrierPlugin.GROUP:
                this.mGroupCallbackContext = {success: success, error: error};
                break;
            case CarrierPlugin.FILE_TRANSFER:
                this.mFileTransferCallbackContext = {success: success, error: error};
                break;
        }
    }

    private createObject(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("CarrierPlugin ts - createObject");
        let dir = args[0] as string;
        let config = args[1] as string;

        dir = this.getDataPath() + dir;

        let carrierHandler = PluginCarrierHandler.createInstance(dir, config, this.mCarrierCallbackContext, this.mGroupCallbackContext, this);

        if (carrierHandler != null) {
            this.mCarrierMap.set(carrierHandler.mCode, carrierHandler);

            let r: any = {};
            r.id = carrierHandler.mCode;
            let selfInfo = carrierHandler.mCarrier.getSelfInfo();
            r.nodeId = carrierHandler.mCarrier.getNodeId();
            r.userId = selfInfo.userId;
            r.address = carrierHandler.mCarrier.getAddress();
            r.nospam = carrierHandler.mCarrier.getNospam();
            r.presence = carrierHandler.mCarrier.getPresence();
            let a: any[] = [];
            //TODO: need groups
            /*for (let group of carrierHandler.mCarrier.getGroups()) {
                
            }*/
            r.groups = a;

            success(r);
        } else {
            error("error");
        }
    }

    private carrierStart(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("CarrierPlugin ts - carrierStart");
        let id = args[0] as number;
        let iterateInterval = args[1] as number;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            carrierHandler.mCarrier.start(iterateInterval);
            success("ok");
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private getSelfInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("CarrierPlugin ts - getSelfInfo");
        let id = args[0] as number;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let selfInfo = carrierHandler.mCarrier.getSelfInfo();
            let r: any = PluginCarrierHandler.getUserInfoJson(selfInfo);
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private setSelfInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("CarrierPlugin ts - setSelfInfo");
        let id = args[0] as number;
        let name = args[1] as string;
        let value = args[2] as string;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let selfInfo = carrierHandler.mCarrier.getSelfInfo();

            switch (name) {
                case "name":
                    selfInfo.name = value;
                    break;
                case "description":
                    selfInfo.description = value;
                    break;
                case "gender":
                    selfInfo.gender = value;
                    break;
                case "phone":
                    selfInfo.phone = value;
                    break;
                case "email":
                    selfInfo.email = value;
                    break;
                case "region":
                    selfInfo.region = value;
                    break;
                case "hasAvatar":
                    if (value == "true") selfInfo.hasAvatar = true
                    else selfInfo.hasAvatar = false;
                    break;
                default:
                    error("Name invalid!");
                    return;
            }

            carrierHandler.mCarrier.setSelfInfo(selfInfo);

            let r: any = {
                name: "name",
                value: "value"
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private getNospam(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let r: any = {
                nospam: carrierHandler.mCarrier.getNospam()
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private setNospam(success: SuccessCallback, error: ErrorCallback, args: any) {
        Log.d("CarrierPlugin", "setNospam");
        let id = args[0] as number;
        let nospam = args[1] as number;

        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            carrierHandler.mCarrier.setNospam(nospam);
            let r: any = {
                nospam: nospam
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private getPresence(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let r: any = {
                presence: carrierHandler.mCarrier.getPresence()
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private setPresence(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let presence = args[1] as number;

        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            carrierHandler.mCarrier.setPresence(presence);
            let r: any = {
                presence: presence
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private isReady(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let r: any = {
                isReady: carrierHandler.mCarrier.isReady()
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private getFriends(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let friends = carrierHandler.mCarrier.getFriends();
            let r: any = {
                friends: PluginCarrierHandler.getFriendsInfoJson(friends)
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private getFriend(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let userId = args[1] as string;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let info = carrierHandler.mCarrier.getFriend(userId);
            let r = PluginCarrierHandler.getFriendInfoJson(info);
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private labelFriend(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let userId = args[1] as string;
        let label = args[2] as string;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            carrierHandler.mCarrier.labelFriend(userId, label);
            let r: any = {
                userId: userId,
                label: label
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private isFriend(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let userId = args[1] as string;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let r: any = {
                userId: userId,
                isFriend: carrierHandler.mCarrier.isFriend(userId)
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private acceptFriend(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let userId = args[1] as string;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            carrierHandler.mCarrier.acceptFriend(userId);
            let r: any = {
                userId: userId
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private addFriend(success: SuccessCallback, error: ErrorCallback, args: any) {
        console.log("CarrierPlugin - addFriend");
        let id = args[0] as number;
        let address = args[1] as string;
        let hello = args[2] as string;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            carrierHandler.mCarrier.addFriend(address, hello);
            let r: any = {
                address: address
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private removeFriend(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let userId = args[1] as string;
        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            carrierHandler.mCarrier.removeFriend(userId);
            let r: any = {
                userId: userId
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private sendFriendMessage(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let to = args[1] as string;
        let message = args[2] as string;

        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let isOffline = carrierHandler.mCarrier.sendFriendMessage(to, message);
            let r: any = {
                isOffline: isOffline
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    private sendFriendBinaryMessage(success: SuccessCallback, error: ErrorCallback, args: any) {
        let id = args[0] as number;
        let to = args[1] as string;
        let data = args[2] as string;
        //TODO: convert to base64: byte[] message = Base64.decode(data, Base64.DEFAULT);
        let message = data;

        let carrierHandler = this.mCarrierMap.get(id);
        if (carrierHandler != null) {
            let isOffline = carrierHandler.mCarrier.sendFriendMessage(to, message);
            let r: any = {
                isOffline: isOffline
            };
            success(r);
        } else {
            error(CarrierPlugin.INVALID_ID);
        }
    }

    //TODO: implement
    private sendFriendBinaryMessageWithReceipt(success: SuccessCallback, error: ErrorCallback, args: any) {

    }

    //TODO: implement
    private inviteFriend(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private destroy(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private newSession(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private sessionClose(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getPeer(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private sessionRequest(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private sessionReplyRequest(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private sessionStart(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private addStream(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private removeStream(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private addService(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private removeService(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getTransportInfo(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private streamWrite(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private openChannel(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private closeChannel(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private writeChannel(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private pendChannel(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private resumeChannel(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private openPortForwarding(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private closePortForwarding(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private createGroup(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private joinGroup(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private inviteGroup(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private leaveGroup(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private sendGroupMessage(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getGroupTitle(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private setGroupTitle(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getGroupPeers(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getGroupPeer(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    private clearGroupHandlerMap() {
        this.mGroupMap.clear();
    }

    private deleteGroupHandlerFromMap(groupHandlerId: string) {
        this.mGroupMap.delete(groupHandlerId);
    }

    private getGroupId(): string {
        //TODO tobe modify , If can get groupid
        return this.randomUUID();
    }

    private randomUUID(): string {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (dt + Math.random()*16)%16 | 0;
            dt = Math.floor(dt/16);
            return (c=='x' ? r :(r&0x3|0x8)).toString(16);
        });
        uuid = uuid.replace(/-/gi, "");
        return uuid;
    }

    private addGroupMap(groupId: string, group: any) {
        this.mGroupMap.set(groupId, group);
    }

    //TODO: implement
    private getGroupPeersInfoJson(group: any) {

    }

    //TODO: implement
    private getGroupPeerInfoJson(group: any, peerId: string): any {

    }

    //TODO: implement
    private getGroupTitleJson(): any {

    }

    //TODO: implement
    private closeFileTrans(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getFileTransFileId(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private getFileTransFileName(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private fileTransConnect(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private acceptFileTransConnect(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private addFileTransFile(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private pullFileTransData(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private writeFileTransData(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private sendFileTransFinish(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private cancelFileTrans(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private pendFileTrans(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private resumeFileTrans(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private newFileTransfer(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private generateFileTransFileId(success: SuccessCallback, error: ErrorCallback, args: any) {
        
    }

    //TODO: implement
    private decodeFileTransferInfo(jsonObject: any): any {

    }
}

TrinityRuntime.getSharedInstance().registerPlugin("CarrierPlugin", (appId: string)=>{
    return new CarrierPlugin(appId);
});

TrinityRuntime.getSharedInstance().createIPCDefinitionForMainProcess("CarrierPlugin", [
    "test",
    "setListener",
    "createObject",
    "carrierStart",
    "isReady",
    "acceptFriend",
    "addFriend",
    "getFriend",
    "labelFriend",
    "isFriend",
    "removeFriend",
    "getFriends",
    "sendFriendMessage",
    "sendFriendBinaryMessage",
    "sendFriendMessageWithReceipt",
    "sendFriendBinaryMessageWithReceipt",
    "getSelfInfo",
    "setSelfInfo",
    "getNospam",
    "setNospam",
    "getPresence",
    "setPresence",
    "inviteFriend",
    "replyFriendInvite",
    "destroy",
    "newSession",
    "sessionClose",
    "getPeer",
    "sessionRequest",
    "sessionReplyRequest",
    "sessionStart",
    "addStream",
    "removeStream",
    "addService",
    "removeService",
    "getTransportInfo",
    "streamWrite",
    "openChannel",
    "closeChannel",
    "writeChannel",
    "pendChannel",
    "resumeChannel",
    "openPortForwarding",
    "closePortForwarding",
    "getVersion",
    "getIdFromAddress",
    "isValidAddress",
    "isValidId",
    "createGroup",
    "joinGroup",
    "inviteGroup",
    "leaveGroup",
    "sendGroupMessage",
    "getGroupTitle",
    "setGroupTitle",
    "getGroupPeers",
    "getGroupPeer",
    "generateFileTransFileId",
    "closeFileTrans",
    "getFileTransFileId",
    "getFileTransFileName",
    "fileTransConnect",
    "acceptFileTransConnect",
    "addFileTransFile",
    "pullFileTransData",
    "writeFileTransData",
    "sendFileTransFinish",
    "cancelFileTrans",
    "pendFileTrans",
    "resumeFileTrans",
    "newFileTransfer"
]);