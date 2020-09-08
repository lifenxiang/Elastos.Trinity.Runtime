var AppManagerPluginProxy = {
    getVersion: async function(success, error, opts) {
        await window.appManagerImpl.getVersion(success, error, opts);
    },

    start: async function(success, error, opts) {
        await window.appManagerImpl.start(success, error, opts);
    },

    closeApp: async function(success, error, opts) {
        await window.appManagerImpl.closeApp(success, error, opts);
    },

    getAppInfos: async function(success, error, opts) {
        await window.appManagerImpl.getAppInfos(success, error, opts);
    },

    setCurrentLocale: async function(success, error, opts) {
        await window.appManagerImpl.setCurrentLocale(success, error, opts);
    },

    install: async function(success, error, opts) {
        await window.appManagerImpl.install(success, error, opts);
    },

    unInstall: async function(success, error, opts) {
        await window.appManagerImpl.unInstall(success, error, opts);
    },

    setPluginAuthority: async function(success, error, opts) {
        await window.appManagerImpl.setPluginAuthority(success, error, opts);
    },

    setUrlAuthority: async function(success, error, opts) {
        await window.appManagerImpl.setUrlAuthority(success, error, opts);
    },

    getRunningList: async function(success, error, opts) {
        await window.appManagerImpl.getRunningList(success, error, opts);
    },

    getAppList: async function(success, error, opts) {
        await window.appManagerImpl.getAppList(success, error, opts);
    },

    alertPrompt: async function(success, error, opts) {
        await window.appManagerImpl.alertPrompt(success, error, opts);
    },

    infoPrompt: async function(success, error, opts) {
        await window.appManagerImpl.infoPrompt(success, error, opts);
    },

    askPrompt: async function(success, error, opts) {
        await window.appManagerImpl.askPrompt(success, error, opts);
    },

    getAppInfo: async function(success, error, opts) {
        await window.appManagerImpl.getAppInfo(success, error, opts);
    },

    getLocale: async function(success, error, opts) {
        await window.appManagerImpl.getLocale(success, error, opts);
    },

    getInfo: async function(success, error, opts) {
        await window.appManagerImpl.getInfo(success, error, opts);
    },

    launcher: async function(success, error, opts) {
        await window.appManagerImpl.launcher(success, error, opts);
    },

    close: async function(success, error, opts) {
        await window.appManagerImpl.close(success, error, opts);
    },

    sendMessage: async function(success, error, opts) {
        await window.appManagerImpl.sendMessage(success, error, opts);
    },

    setListener: function(success, error, opts) {
        window.appManagerImpl.setListener((args) => {
            success(args, {keepCallback: true});
        }, error, opts);
    },

    sendIntent: async function(success, error, opts) {
        await window.appManagerImpl.sendIntent(success, error, opts);
    },

    sendUrlIntent: async function(success, error, opts) {
        await window.appManagerImpl.sendUrlIntent(success, error, opts);
    },

    setIntentListener: async function(success, error, opts) {
        window.appManagerImpl.setIntentListener((args) => {
            success(args, {keepCallback: true});
        }, error, opts);
    },

    sendIntentResponse: async function(success, error, opts) {
        await window.appManagerImpl.sendIntentResponse(success, error, opts);
    },

    hasPendingIntent: async function(success, error, opts) {
        await window.appManagerImpl.hasPendingIntent(success, error, opts);
    },

    setVisible: async function(success, error, opts) {
        await window.appManagerImpl.setVisible(success, error, opts);
    },

    getSetting: async function(success, error, opts) {
        await window.appManagerImpl.getSetting(success, error, opts);
    },

    getSettings: async function(success, error, opts) {
        await window.appManagerImpl.getSettings(success, error, opts);
    },

    setSetting: async function(success, error, opts) {
        await window.appManagerImpl.setSetting(success, error, opts);
    },

    getPreference: async function(success, error, opts) {
        await window.appManagerImpl.getPreference(success, error, opts);
    },

    getPreferences: async function(success, error, opts) {
        await window.appManagerImpl.getPreferences(success, error, opts);
    },

    setPreference: async function(success, error, opts) {
        await window.appManagerImpl.setPreference(success, error, opts);
    },

    resetPreferences: async function(success, error, opts) {
        await window.appManagerImpl.resetPreferences(success, error, opts);
    },

    broadcastMessage: async function(success, error, opts) {
        await window.appManagerImpl.broadcastMessage(success, error, opts);
    },

    getStartupMode: async function(success, error, opts) {
        await window.appManagerImpl.getStartupMode(success, error, opts);
    },

    startBackgroundService: async function(success, error, opts) {
        await window.appManagerImpl.startBackgroundService(success, error, opts);
    },

    stopBackgroundService: async function(success, error, opts) {
        await window.appManagerImpl.stopBackgroundService(success, error, opts);
    },

    getRunningServiceList: async function(success, error, opts) {
        await window.appManagerImpl.getRunningServiceList(success, error, opts);
    },

    startAppBackgroundService: async function(success, error, opts) {
        await window.appManagerImpl.startAppBackgroundService(success, error, opts);
    },

    stopAppBackgroundService: async function(success, error, opts) {
        await window.appManagerImpl.stopAppBackgroundService(success, error, opts);
    },

    stopAllBackgroundService: async function(success, error, opts) {
        await window.appManagerImpl.stopAllBackgroundService(success, error, opts);
    },

    getAllRunningServiceList: async function(success, error, opts) {
        await window.appManagerImpl.getAllRunningServiceList(success, error, opts);
    }
};

module.exports = AppManagerPluginProxy;

require("cordova/exec/proxy").add("AppManager", AppManagerPluginProxy);

