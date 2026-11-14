# Drip Slayer iOS release preparation

Status: source and native project prepared; **not signed, uploaded, deployed, or submission-ready yet**.

## Identity and accounts

- Proposed bundle ID: `com.streamwalkers.dripslayer`. Register this in Apple Developer and use the same explicit identifier in App Store Connect. Availability has not been verified.
- Display name: Drip Slayer. Version/build: 1.0 / 1.
- Apple Team ID and signing identity are not configured. Select the correct team in Xcode.
- Source: `streamwalker/wardrobe-whisperer-style`, based on commit `1371ef1caa5be8784667648c1ddf490f0cd7006d`, which matches the live site's deployment metadata.
- Website target: https://dripslayer.streamwalkers.com. Hosting project and publish access remain unverified.
- Supabase project reference: `zpctyufmvrvavnidovtp`. No production writes or database migrations were performed.

## Apple subscriptions through RevenueCat

The iOS app uses native purchases, localized store prices, Restore Purchases, and Apple subscription management. Web checkout remains on the website. Apple products are not yet configured or tested.

1. Create one auto-renewable subscription group, “Drip Slayer Pro”. Suggested product IDs: `com.streamwalkers.dripslayer.pro.monthly` and `com.streamwalkers.dripslayer.pro.annual`. Suggested existing web price equivalents: $4.99/month and $39.99/year; choose actual Apple pricing and territories in App Store Connect.
2. Supply localized subscription names/descriptions, review screenshots, tax/banking agreements, availability, and review information.
3. Add the iOS app in RevenueCat with the registered bundle ID and the Apple credentials required by its current setup guide. Import both products, attach them to the **`pro` entitlement**, and create a current/default offering with monthly and annual packages.
4. Use RevenueCat's **keep purchases with the original App User ID** restore/transfer policy unless the account transfer behavior is deliberately redesigned. The SDK uses the authenticated Supabase UUID, not an anonymous identity. Test a second Drip Slayer login against the same Apple account to confirm the intended ownership behavior.
5. Set the public Apple SDK key in `VITE_REVENUECAT_APPLE_API_KEY` in the build environment. Store `REVENUECAT_SECRET_API_KEY` in Supabase Edge Function secrets; never put it in frontend variables or source control. The backend uses RevenueCat's v1 subscriber endpoint.
6. Deploy and test `check-app-subscription`. It verifies the Supabase access token and checks `pro` on the server using that verified user's UUID. It never trusts entitlement claims or an account ID supplied by the app.
7. Test successful purchase, restore after reinstall, purchase cancellation, pending approval, expiration, billing retry/grace period, offline failure, account switching, and backend verification failure with Apple sandbox/TestFlight. Confirm a paid user can actually use every advertised Pro feature.

The original app's server functions do not centrally enforce all advertised Pro quotas. Client gating is not a billing-security boundary. Server-side quota/entitlement enforcement and agreement on the limits must be reviewed before charging users at launch.

## Account deletion and data

Deploy `delete-account` before releasing this frontend. It verifies the caller, requires explicit confirmation, removes the caller's wardrobe-photo folder, and deletes the Auth user so the schema's foreign-key cascades remove app records. Test with a disposable account in staging, including more than 100 photos, failed storage removal, shares, saved outfits, consents, and rejected/expired tokens. This endpoint has not been exercised against the connected production backend.

Deletion does not cancel Apple billing. The confirmation explains that users must cancel their subscription in Apple Settings. RevenueCat/Apple transaction retention is separate from app profile deletion; confirm a documented retention/deletion process and update the privacy policy accordingly.

Before deleting real users, confirm all storage objects use the UUID folder layout, that all user-owned tables have the expected cascade behavior, and that no external data is omitted. Photo removal can partially complete before a failure; retry is supported but there is no cross-service transaction.

AI calls request session-scoped permission before sending clothing photos, wardrobe data, and relevant style profile fields through Lovable AI to Google Gemini. Permission is requested again in a new session. Verify actual provider terms/retention and add any required contractual disclosures.

## Build on a Mac

Current Capacitor docs require Xcode 26+; recheck Apple's current upload SDK requirements when submitting. This generated project uses Swift Package Manager.

```sh
npm ci
npm run typecheck
npm test
npm run ios:sync
npm run ios:open
```

In Xcode open `ios/App/App.xcodeproj`, select App → Signing & Capabilities, select the Apple team, verify the Bundle ID, and enable the account's purchase capability as required. Let Swift packages resolve. Run on iPhone and iPad (the generated target currently supports both), then Product → Archive → Validate App → Distribute App → App Store Connect. Never commit certificates, provisioning profiles, or API private keys.

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

Production web build, TypeScript checking, purchase UI tests, Capacitor asset/plugin sync, and local browser layout checks. Full lint has 130 errors and 10 warnings; the unchanged baseline has the same counts. These are inherited typing/style issues, not a passing lint gate. No authenticated end-to-end or native Xcode verification has been completed here.

References: https://developer.apple.com/app-store/review/guidelines/ ; https://capacitorjs.com/docs/ios ; https://www.revenuecat.com/docs/getting-started/installation/capacitor
