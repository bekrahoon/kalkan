package kg.kalkancheck.guard;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Parcelable;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.view.View;
import android.view.WindowManager;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/**
 * Reads incoming notifications (WhatsApp, Telegram, SMS…), sends suspicious-looking ones to KalkanCheck
 * and shows a big red warning when the server says it is a scam.
 */
public class GuardService extends NotificationListenerService {
    static final String CHANNEL_ALERT = "kalkan_alert";
    static final String CHANNEL_INFO = "kalkan_info";

    private static final Pattern URL = Pattern.compile("(https?://|www\\.|\\b[a-z0-9-]+\\.(ru|kg|com|net|org|xyz|top|site|online|info|me|io|cc|link|click)\\b)", Pattern.CASE_INSENSITIVE);
    private static final Pattern KEYWORDS = Pattern.compile(
            "банк|карт|код|смс|sms|перевед|перевод|переведи|скинь|выигр|приз|подар|голос|штраф|милиц|мвд|полиц|инвест|доход|заработ|займ|кредит|счет|счёт|блокир|безопасн|пароль|срочно|выплат|компенсац|акци|bank|card|code|password|prize|invest|loan|urgent|"
                    + "банк|карта|акча|утуш|сыйлык|которуп|тез",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final long DEDUP_MS = 60 * 60 * 1000L;
    private final Map<Integer, Long> seen = new HashMap<>();
    private final ExecutorService pool = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private View overlay;

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            handle(sbn);
        } catch (Exception ignored) {
            // never crash the listener
        }
    }

    private void handle(StatusBarNotification sbn) {
        if (sbn == null || getPackageName().equals(sbn.getPackageName())) return;
        if (!Api.registered(this) || !Api.prefs(this).getBoolean("enabled", true)) return;
        Notification n = sbn.getNotification();
        if (n == null || sbn.isOngoing()) return;
        if ((n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        String cat = n.category;
        if (Notification.CATEGORY_CALL.equals(cat) || Notification.CATEGORY_PROGRESS.equals(cat)
                || Notification.CATEGORY_TRANSPORT.equals(cat) || Notification.CATEGORY_SERVICE.equals(cat)) return;

        String text = extract(n.extras);
        if (text.length() < 15) return;
        if (!URL.matcher(text).find() && !KEYWORDS.matcher(text).find()) return;

        int key = text.hashCode();
        long now = System.currentTimeMillis();
        synchronized (seen) {
            Iterator<Map.Entry<Integer, Long>> it = seen.entrySet().iterator();
            while (it.hasNext()) if (now - it.next().getValue() > DEDUP_MS) it.remove();
            if (seen.containsKey(key)) return;
            seen.put(key, now);
        }

        final String app = appLabel(sbn.getPackageName());
        final String body = text.length() > 3000 ? text.substring(0, 3000) : text;
        pool.execute(() -> {
            try {
                JSONObject r = Api.check(this, body, app);
                if (!r.optBoolean("ok")) return;
                String verdict = r.optString("verdict");
                if ("danger".equals(verdict)) {
                    main.post(() -> warn(r, app));
                } else if ("suspicious".equals(verdict)) {
                    notifyResult(r, app, false);
                }
            } catch (Exception ignored) {
                // offline or server busy: skip silently
            }
        });
    }

    /** Title + text of the notification, including the last messages of a chat. */
    static String extract(Bundle e) {
        if (e == null) return "";
        StringBuilder sb = new StringBuilder();
        CharSequence title = e.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence big = e.getCharSequence(Notification.EXTRA_BIG_TEXT);
        CharSequence txt = e.getCharSequence(Notification.EXTRA_TEXT);
        if (title != null) sb.append(title).append(": ");

        Parcelable[] msgs = e.getParcelableArray(Notification.EXTRA_MESSAGES);
        if (msgs != null && msgs.length > 0) {
            // only the newest message: older ones were already checked when they arrived
            Parcelable last = msgs[msgs.length - 1];
            if (last instanceof Bundle) {
                CharSequence m = ((Bundle) last).getCharSequence("text");
                if (m != null) sb.append(m);
            }
        } else if (big != null && big.length() > 0) {
            sb.append(big);
        } else {
            CharSequence[] lines = e.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
            if (lines != null && lines.length > 0) {
                for (CharSequence l : lines) sb.append(l).append("\n");
            } else if (txt != null) {
                sb.append(txt);
            }
        }
        return sb.toString().trim();
    }

    private String appLabel(String pkg) {
        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
            return pm.getApplicationLabel(ai).toString();
        } catch (Exception e) {
            return pkg;
        }
    }

    /** Red full-screen warning + vibration + a notification that reopens it. */
    void warn(JSONObject r, String app) {
        vibrate(this);
        notifyResult(r, app, true);
        if (Settings.canDrawOverlays(this)) {
            showOverlay(r, app);
        } else {
            Intent i = WarningActivity.intent(this, r, app);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                startActivity(i); // may be blocked from background; the notification is the fallback
            } catch (Exception ignored) {
            }
        }
    }

    private void showOverlay(JSONObject r, String app) {
        final WindowManager wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        hideOverlay();
        View v = Warning.build(this, r, app, this::hideOverlay);
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED,
                PixelFormat.TRANSLUCENT);
        try {
            wm.addView(v, lp);
            overlay = v;
        } catch (Exception e) {
            Intent i = WarningActivity.intent(this, r, app);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                startActivity(i);
            } catch (Exception ignored) {
            }
        }
    }

    private void hideOverlay() {
        if (overlay == null) return;
        try {
            ((WindowManager) getSystemService(WINDOW_SERVICE)).removeView(overlay);
        } catch (Exception ignored) {
        }
        overlay = null;
    }

    static void vibrate(Context c) {
        try {
            Vibrator vib = (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
            if (vib != null && vib.hasVibrator()) {
                vib.vibrate(VibrationEffect.createWaveform(new long[]{0, 500, 200, 500, 200, 800}, -1));
            }
        } catch (Exception ignored) {
        }
    }

    static void channels(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationChannel alert = new NotificationChannel(CHANNEL_ALERT, "Опасные сообщения", NotificationManager.IMPORTANCE_HIGH);
        alert.setDescription("Когда KalkanCheck находит мошенничество");
        alert.enableVibration(true);
        nm.createNotificationChannel(alert);
        NotificationChannel info = new NotificationChannel(CHANNEL_INFO, "Подозрительные сообщения", NotificationManager.IMPORTANCE_DEFAULT);
        nm.createNotificationChannel(info);
    }

    void notifyResult(JSONObject r, String app, boolean danger) {
        Context c = this;
        channels(c);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Intent open = WarningActivity.intent(c, r, app);
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        int id = (int) (System.currentTimeMillis() & 0x7fffffff);
        PendingIntent pi = PendingIntent.getActivity(c, id, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        String title = (danger ? "⚠️ Мошенники! " : "⚠️ Осторожно: ") + r.optString("title");
        Notification.Builder b = new Notification.Builder(c, danger ? CHANNEL_ALERT : CHANNEL_INFO)
                .setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(title)
                .setContentText(r.optString("summary"))
                .setStyle(new Notification.BigTextStyle().bigText(r.optString("summary")))
                .setSubText(app)
                .setContentIntent(pi)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_ALARM);
        if (danger) b.setColor(0xFFB71C1C);
        try {
            nm.notify(id, b.build());
        } catch (Exception ignored) {
            // POST_NOTIFICATIONS not granted
        }
    }

    @Override
    public void onDestroy() {
        hideOverlay();
        pool.shutdownNow();
        super.onDestroy();
    }

    /** Is notification access switched on for this app? */
    static boolean listenerEnabled(Context c) {
        String flat = Settings.Secure.getString(c.getContentResolver(), "enabled_notification_listeners");
        return flat != null && flat.toLowerCase(Locale.ROOT).contains(c.getPackageName().toLowerCase(Locale.ROOT));
    }

    static boolean isAtLeast13() {
        return Build.VERSION.SDK_INT >= 33;
    }
}
