var AppManagerPluginProxy = {
    getAppInfos: async function(success, error, opts) {
        await window.appManagerImpl.getAppInfos(success, error, opts);
    },
    getPreference: async function(success, error, opts) {
        await window.appManagerImpl.getPreference(success, error, opts);
    },
    start: async function(success, error, opts) {
        await window.appManagerImpl.start(success, error, opts);
    },
    getLocale: async function(success, error, opts) {
        success({
            defaultLang: "en",
            currentLang: "en",
            systemLang: "en"
        });
    },
    setListener: function(success, error, opts) {
        window.appManagerImpl.setListener((args)=>{
            success(args, {
                keepCallback: true
            })
        }, error, opts);
    },
    setVisible: function(success, error, opts) {
        window.appManagerImpl.setVisible(success, error, opts);
    },
    getRunningList: function(success, error, opts) { success([]) },
    setIntentListener: function(success, error, opts) { },
    hasPendingIntent: function(success, error, opts) { success("false") }
};

module.exports = AppManagerPluginProxy;

require("cordova/exec/proxy").add("AppManager", AppManagerPluginProxy);

/** TEMP STUBS BPI */
require("cordova/exec/proxy").add("NotificationManagerPlugin", {
    setNotificationListener: function(success, error, opts) { },
    getNotifications: function(success, error, opts) { success({
        notifications:[]
    }) },
});

require("cordova/exec/proxy").add("TitleBarPlugin", {
    showActivityIndicator: function(success, error, opts) { success() },
    hideActivityIndicator: function(success, error, opts) { success() },
    addOnItemClickedListener: function(success, error, opts) { },
    setForegroundMode: function(success, error, opts) { success() },
    setBackgroundColor: function(success, error, opts) { success() },
    setNavigationIconVisibility: function(success, error, opts) { success() },
    setIcon: function(success, error, opts) { success() },
    setBadgeCount: function(success, error, opts) { success() },
});

require("cordova/exec/proxy").add("DIDSessionManagerPlugin", {
    getSignedInIdentity: function(success, error, opts) { success({did:"abcd"}) },
});