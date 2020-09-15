var NotificationManagerPluginProxy = {
	clearNotification: async function(success, error, opts) {
		await window.notificationManagerImpl.clearNotification(success, error, opts);
	},
	getNotifications: async function(success, error, opts) {
		await window.notificationManagerImpl.getNotifications(success, error, opts);
	},
	sendNotification: async function(success, error, opts) {
		await window.notificationManagerImpl.sendNotification(success, error, opts);
	},
    setNotificationListener: async function(success, error, opts) {
		window.notificationManagerImpl.setNotificationListener((args) => {
            success(args, {keepCallback: true});
        }, error, opts);
    }
};

module.exports = NotificationManagerPluginProxy;

require("cordova/exec/proxy").add("NotificationManagerPlugin", NotificationManagerPluginProxy);