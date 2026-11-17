# Drip Slayer iOS release preparation

Status: the rebuilt website is live at https://dripslayer.streamwalkers.com. The native project compiles successfully for the iOS simulator under Xcode 26.6, but is **not signed, uploaded to TestFlight, or submitted for App Review**.

## Identity and accounts

- Registered bundle ID: `com.streamwalkers.dripslayer`. Verified on App Store Connect app `6835746469`, version 1.0, Prepare for Submission. See `deploy/apple-account-setup.json` for current account setup evidence.
- Display name: Drip Slayer. Version/build: 1.0 / 1.
- Apple Team ID: `32N9W9HZ54`, supplied by the owner and configured for both Debug and Release with automatic signing. Certificates, provisioning, and access to this team still need verification on the owner's Mac; the identifier itself does not grant Apple account access.
- Source: `streamwalker/wardrobe-whisperer-style`. The verified web release and asset hashes are recorded in `deploy/releases/2026-11-16-web.json`.
- Website target: https://dripslayer.streamwalkers.com. Verified Lovable project: `7a0ace2b-6614-44c5-a39d-036c8e22e68b` in Streamwalkers Corporation. GitHub main syncs to the editor; production publication is a separate action.
- Supabase project reference: `zpctyufmvrvavnidovtp`, managed by Lovable Cloud. The owner resumed the database during release. Authentication health and database REST probes now return 200. The two new Edge Functions are deployed. No production data or schema changes were performed.
- Production builds have public Supabase URL/key fallbacks in `vite.config.ts`; the gitignored `.env` is not supplied by Lovable's production build. Never replace the public key with a service-role key.

## Apple subscriptions through RevenueCat

The iOS app uses native purchases, localized store prices, Restore Purchases, and Apple subscription management. Web checkout remains on the website. The owner confirmed RevenueCat is not set up yet; Apple monthly/annual product drafts now exist in group `22587801`; pricing, availability, RevenueCat configuration and purchase tests remain incomplete.

1. Create one auto-renewable subscription group, “Drip Slayer Pro”. Suggested product IDs: `com.streamwalkers.dripslayer.pro.monthly` and `com.streamwalkers.dripslayer.pro.annual`. Suggested existing web price equivalents: $4.99/month and $39.99/year; choose actual Apple pricing and territories in App Store Connect.
2. Supply localized subscription names/descriptions, review screenshots, tax/banking agreements, availability, and review information.
3. Add the iOS app in RevenueCat with the registered bundle ID and the Apple credentials required by its current setup guide. Import both products, attach them to the **`pro` entitlement**, and create a current/default offering with monthly and annual packages.
4. Use RevenueCat's **keep purchases with the original App User ID** restore/transfer policy unless the account transfer behavior is deliberately redesigned. The SDK uses the authenticated Supabase UUID, not an anonymous identity. Test a second Drip Slayer login against the same Apple account to confirm the intended ownership behavior.
5. Set the public Apple SDK key in `VITE_REVENUECAT_APPLE_API_KEY` in the build environment. Store `REVENUECAT_SECRET_API_KEY` in Supabase Edge Function secrets; never put it in frontend variables or source control. The backend uses RevenueCat's v1 subscriber endpoint.
6. `check-app-subscription` is deployed and rejects signed-out callers with 401. Complete signed-in verification after configuring RevenueCat. It verifies the Supabase access token and checks `pro` on the server using that verified user's UUID. It never trusts entitlement claims or an account ID supplied by the app.
7. Test successful purchase, restore after reinstall, purchase cancellation, pending approval, expiration, billing retry/grace period, offline failure, account switching, and backend verification failure with Apple sandbox/TestFlight. Confirm a paid user can actually use every advertised Pro feature.

The original app's server functions do not centrally enforce all advertised Pro quotas. Client gating is not a billing-security boundary. The [billing enforcement review](BILLING-READINESS.md) records the specific gaps and required verification. Enforcement, paid-feature claims and sandbox purchase tests must be completed before charging users at launch.

## Account deletion and data

`delete-account` is deployed and rejects signed-out callers with 401. It verifies the caller, requires explicit confirmation, removes the caller's wardrobe-photo folder, explicitly removes legacy shares/style signals/dismissed outfits/transfers that lack foreign keys, and deletes the Auth user so foreign-key cascades remove profiles, wardrobe items, saved outfits and consents. The live schema's foreign-key coverage was reviewed. Local handler tests cover authorization, confirmation, 101 photos, caller-only cleanup, and keeping the identity for retry after storage/database failures. Test with a disposable account against the actual backend, including saved outfits, consents, and rejected/expired tokens. Authenticated deletion has not been exercised: the connected tools lack supported Auth-admin test-user creation, and normal sign-up sends email. No test accounts were created and email confirmation was left enabled.

Deletion does not cancel Apple billing. The confirmation explains that users must cancel their subscription in Apple Settings. RevenueCat/Apple transaction retention is separate from app profile deletion; confirm a documented retention/deletion process and update the privacy policy accordingly.

Before deleting real users, confirm all storage objects use the UUID folder layout, that all user-owned tables have the expected cascade behavior, and that no external data is omitted. Photo removal can partially complete before a failure; retry is supported but there is no cross-service transaction.

AI calls request session-scoped permission before sending clothing photos, wardrobe data, and relevant style profile fields through Lovable AI to Google Gemini. Permission is requested again in a new session. Verify actual provider terms/retention and add any required contractual disclosures.

## Build on a Mac

Automated catalog setup, signed Mac-runner builds and TestFlight upload are prepared in [RELEASE-AUTOMATION.md](RELEASE-AUTOMATION.md). They still require secure account credentials and store configuration; they have not performed a signed upload.

Current Capacitor docs require Xcode 26+; recheck Apple's current upload SDK requirements when submitting. This generated project uses Swift Package Manager.

`.github/workflows/ios-validation.yml` compiles an unsigned simulator build on GitHub's Mac runner. It uses placeholder backend settings for compilation only and does not create a distributable archive or submit anything to Apple. A passing job must not be reported as signing or App Store validation.

```sh
npm ci
npm run typecheck
npm test
npm run ios:sync
npm run ios:open
```

In Xcode → Settings → Accounts, sign in to the Apple Developer account that belongs to team `32N9W9HZ54`. Open `ios/App/App.xcodeproj`, select App → Signing & Capabilities, and confirm this team is selected with automatic signing. Verify/register Bundle ID `com.streamwalkers.dripslayer` and enable the account's purchase capability as required. Let Swift packages resolve. Run on iPhone and iPad (the generated target currently supports both).

Once subscriptions are configured and device tests pass, select Any iOS Device as the destination, then Product → Archive. In Organizer choose Validate App, then Distribute App → App Store Connect → Upload. Uploading makes the build available for TestFlight; App Review submission is a separate step in App Store Connect after completing listing, privacy, review and subscription details. Never commit certificates, provisioning profiles, or API private keys.

The app bundles `dist`; it does not load the production website as its application shell. Camera/photo descriptions, native file exports/share sheets, a 1024px opaque icon, branded launch art, and a file timestamp privacy reason are prepared. Inspect Xcode's combined SDK privacy report before upload; the app's manifest does not replace the App Store privacy questionnaire.

## Store listing draft

- Name: Drip Slayer
- Subtitle: Your everyday style companion
- Primary category suggestion: Lifestyle
- Promotional text: Build outfits from the clothes you own. Organize your wardrobe, discover color combinations, and save your favorite looks.
- Keywords draft: wardrobe,outfit,closet,style,clothing,color,planner,fashion
- Description: Drip Slayer brings your wardrobe together in one place. Add clothing photos, organize pieces by category, explore color and style matches, and save outfits you love. Use AI clothing analysis and occasion suggestions to discover new ways to wear what you own. Personalize recommendations with optional style preferences and sizing information. Drip Slayer Pro adds unlimited wardrobe items and AI outfit matching, shopping analysis, occasion suggestions, and PDF outfit exports. Pro is an optional auto-renewing subscription. Pricing is displayed before purchase. Manage or cancel in your Apple account settings.
- Privacy URL: https://dripslayer.streamwalkers.com/privacy (publish updated policy first)
- Marketing URL: https://dripslayer.streamwalkers.com
- Support URL: **needs a verified support page/contact**
- Copyright/legal entity: **owner must confirm**
- Review notes draft: Account required for personal wardrobe storage. Supply a working reviewer account through App Store Connect. Add items using the + button; save and match outfits from Wardrobe and Outfits. Pro subscriptions can be purchased and restored from Profile or Pricing. Account deletion is in Profile → Data & Privacy. AI processing requests permission before first use each session.

Complete the current age-rating questionnaire honestly; do not infer a rating from this draft. Privacy labels likely need email/user ID, user photos/content, style/profile data, and purchase history linked to the user for app functionality. Assess optional skin tone, measurements, diagnostics, and SDK collection using Apple's definitions and the actual production configuration. Do not select “Data Not Collected”. No advertising SDK was added.

Replace or verify existing `privacy@dripslayer.com` and `dpo@dripslayer.com` contacts; these came from the original app and have not been verified. Review the Terms for the actual legal operator, subscription terms, and any outdated web-only claims. Apple's standard EULA link is included on the native paywall.

## Required evidence before submission

- Signed Xcode archive validates with current Apple tools.
- Native iPhone/iPad flows pass: sign up/confirmation, sign in/out, item upload from camera and photo library, batch upload, filters, matching, saving, sharing, imports, JSON/PDF exports, profile edits, deletion, and purchase/restore.
- Backend functions deployed and staging deletion/entitlement tests pass.
- Apple sandbox/TestFlight purchase evidence recorded; secrets configured securely.
- Working support/privacy URLs, verified contact/legal details, reviewer credentials, privacy answers, age rating, and subscription metadata complete.
- Capture actual simulator/device screenshots in the sizes App Store Connect requests. `artifacts/*-iphone.png` are browser design previews, not final native App Store screenshots.

## Validation already performed

Production web build, TypeScript checking, 12 unit tests, and Capacitor asset/plugin sync passed. GitHub's Mac runner compiled the unsigned simulator app with Xcode 26.6 (see `deploy/native-validation.json`). Actual signed-out iPhone 17 Pro Max and iPad Pro 13-inch home captures on iOS 26.5 were visually reviewed; advancing video and the corrected safe-area spacing passed (see `deploy/native-preview-validation.json`). Live desktop/mobile checks covered nine routes: all returned 200, videos advanced, menus and pause controls worked, and there were no page errors or horizontal overflow. A further production check passed header spacing and menu behavior with iPhone, iPad and desktop safe-area insets. Full lint has 130 errors and 10 warnings; the unchanged baseline has the same counts. These are inherited typing/style issues, not a passing lint gate. Authenticated end-to-end tests, signed archives, native-device interactions and purchase sandbox tests remain incomplete.

References: https://developer.apple.com/app-store/review/guidelines/ ; https://capacitorjs.com/docs/ios ; https://www.revenuecat.com/docs/getting-started/installation/capacitor
