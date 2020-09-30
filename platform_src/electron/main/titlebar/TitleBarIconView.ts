enum View {
    GONE = "none",
    VISIBLE = "block"
}

type state = {
    colorFilter: string,
    visibility: string,
    imageResource: string
}

type ivBadge = {
    visibility: string
}

export class TitleBarIconView {
    ivMainIcon: any;
    ivBadge: ivBadge = {
        visibility: null
    };
    state: state = {
        colorFilter: null,
        visibility: View.GONE,
        imageResource: null
    };

    constructor() {

    }

    public setImageResource(resId: string) {
        this.state.imageResource = "assets/icon/" + resId + ".png";
    }

    public setImageURI(uri: string) {
        this.state.imageResource = uri;
    }

    public setColorFilter(color: string) {
        if (color == "#444444") {
            this.state.colorFilter = "invert(25%) sepia(15%) saturate(0%) hue-rotate(268deg) brightness(97%) contrast(92%)";
        }
        else if (color == "#FFFFFF") {
            this.state.colorFilter = "invert(100%) sepia(0%) saturate(2%) hue-rotate(141deg) brightness(108%) contrast(100%)";
        }
    }

    public setBadgeCount(count: number) {

    }
}
