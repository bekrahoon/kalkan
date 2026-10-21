package kg.kalkancheck.guard;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/** Talks to the KalkanCheck server (/api/device). All calls are blocking: run them off the main thread. */
public final class Api {
    public static final String BASE = "https://kalkan-sigma.vercel.app";
    private static final String PREFS = "kalkan";

    private Api() {}

    public static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static boolean registered(Context c) {
        return prefs(c).getString("id", null) != null;
    }

    public static String name(Context c) {
        return prefs(c).getString("name", "");
    }

    /** Registers this phone (first time) or renames it. */
    public static void saveName(Context c, String name) throws IOException, JSONException {
        JSONObject body = new JSONObject();
        body.put("name", name);
        body.put("lang", "ru");
        if (registered(c)) {
            body.put("action", "rename");
            JSONObject r = authed(c, body);
            if (!r.optBoolean("ok")) throw new IOException(r.optString("error", "error"));
        } else {
            body.put("action", "register");
            JSONObject r = post(body);
            if (!r.optBoolean("ok")) throw new IOException(r.optString("error", "error"));
            prefs(c).edit().putString("id", r.getString("id")).putString("secret", r.getString("secret")).apply();
        }
        prefs(c).edit().putString("name", name).apply();
    }

    /** Adds id + secret and posts. */
    public static JSONObject authed(Context c, JSONObject body) throws IOException, JSONException {
        SharedPreferences p = prefs(c);
        body.put("id", p.getString("id", ""));
        body.put("secret", p.getString("secret", ""));
        body.put("lang", "ru");
        return post(body);
    }

    public static JSONObject action(Context c, String action) throws IOException, JSONException {
        JSONObject body = new JSONObject();
        body.put("action", action);
        return authed(c, body);
    }

    public static JSONObject check(Context c, String text, String app) throws IOException, JSONException {
        JSONObject body = new JSONObject();
        body.put("action", "check");
        body.put("text", text);
        body.put("app", app);
        return authed(c, body);
    }

    private static JSONObject post(JSONObject body) throws IOException, JSONException {
        HttpURLConnection con = (HttpURLConnection) new URL(BASE + "/api/device").openConnection();
        try {
            con.setRequestMethod("POST");
            con.setConnectTimeout(15000);
            con.setReadTimeout(60000);
            con.setDoOutput(true);
            con.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            byte[] out = body.toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = con.getOutputStream()) {
                os.write(out);
            }
            int code = con.getResponseCode();
            InputStream in = code >= 400 ? con.getErrorStream() : con.getInputStream();
            if (in == null) throw new IOException("HTTP " + code);
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            byte[] chunk = new byte[4096];
            int n;
            while ((n = in.read(chunk)) > 0) buf.write(chunk, 0, n);
            in.close();
            return new JSONObject(new String(buf.toByteArray(), StandardCharsets.UTF_8));
        } finally {
            con.disconnect();
        }
    }
}
