package com.all575.app;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

/** App-wide visibility: an internal biometric activity must not count as leaving the app. */
@CapacitorPlugin(name = "AppEntry")
public class AppEntryPlugin extends Plugin implements Application.ActivityLifecycleCallbacks {
    private final Set<Activity> started = Collections.newSetFromMap(new IdentityHashMap<>());
    private boolean active = true;

    @Override
    public void load() {
        started.add(getActivity());
        getActivity().getApplication().registerActivityLifecycleCallbacks(this);
    }

    private void publish(boolean value) {
        if (active == value) return;
        active = value;
        JSObject state = new JSObject();
        state.put("isActive", value);
        notifyListeners("change", state, true);
    }

    @Override
    public void onActivityStarted(Activity activity) {
        started.add(activity);
        publish(true);
    }

    @Override
    public void onActivityStopped(Activity activity) {
        started.remove(activity);
        if (started.isEmpty()) publish(false);
    }

    @Override
    protected void handleOnDestroy() {
        getActivity().getApplication().unregisterActivityLifecycleCallbacks(this);
        started.clear();
    }

    @Override public void onActivityCreated(Activity activity, Bundle state) {}
    @Override public void onActivityResumed(Activity activity) {}
    @Override public void onActivityPaused(Activity activity) {}
    @Override public void onActivitySaveInstanceState(Activity activity, Bundle state) {}
    @Override public void onActivityDestroyed(Activity activity) { started.remove(activity); }
}
