# CrayAI Mobile (Expo)

## Why login can fail on APK builds

For APK/AAB builds, `localhost` or LAN IPs do not work unless your phone can reach that network. The app must use a **public HTTPS API URL**.

This project reads backend URL from:

- `EXPO_PUBLIC_NETWORK_IP`

The axios client builds requests as:

- `${EXPO_PUBLIC_NETWORK_IP}/api/...`

So your value should look like:

- `https://crayai-node-api.onrender.com`

## EAS build profiles

`frontend_mobile/eas.json` is configured so both `preview` and `production` Android builds:

- produce an APK (`android.buildType = "apk"`)
- inject `EXPO_PUBLIC_NETWORK_IP=https://crayai-node-api.onrender.com`

## Commands

Run these from `frontend_mobile/`.

### 1) Login to Expo

```bash
npx eas login
```

### 2) Build APK (internal/preview)

```bash
npx eas build --platform android --profile preview
```

### 3) Build APK (production profile)

```bash
npx eas build --platform android --profile production
```

### 4) Download artifact

After build completes, open the provided URL and download the `.apk`.

## Google Sign-In in mobile

Google Sign-In now uses Expo public env vars (not hardcoded placeholders):

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Set these in one of the following:

1. EAS secrets/env (`eas env:create`) for cloud builds, or
2. local `.env` for development builds.

If client IDs are missing or incorrect for your package/signature, Google login may open but fail to authenticate.

## Recommended checks before releasing

1. Ensure Render backend CORS allows your mobile origin flow (or wildcard as appropriate).
2. Confirm `/api/auth/login` works from Postman against production URL.
3. Build/install APK and test:
   - email/password login
   - token persistence after app restart
   - Google sign-in callback

## Quick troubleshooting for "Could not connect to server"

1. In your EAS build profile, set `EXPO_PUBLIC_NETWORK_IP` to backend **origin only** (no trailing `/`, no `/api`), e.g.:
   - ✅ `https://crayai-node-api.onrender.com`
   - ❌ `http://localhost:5000`
   - ❌ `https://crayai-node-api.onrender.com/api`
2. Ensure backend is awake/reachable from phone network:
   - open `https://crayai-node-api.onrender.com/api/auth/login` in browser (expect non-200 is okay for GET; main check is reachable).
3. Rebuild APK after env changes (EAS embeds env at build time).
4. Check device date/time and internet access (SSL can fail on wrong clock).
5. Open Expo logs / Logcat and confirm startup log:
   - `[API] Using backend origin: ...`