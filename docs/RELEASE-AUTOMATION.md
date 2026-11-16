# Automated iOS release operations

The website is live. Apple Team ID `32N9W9HZ54` is configured. The automation below is prepared and locally tested; it has **not** created a RevenueCat project, signed a release archive, uploaded to TestFlight, or submitted to App Review.

The current task has no Apple/RevenueCat credential bindings or connected browser-control tool. The GitHub connection can publish source, but reading repository secret settings returned `403 Resource not accessible by integration`. Credentials must be supplied through a secure account/environment connection; a Team ID does not grant account access. Never paste private keys or passwords into chat or commit them.

## RevenueCat catalog

`deploy/apple-release.json` is the source of product IDs, entitlement `pro`, offering `default`, and monthly/annual packages. Preview the configuration with:

```sh
npm run revenuecat:setup
```

With a RevenueCat **v2** API key bound as `REVENUECAT_V2_API_KEY`, run:

```sh
npm run revenuecat:setup -- --apply --write-sdk-env
```

Alternatively, store that key in the repository secret `REVENUECAT_V2_API_KEY` and run the **Configure Drip Slayer RevenueCat catalog** GitHub workflow. It consumes the key inside the runner without revealing it. Its artifact contains only the public Apple SDK configuration, which can then be used for the native build. `REVENUECAT_PROJECT_ID` may be supplied as a repository variable when targeting an existing project.

The key needs project-configuration read/write permissions for projects, apps, products, entitlements, offerings and packages. `REVENUECAT_PROJECT_ID` can identify an existing Drip Slayer project explicitly. The command finds or creates the project and iOS app, adds both subscription catalog entries, links them to `pro`, creates the monthly/annual packages, and makes the offering current after linking. It reuses matching objects on subsequent runs. Ambiguous identities, archived records, and conflicting current offerings/package assignments stop the process.

`--write-sdk-env` saves only the public Apple SDK key into the gitignored `.env.production.local`. It preserves existing settings and stops if a different Apple SDK key is already configured. The private v2 key is never written into frontend files or printed. HTTP mutations are not automatically retried; after an interrupted operation, rerunning first reads the catalog to find objects already created.

Creating RevenueCat catalog entries does **not** create or price Apple products. Apple store credentials, App Store Connect product registration/pricing/review metadata, and the original-app-user restore policy still require verification with account access. The runtime function also needs `REVENUECAT_SECRET_API_KEY`, a suitable RevenueCat **v1** server key, in Lovable/Supabase secrets. Do not substitute the catalog's v2 management key or put any private key in `VITE_*` variables.

## Signed build and TestFlight

The manual GitHub Actions workflow **iOS signed build and TestFlight** runs only from `main` on a Mac runner. It checks configuration, runs tests, bundles the app, validates the provisioning profile's team/bundle/expiry/distribution type, imports signing material into a temporary keychain, archives, exports and validates the IPA. With `upload=true`, it uploads through Apple's tooling. Private signing files and the temporary keychain are cleaned up on exit; there is no signing-material artifact upload.

The repository's [Actions secret settings](https://github.com/streamwalker/wardrobe-whisperer-style/settings/secrets/actions) must contain:

| Secret | Value |
| --- | --- |
| `IOS_DISTRIBUTION_P12_BASE64` | Base64 of an Apple Distribution certificate **including its private key** |
| `IOS_DISTRIBUTION_P12_PASSWORD` | Password protecting that P12 |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64 of an unexpired App Store distribution profile for `32N9W9HZ54.com.streamwalkers.dripslayer` |
| `ASC_API_KEY_ID` | App Store Connect API key ID |
| `ASC_ISSUER_ID` | Issuer UUID for that team API key |
| `ASC_PRIVATE_KEY_BASE64` | Base64 of the matching App Store Connect `.p8` private key |
| `VITE_REVENUECAT_APPLE_API_KEY` | Public production Apple SDK key beginning with `appl_` |

The Apple API key must belong to the correct account and have upload permission. An App Store Connect app record must exist for the exact bundle ID. The upload workflow does not create that record. Use a fresh positive `build_number` for each upload. `upload=false` validates signing without uploading; the runner's archive is temporary. After credentials and store setup are verified, the authorized upload can be started with:

```sh
gh workflow run ios-testflight.yml --ref main -f build_number=2 -F upload=true
```

This performs an upload request, not an App Review submission. Verify Apple's processing result, test the native app and purchase/restore flows in TestFlight, and complete the remaining listing/privacy/reviewer requirements in [IOS-SUBMISSION.md](IOS-SUBMISSION.md) before submitting for review. The pipeline deliberately does not assert device tests or store readiness from a successful compile.

## Verification completed here

- Six Node checks cover missing/invalid credential rejection, secret-free error reporting, RevenueCat pagination confinement, no automatic mutation retries, catalog reuse, and ambiguous project rejection.
- Three Python checks cover exact distribution-profile identity, wrong team/wildcard rejection, and expired/development-profile rejection.
- Shell syntax and workflow YAML checks passed.
- Actual signed Xcode execution, RevenueCat API mutations and Apple upload remain untested because credentials are unavailable.

The separate **iOS native simulator preview** workflow builds with the public production backend configuration and captures signed-out iPhone/iPad home screens plus a short motion recording. It does not access private accounts or test subscriptions. Its images must be visually reviewed before use as store screenshots.

Implementation references: [GitHub's signing guidance](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications), [Apple upload methods](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds), [RevenueCat API v2](https://www.revenuecat.com/docs/api-v2).
