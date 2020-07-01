package org.elastos.trinity.runtime;

public class IntentFilter {
    public String packageId = null;
    public String action;
    public String startupMode;
    public String serviceName;

    IntentFilter(String action, String startupMode, String serviceName) {
        this.action = action;
        this.startupMode = startupMode;
        this.serviceName = serviceName;
    }
}
