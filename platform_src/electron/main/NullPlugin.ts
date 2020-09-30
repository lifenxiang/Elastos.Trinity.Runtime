import { TrinityPlugin } from './TrinityPlugin';

export class NullPlugin extends TrinityPlugin {
    private pluginName: string;

    constructor(name: string) {
        super(null);
        this.pluginName = name;
    }
}