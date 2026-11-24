# App Review preparation — 24 November 2026

Status: preparation only. This packet is not a submitted questionnaire or evidence of a completed purchase. App 6835746469, bundle com.streamwalkers.dripslayer, version 1.0.

## Reviewer notes ready to paste

Drip Slayer organizes a personal clothing wardrobe and saved outfits. Sign in with the review account supplied in App Store Connect. Add clothing from Wardrobe → Add clothing; choose an image from the photo library or camera, review its details, and save. Tap a wardrobe item to request outfit matches; save results and view them under Outfits. Manual wardrobe organization and outfit saving remain available without AI consent.

AI requests use Lovable AI with Google Gemini, not on-device processing. Before the first AI request in a session, the app asks permission to send clothing photos, wardrobe details, and relevant style profile information. Declining cancels the request. Optional profile measurements and style preferences are edited in Profile.

Pro subscriptions use Apple in-app purchase on iOS. Open Pricing or Profile to view localized Apple prices, purchase, restore, or open Apple subscription management. The app identifies purchases with the signed-in Drip Slayer account. A verification outage shows a retry state, not a Free-plan assertion. Account deletion is under Profile → Data & Privacy and does not cancel Apple billing; the confirmation explains this. JSON data export remains available there.

On iPhone, choose Use with Siri on a saved outfit, then say “Read my outfit in Drip Slayer.” The selected outfit name and clothing list are stored locally, valid for 24 hours, and can be cleared in Outfits. HomePod uses Personal Requests and the associated iPhone. HomeView also supports the responsive website in Safari; there is no standalone HomeView app or widget.

Do not paste these notes as a claim that purchases work until the RevenueCat configuration and sandbox tests below pass. Supply real, tested reviewer credentials through App Store Connect, never this public repository. The review phone supplied by the owner is recorded only in the local release checkpoint.

## Privacy questionnaire worksheet

This is a source-backed draft, not a published privacy label. Apple requires assessment of the developer and all partners. For the following account-linked data, draft “linked to user: Yes”; no advertising tracking SDK or cross-app ad integration was found in the checked-in app. Confirm final provider/dashboard settings before declaring “tracking: No.”

| Data type | Evidence and purpose | Preparation decision |
| --- | --- | --- |
| Email Address | `src/pages/Auth.tsx` passes email to Supabase Auth. | Collect; app functionality/account access. |
| Name | `src/pages/Profile.tsx` saves optional display name in `profiles`. | Collect; app functionality/personalization. |
| User ID | Supabase UUID relates records; `src/lib/native-purchases.ts` passes it as RevenueCat App User ID. | Collect; app functionality and purchase verification. |
| Photos or Videos | `AddItem.tsx`, `Shop.tsx`, `Outfits.tsx` upload selected clothing/inspiration photos to wardrobe-photos. AI endpoints send selected photos to Lovable AI/Gemini after consent. | Collect photos; app functionality and product personalization. No user video recording feature found. |
| Other User Content | Clothing descriptions, wardrobe items and saved outfits live in public-schema tables protected by policies. | Collect; app functionality and product personalization. |
| Product Interaction | `src/lib/style-signals.ts` records weighted style interactions; dismissed outfits and tour completion are persisted. | Collect; product personalization and app functionality. Do not label this advertising. |
| Purchase History | RevenueCat receives transactions and the account identifier; Apple processes payment. | Collect; app functionality. Confirm any enabled RevenueCat analytics/integrations before final purposes. |
| Other Data Types / profile characteristics | Optional body type, height, weight, shoulder/waist/thigh/inseam and sizes are stored for styling. Skin tone is also stored. | Resolve the final Apple category for body/skin characteristics; do not silently omit them or claim biometric identification. No HealthKit use or health diagnosis found. |
| Other diagnostic/technical data | `Auth.tsx` records user agent with consent; backend/provider infrastructure has service logs. | Confirm production logging and retention before final diagnostics/IP classification. Schema alone does not prove an IP address is collected. |

Not found in the app's implementation: location access, contacts/address book access, messaging inbox, microphone recording, health-store integration, advertising identifier access, or payment-card entry in the native app. External Apple payment screens are not evidence that Drip Slayer collects card numbers. On-device Siri selection is not sent to the app's backend by the shortcut; Apple's Siri processing is governed by the user's Apple settings.

### Privacy reconciliation still required

- The public policy's analytics-cookie, screen-resolution, cross-border safeguard and 30-day deletion statements need operational verification. The cookie component records a preference; that alone does not demonstrate an analytics integration. Do not publish privacy answers based solely on that copy.
- Document provider log/back-up retention and Apple/RevenueCat transaction retention separately from app-account deletion. The deletion function removes app records/photos; it does not currently call RevenueCat's customer deletion API.
- Wardrobe photos use public storage URLs, and optional share links allow recipients to view a wardrobe. Recheck intended link access and revocation behavior; do not describe all photos as private by virtue of database RLS.
- Four embedded privacy manifests were inventoried from the distribution IPA on November 24. RevenueCat declares purchase history; the app uses a known Supabase UUID, so the final app label must mark purchases linked even though the SDK manifest default is unlinked. Review the combined SDK privacy report from the final archive. The app's `PrivacyInfo.xcprivacy` declares the file-timestamp reason; it is not the App Store privacy questionnaire.

## Age-rating worksheet

Source inventory: private wardrobe organization, clothing/inspiration images, optional share links and transfers, AI styling, purchases, and Siri. No social feed, direct messaging/chat, dating, shared location, gambling, loot boxes, contests, medical advice, parental controls or age-assurance API was found. These are draft capability answers, not a calculated rating.

- Assess user-generated content against Apple's definition of broad distribution: sharing by a link exists; a public discovery feed does not. Resolve the scope and required moderation/reporting controls before final answers.
- A link to Apple subscription management or a legal page does not by itself demonstrate unrestricted web browsing. Verify actual native navigation before answering.
- The policy says the service is not directed to under-16s. Use Apple's rating override if needed to align the declared minimum audience; an age rating does not implement age assurance.
- Answer the current Shared Location and Dating and Relationships questions explicitly. Do not assume an older questionnaire is complete.
- Confirm content rights for bundled clothing/catalog images and motion assets. Source possession alone is not licensing evidence.
- Choose distribution territories deliberately. China mainland AI/security filings require separate evidence if that territory is selected.

## Acceptance tests before submission

| Area | Required evidence |
| --- | --- |
| Authentication | Fresh review-account sign-in, confirmation path, sign-out and second-account isolation. |
| Wardrobe | Camera/library upload, batch upload, edits, deletes, filters, imports/transfers; 20-item free boundary with concurrent direct API writes. |
| AI | Decline consent causes no provider request; accept sends expected data; all matching paths share the 3-per-UTC-month quota; failed calls release reservations. |
| Entitlements | Existing Stripe user retained; Apple purchase, pending/cancel, restore, expiration and outage; server checks guard paid operations. |
| PDF | Verified Pro exports; verified free opens plans; failed verification remains on outfits with retry guidance. Covered by local regression tests, not sandbox entitlement proof. |
| Account deletion | Disposable account with nested photos, saved outfits and shares; token expiry and retry failures; external-provider retention documented. |
| Native/device | Duo fold/keyboard/camera, iPad multitasking, physical Siri/HomePod/HomeView; capture final native store screenshots. |
| Signing/store | Signed archive and privacy report, Apple validation, processed build, localized subscription review screenshots, tested review account, privacy/age/content/territory fields. |

## Sources checked 24 November 2026

- [Apple privacy data definitions](https://developer.apple.com/app-store/app-privacy-details/)
- [RevenueCat Apple privacy guidance](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy)
- [Apple age-rating definitions](https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/)
- [Apple rating override](https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating)
- [RevenueCat purchase-key configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)

> This analysis identifies risks and opportunities but is not legal, financial, or regulatory advice. Verify flagged items with qualified counsel and compliance experts. Competitor prices marked (est.) are estimates to re-verify.
