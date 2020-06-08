/*
* Copyright (c) 2020 Elastos Foundation
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import ElastosCarrierSDK

public class DefaultCarrierOptions {
    public static func createOptions (didSessionDID: String) -> CarrierOptions {
        let options = CarrierOptions()

        options.bootstrapNodes = [BootstrapNode]()
        options.expressNodes = [ExpressNode]()
        options.udpEnabled = true

        let dataPath = NSHomeDirectory() + "/Documents/data"
        let dbPath = dataPath+"/contactnotifier/"+didSessionDID
        options.persistentLocation = dbPath

        var nodes = Array<BootstrapNode>()
        var node: BootstrapNode

        node = BootstrapNode()
        node.ipv4 = "13.58.208.50"
        node.port = "33445"
        node.publicKey = "89vny8MrKdDKs7Uta9RdVmspPjnRMdwMmaiEW27pZ7gh"
        nodes.append(node)

        node = BootstrapNode()
        node.ipv4 = "18.216.102.47"
        node.port = "33445"
        node.publicKey = "G5z8MqiNDFTadFUPfMdYsYtkUDbX5mNCMVHMZtsCnFeb"
        nodes.append(node)

        node = BootstrapNode()
        node.ipv4 = "18.216.6.197"
        node.port = "33445"
        node.publicKey = "H8sqhRrQuJZ6iLtP2wanxt4LzdNrN2NNFnpPdq1uJ9n2"
        nodes.append(node)

        node = BootstrapNode()
        node.ipv4 = "52.83.171.135"
        node.port = "33445"
        node.publicKey = "5tuHgK1Q4CYf4K5PutsEPK5E3Z7cbtEBdx7LwmdzqXHL"
        nodes.append(node)

        node = BootstrapNode()
        node.ipv4 = "52.83.191.228"
        node.port = "33445"
        node.publicKey = "3khtxZo89SBScAMaHhTvD68pPHiKxgZT6hTCSZZVgNEm"
        nodes.append(node)

        options.bootstrapNodes = nodes

        //Hive
        var expressNodes = Array<ExpressNode>()
        var expNode: ExpressNode

        expNode = ExpressNode()
        expNode.ipv4 = "ece00.trinity-tech.io"
        expNode.port = "443"
        expNode.publicKey = "FyTt6cgnoN1eAMfmTRJCaX2UoN6ojAgCimQEbv1bruy9"
        expressNodes.append(expNode)

        expNode = ExpressNode()
        expNode.ipv4 = "ece01.trinity-tech.io"
        expNode.port = "443"
        expNode.publicKey = "FyTt6cgnoN1eAMfmTRJCaX2UoN6ojAgCimQEbv1bruy9"
        expressNodes.append(expNode)

        expNode = ExpressNode()
        expNode.ipv4 = "ece01.trinity-tech.cn"
        expNode.port = "443"
        expNode.publicKey = "FyTt6cgnoN1eAMfmTRJCaX2UoN6ojAgCimQEbv1bruy9"
        expressNodes.append(expNode)

        options.expressNodes = expressNodes

        return options
    }
}
