import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

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

@Entity()
export class Icon {
    @PrimaryGeneratedColumn() public tid: string;
    @Column() app_tid: string;
    @Column({ nullable: true }) public src: string = "";
    @Column({ nullable: true }) public sizes: string = "";
    @Column({ nullable: true }) public type: string = "";

    constructor(tid: string, src: string, sizes: string, type: string) {
        this.tid = tid;
        this.src = src;
        this.sizes = sizes;
        this.type = type;
    }
}

export class PluginAuth {
    public plugin = "";
    public authority = AppInfo.AUTHORITY_NOINIT;

    constructor(plugin: string, authority: number) {
        this.plugin = plugin;
        this.authority = authority;
    }
}

export class UrlAuth {
    public url: string;
    public authority = AppInfo.AUTHORITY_NOINIT;

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
export class AppInfo {
    public static AUTHORITY_NOEXIST = -1;
    public static AUTHORITY_NOINIT = 0;
    public static AUTHORITY_ASK = 1;
    public static AUTHORITY_ALLOW = 2;
    public static AUTHORITY_DENY = 3;

    public static TID = "tid";
    public static APP_TID = "app_tid";
    public static APP_ID = "app_id";
    public static VERSION = "version";
    public static VERSION_CODE = "version_code";
    public static NAME = "name";
    public static SHORT_NAME = "short_name";
    public static DESCRIPTION = "description";
    public static START_URL = "start_url";
    public static AUTHOR_NAME = "author_name";
    public static AUTHOR_EMAIL = "author_email";
    public static DEFAULT_LOCAL = "default_locale";
    public static BACKGROUND_COLOR = "background_color";
    public static THEME_DISPLAY = "theme_display";
    public static THEME_COLOR = "theme_color";
    public static THEME_FONT_NAME = "theme_font_name";
    public static THEME_FONT_COLOR = "theme_font_color";
    public static INSTALL_TIME = "install_time";
    public static BUILT_IN = "built_in";
    public static REMOTE = "remote";
    public static CATEGORY = "category";
    public static KEY_WORDS = "key_words";
    public static LAUNCHER = "launcher";
    public static LANGUAGE = "language";
    public static ACTION = "act";
    public static START_VISIBLE = "start_visible";

    public static SRC = "src";
    public static SIZES = "sizes";
    public static TYPE = "type";

    public static PLUGIN = "plugin";
    public static URL = "url";
    public static API = "api";
    public static AUTHORITY = "authority";

    @PrimaryGeneratedColumn() public tid: string;
    @Column() public app_id: string;
    @Column() public version: string;
    @Column({ nullable: true }) public version_code: number;
    @Column() public name: string;
    @Column({ nullable: true }) public short_name: string;
    @Column({ nullable: true }) public description: string;
    @Column() public start_url: string;
    @Column({ nullable: true }) public start_visible: string;
    @Column() public type: string;
    @Column({ nullable: true }) public author_name: string;
    @Column({ nullable: true }) public author_email: string;
    @Column({ nullable: true }) public default_locale: string;
    @Column({ nullable: true }) public isRemote: boolean;
    
    @Column({ nullable: true }) public background_color: string;
    /* TODO public String theme_display;
    public String theme_color;
    public String theme_font_name;
    public String theme_font_color;*/
    @Column({ nullable: true }) public install_time: number;
    @Column({ nullable: true }) public isBuiltIn: boolean;
    @Column({ nullable: true }) public isLauncher: boolean;
    @Column({ nullable: true }) public category: string;
    @Column({ nullable: true }) public key_words: string;
    public share: boolean = true;

    public locales = new Array<Locale>();
    public icons = new Array<Icon>();
    public plugins = new Array<PluginAuth>();
    public urls = new Array<UrlAuth>();
    public intents = new Array<UrlAuth>();
    public intentFilters = new Array<IntentFilter>();
    public frameworks = new Array<Framework>();
    public platforms = new Array<Platform>();

     public addIcon(icon: Icon) {
         this.icons.push(icon);
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