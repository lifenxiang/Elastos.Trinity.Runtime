import { WebViewFragment, PluginEntry } from './WebViewFragment';
import { TrinityPlugin } from './TrinityPlugin';
import { AppManager } from './AppManager';
import { AppBasePlugin } from './AppBasePlugin';

export class LauncherViewFragment extends WebViewFragment {

    static allPluginEntries: Array<PluginEntry>;

    constructor() {
        super();
    }

    protected loadConfig() {
        console.log("loadConfig - LauncherViewFragment");
        this.launchUrl = AppManager.getSharedInstance().getStartPath(this.appInfo);

        let entries = this.getPluginEntries();
        WebViewFragment.cfgPluginEntries = new Array<PluginEntry>();
        this.pluginEntries = new Array<PluginEntry>();

        for (let entry of entries) {
            if (entry.service == "AppManager") {
                this.basePlugin = entry.plugin as AppBasePlugin;
                this.pluginEntries.push(entry);
            }
            else {
                this.pluginEntries.push(entry);
            }
            WebViewFragment.cfgPluginEntries.push(entry);
        }
        
        if (LauncherViewFragment.allPluginEntries == null) {
            LauncherViewFragment.allPluginEntries = this.pluginEntries;
        }
    }

    public isLauncher(): boolean {
        return true;
    }

    private getPluginEntries(): Array<PluginEntry> {
        let entries = new Array<PluginEntry>();
        this.runtime.plugins2.forEach(async (value: any, key: string) => {
            let pluginName = key;
            console.log("pluginName: "+pluginName);
            let pluginInstance = value.instanceCreationCallback(this.appInfo.app_id);
            await pluginInstance.setInfo(this.appInfo);
            entries.push(new PluginEntry(pluginName, null, pluginInstance));
        });
        return entries;
    }
}