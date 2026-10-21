package kg.kalkancheck.guard;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import org.json.JSONObject;

/** Shows the red warning as a normal screen (from a notification, or when overlays are not allowed). */
public class WarningActivity extends Activity {
    static Intent intent(Context c, JSONObject r, String app) {
        Intent i = new Intent(c, WarningActivity.class);
        i.putExtra("r", r.toString());
        i.putExtra("app", app);
        return i;
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        if (android.os.Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        show(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        show(intent);
    }

    private void show(Intent i) {
        JSONObject r;
        try {
            r = new JSONObject(i.getStringExtra("r"));
        } catch (Exception e) {
            finish();
            return;
        }
        setContentView(Warning.build(this, r, i.getStringExtra("app"), this::finish));
    }
}
