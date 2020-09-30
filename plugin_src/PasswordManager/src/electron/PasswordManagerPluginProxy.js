var PasswordManagerPluginProxy = {
	setPasswordInfo: async function(success, error, opts) {
		await window.passwordManagerImpl.setPasswordInfo(success, error, opts);
	},
	
	getPasswordInfo: async function(success, error, opts) {
		await window.passwordManagerImpl.getPasswordInfo(success, error, opts);
	},
	
	getAllPasswordInfo: async function(success, error, opts) {
		await window.passwordManagerImpl.getAllPasswordInfo(success, error, opts);
	},
	
	deletePasswordInfo: async function(success, error, opts) {
		await window.passwordManagerImpl.deletePasswordInfo(success, error, opts);
	},
	
	deleteAppPasswordInfo: async function(success, error, opts) {
		await window.passwordManagerImpl.deleteAppPasswordInfo(success, error, opts);
	},
	
	generateRandomPassword: async function(success, error, opts) {
		await window.passwordManagerImpl.generateRandomPassword(success, error, opts);
	},
	
	changeMasterPassword: async function(success, error, opts) {
		await window.passwordManagerImpl.changeMasterPassword(success, error, opts);
	},
	
	lockMasterPassword: async function(success, error, opts) {
		await window.passwordManagerImpl.lockMasterPassword(success, error, opts);
	},
	
	deleteAll: async function(success, error, opts) {
		await window.passwordManagerImpl.deleteAll(success, error, opts);
	},
	
	setUnlockMode: async function(success, error, opts) {
		await window.passwordManagerImpl.setUnlockMode(success, error, opts);
	},
	
	setVirtualDIDContext: async function(success, error, opts) {
		await window.passwordManagerImpl.setVirtualDIDContext(success, error, opts);
	}
};

module.exports = PasswordManagerPluginProxy;

require("cordova/exec/proxy").add("PasswordManagerPlugin", PasswordManagerPluginProxy);