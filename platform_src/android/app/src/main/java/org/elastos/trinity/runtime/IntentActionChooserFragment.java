package org.elastos.trinity.runtime;

import android.annotation.SuppressLint;
import android.app.DialogFragment;
import android.net.Uri;
import android.os.Bundle;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import java.io.File;
import java.util.ArrayList;

@SuppressLint("ValidFragment")
public class IntentActionChooserFragment extends DialogFragment {
    private AppManager appManager;
    private ArrayList<AppInfo> appInfos;
    private OnAppChosenListener listener = null;

    public IntentActionChooserFragment(AppManager appManager, ArrayList<AppInfo> appInfos) {
        this.appManager = appManager;
        this.appInfos = appInfos;
    }

    public void setListener(OnAppChosenListener listener) {
        this.listener = listener;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_intent_action_chooser, container);

        // Apps list
        RecyclerView rvApps = rootView.findViewById(R.id.rvApps);
        RecyclerView.LayoutManager layoutManager = new LinearLayoutManager(getActivity());
        rvApps.setLayoutManager(layoutManager);
        rvApps.setAdapter(new AppsListAdapter(appInfos, listener));

        // Cancel button
        /*rootView.findViewById(R.id.btCancel).setOnClickListener(view -> {
            // Cancelling - close the popup.
            IntentActionChooserFragment.this.dismiss();
        });*/

        return rootView;
    }

    /**
     * Listener for apps selection
     */
    public interface OnAppChosenListener {
        void onAppChosen(AppInfo appInfo);
    }

    /**
     * Apps list adapter
     */
    public class AppsListAdapter extends RecyclerView.Adapter<AppsListAdapter.ViewHolder> {
        private ArrayList<AppInfo> appInfos;
        private OnAppChosenListener listener;

        class ViewHolder extends RecyclerView.ViewHolder {
            private View rootView;
            ImageView ivAppIcon;
            TextView tvAppName;

            ViewHolder(View v) {
                super(v);

                rootView = v;

                this.ivAppIcon = v.findViewById(R.id.ivAppIcon);
                this.tvAppName = v.findViewById(R.id.tvAppName);
            }
        }

        AppsListAdapter(ArrayList<AppInfo> appInfos, OnAppChosenListener listener) {
            this.appInfos = appInfos;
            this.listener = listener;
        }

        @Override
        public AppsListAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
            View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.row_intent_chooser_app_info, parent, false);
            AppsListAdapter.ViewHolder vh = new AppsListAdapter.ViewHolder(v);

            return vh;
        }

        @Override
        public void onBindViewHolder(ViewHolder holder, int position) {
            AppInfo appInfo = appInfos.get(position);

            // TODO: dirty - use a method to get app icon path in a clean way.
            String[] iconPaths = appManager.getIconPaths(appInfo);
            if (iconPaths != null && iconPaths.length > 0) {
                String appIconPath = iconPaths[0];
                holder.ivAppIcon.setImageURI(Uri.fromFile(new File(appIconPath)));
            }
            else {
                holder.ivAppIcon.setVisibility(View.INVISIBLE);
            }
            holder.tvAppName.setText(appInfo.name);

            holder.rootView.setOnClickListener(view -> {
                listener.onAppChosen(appInfo);
            });
        }

        @Override
        public int getItemCount() {
            return appInfos.size();
        }
    }
}