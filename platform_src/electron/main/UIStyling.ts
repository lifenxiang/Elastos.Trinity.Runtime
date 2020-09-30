export class UIStyling {
    public static popupMainTextColor = "#FFFFFF";
    public static popupInputHintTextColor = "#CCCCCC";
    public static popupMainBackgroundColor = "#FFFFFF";
    public static popupSecondaryBackgroundColor = "#FFFFFF";

    static prepare(useDarkMode: boolean) {
        if (useDarkMode) {
            this.popupMainTextColor = "#fdfeff";
            this.popupInputHintTextColor = "#fdfeff";
            this.popupMainBackgroundColor = "#2e2f4e";
            this.popupSecondaryBackgroundColor = "#1c1d34";
        }
        else {
            this.popupMainTextColor = "#161740";
            this.popupInputHintTextColor = "#161740";
            this.popupMainBackgroundColor = "#F0F0F0";
            this.popupSecondaryBackgroundColor = "#FFFFFF";
        }
    }
}