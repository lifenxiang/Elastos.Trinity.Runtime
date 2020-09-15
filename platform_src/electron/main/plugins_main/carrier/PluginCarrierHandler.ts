import { SuccessCallback, ErrorCallback } from '../../TrinityPlugin';
import { CarrierPlugin } from './CarrierPlugin';
import { Log } from '../../Log';
import { existsSync, mkdirSync } from 'fs';
import { BootstrapsGetter } from './BootstrapsGetter';

var addon = require('./lib/carrier_addon');

type CallbackContext = {
    success: SuccessCallback;
    error: ErrorCallback;
}

export class PluginCarrierHandler {
    private static LOG_TAG = "PluginCarrierHandler";
    private static mCodeCounter: number = 0;

    public mCarrier: any;
    public mCode: number = 0;
    public mSessionManager: any;
    public static mCallbackContext: CallbackContext = null;
    public mGroupCallbackContext: CallbackContext = null;
    public groups: Map<any, string>;
    private binaryUsed: boolean = false;

    private mFileTransferManager: any;

    public static AGENT_READY = 0;

    constructor(callbackContext: CallbackContext, groupCallbackContext: CallbackContext) {
        PluginCarrierHandler.mCallbackContext = callbackContext;
        this.mGroupCallbackContext = groupCallbackContext;
        this.groups = new Map<any, string>();
    }

    private createCarrier(dir: string, configString: string, plugin: CarrierPlugin): any {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        let udpEnabled = false;
        let bootstraps: any[] = [];
        let list = BootstrapsGetter.getBootstrapNodes(plugin);
        for (let node of list) {
            bootstraps.push({
                ipv4: node.ipv4,
                port: node.port.toString(),
                publicKey: node.publicKey
            });
        }

        let expressNodes: any[] = [];
        let list2 = BootstrapsGetter.getExpressNodes(plugin);
        for (let expNode of list2) {
            expressNodes.push({
                ipv4: expNode.ipv4,
                port: expNode.port.toString(),
                publicKey: expNode.publicKey
            });
        }

        let jsonObject = JSON.parse(configString);
        udpEnabled = (jsonObject.udpEnabled == null) ? true : jsonObject.udpEnabled;
        this.binaryUsed = (jsonObject.binaryUsed == null) ? false : jsonObject.binaryUsed;
        
        let options: any = {};
        //options.persistentLocation = dir;
        options.persistentLocation = "D:\\elastOS\\electron_build\\dev_trinity\\Runtime";
        options.udpEnabled = udpEnabled;
        options.bootstraps = bootstraps;
        options.expressNodes = expressNodes;

        let optionSecret: string = (jsonObject.secret_key == null) ? "" : jsonObject.secret_key;
        if (optionSecret != "") {
            //TODO: optionSecret.getBytes()
            options.secretKey = optionSecret;
        }

        console.log(options);
        
        let callbacks = {
            onConnection: this.onConnection,
            onReady: this.onReady,
            onSelfInfoChanged: this.onSelfInfoChanged,
            onFriendConnection: this.onFriendConnection,
            onFriendInfoChanged: this.onFriendInfoChanged,
            onFriendPresence: this.onFriendPresence,
            onFriendRequest: this.onFriendRequest,
            onFriendAdded: this.onFriendAdded,
            onFriendRemoved: this.onFriendRemoved,
            onFriendMessage: this.onFriendMessage
        };
        this.mCarrier = addon.createCarrierInstance(options, callbacks);
        Log.d("Agent elastos carrier instance created successfully");
        if (this.mCarrier == null) {
            return null;
        }

        //TODO: implement
        /*mSessionManager = Manager.createInstance(mCarrier,  this);
        Log.i(TAG, "Agent session manager created successfully");

        mFileTransferManager = org.elastos.carrier.filetransfer.Manager.createInstance(mCarrier,this);
        Log.i(TAG, "Agent file transfer manager created successfully");*/
        
        //this.mCode = PluginCarrierHandler.mCodeCounter++;
        this.mCode = 1;
        console.log("createCarrier mCode: "+this.mCode);

        return this.mCarrier;
    }

    public static createInstance(dir: string,
                                configString: string,
                                callbackContext: CallbackContext,
                                groupCallbackContext: CallbackContext,
                                plugin: CarrierPlugin): PluginCarrierHandler {
        let handler = new PluginCarrierHandler(callbackContext, groupCallbackContext);
        if (handler != null) {
            let carrier = handler.createCarrier(dir, configString, plugin);
            if (carrier == null) {
                handler = null;
            }
        }
        return handler;
    }

    public static getUserInfoJson(info: any): any {
        let r: any = {
            description: info.description,
            email: info.email,
            gender: info.gender,
            name: info.name,
            phone: info.phone,
            region: info.region,
            userId: info.userId,
            hasAvatar: info.hasAvatar
        };
        return r;
    }

    public static getFriendInfoJson(info: any): any {
        let r: any = {
            status: info.connectionStatus,
            label: info.label,
            presence: info.presence,
            userInfo: PluginCarrierHandler.getUserInfoJson(info)
        };
        return r;
    }

    public static getFriendsInfoJson(friends: Array<any>) {
        let ret: any = {};
        for (let friend of friends) {
            ret[friend.userId] = PluginCarrierHandler.getFriendInfoJson(friend);
            Log.d(friend);
        }
        return ret;
    }

  //	public JSONObject getCarrierInfoJson() throws JSONException, CarrierException {
  //		UserInfo selfInfo = mCarrier.getSelfInfo();
  //		List<FriendInfo> friends = mCarrier.getFriends();
  //
  //		JSONObject r = new JSONObject();
  //		r.put("nodeId", mCarrier.getNodeId());
  //		r.put("address", mCarrier.getAddress());
  //		r.put("nospam", mCarrier.getNospam());
  //		r.put("presence", mCarrier.getPresence().value());
  //		r.put("selfInfo", getUserInfoJson(selfInfo));
  //		r.put("friends", getFriendsInfoJson(friends));
  //		return r;
  //	}

  //	public void logout() {
  //		String elaCarrierPath = mContext.getFilesDir().getAbsolutePath() + "/elaCarrier";
  //		File elaCarrierDir = new File(elaCarrierPath);
  //		if (elaCarrierDir.exists()) {
  //			File[] files = elaCarrierDir.listFiles();
  //			for (File file : files) {
  //				file.delete();
  //			}
  //		}
  //
  //		this.kill();
  //	}

    public kill() {
        if (this.mCarrier != null) {
            this.mSessionManager.cleanup();
            this.mFileTransferManager.cleanup();
            this.mCarrier.kill();
        }
    }

    public getSessionManager(): any {
        return this.mSessionManager;
    }

    public getFileTransferManager(): any {
        return this.mFileTransferManager;
    }

    public getInfo(): any {
        return this.mCarrier.getSelfInfo();
    }

    //TODO setKeepCallback true in proxy file
    private static sendEvent(info: any) {
        console.log("sendEvent");
        //info.id = this.mCode;
        info.id = 1;
        console.log(info);
        if (PluginCarrierHandler.mCallbackContext != null) {
            PluginCarrierHandler.mCallbackContext.success(info);
        }
    }

    //TODO setKeepCallback true in proxy file
    private sendGroupEvent(info: any, groupId: string) {
        info.groupId = groupId;
        if (PluginCarrierHandler.mCallbackContext != null) {
            this.mGroupCallbackContext.success(info);
        }
    }

    public onIdle(carrier: any) {
        let r: any = {
            name: "onIdle"
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onConnection(carrier: any, status: any) {
        Log.d("Agent connection status changed to " + status);
        let r: any = {
            name: "onConnection",
            status: status
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onReady(carrier: any) {
        console.log("PluginCarrierHandler - onReady");
        let r: any = {
            name: "onReady"
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onSelfInfoChanged(carrier: any, userInfo: any) {
        let r: any = {
            name: "onSelfInfoChanged",
            userInfo: PluginCarrierHandler.getUserInfoJson(userInfo)
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriends(carrier: any, friends: Array<any>) {
        Log.d("Client portforwarding agent received friend list: " + friends);

        let r: any = {
            name: "onFriends",
            friends: PluginCarrierHandler.getFriendsInfoJson(friends)
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendConnection(carrier: any, friendId: string, status: any) {
        console.log("PluginCarrierHandler - onFriendConnection");
        let r: any = {
            name: "onFriendConnection",
            friendId: friendId,
            status: status
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendInfoChanged(carrier: any, friendId: string, friendInfo: any) {
        console.log("PluginCarrierHandler - onFriendInfoChanged");
        let r: any = {
            name: "onFriendInfoChanged",
            friendId: friendId,
            friendInfo: PluginCarrierHandler.getFriendInfoJson(friendInfo)
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendPresence(carrier: any, friendId: string, presence: number) {
        console.log("PluginCarrierHandler - onFriendPresence");
        let r: any = {
            name: "onFriendPresence",
            friendId: friendId,
            presence: presence
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendAdded(carrier: any, friendInfo: any) {
        console.log("PluginCarrierHandler - onFriendAdded");
        let r: any = {
            name: "onFriendAdded",
            friendInfo: PluginCarrierHandler.getFriendInfoJson(friendInfo)
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendRemoved(carrier: any, friendId: string) {
        let r: any = {
            name: "onFriendRemoved",
            friendId: friendId
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendRequest(carrier: any, userId: string, info: any, hello: string) {
        console.log("PluginCarrierHandler - onFriendRequest");
        let r: any = {
            name: "onFriendRequest",
            userId: userId,
            userInfo: PluginCarrierHandler.getUserInfoJson(info),
            hello: hello
        };
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendMessage(carrier: any, from: any, data: any, timestamp: any, isOffline: boolean) {
        console.log("PluginCarrierHandler - onFriendMessage");
        let r: any = {};
        let message = null;
        if (this.binaryUsed) {
            //TODO: convert to binary
            //message = Base64.encodeToString(data, Base64.NO_WRAP);
            r.name = "onFriendBinaryMessage";
        } else {
            message = data as string;
            r.name = "onFriendMessage";
        }

        r.from = from;
        r.message = message;
        r.timestamp = timestamp;
        r.isOffline = isOffline;
        PluginCarrierHandler.sendEvent(r);
    }

    public onFriendInviteRequest(carrier: any, from: string, data: string) {
        let r: any = {
            name: "onFriendInviteRequest",
            from: from,
            message: data
        };
        //this.sendEvent(r);
    }

    public onSessionRequest(carrier: any, from: string, sdp: string) {
        let r: any = {
            name: "onSessionRequest",
            from: from,
            sdp: sdp
        };
        //this.sendEvent(r);
    }

    public onGroupInvite(carrier: any, from: string, cookie: any) {
        //TODO: convert to Base58
        let cookieData = cookie;
        let r: any = {
            name: "onGroupInvite",
            from: "from",
            cookieCode: cookieData
        };
        //this.sendEvent(r);
    }

    public onConnectRequest(carrier: any, from: string, info: any) {
        let r: any = {
            name: "onConnectRequest",
            from: from,
            info: this.createFileTransferJSON(info)
        };
    }

    public onGroupConnected(group: any) {
        let r: any = {
            name: "onConnection"
        };
        this.sendGroupEvent(r, this.groups.get(group));
    }

    public onGroupMessage(group: any, from: string, message: any) {
        let r: any = {};
        //TODO: convert to string
        let messageData = message;
        r.name = "onGroupMessage";
        r.from = from;
        r.message = messageData;
        this.sendGroupEvent(r, this.groups.get(group));
    }

    public onGroupTitle(group: any, from: string, title: string) {
        let r: any = {
            name: "onGroupTitle",
            from: from,
            title: title
        };
        this.sendGroupEvent(r, this.groups.get(group));
    }

    public onPeerName(group: any, peerId: string, peerName: string) {
        let r: any = {
            name: "onPeerName",
            peerId: peerId,
            peerName: peerName
        };
        this.sendGroupEvent(r, this.groups.get(group));
    }

    public onPeerListChanged(group: any) {
        let r: any = {
            name: "onPeerListChanged"
        };
        this.sendGroupEvent(r, this.groups.get(group));
    }

    private createFileTransferJSON(info: any) {
        let jsonObject: any = {
            fileId: info.fileId,
            filename: info.fileName,
            size: info.size
        };

        return jsonObject;
    }
}

