var DIDSessionManagerPluginProxy = {
    addIdentityEntry: async function(success, error, opts) {
		console.log("asd - DIDSessionManagerPluginProxy - addIdentityEntry");
        await window.didSessionManagerImpl.addIdentityEntry(success, error, opts);
    },
	
	deleteIdentityEntry: async function(success, error, opts) {
		console.log("asd - DIDSessionManagerPluginProxy - deleteIdentityEntry");
        await window.didSessionManagerImpl.deleteIdentityEntry(success, error, opts);
    },
	
	getIdentityEntries: async function(success, error, opts) {
		console.log("asd - DIDSessionManagerPluginProxy - getIdentityEntries");
        await window.didSessionManagerImpl.getIdentityEntries(success, error, opts);
    },
	
	getSignedInIdentity: async function(success, error, opts) {
		console.log("asd - DIDSessionManagerPluginProxy - getSignedInIdentity");
        await window.didSessionManagerImpl.getSignedInIdentity(success, error, opts);
		//success({did:"abcd"});
    },
	
	signIn: async function(success, error, opts) {
		console.log("asd - DIDSessionManagerPluginProxy - signIn");
        await window.didSessionManagerImpl.signIn(success, error, opts);
    },
	
	signOut: async function(success, error, opts) {
		console.log("asd - DIDSessionManagerPluginProxy - signOut");
        await window.didSessionManagerImpl.signOut(success, error, opts);
    },
	
	authenticate: async function(success, error, opts) {
		console.log("asd - DIDSessionManagerPluginProxy - authenticate");
        await window.didSessionManagerImpl.authenticate(success, error, opts);
    }
};

module.exports = DIDSessionManagerPluginProxy;

require("cordova/exec/proxy").add("DIDSessionManagerPlugin", DIDSessionManagerPluginProxy);


/*** TEMP STUBS ***/
require("cordova/exec/proxy").add("DIDPlugin", {
    generateMnemonic: function(success, error, opts) {
		console.log("DIDPluginProxy - generateMnemonic");
		console.log(opts);
		success("word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12");
	},
	
	initDidStore: function(success, error, opts) {
		console.log("DIDPluginProxy - initDidStore");
		console.log(opts);
		success();
	},
	
	setListener: function(success, error, opts) {
		console.log("DIDPluginProxy - setListener");
		console.log(opts);
	},
	
	initPrivateIdentity: function(success, error, opts) {
		console.log("DIDPluginProxy - initPrivateIdentity");
		console.log(opts);
		success();
	},
	
	newDid: function(success, error, opts) {
		console.log("DIDPluginProxy - newDid");
		console.log(opts);
		var result           = '';
		var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for ( var i = 0; i < 20; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		success({
			did: result
		});
	},
	
	CreateCredential: function(success, error, opts) {
		console.log("DIDPlugin - CreateCredential");
		console.log(opts);
		success({
			credential: '{"issuanceDate":"2020-09-03T13:17:21Z","expirationDate":"2025-09-02T13:17:21Z"}'
		});
	},
	
	storeCredential: function(success, error, opts) {
		console.log("DIDPlugin - storeCredential");
		console.log(opts);
		success();
	}
});
/*
require("cordova/exec/proxy").add("PasswordManagerPlugin", {
    generateRandomPassword: function(success, error, opts) {
		console.log("asd - PasswordManagerPlugin - generateRandomPassword");
		console.log(opts);
		success("password");
	},
	
	setVirtualDIDContext: function(success, error, opts) {
		console.log("asd - DIDPlugin - setVirtualDIDContext");
		console.log(opts);
		success({});
	},
	
	setPasswordInfo: function(success, error, opts) {
		console.log("asd - DIDPlugin - setPasswordInfo");
		console.log(opts);
		success({
			couldSet: true
		});
	},
	
	getPasswordInfo: function(success, error, opts) {
		console.log("asd - DIDPlugin - getPasswordInfo");
		console.log(opts);
		success({
			passwordInfo: {"key":"didstore-CB0545","type":0,"displayName":"DID store password","appID":"org.elastos.trinity.dapp.did","password":"1SmS|fY="}
		});
	}
});*/