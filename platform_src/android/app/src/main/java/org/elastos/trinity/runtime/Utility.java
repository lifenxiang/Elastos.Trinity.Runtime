package org.elastos.trinity.runtime;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

public class Utility {
    public static JSONObject getJsonFromFile(InputStream inputStream) throws Exception {
        InputStreamReader inputStreamReader = new InputStreamReader(inputStream, "UTF-8");
        BufferedReader bufReader = new BufferedReader(inputStreamReader);
        String line;
        StringBuilder builder = new StringBuilder();
        while ((line = bufReader.readLine()) != null) {
            builder.append(line);
        }
        bufReader.close();
        inputStreamReader.close();
        JSONObject json = new JSONObject(builder.toString());
        return json;
    }

    public static void alertPrompt(String title, String msg, Activity activity) {
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

    public static float convertDpToPx(Context context, float dp) {
        return dp * context.getResources().getDisplayMetrics().density;
    }

    public static float convertPxToDp(Context context, float px) {
        return px / context.getResources().getDisplayMetrics().density;
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
    }

    public static void showWebPage(Activity activity, String url) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        Uri uri = Uri.parse(url);
        intent.setData(uri);
        activity.startActivity(intent);
    }
}
