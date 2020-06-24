export class Utility {
    public static getJsonFromFile(loadedJsonFile: any): any {
        // Useless - more straight forward in JS than in Java. Just kept here to keep code similar among
        // platforms.
        return loadedJsonFile;
    }

    /*public static void alertPrompt(String title, String msg, Activity activity) {
        AlertDialog.Builder ab = new AlertDialog.Builder(activity);
        ab.setTitle(title);
        ab.setMessage(msg);
        ab.setIcon(android.R.drawable.ic_dialog_alert);

        ab.setPositiveButton("OK", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {

            }
        });
        ab.show();
    }

    public static boolean isJSONType(String str) {
        str = str.trim();
        if ((str.startsWith("{") && str.endsWith("}"))
                || (str.startsWith("[") && str.endsWith("]"))) {
            return true;

        }
        return false;
    }

    public static String getCustomHostname(String did, String appId) {
        String hostname = "";

        if (did != null) {
            hostname += did.replace(":", ".") + ".";
        }
        hostname += appId;

        return Uri.encode(hostname.toLowerCase());
    }*/
}

export function notImplemented(method: string) {
    console.log("NOT IMPLEMENTED: "+method);
}