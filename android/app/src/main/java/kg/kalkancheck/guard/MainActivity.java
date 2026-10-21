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
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * One activity, four simple screens (big fonts, one main action each):
 *  NAME  – first launch: "how should your family see you?"
 *  SETUP – permissions, one step at a time
 *  HOME  – status, trusted person, SOS
 *  MENU  – everything else (demo, rename, pause, battery tips, privacy)
 */
public class MainActivity extends Activity {
    private static final int BRAND = Color.parseColor("#1F5FD6");
    private static final int INK = Color.parseColor("#0F1B36");
    private static final int MUTED = Color.parseColor("#55607A");
    private static final int OK = Color.parseColor("#1B7F3B");
    private static final int OK_SOFT = Color.parseColor("#E3F4E8");
    private static final int BAD = Color.parseColor("#B71C1C");
    private static final int BAD_SOFT = Color.parseColor("#FBE4E4");
    private static final int BG = Color.parseColor("#F3F6FB");
    private static final int SOFT = Color.parseColor("#E8EEFA");

    private enum Screen { HOME, MENU, NAME }

    private final Handler main = new Handler(Looper.getMainLooper());
    private Screen screen = Screen.HOME;
    private LinearLayout box;
    private LinearLayout bottom;
    private TextView guardiansView;
    private Button inviteButton;
    /** The overlay step can be skipped: the notification still works without it. */
    private boolean overlaySkipped;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        GuardService.channels(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 1);
        }
        overlaySkipped = Api.prefs(this).getBoolean("overlaySkipped", false);
    }

    @Override
    protected void onResume() {
        super.onResume();
        show(screen == Screen.MENU ? Screen.MENU : Screen.HOME);
    }

    @Override
    public void onBackPressed() {
        if (screen != Screen.HOME && Api.registered(this)) {
            show(Screen.HOME);
        } else {
            super.onBackPressed();
        }
    }

    // ---------- building blocks ----------

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

    private GradientDrawable round(int color, int radiusDp) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radiusDp));
        return d;
    }

    private Button primary(String s) {
        return Warning.button(this, s, BRAND, Color.WHITE);
    }

    private Button secondary(String s) {
        return Warning.button(this, s, SOFT, INK);
    }

    /** Page skeleton: top bar, scrollable middle, optional pinned bottom area. */
    private void page(String title, boolean menuButton, boolean backButton) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setBackgroundColor(Color.WHITE);
        bar.setPadding(dp(12), dp(10), dp(12), dp(10));
        if (backButton) {
            Button back = Warning.button(this, "←", SOFT, INK);
            back.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
            back.setPadding(dp(14), dp(4), dp(14), dp(4));
            back.setContentDescription("Назад");
            back.setOnClickListener(v -> show(Screen.HOME));
            LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48));
            bp.rightMargin = dp(12);
            bar.addView(back, bp);
        }
        TextView tt = t(title, 22, true, INK);
        bar.addView(tt, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        if (menuButton) {
            Button menu = Warning.button(this, "☰  Меню", SOFT, INK);
            menu.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
            menu.setPadding(dp(16), dp(4), dp(16), dp(4));
            menu.setOnClickListener(v -> show(Screen.MENU));
            bar.addView(menu, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(48)));
        }
        root.addView(bar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        ScrollView scroll = new ScrollView(this);
        box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(20), dp(16), dp(20), dp(24));
        scroll.addView(box);
        root.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        bottom = new LinearLayout(this);
        bottom.setOrientation(LinearLayout.VERTICAL);
        bottom.setPadding(dp(20), dp(8), dp(20), dp(20));
        root.addView(bottom, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        setContentView(root);
        guardiansView = null;
        inviteButton = null;
    }

    // ---------- routing ----------

    private void show(Screen s) {
        screen = s;
        if (!Api.registered(this)) {
            renderName(true);
            return;
        }
        if (s == Screen.MENU) {
            renderMenu();
            return;
        }
        if (s == Screen.NAME) {
            renderName(false);
            return;
        }
        if (!GuardService.listenerEnabled(this)) {
            renderStep(1);
        } else if (!Settings.canDrawOverlays(this) && !overlaySkipped) {
            renderStep(2);
        } else {
            renderHome();
        }
    }

    // ---------- screens ----------

    private void renderName(boolean first) {
        screen = Screen.NAME;
        page(first ? "KalkanCheck Защитник" : "Ваше имя", false, !first);
        if (first) {
            box.addView(t("🛡️", 56, false, INK));
            box.addView(t("Защита от мошенников", 26, true, INK), lp(4));
            box.addView(t("Приложение само проверяет сообщения в WhatsApp, Telegram и СМС и предупреждает, если пишут мошенники.", 18, false, MUTED), lp(8));
        }
        box.addView(t("Как вас зовут?", 22, true, INK), lp(first ? 28 : 8));
        box.addView(t("Это имя увидят близкие, например: «Бабушка Айгуль».", 17, false, MUTED), lp(4));
        final EditText name = new EditText(this);
        name.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        name.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_WORDS);
        name.setHint("Имя");
        name.setText(Api.name(this));
        name.setBackground(round(Color.WHITE, 14));
        name.setPadding(dp(16), dp(14), dp(16), dp(14));
        box.addView(name, lp(12));

        final Button save = primary(first ? "Продолжить" : "Сохранить");
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
                        show(Screen.HOME);
                    }
                });
            }).start();
        });
        bottom.addView(save, lp(0));
    }

    /** Permission steps: one big instruction and one big button. */
    private void renderStep(int step) {
        screen = Screen.HOME;
        page("Настройка", false, false);
        box.addView(t("Шаг " + step + " из 2", 17, true, BRAND));
        if (step == 1) {
            box.addView(t("Разрешите читать уведомления", 26, true, INK), lp(6));
            box.addView(t("Так приложение увидит новое сообщение и проверит его. Переписку мы не храним.", 18, false, MUTED), lp(10));
            box.addView(hint("Что нажать:\n1. Нажмите синюю кнопку внизу.\n2. Найдите «KalkanCheck Защитник».\n3. Включите переключатель и нажмите «Разрешить».\n4. Вернитесь назад."), lp(18));
            if (Build.VERSION.SDK_INT >= 33) {
                final TextView more = t("Переключатель серый и не нажимается?", 17, true, BRAND);
                more.setPadding(0, dp(12), 0, dp(12));
                more.setOnClickListener(v -> {
                    more.setOnClickListener(null);
                    more.setText("Переключатель серый — так бывает с приложениями не из Google Play:");
                    more.setTextColor(INK);
                    TextView how = hint("1. Нажмите «Открыть настройки приложения».\n2. Вверху справа нажмите ⋮ (три точки).\n3. Выберите «Разрешить ограниченные настройки».\n4. Вернитесь сюда и снова нажмите синюю кнопку.");
                    box.addView(how, lp(4));
                    Button app = secondary("Открыть настройки приложения");
                    app.setOnClickListener(x -> openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
                    box.addView(app, lp(10));
                });
                box.addView(more, lp(12));
            }
            Button go = primary("Открыть настройки");
            go.setOnClickListener(v -> openSettings(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS, null));
            bottom.addView(go, lp(0));
        } else {
            box.addView(t("Разрешите показ поверх окон", 26, true, INK), lp(6));
            box.addView(t("Тогда красное предупреждение появится сразу, прямо поверх WhatsApp или Telegram.", 18, false, MUTED), lp(10));
            box.addView(hint("Что нажать:\n1. Нажмите синюю кнопку внизу.\n2. Включите «Разрешить показ поверх других приложений».\n3. Вернитесь назад."), lp(18));
            Button go = primary("Разрешить");
            go.setOnClickListener(v -> openSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName())));
            bottom.addView(go, lp(0));
            Button skip = Warning.button(this, "Пропустить", Color.TRANSPARENT, MUTED);
            skip.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
            skip.setOnClickListener(v -> {
                overlaySkipped = true;
                Api.prefs(this).edit().putBoolean("overlaySkipped", true).apply();
                show(Screen.HOME);
            });
            bottom.addView(skip, lp(4));
        }
    }

    private TextView hint(String s) {
        TextView h = t(s, 18, false, INK);
        h.setBackground(round(Color.WHITE, 16));
        h.setPadding(dp(16), dp(14), dp(16), dp(14));
        h.setLineSpacing(dp(4), 1f);
        return h;
    }

    private void renderHome() {
        screen = Screen.HOME;
        page("KalkanCheck", true, false);
        boolean on = Api.prefs(this).getBoolean("enabled", true);

        // big status
        LinearLayout status = new LinearLayout(this);
        status.setOrientation(LinearLayout.VERTICAL);
        status.setGravity(Gravity.CENTER_HORIZONTAL);
        status.setPadding(dp(18), dp(18), dp(18), dp(20));
        status.setBackground(round(on ? OK_SOFT : BAD_SOFT, 24));
        TextView icon = t(on ? "🛡️" : "⏸️", 52, false, INK);
        icon.setGravity(Gravity.CENTER);
        status.addView(icon);
        TextView head = t(on ? "Вы под защитой" : "Проверка на паузе", 28, true, on ? OK : BAD);
        head.setGravity(Gravity.CENTER);
        status.addView(head, lp(6));
        TextView sub = t(on
                ? "Если напишут мошенники, на экране появится красное предупреждение."
                : "Сообщения сейчас не проверяются.", 18, false, INK);
        sub.setGravity(Gravity.CENTER);
        status.addView(sub, lp(6));
        if (!on) {
            Button resume = Warning.button(this, "Включить защиту", OK, Color.WHITE);
            resume.setOnClickListener(v -> {
                Api.prefs(this).edit().putBoolean("enabled", true).apply();
                show(Screen.HOME);
            });
            status.addView(resume, lp(14));
        }
        box.addView(status);

        // trusted person
        LinearLayout fam = new LinearLayout(this);
        fam.setOrientation(LinearLayout.VERTICAL);
        fam.setBackground(round(Color.WHITE, 20));
        fam.setPadding(dp(18), dp(16), dp(18), dp(16));
        fam.addView(t("👨‍👩‍👧 Близкие", 20, true, INK));
        guardiansView = t("Загружаем…", 18, false, MUTED);
        fam.addView(guardiansView, lp(4));
        inviteButton = primary("Подключить близкого");
        inviteButton.setOnClickListener(v -> shareInvite());
        inviteButton.setVisibility(View.GONE);
        fam.addView(inviteButton, lp(12));
        box.addView(fam, lp(14));
        loadStatus();

        // SOS always at the bottom, always visible
        Button sos = Warning.button(this, "🆘 Меня обманули", BAD, Color.WHITE);
        sos.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        sos.setMinHeight(dp(64));
        sos.setOnClickListener(v -> confirmSos());
        bottom.addView(sos, lp(0));
        TextView sosHint = t("Нажмите, если уже перевели деньги или назвали код", 15, false, MUTED);
        sosHint.setGravity(Gravity.CENTER);
        bottom.addView(sosHint, lp(6));
    }

    private void renderMenu() {
        screen = Screen.MENU;
        page("Меню", false, true);
        final boolean on = Api.prefs(this).getBoolean("enabled", true);
        menuItem("👁️", "Показать, как выглядит предупреждение", "Пример красного экрана", v -> demo());
        menuItem("👨‍👩‍👧", "Подключить ещё одного близкого", "Отправить ссылку в Telegram", v -> shareInvite());
        menuItem("✏️", "Изменить имя", "Сейчас: " + Api.name(this), v -> show(Screen.NAME));
        menuItem(on ? "⏸️" : "▶️", on ? "Поставить проверку на паузу" : "Включить проверку", on ? "Например, на время" : "Сейчас проверка выключена", v -> {
            Api.prefs(this).edit().putBoolean("enabled", !on).apply();
            Toast.makeText(this, on ? "Проверка на паузе" : "Защита включена", Toast.LENGTH_SHORT).show();
            show(Screen.HOME);
        });
        menuItem("🔋", "Телефон отключает защиту?", "Xiaomi, Redmi, Huawei, Samsung", v -> new AlertDialog.Builder(this)
                .setTitle("Чтобы защита не отключалась")
                .setMessage("Откройте настройки приложения и:\n\n• разрешите «Автозапуск»;\n• в разделе «Батарея» выберите «Нет ограничений».\n\nНа Xiaomi: Безопасность → Автозапуск.")
                .setPositiveButton("Открыть настройки", (d, w) -> openSettings(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())))
                .setNegativeButton("Закрыть", null)
                .show());
        if (!Settings.canDrawOverlays(this)) {
            menuItem("🪟", "Показ поверх окон", "Чтобы предупреждение появлялось сразу", v -> openSettings(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getPackageName())));
        }
        menuItem("🔒", "Приватность", "Что мы отправляем на проверку", v -> new AlertDialog.Builder(this)
                .setTitle("Приватность")
                .setMessage("На проверку уходит только текст подозрительных сообщений — со ссылками или словами про деньги, коды, банк. Переписку мы не храним и никому не передаём.")
                .setPositiveButton("Понятно", null)
                .show());
        menuItem("🌐", "Сайт KalkanCheck", "Проверить ссылку или скриншот вручную", v -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(Api.BASE))));
    }

    private void menuItem(String emoji, String title, String sub, View.OnClickListener click) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setBackground(round(Color.WHITE, 18));
        row.setPadding(dp(16), dp(14), dp(16), dp(14));
        row.setClickable(true);
        row.setFocusable(true);
        row.setOnClickListener(click);
        TextView ic = t(emoji, 26, false, INK);
        LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(dp(44), ViewGroup.LayoutParams.WRAP_CONTENT);
        ip.rightMargin = dp(10);
        row.addView(ic, ip);
        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.addView(t(title, 19, true, INK));
        col.addView(t(sub, 15, false, MUTED));
        row.addView(col, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        row.addView(t("›", 28, false, MUTED));
        box.addView(row, lp(box.getChildCount() == 0 ? 0 : 10));
    }

    // ---------- actions ----------

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
            boolean none;
            try {
                JSONObject r = Api.action(this, "status");
                JSONArray g = r.optJSONArray("guardians");
                none = g == null || g.length() == 0;
                s = none ? "Пока никто не подключён. Сын, дочь или внук будут получать сообщение, если вам напишут мошенники." : "Получат сообщение, если что-то случится: " + Warning.join(g);
            } catch (Exception e) {
                none = false;
                s = "Нет связи с сервером";
            }
            final String fs = s;
            final boolean fnone = none;
            main.post(() -> {
                if (guardiansView != null) guardiansView.setText(fs);
                if (inviteButton != null) inviteButton.setVisibility(fnone ? View.VISIBLE : View.GONE);
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
                .setMessage("Мы сразу напишем вашим близким и покажем, что делать.")
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
