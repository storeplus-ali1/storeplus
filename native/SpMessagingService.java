package com.storeplus.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

// Draws data-only pushes (title/body in data) with BigTextStyle so long text expands.
// Pushes that carry a normal "notification" payload are untouched (handled by the system as before).
public class SpMessagingService extends MessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage m) {
        try {
            Map<String, String> d = m.getData();
            if (m.getNotification() == null && d != null && (d.containsKey("sp_title") || d.containsKey("sp_body"))) {
                show(m, d);
            }
        } catch (Throwable t) { /* fall through to default handling */ }
        super.onMessageReceived(m);
    }

    private void show(RemoteMessage m, Map<String, String> d) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel("sp_alert") == null) {
            NotificationChannel ch = new NotificationChannel("sp_alert", "إشعارات متجر بلس", NotificationManager.IMPORTANCE_HIGH);
            nm.createNotificationChannel(ch);
        }
        String title = d.get("sp_title") == null ? "" : d.get("sp_title");
        String body = d.get("sp_body") == null ? "" : d.get("sp_body");
        String id = m.getMessageId() == null ? String.valueOf(System.currentTimeMillis()) : m.getMessageId();
        Intent i = new Intent(this, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        for (Map.Entry<String, String> e : d.entrySet()) i.putExtra(e.getKey(), e.getValue());
        i.putExtra("google.message_id", id);
        PendingIntent pi = PendingIntent.getActivity(this, (int) (System.currentTimeMillis() & 0x7fffffff), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, "sp_alert")
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setContentIntent(pi);
        nm.notify((int) (System.currentTimeMillis() & 0x7fffffff), b.build());
    }
}
