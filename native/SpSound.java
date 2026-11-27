package com.storeplus.app;

import android.media.AudioAttributes;
import android.media.SoundPool;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "SpSound")
public class SpSound extends Plugin {
    private SoundPool pool;
    private final Map<String, Integer> ids = new HashMap<>();

    @Override
    public void load() {
        AudioAttributes a = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        pool = new SoundPool.Builder().setMaxStreams(4).setAudioAttributes(a).build();
        ids.put("click", pool.load(getContext(), R.raw.sp_click, 1));
        ids.put("chime", pool.load(getContext(), R.raw.sp_chime, 1));
        ids.put("paid", pool.load(getContext(), R.raw.sp_paid, 1));
    }

    @PluginMethod
    public void play(PluginCall call) {
        String n = call.getString("name", "click");
        Integer id = ids.get(n);
        if (pool != null && id != null) pool.play(id, 1f, 1f, 1, 0, 1f);
        call.resolve();
    }
}
