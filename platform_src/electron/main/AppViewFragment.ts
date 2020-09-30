import { WebViewFragment, PluginEntry } from './WebViewFragment';
import { AppManager } from './AppManager';
import { AppBasePlugin } from './AppBasePlugin';
import { NullPlugin } from './NullPlugin';

export class AppViewFragment extends WebViewFragment {

    constructor() {
        super();
    }
    
    private isPluginAllowedToLoad(name: string) {
        if (name == "SplashScreen" && this.appInfo.start_visible == "hide") {
            return false;
        }

        return true;
    }

    //TODO: implement AppWhitelistPlugin
    protected loadConfig() {
        console.log("loadConfig - AppViewFragment");
        AppManager.getSharedInstance().getDBAdapter().resetApiDenyAuth(this.modeId);

        this.pluginEntries = new Array<PluginEntry>();

        this.launchUrl = AppManager.getSharedInstance().getStartPath(this.appInfo);

        let pluginClass;
        //AppWhitelistPlugin whitelistPlugin = new AppWhitelistPlugin(appInfo);
        //PermissionGroup permissionGroup = PermissionManager.getShareInstance().getPermissionGroup(appInfo.app_id);
        for (let entry of WebViewFragment.cfgPluginEntries) {
            if (entry.service == "Whitelist") {
                this.pluginEntries.push(new PluginEntry("Whitelist", "org.elastos.plugins.appmanager.AppWhitelistPlugin", null));
            }
            else {
                pluginClass = entry.pluginClass;
                let plugin = null;
                if (this.isPluginAllowedToLoad(entry.service)) {
                    pluginClass = "org.elastos.plugins.appmanager.AuthorityPlugin";
                    //plugin = new AuthorityPlugin(entry.pluginClass, this, entry.service, whitelistPlugin, permissionGroup);
                    if (entry.service == "AppManager") {
                        this.basePlugin = entry.plugin as AppBasePlugin;
                    }
                }
                else {
                    pluginClass = "org.elastos.plugins.appmathisnager.NullPlugin";
                    plugin = new NullPlugin(entry.service);
                }
                this.pluginEntries.push(new PluginEntry(entry.service, pluginClass, plugin));
            }
        }
    }
}