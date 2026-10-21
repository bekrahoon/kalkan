package kg.kalkancheck.guard;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

/** The big red "this is a scam" screen, used both as an overlay and inside WarningActivity. */
public final class Warning {
    private Warning() {}

    static final String SOS_STEPS =
            "1. Позвоните в банк по номеру на обороте карты и заблокируйте карту. Скажите, что это мошенничество.\n\n"
                    + "2. Если назвали код от Telegram или WhatsApp — Настройки → Устройства → «Завершить все другие сеансы».\n\n"
                    + "3. Больше ничего не переводите и не отвечайте мошенникам.\n\n"
                    + "4. Сохраните переписку и позвоните в милицию: 102.";

    static int dp(Context c, int v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, c.getResources().getDisplayMetrics()));
    }

    static TextView text(Context c, String s, int sp, boolean bold, int color) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setLineSpacing(0, 1.15f);
        return t;
    }

    static Button button(Context c, String s, int bg, int fg) {
        Button b = new Button(c);
        b.setText(s);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        b.setTextColor(fg);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable d = new GradientDrawable();
        d.setColor(bg);
        d.setCornerRadius(dp(c, 16));
        b.setBackground(d);
        b.setPadding(dp(c, 16), dp(c, 14), dp(c, 16), dp(c, 14));
        return b;
    }

    private static LinearLayout.LayoutParams fullWidth(Context c, int topDp) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(c, topDp);
        return lp;
    }

    /** Builds the warning. r = server answer for "check"; onClose hides the overlay or finishes the activity. */
    public static View build(final Context c, JSONObject r, String appLabel, final Runnable onClose) {
        // Content scrolls, buttons stay pinned at the bottom so they are always visible.
        final LinearLayout root = new LinearLayout(c);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#B71C1C"));
        root.setClickable(true);

        ScrollView scroll = new ScrollView(c);
        final LinearLayout box = new LinearLayout(c);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(c, 24), dp(c, 40), dp(c, 24), dp(c, 16));
        scroll.addView(box);
        root.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        final LinearLayout footer = new LinearLayout(c);
        footer.setOrientation(LinearLayout.VERTICAL);
        footer.setBackgroundColor(Color.parseColor("#8E1414"));
        footer.setPadding(dp(c, 16), dp(c, 10), dp(c, 16), dp(c, 28));
        root.addView(footer, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        boolean danger = "danger".equals(r.optString("verdict"));
        TextView head = text(c, danger ? "⚠️ ОСТОРОЖНО!\nЭТО МОШЕННИКИ" : "⚠️ БУДЬТЕ ОСТОРОЖНЫ", 34, true, Color.WHITE);
        box.addView(head);

        if (appLabel != null && !appLabel.isEmpty()) {
            box.addView(text(c, "Сообщение в " + appLabel, 18, false, Color.parseColor("#FFE0E0")), fullWidth(c, 8));
        }
        box.addView(text(c, r.optString("title"), 24, true, Color.WHITE), fullWidth(c, 20));
        box.addView(text(c, r.optString("summary"), 20, false, Color.WHITE), fullWidth(c, 10));

        JSONArray advice = r.optJSONArray("advice");
        if (advice != null && advice.length() > 0) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < advice.length(); i++) sb.append("• ").append(advice.optString(i)).append("\n");
            box.addView(text(c, sb.toString().trim(), 19, false, Color.WHITE), fullWidth(c, 16));
        }

        JSONArray warned = r.optJSONArray("warned");
        if (warned != null && warned.length() > 0) {
            box.addView(text(c, "👨‍👩‍👧 Мы уже предупредили: " + join(warned), 18, true, Color.parseColor("#FFF3B0")), fullWidth(c, 16));
        }

        Button ok = button(c, "Понятно, не буду ничего делать", Color.WHITE, Color.parseColor("#B71C1C"));
        ok.setOnClickListener(v -> onClose.run());
        footer.addView(ok, fullWidth(c, 0));

        final Button sos = button(c, "🆘 Я уже перевёл(а) деньги или назвал(а) код", Color.parseColor("#0F1B36"), Color.WHITE);
        sos.setOnClickListener(v -> {
            sos.setEnabled(false);
            sos.setText("Сообщаем близким…");
            sendSos(c, names -> {
                box.removeAllViews();
                footer.removeAllViews();
                box.addView(text(c, "🆘 Действуйте прямо сейчас", 30, true, Color.WHITE));
                box.addView(text(c, SOS_STEPS, 20, false, Color.WHITE), fullWidth(c, 16));
                box.addView(text(c, names.isEmpty()
                        ? "Добавьте доверенное лицо в приложении, чтобы в следующий раз мы сразу сообщили близким."
                        : "👨‍👩‍👧 Мы сообщили: " + names + ". Они скоро позвонят.", 19, true, Color.parseColor("#FFF3B0")), fullWidth(c, 16));
                Button close = button(c, "Закрыть", Color.WHITE, Color.parseColor("#B71C1C"));
                close.setOnClickListener(x -> onClose.run());
                footer.addView(close, fullWidth(c, 0));
            });
        });
        footer.addView(sos, fullWidth(c, 10));
        return root;
    }

    interface NamesCallback {
        void done(String names);
    }

    /** Alerts the trusted people from a background thread, then calls back on the main thread. */
    static void sendSos(final Context c, final NamesCallback cb) {
        final Handler main = new Handler(Looper.getMainLooper());
        new Thread(() -> {
            String names = "";
            try {
                JSONObject r = Api.action(c, "sos");
                JSONArray w = r.optJSONArray("warned");
                if (w != null) names = join(w);
            } catch (Exception ignored) {
                // no network: the steps are still shown
            }
            final String result = names;
            main.post(() -> cb.done(result));
        }).start();
    }

    static String join(JSONArray a) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < a.length(); i++) {
            if (i > 0) sb.append(", ");
            sb.append(a.optString(i));
        }
        return sb.toString();
    }

    static void center(TextView t) {
        t.setGravity(Gravity.CENTER_HORIZONTAL);
    }
}
