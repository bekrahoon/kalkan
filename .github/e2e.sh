#!/usr/bin/env bash
# Runs inside the emulator job. Everything it finds goes to ./e2e
set -x
P=kg.kalkancheck.guard
mkdir -p e2e
shot() { adb exec-out screencap -p > "e2e/$1.png"; }
ui() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml "e2e/$1.xml" >/dev/null 2>&1; }
# tap the first node whose text/class contains $2 in dump $1
tap() {
  local xy
  xy=$(python3 - "$1" "$2" <<'EOF'
import re, sys, xml.etree.ElementTree as ET
root = ET.parse(sys.argv[1]).getroot()
for n in root.iter("node"):
    if sys.argv[2] in (n.get("text") or "") or sys.argv[2] == n.get("class"):
        a, b, c, d = map(int, re.findall(r"\d+", n.get("bounds")))
        print((a + c) // 2, (b + d) // 2); break
EOF
)
  echo "tap $2 -> $xy"
  [ -n "$xy" ] && adb shell input tap $xy
}

adb logcat -c
adb install -r app.apk 2>&1 | tee e2e/install.txt
adb shell pm grant $P android.permission.POST_NOTIFICATIONS
adb shell appops set $P SYSTEM_ALERT_WINDOW allow
adb shell cmd notification allow_listener $P/$P.GuardService

adb shell am start -W -n $P/.MainActivity
sleep 6; shot 01_first; ui 01_first
tap e2e/01_first.xml android.widget.EditText; sleep 1
adb shell input text "Babushka"; sleep 1
adb shell input keyevent 111   # hide keyboard
sleep 1; ui 01b
tap e2e/01b.xml "Продолжить"
sleep 15; shot 02_main; ui 02_main

adb shell input keyevent 3   # home: the scam arrives while another screen is open
sleep 2
adb shell "cmd notification post -S bigtext -t 'Bank Security' scam1 'Здравствуйте! Служба безопасности банка. Ваша карта заблокирована. Срочно перейдите по ссылке http://bit.ly/kart-unblock и назовите код из СМС'"

found=0
for i in $(seq 1 30); do
  sleep 3
  ui warn
  if grep -q "ОСТОРОЖНО\|БУДЬТЕ" e2e/warn.xml 2>/dev/null; then found=1; break; fi
done
shot 03_warning
echo "overlay_found=$found" | tee e2e/result.txt
adb shell dumpsys notification --noredact | grep -A3 "pkg=$P" | head -40 > e2e/our_notifications.txt
if [ $found = 1 ]; then
  sleep 6   # let the heads-up notification go away
  ui warn2
  tap e2e/warn2.xml "Понятно"; sleep 3; shot 04_after_ok; ui after_ok
  adb shell dumpsys window windows | grep -iE "kalkan|Window #" | head -30 > e2e/windows_after_ok.txt
  grep -q "ОСТОРОЖНО" e2e/after_ok.xml && echo "dismiss_ok=0" >> e2e/result.txt || echo "dismiss_ok=1" >> e2e/result.txt
fi
adb shell cmd statusbar expand-notifications; sleep 2; shot 03b_shade; adb shell cmd statusbar collapse; sleep 2

# a normal message must stay silent
adb shell "cmd notification post -S bigtext -t 'Мама' normal1 'Привет, ты когда придёшь домой? Купи хлеба по дороге'"
sleep 25; ui normal; shot 05_normal
grep -q "ОСТОРОЖНО\|БУДЬТЕ" e2e/normal.xml && echo "false_alarm=1" >> e2e/result.txt || echo "false_alarm=0" >> e2e/result.txt

# demo button inside the app
adb shell am start -W -n $P/.MainActivity; sleep 4
shot 05b_home; ui home
tap e2e/home.xml "Меню"; sleep 2; shot 05c_menu
ui demo
tap e2e/demo.xml "Показать, как"; sleep 3; shot 06_demo; ui demo_open
grep -q "пример" e2e/demo_open.xml && echo "demo_ok=1" >> e2e/result.txt || echo "demo_ok=0" >> e2e/result.txt
# SOS from the warning screen shows the help steps
tap e2e/demo_open.xml "SOS"; sleep 1
ui demo_open2; tap e2e/demo_open2.xml "Я уже"; sleep 8; shot 07_sos; ui sos
grep -q "Действуйте" e2e/sos.xml && echo "sos_ok=1" >> e2e/result.txt || echo "sos_ok=0" >> e2e/result.txt

adb logcat -d > e2e/logcat_full.txt
grep -E "FATAL|KalkanGuard|kalkancheck.guard.*(Exception|Error)|InputDispatcher" e2e/logcat_full.txt | tail -200 > e2e/logcat.txt
grep -q "FATAL EXCEPTION" e2e/logcat_full.txt && echo "crash=1" >> e2e/result.txt || echo "crash=0" >> e2e/result.txt
rm -f e2e/logcat_full.txt
cat e2e/result.txt
exit 0
