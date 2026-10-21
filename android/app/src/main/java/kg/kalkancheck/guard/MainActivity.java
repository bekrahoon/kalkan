package kg.kalkancheck.guard;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.text.InputType;
import android.util.TypedValue;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

/** Setup screen: name, permissions, trusted person, SOS and a demo. Big fonts for older people. */
public class MainActivity extends Activity {
    private static final int BRAND = Color.parseColor("#1F5FD6");
    private static final int INK = Color.parseColor("#0F1B36");
    private static final int OK = Color.parseColor("#1B7F3B");
    private static final int BAD = Color.parseColor("#B71C1C");

    private final Handler main = new Handler(Looper.getMainLooper());
    private LinearLayout box;
    private TextView guardiansView;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        GuardService.channels(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        render();
    }

    private int dp(int v) {
        return Warning.dp(this, v);
    }

    private LinearLayout.LayoutParams lp(int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        p.topMargin = dp(top);
        return p;
    }

    private TextView t(String s, int sp, boolean bold, int color) {
        return Warning.text(this, s, sp, bold, color);
    }

    private LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(18), dp(16), dp(18), dp(18));
        GradientDrawable d = new GradientDrawable();
        d.setColor(Color.WHITE);
        d.setCornerRadius(dp(18));
        d.setStroke(dp(1), Color.parseColor("#DCE3F0"));
        c.setBackground(d);
        box.addView(c, lp(14));
        return c;
    }

    private void render() {
        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(Color.parseColor("#F3F6FB"));
        box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(18), dp(28), dp(18), dp(36));
        scroll.addView(box);
        setContentView(scroll);

        box.addView(t("🛡️ KalkanCheck Защитник", 28, true, INK));
        box.addView(t("Сам проверяет сообщения в WhatsApp, Telegram и СМС. Если пишут мошенники — покажет красное предупреждение и сообщит близким.", 18, false, Color.parseColor("#3A4660")), lp(8));

        if (!Api.registered(this)) {
            renderName(true);
            return;
        }

        boolean listener = GuardService.listenerEnabled(this);
        boolean overlay = Settings.canDrawOverlays(this);
        boolean on = listener && Api.prefs(this).getBoolean("enabled", true);

        // status
        LinearLayout st = card();
        st.addView(t(on ? "✅ Защита включена" : "⛔ Защита выключена", 24, true, on ? OK : BAD));
        st.addView(t("Телефон: " + Api.name(this), 17, false, Color.GRAY), lp(4));
        if (listener) {
            Switch sw = new Switch(this);
            sw.setText("Проверять сообщения");
            sw.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
            sw.setChecked(Api.prefs(this).getBoolean("enabled", true));
            sw.setOnCheckedChangeListener((v, checked) -> {
                Api.prefs(this).edit().putBoolean("enabled", checked).apply();
                render();
            });
            st.addView(sw, lp(10));
        }

        // step 1: notifications
        LinearLayout s1 = card();
        s1.addView(t((listener ? "✅ " : "1️⃣ ") + "Доступ к уведомлениям", 20, true, INK));
        s1.addView(t(listener
                ? "Готово. Приложение видит новые сообщения и проверяет только подозрительные."
                : "Нужен, чтобы видеть новые сообщения. В списке найдите «KalkanCheck Защитник» и включите.", 17, false, Color.DKGRAY), lp(6));
        if (!listener) {
            Button b1 = Warning.button(this, "Открыть настройки", BRAND, Color.WHITE);
            b1.setOnClickListener(v -> openSettings(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS, null));
            s1.addView(b1, lp(12));
            if (Build.VERSION.SDK_INT >= 33) {
                s1.addView(t("Если переключатель серый: Настройки → Приложения → KalkanCheck Защитник → ⋮ (вверху справа) → «Разрешить ограниченные настройки». Потом снова нажмите кнопку выше.", 15, false, Color.parseColor("#8A5A00")), lp(10));
                Button bi = Warning.button(this, "О приложении (ограниченные настройки)", Color.parseColor("#EEF2FA"), INK);
                bi.setOnClickListener(v -> openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
                s1.addView(bi, lp(8));
            }
        }

        // step 2: overlay
        LinearLayout s2 = card();
        s2.addView(t((overlay ? "✅ " : "2️⃣ ") + "Показ поверх других окон", 20, true, INK));
        s2.addView(t(overlay
                ? "Готово. Красное предупреждение появится прямо поверх WhatsApp."
                : "Чтобы красное предупреждение появлялось сразу поверх WhatsApp или Telegram.", 17, false, Color.DKGRAY), lp(6));
        if (!overlay) {
            Button b2 = Warning.button(this, "Разрешить", BRAND, Color.WHITE);
            b2.setOnClickListener(v -> openSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName())));
            s2.addView(b2, lp(12));
        }

        // trusted people
        LinearLayout s3 = card();
        s3.addView(t("👨‍👩‍👧 Доверенное лицо", 20, true, INK));
        s3.addView(t("Сын, дочь или внук получит сообщение в Telegram, если вам напишут мошенники или вы нажмёте SOS.", 17, false, Color.DKGRAY), lp(6));
        guardiansView = t("Загружаем…", 17, true, INK);
        s3.addView(guardiansView, lp(10));
        Button b3 = Warning.button(this, "Подключить близкого", BRAND, Color.WHITE);
        b3.setOnClickListener(v -> shareInvite());
        s3.addView(b3, lp(12));
        loadStatus();

        // SOS
        Button sos = Warning.button(this, "🆘 Я перевёл(а) деньги или назвал(а) код", BAD, Color.WHITE);
        sos.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        sos.setOnClickListener(v -> confirmSos());
        box.addView(sos, lp(20));

        // demo
        Button demo = Warning.button(this, "Показать, как выглядит предупреждение", Color.parseColor("#EEF2FA"), INK);
        demo.setOnClickListener(v -> demo());
        box.addView(demo, lp(12));

        Button rename = Warning.button(this, "Изменить имя", Color.parseColor("#EEF2FA"), INK);
        rename.setOnClickListener(v -> renderName(false));
        box.addView(rename, lp(10));

        box.addView(t("Для Xiaomi, Redmi, Huawei: в настройках приложения разрешите «Автозапуск» и снимите ограничения батареи, иначе телефон может отключить защиту.", 15, false, Color.GRAY), lp(18));
        box.addView(t("Мы отправляем на проверку только текст подозрительных сообщений (со ссылками или словами про деньги, коды, банк). Не храним переписку.", 14, false, Color.GRAY), lp(10));
    }

    private void renderName(boolean first) {
        if (!first) {
            box.removeAllViews();
            box.addView(t("Изменить имя", 26, true, INK));
        }
        LinearLayout c = card();
        c.addView(t("Как вас зовут?", 22, true, INK));
        c.addView(t("Это имя увидят близкие в сообщении, например: «Бабушка Айгуль».", 17, false, Color.DKGRAY), lp(6));
        final EditText name = new EditText(this);
        name.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        name.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        name.setHint("Имя");
        name.setText(Api.name(this));
        c.addView(name, lp(10));
        final Button save = Warning.button(this, first ? "Продолжить" : "Сохранить", BRAND, Color.WHITE);
        save.setOnClickListener(v -> {
            final String n = name.getText().toString().trim();
            if (n.isEmpty()) {
                name.setError("Введите имя");
                return;
            }
            save.setEnabled(false);
            save.setText("Подождите…");
            new Thread(() -> {
                String err = null;
                try {
                    Api.saveName(this, n);
                } catch (Exception e) {
                    err = "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.";
                }
                final String fe = err;
                main.post(() -> {
                    if (fe != null) {
                        Toast.makeText(this, fe, Toast.LENGTH_LONG).show();
                        save.setEnabled(true);
                        save.setText(first ? "Продолжить" : "Сохранить");
                    } else {
                        render();
                    }
                });
            }).start();
        });
        c.addView(save, lp(14));
        if (!first) {
            Button back = Warning.button(this, "Назад", Color.parseColor("#EEF2FA"), INK);
            back.setOnClickListener(v -> render());
            c.addView(back, lp(8));
        }
    }

    private void openSettings(String action, Uri data) {
        try {
            Intent i = new Intent(action);
            if (data != null) i.setData(data);
            startActivity(i);
        } catch (Exception e) {
            startActivity(new Intent(Settings.ACTION_SETTINGS));
        }
    }

    private void loadStatus() {
        new Thread(() -> {
            String s;
            try {
                JSONObject r = Api.action(this, "status");
                JSONArray g = r.optJSONArray("guardians");
                s = g == null || g.length() == 0 ? "Пока никого нет" : "Подключены: " + Warning.join(g);
            } catch (Exception e) {
                s = "Нет связи с сервером";
            }
            final String fs = s;
            main.post(() -> {
                if (guardiansView != null) guardiansView.setText(fs);
            });
        }).start();
    }

    private void shareInvite() {
        Toast.makeText(this, "Готовим ссылку…", Toast.LENGTH_SHORT).show();
        new Thread(() -> {
            try {
                JSONObject r = Api.action(this, "link");
                final String text = r.optString("text", r.optString("link"));
                main.post(() -> {
                    Intent send = new Intent(Intent.ACTION_SEND);
                    send.setType("text/plain");
                    send.putExtra(Intent.EXTRA_TEXT, text);
                    startActivity(Intent.createChooser(send, "Отправить близкому"));
                });
            } catch (Exception e) {
                main.post(() -> Toast.makeText(this, "Нет связи с сервером", Toast.LENGTH_LONG).show());
            }
        }).start();
    }

    private void confirmSos() {
        new AlertDialog.Builder(this)
                .setTitle("Сообщить близким?")
                .setMessage("Мы сразу напишем вашим доверенным лицам и покажем, что делать.")
                .setPositiveButton("Да, сообщить", (d, w) -> Warning.sendSos(this, names -> {
                    JSONObject r = new JSONObject();
                    try {
                        r.put("verdict", "danger");
                        r.put("title", "Что делать прямо сейчас");
                        r.put("summary", Warning.SOS_STEPS);
                        if (!names.isEmpty()) r.put("warned", new JSONArray().put(names));
                    } catch (Exception ignored) {
                    }
                    startActivity(WarningActivity.intent(this, r, null));
                }))
                .setNegativeButton("Отмена", null)
                .show();
    }

    private void demo() {
        JSONObject r = new JSONObject();
        try {
            r.put("verdict", "danger");
            r.put("title", "Это пример предупреждения");
            r.put("summary", "Так будет выглядеть экран, если вам напишут, например: «Ваша карта заблокирована, назовите код из СМС».");
            r.put("advice", new JSONArray()
                    .put("Не переходите по ссылке и не называйте коды")
                    .put("Позвоните в банк сами по номеру на карте")
                    .put("Спросите совета у близких"));
        } catch (Exception ignored) {
        }
        startActivity(WarningActivity.intent(this, r, "WhatsApp (пример)"));
    }
}
