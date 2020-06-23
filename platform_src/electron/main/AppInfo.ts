import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

const AUTHORITY_NOEXIST = -1;
const AUTHORITY_NOINIT = 0;
const AUTHORITY_ASK = 1;
const AUTHORITY_ALLOW = 2;
const AUTHORITY_DENY = 3;

export class Locale {
    public language = "";
    public name = "";
    public short_name = "";
    public description = "";
    public author_name = "";

    constructor(language: string, name: string, short_name: string, description: string, author_name: string) {
        this.language = language;
        this.name = name;
        this.short_name = short_name;
        this.description = description;
        this.author_name = author_name;
    }
}

export class Icon {
    public src = "";
    public sizes = "";
    public type = "";

    constructor(src: string, sizes: string, type: string) {
        this.src = src;
        this.sizes = sizes;
        this.type = type;
    }
}

export class PluginAuth {
    public plugin = "";
    public authority = AUTHORITY_NOINIT;

    constructor(plugin: string, authority: number) {
        this.plugin = plugin;
        this.authority = authority;
    }
}

export class UrlAuth {
    public url: string;
    public authority = AUTHORITY_NOINIT;

    constructor(url: string, authority: number) {
        this.url = url;
        this.authority = authority;
    }
}

export class Framework {
    public name: string;
    public version: string;

    constructor(name: string, version: string) {
        this.name = name;
        this.version = version;
    }
}

export class Platform {
    public name: string;
    public version: string;

    constructor(name: string, version: string) {
        this.name = name;
        this.version = version;
    }
}

export class IntentFilter {
    public action: string;

    constructor(action: string) {
        this.action = action;
    }
}

@Entity()
export class AppInfo extends BaseEntity {
    public static TID = "tid";
    public static APP_TID = "app_tid";
    public static APP_ID = "app_id";
    public static VERSION = "version";
    public static VERSION_CODE = "version_code";
    public static NAME = "name";
    public static SHORT_NAME = "short_name";
    public static DESCRIPTION = "description";
    public static START_URL = "start_url";
    /*public static final String AUTHOR_NAME = "author_name";
    public static final String AUTHOR_EMAIL = "author_email";
    public static final String DEFAULT_LOCAL = "default_locale";
    public static final String BACKGROUND_COLOR = "background_color";
    public static final String THEME_DISPLAY = "theme_display";
    public static final String THEME_COLOR = "theme_color";
    public static final String THEME_FONT_NAME = "theme_font_name";
    public static final String THEME_FONT_COLOR = "theme_font_color";
    public static final String INSTALL_TIME = "install_time";
    public static final String BUILT_IN = "built_in";
    public static final String REMOTE = "remote";
    public static final String CATEGORY = "category";
    public static final String KEY_WORDS = "key_words";
    public static final String LAUNCHER = "launcher";
    public static final String LANGUAGE = "language";
    public static final String ACTION = "act";
    public static final String START_VISIBLE = "start_visible";
*/
    public static SRC = "src";
    public static SIZES = "sizes";
    public static TYPE = "type";

/*
    public static final String PLUGIN = "plugin";
    public static final String URL = "url";
    public static final String API = "api";
    public static final String AUTHORITY = "authority";*/

    @PrimaryGeneratedColumn() public tid: string;
    @Column() public app_id: string;
    @Column() public version: string;
    @Column() public version_code: number;
    @Column() public name: string;
    @Column() public short_name: string;
    @Column() public description: string;
    @Column() public start_url: string;
    @Column() public type: string;
    @Column() public author_name: string;
    @Column() public author_email: string;
    @Column() public default_locale: string;
    @Column() public remote: number;
    
    /* TODO public String background_color;
    public String theme_display;
    public String theme_color;
    public String theme_font_name;
    public String theme_font_color;
    public long   install_time;*/
    @Column() public built_in: boolean;
    @Column() public isLauncher: boolean;
    /*public String category;
    public String key_words;*/
    @Column() public start_visible: string;
    @Column() public share: boolean = true;

    public locales = new Array<Locale>();
    public icons = new Array<Icon>();
    public plugins = new Array<PluginAuth>();
    public urls = new Array<UrlAuth>();
    public intents = new Array<UrlAuth>();
    public intentFilters = new Array<IntentFilter>();
    public frameworks = new Array<Framework>();
    public platforms = new Array<Platform>();

     public addIcon(src: string, sizes: string, type: string) {
         this.icons.push(new Icon(src, sizes, type));
     }

     public addPlugin(plugin: string, authority: number) {
         for (let pluginAuth of this.plugins) {
             if (pluginAuth.plugin == plugin) {
                 pluginAuth.authority = authority;
                 return;
             }
         }
         this.plugins.push(new PluginAuth(plugin, authority));
     }

     public addUrl(url: string, authority: number) {
         for (let urlAuth of this.urls) {
             if (urlAuth.url == url) {
                 urlAuth.authority = authority;
                 return;
             }
         }
         this.urls.push(new UrlAuth(url, authority));
     }

     public addIntent(url: string, authority: number) {
         for (let urlAuth of this.intents) {
             if (urlAuth.url == url) {
                 urlAuth.authority = authority;
                 return;
             }
         }

         this.intents.push(new UrlAuth(url, authority));
     }

     public addLocale(language: string, name: string, short_name: string, description: string, author_name: string) {
         this.locales.push(new Locale(language, name, short_name, description, author_name));
     }

     public addFramework(name: string, version: string) {
         this.frameworks.push(new Framework(name, version));
     }

     public addPlatform(name: string, version: string) {
         this.platforms.push(new Platform(name, version));
     }

     public addIntentFilter(action: string) {
         this.intentFilters.push(new IntentFilter(action));
     }
}