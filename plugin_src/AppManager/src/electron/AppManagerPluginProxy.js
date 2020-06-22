var AppManagerPluginProxy = {
    getAppInfos: async function(success, error, opts) {
        success(window.appManagerImpl.getAppInfos(opts));
    },
    getPreference: async function(success, error, opts) {
        success(window.appManagerImpl.getPreference(opts));
    },
    getLocale: async function(success, error, opts) {
        success("en");
    },
    setListener: function(success, error, opts) { success() },
    getRunningList: function(success, error, opts) { success([]) },
    setIntentListener: function(success, error, opts) { success([]) },
};

module.exports = AppManagerPluginProxy;

require("cordova/exec/proxy").add("AppManager", AppManagerPluginProxy);

/** TEMP STUBS BPI */
require("cordova/exec/proxy").add("NotificationManagerPlugin", {
    setNotificationListener: function(success, error, opts) { success() }
});

require("cordova/exec/proxy").add("TitleBarPlugin", {
    showActivityIndicator: function(success, error, opts) { success() },
    hideActivityIndicator: function(success, error, opts) { success() },
    addOnItemClickedListener: function(success, error, opts) { success() },
    setForegroundMode: function(success, error, opts) { success() },
    setBackgroundColor: function(success, error, opts) { success() }
});

require("cordova/exec/proxy").add("DIDSessionManagerPlugin", {
    getSignedInIdentity: function(success, error, opts) { success({did:"abcd"}) },
});