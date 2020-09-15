var TitleBarManagerPluginProxy = {
    setTitle: async function(success, error, opts) { 
        await window.titleBarManagerImpl.setTitle(success, error, opts);
    },
    setBackgroundColor: async function(success, error, opts) {
        await window.titleBarManagerImpl.setBackgroundColor(success, error, opts);
    },
    setForegroundMode: async function(success, error, opts) { 
        await window.titleBarManagerImpl.setForegroundMode(success, error, opts);
    },
    setNavigationMode: async function(success, error, opts) {
        await window.titleBarManagerImpl.setNavigationMode(success, error, opts);
    },
    setNavigationIconVisibility: async function(success, error, opts) {
        await window.titleBarManagerImpl.setNavigationIconVisibility(success, error, opts);
    },
    addOnItemClickedListener: function(success, error, opts) {
        window.titleBarManagerImpl.addOnItemClickedListener((args) => {
			success(args, {keepCallback: true});
		}, error, opts);
    },
    removeOnItemClickedListener: async function(success, error, opts) {
        await window.titleBarManagerImpl.removeOnItemClickedListener(success, error, opts);
    },
    setIcon: async function(success, error, opts) {
        await window.titleBarManagerImpl.setIcon(success, error, opts);
    },
    setBadgeCount: async function(success, error, opts) {
        await window.titleBarManagerImpl.setBadgeCount(success, error, opts);
    },
    setupMenuItems: async function(success, error, opts) {
        await window.titleBarManagerImpl.setupMenuItems(success, error, opts);
    },
    showActivityIndicator: async function(success, error, opts) {
        await window.titleBarManagerImpl.showActivityIndicator(success, error, opts);
    },
    hideActivityIndicator: async function(success, error, opts) {
        await window.titleBarManagerImpl.hideActivityIndicator(success, error, opts);
    }
};

module.exports = TitleBarManagerPluginProxy;

require("cordova/exec/proxy").add("TitleBarPlugin", TitleBarManagerPluginProxy);