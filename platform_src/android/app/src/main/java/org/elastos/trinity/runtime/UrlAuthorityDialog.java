package org.elastos.trinity.runtime;

import android.app.AlertDialog;
import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.cardview.widget.CardView;

public class UrlAuthorityDialog extends AlertDialog {
    public interface OnDenyClickedListener {
        void onDenyClicked();
    }

    public interface OnAcceptClickedListener {
        void onAcceptClicked();
    }

    public static class Builder {
        private Context context;
        private AlertDialog.Builder alertDialogBuilder;
        private AlertDialog alertDialog;
        private String url;
        private AppInfo appInfo;
        private String plugin;
        private OnDenyClickedListener onDenyClickedListener;
        private OnAcceptClickedListener onAcceptClickedListener;

        public Builder(Context context) {
            this.context = PreferenceManager.getShareInstance().getLocalizedContext(context);
            alertDialogBuilder = new AlertDialog.Builder(context);

            alertDialogBuilder.setCancelable(false);
        }

        Builder setData(String url, AppInfo appInfo) {
            this.url = url;
            this.appInfo = appInfo;
            this.plugin = plugin;

            return this;
        }

        Builder setOnDenyClickedListener(OnDenyClickedListener listener) {
            this.onDenyClickedListener = listener;
            return this;
        }

        Builder setOnAcceptClickedListener(OnAcceptClickedListener listener) {
            this.onAcceptClickedListener = listener;
            return this;
        }

        public void show() {
            View view = LayoutInflater.from(context).inflate(R.layout.url_alert_authority,null);

            // Hook UI items
            LinearLayout llRoot = view.findViewById(R.id.llRoot);
            LinearLayout llMainContent = view.findViewById(R.id.llMainContent);
            TextView lblTitle = view.findViewById(R.id.lblTitle);
            TextView lblSubtitle = view.findViewById(R.id.lblSubtitle);
            TextView lblAppNameTitle = view.findViewById(R.id.lblAppNameTitle);
            TextView lblAppName = view.findViewById(R.id.lblAppName);
            TextView lblUrlTitle = view.findViewById(R.id.lblUrlTitle);
            TextView lblUrl = view.findViewById(R.id.lblUrl);
            Button btDeny = view.findViewById(R.id.btDeny);
            Button btAccept = view.findViewById(R.id.btAccept);
            CardView cardDeny = view.findViewById(R.id.cardDeny);
            CardView cardAccept = view.findViewById(R.id.cardAccept);

            // Customize colors
            llRoot.setBackgroundColor(UIStyling.popupMainBackgroundColor);
            llMainContent.setBackgroundColor(UIStyling.popupSecondaryBackgroundColor);
            lblAppName.setTextColor(UIStyling.popupMainTextColor);
            lblTitle.setTextColor(UIStyling.popupMainTextColor);
            lblSubtitle.setTextColor(UIStyling.popupMainTextColor);
            lblAppNameTitle.setTextColor(UIStyling.popupMainTextColor);
            lblAppName.setTextColor(UIStyling.popupMainTextColor);
            lblUrlTitle.setTextColor(UIStyling.popupMainTextColor);
            lblUrl.setTextColor(UIStyling.popupMainTextColor);
            cardDeny.setCardBackgroundColor(UIStyling.popupSecondaryBackgroundColor);
            btDeny.setTextColor(UIStyling.popupMainTextColor);
            cardAccept.setCardBackgroundColor(UIStyling.popupSecondaryBackgroundColor);
            btAccept.setTextColor(UIStyling.popupMainTextColor);

            // Apply data
            lblAppName.setText(appInfo.name);
            lblUrl.setText(url);

            btDeny.setOnClickListener(v -> {
                alertDialog.dismiss();
                onDenyClickedListener.onDenyClicked();
            });

            btAccept.setOnClickListener(v -> {
                alertDialog.dismiss();
                onAcceptClickedListener.onAcceptClicked();
            });

            alertDialogBuilder.setView(view);
            alertDialog = alertDialogBuilder.create();
            alertDialog.show();
        }
    }

    protected UrlAuthorityDialog(Context context, int themeResId) {
        super(context, themeResId);
    }
}
