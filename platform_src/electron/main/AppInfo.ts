import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IntentFilter } from './IntentFilter';

@Entity()
export class AppInfo {
	
	public static TID = "tid";
	public static APP_TID = "app_tid";
	public static APP_ID = "app_id";
	public static VERSION = "version";
	public static VERSION_CODE = "version_code";
	public static NAME = "name";
	public static SHORT_NAME = "short_name";
	public static DESCRIPTION = "description";
	public static START_URL = "start_url";
	public static STARTUP_SERVICE = "startup_service";
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

    public static STARTUP_MODE = "startup_mode";
    public static SERVICE_NAME = "service_name";

    public static MSG_PARAMS = 0;
    public static MSG_RETURN = 1;
    public static MSG_URL_AUTHORITY = 2;
    public static MSG_PLUGIN_AUTHORITY = 3;

    @PrimaryGeneratedColumn() public tid: string;
    @Column() public app_id: string;
    @Column() public version: string;
    @Column({ nullable: true }) public version_code: number;
    @Column() public name: string;
    @Column({ nullable: true }) public short_name: string;
    @Column({ nullable: true }) public description: string;
    @Column() public start_url: string;
    @Column() public type: string;
    @Column({ nullable: true }) public author_name: string;
    @Column({ nullable: true }) public author_email: string;
    @Column({ nullable: true }) public default_locale: string;
    @Column({ nullable: true }) public background_color: string;
    @Column({ nullable: true }) public theme_display: string;
    @Column({ nullable: true }) public theme_color: string;
    @Column({ nullable: true }) public theme_font_name: string;
    @Column({ nullable: true }) public theme_font_color: string;
    @Column({ nullable: true }) public install_time: number;
    @Column({ nullable: true }) public built_in: number;
    @Column({ nullable: true }) public remote: number;
    @Column({ nullable: true }) public launcher: number;
    @Column({ nullable: true }) public category: string;
    @Column({ nullable: true }) public key_words: string;
    @Column({ nullable: true }) public start_visible: string;
    public share: boolean = true;

    public static AUTHORITY_NOEXIST = -1;
    public static AUTHORITY_NOINIT = 0;
    public static AUTHORITY_ASK = 1;
    public static AUTHORITY_ALLOW = 2;
    public static AUTHORITY_DENY = 3;

    public locales = new Array<AppInfo.Locale>();
    public icons = new Array<AppInfo.Icon>();
    public plugins = new Array<AppInfo.PluginAuth>();
    public urls = new Array<AppInfo.UrlAuth>();
    public intents = new Array<AppInfo.UrlAuth>();
    public intentFilters = new Array<IntentFilter>();
    public frameworks = new Array<AppInfo.Framework>();
    public platforms = new Array<AppInfo.Platform>();
    public startupServices = new Array<AppInfo.StartupService>();

     public addIcon(src: string, sizes: string, type: string) {
         this.icons.push(new AppInfo.Icon(src, sizes, type));
     }

    public addPlugin(plugin: string, authority: number) {
        for (let pluginAuth of this.plugins) {
            if (pluginAuth.plugin == plugin) {
                pluginAuth.authority = authority;
                return;
            }
        }
        this.plugins.push(new AppInfo.PluginAuth(plugin, authority));
    }

    public addUrl(url: string, authority: number) {
        for (let urlAuth of this.urls) {
            if (urlAuth.url == url) {
                urlAuth.authority = authority;
                return;
            }
        }
        this.urls.push(new AppInfo.UrlAuth(url, authority));
    }

    public addIntent(url: string, authority: number) {
        for (let urlAuth of this.intents) {
            if (urlAuth.url == url) {
                urlAuth.authority = authority;
                return;
            }
        }
        this.intents.push(new AppInfo.UrlAuth(url, authority));
    }

    public addLocale(language: string, name: string, short_name: string, description: string, author_name: string) {
        this.locales.push(new AppInfo.Locale(language, name, short_name, description, author_name));
    }

    public addFramework(name: string, version: string) {
        this.frameworks.push(new AppInfo.Framework(name, version));
    }

    public addPlatform(name: string, version: string) {
        this.platforms.push(new AppInfo.Platform(name, version));
    }

    public addIntentFilter(action: string, startupMode: string, serviceName: string) {
        this.intentFilters.push(new IntentFilter(action, startupMode, serviceName));
    }

    public getFramework(name: string): AppInfo.Framework {
        for (let item of this.frameworks) {
            if (item.name == name) {
                return item;
            }
        }
        return null;
    }

    public getPlatform(name: string): AppInfo.Platform {
        for (let item of this.platforms) {
            if (item.name == name) {
                return item;
            }
        }
        return null;
    }

    public addStartService(name: string) {
        this.startupServices.push(new AppInfo.StartupService(name));
    }

}



export namespace AppInfo {

    @Entity()
    export class Locale {
        @PrimaryGeneratedColumn() public tid: string;
        @Column() public app_tid: string;
        @Column({ nullable: true }) public language: string = "";
        @Column({ nullable: true }) public name: string = "";
        @Column({ nullable: true }) public short_name: string = "";
        @Column({ nullable: true }) public description: string = "";
        @Column({ nullable: true }) public author_name: string = "";

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
        @Column() public app_tid: string;
        @Column({ nullable: true }) public src: string = "";
        @Column({ nullable: true }) public sizes: string = "";
        @Column({ nullable: true }) public type: string = "";
    
        constructor(src: string, sizes: string, type: string) {
            this.src = src;
            this.sizes = sizes;
            this.type = type;
        }
    }

    @Entity()
    export class PluginAuth {
        @PrimaryGeneratedColumn() public tid: string;
        @Column() public app_tid: string;
        @Column({ nullable: true }) public plugin: string = "";
        @Column({ nullable: true }) public authority: number = AppInfo.AUTHORITY_NOINIT;
    
        constructor(plugin: string, authority: number) {
            this.plugin = plugin;
            this.authority = authority;
        }
    }

    @Entity()
    export class UrlAuth {
        @PrimaryGeneratedColumn() public tid: string;
        @Column() public app_tid: string;
        @Column({ nullable: true }) public url: string;
        @Column({ nullable: true }) public authority: number = AppInfo.AUTHORITY_NOINIT;
    
        constructor(url: string, authority: number) {
            this.url = url;
            this.authority = authority;
        }
    }

    //CUSTOM: pojo need to save in repository
    @Entity()
    export class IntentAuth {
        @PrimaryGeneratedColumn() public tid: string;
        @Column() public app_tid: string;
        @Column({ nullable: true }) public url: string;
        @Column({ nullable: true }) public authority: number = AppInfo.AUTHORITY_NOINIT;
    
        constructor(url: string, authority: number) {
            this.url = url;
            this.authority = authority;
        }
    }

    @Entity()
    export class Framework {
        @PrimaryGeneratedColumn() public tid: string;
        @Column() public app_tid: string;
        @Column({ nullable: true }) public name: string;
        @Column({ nullable: true }) public version: string;
    
        constructor(name: string, version: string) {
            this.name = name;
            this.version = version;
        }
    }

    @Entity()
    export class Platform {
        @PrimaryGeneratedColumn() public tid: string;
        @Column() public app_tid: string;
        @Column({ nullable: true }) public name: string;
        @Column({ nullable: true }) public version: string;
    
        constructor(name: string, version: string) {
            this.name = name;
            this.version = version;
        }
    }

    @Entity()
    export class StartupService {
        @PrimaryGeneratedColumn() public tid: string;
        @Column() public app_id: string;
        @Column({ nullable: true }) public name: string;
    
        constructor(name: string) {
            this.name = name;
        }
    }

}