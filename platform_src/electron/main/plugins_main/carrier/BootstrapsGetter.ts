import { CarrierPlugin } from './CarrierPlugin';

export class BootstrapsGetter {
    public bootstrapNodes: Array<BootstrapNode>;

    public expressNode0s: Array<ExpressNode0>;

    public static getBootstrapNodes(plugin: CarrierPlugin): Array<BootstrapNode> {
        let bootstrapNodes = new Array<BootstrapNode>();
        let node1 = new BootstrapNode();
        node1.ipv4 = "13.58.208.50";
        node1.port = 33445;
        node1.publicKey = "89vny8MrKdDKs7Uta9RdVmspPjnRMdwMmaiEW27pZ7gh";
        let node2 = new BootstrapNode();
        node2.ipv4 = "18.216.102.47";
        node2.port = 33445;
        node2.publicKey = "G5z8MqiNDFTadFUPfMdYsYtkUDbX5mNCMVHMZtsCnFeb";
        let node3 = new BootstrapNode();
        node3.ipv4 = "18.216.6.197";
        node3.port = 33445;
        node3.publicKey = "H8sqhRrQuJZ6iLtP2wanxt4LzdNrN2NNFnpPdq1uJ9n2";
        let node4 = new BootstrapNode();
        node4.ipv4 = "52.83.171.135";
        node4.port = 33445;
        node4.publicKey = "5tuHgK1Q4CYf4K5PutsEPK5E3Z7cbtEBdx7LwmdzqXHL";
        let node5 = new BootstrapNode();
        node5.ipv4 = "52.83.191.228";
        node5.port = 33445;
        node5.publicKey = "3khtxZo89SBScAMaHhTvD68pPHiKxgZT6hTCSZZVgNEm";
        bootstrapNodes.push(node1, node2, node3, node4, node5);
        return bootstrapNodes;
    }

    public static getExpressNodes(plugin: CarrierPlugin): Array<ExpressNode0> {
        let expressNode0s = new Array<ExpressNode0>();
        let node1 = new ExpressNode0();
        node1.ipv4 = "ece00.trinity-tech.io";
        node1.port = 443;
        node1.publicKey = "FyTt6cgnoN1eAMfmTRJCaX2UoN6ojAgCimQEbv1bruy9";
        let node2 = new ExpressNode0();
        node2.ipv4 = "ece01.trinity-tech.io";
        node2.port = 443;
        node2.publicKey = "FyTt6cgnoN1eAMfmTRJCaX2UoN6ojAgCimQEbv1bruy9";
        let node3 = new ExpressNode0();
        node3.ipv4 = "ece01.trinity-tech.cn";
        node3.port = 443;
        node3.publicKey = "FyTt6cgnoN1eAMfmTRJCaX2UoN6ojAgCimQEbv1bruy9";
        expressNode0s.push(node1, node2, node3);
        return expressNode0s;
    }
}

export class BootstrapNode {
    public ipv4: string;

    public port: number;

    public publicKey: string;
}

export class ExpressNode0 {
    public ipv4: string;

    public port: number;

    public publicKey: string;
}