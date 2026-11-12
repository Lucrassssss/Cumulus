# Cumulus — iOS & Android beta apps

Native shells built with [Capacitor](https://capacitorjs.com). Each app opens
**https://cumulusapp.co** full-screen, so:

- every Vercel deploy reaches testers instantly — no app rebuild needed;
- sign-in (6-digit email code), Stripe, PayPal, Mapbox and Supabase work
  exactly as on the web;
- you only rebuild the app to change the native side: the icon, splash screen,
  permissions or version.

If the phone is offline, the app shows a small "You're offline / Try again"
screen (`www/index.html`).

| | |
|---|---|
| Bundle / application ID | `co.cumulusapp.app` |
| Devices | iPhone (portrait), Android phones (portrait) |
| Permissions | Location (Near me), Camera (hosts scanning tickets) |
| Builds | GitHub Actions: `Android beta`, `iOS TestFlight` |

The live URL is set in `capacitor.config.json` (`server.url`). To point a
build at a preview deploy, change it there and re-run the workflow.

---

## Android: one-off setup (about 5 minutes)

**Quickest option: sideload the APK.** You don't need any accounts for this.

1. Push to `main` (any change under `native/`), or open GitHub → **Actions →
   Android beta → Run workflow**.
2. Open the finished run and download the **cumulus-android-N** artifact.
   Unzip it to get `cumulus-beta.apk`.
3. Send the APK to testers. On the phone, open it and allow "Install unknown
   apps" when asked.

**Option: Google Play internal testing.** This gives testers auto-updates and
up to 100 people. It needs a Play Console account (a one-off $25).

1. Create a release keystore. Keep it safe: you can't replace it once the app
   is on Play.

   ```bash
   keytool -genkey -v -keystore cumulus-release.jks -alias cumulus -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Add these repository secrets in GitHub → Settings → Secrets and variables →
   Actions:
   - `ANDROID_KEYSTORE_BASE64`: the output of `base64 -i cumulus-release.jks`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`: `cumulus`
   - `ANDROID_KEY_PASSWORD`
3. Run **Android beta** again. The artifact now also contains
   `cumulus-release.aab`.
4. In Play Console, create the app `co.cumulusapp.app`. Go to **Testing →
   Internal testing**, upload the `.aab` and add testers' emails.

## iOS: TestFlight setup (about 20 minutes, no Mac needed)

You need an **Apple Developer Program** membership ($99/yr).

1. **Register the bundle ID.** Go to
   [developer.apple.com](https://developer.apple.com) → Certificates, IDs &
   Profiles → Identifiers → **+** → App IDs. Use the bundle ID
   `co.cumulusapp.app` and the name Cumulus.
2. **Create the app.** In [App Store Connect](https://appstoreconnect.apple.com)
   → Apps → **+** → New App, choose iOS, name it Cumulus, pick that bundle ID
   and use SKU `cumulus`.
3. **Create an API key.** Go to App Store Connect → Users and Access →
   Integrations → **App Store Connect API** → **+**.
   - Give the key the **Admin** role. Admin is needed so the build can create
     its own signing certificate.
   - Download the `.p8` file. You can only download it once.
   - Note the **Key ID** and the **Issuer ID**.
4. **Find your Team ID.** It's in developer.apple.com → Membership details.
5. **Add GitHub repository secrets:**
   - `APPSTORE_KEY_ID`
   - `APPSTORE_ISSUER_ID`
   - `APPSTORE_API_PRIVATE_KEY`: paste the whole `.p8` file, including the
     BEGIN/END lines
   - `APPLE_TEAM_ID`
6. **Run the build.** Go to GitHub → **Actions → iOS TestFlight → Run
   workflow**. It takes about 10–15 minutes and uploads straight to TestFlight.
   Apple then processes the build for another 5–30 minutes.
7. **Add testers** in App Store Connect → your app → **TestFlight**:
   - **Internal testers** (people on your App Store Connect team, up to 100)
     can install immediately.
   - **External testers** (anyone by email or a public link, up to 10,000)
     need a quick Beta App Review the first time, usually within a day.

Each run uses the GitHub run number as the build number, so builds never
clash.

## Notes for App Store review (later, not needed for TestFlight)

Apple can reject apps that are "just a website" (guideline 4.2) at full App
Store review. TestFlight internal testing has no review, and external beta
review is lighter. Before a public release, plan some native value, for
example:

- push notifications for doors opening and ticket transfers,
- an Apple Wallet pass for tickets,
- native share.

Capacitor plugins make each of these a small addition.

Selling event tickets with Stripe is allowed. Apple's in-app purchase rules
don't apply to real-world events.

## Local development (optional)

```bash
cd native
npm install
```

- `npx cap open android` opens the project in Android Studio.
- `npx cap open ios` opens it in Xcode (Mac only; run `pod install` in
  `ios/App` first).
