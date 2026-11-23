# Apple device support — 23 November 2026

## Implemented

- Universal iPhone/iPad binary (`UIDeviceFamily` 1,2), compiled with the iOS 27.2 SDK. Minimum OS remains iOS 15; Siri App Intents require iOS 16; native reserved-region handling requires iOS 27.1.
- A scene-based native container preserves one Capacitor web session across size changes. It independently respects all four safe-area edges. On a partially folded Duo it places the complete interactive web surface in the largest usable pane, including web dialogs and popovers; on a fully open Duo it uses the full safe area. A hinge interaction invalidates layout after pose changes.
- Responsive side navigation for 700–1100 point windows; compact navigation below 700 points. Scrollable menus, height-bounded dialogs/sheets, independent landscape safe areas, and short-window spacing also support iPad multitasking and HomeView Safari.
- An iOS App Shortcut, **Read my outfit**, reads only the outfit explicitly chosen with **Use with Siri** in Your outfits. It returns spoken text without opening the app or making a network request. The app stores no credentials, photos, or measurements in the selection file. Selection validity is 24 hours. Clear selection, account switching, local sign-out, and account deletion remove the selection. HomePod Personal Requests uses the associated iPhone; this is not a standalone HomePod application.
- HomeView support is the responsive website in Safari, plus the iPhone-backed Siri action where supported by Apple's device/account setup. No standalone HomeView app or widget is claimed.

## Validation

- TypeScript check: passed.
- Vitest: 16 tests passed, including bounded spoken text and explicit selection/clear behavior.
- Release tooling: 6 Node tests and 3 Python tests passed.
- Native geometry: 6 assertions passed (zero/outside regions, vertical/horizontal folds, camera avoidance).
- Simulator Debug and unsigned device Release builds: passed. Apple generated App Intents and shortcut phrase metadata successfully.
- Chrome responsive matrix: 320×568, 402×874, 440×956, 874×402, 744×1133, 1133×744, 448×364. Wardrobe document width matched each viewport, and the selected Shoes filter survived all transitions. This is browser emulation, not device certification.
- HomeView-sized menu: close control remains visible; 364-point dialog scrolls its 551-point content.
- Native Duo: closed, partially folded, and fully open launch layouts inspected. The unfolded screen expands after the hinge update; partially folded content avoids the division region.
- Native iPhone 18 Pro, iPhone 18 Pro Max, and iPad mini A17 Pro launch layouts inspected in Device Hub. The mini needed a foreground launch after startup; its app rendered successfully.

## Before submission

- Complete authenticated wardrobe/purchase flows and test the shortcut on a paired iPhone + HomePod/HomeView. Simulator metadata generation does not prove physical Siri/Personal Requests delivery.
- Test iPad multitasking, keyboard, rotation, and Duo camera/keyboard interactions on hardware. The newest iPad mini A20 Pro simulator profile exists locally but the installed runtime rejected it as incompatible; A17 Pro mini and web dimensions are supplementary checks.
- No base iPhone 18 simulator profile is installed; Pro/Pro Max plus adaptive layouts cover the currently available 18-series test targets. Do not claim a model-specific hardware certification.
- Capture App Store screenshots from the final signed build. Do not submit device compatibility badges based only on browser emulation.
- Existing submission gates still apply: RevenueCat credentials/catalog and billing enforcement/testing, signed archive/upload, screenshots, privacy/age-rating/review details.

## Apple references

- https://developer.apple.com/iphone-duo/prepare/
- https://developer.apple.com/design/human-interface-guidelines/app-shortcuts
- https://developer.apple.com/forums/thread/847876
- https://webkit.org/blog/18608/safari-on-apple-homeview/
- https://support.apple.com/en-us/148407

> This analysis identifies risks and opportunities but is not legal, financial, or regulatory advice. Verify flagged items with qualified counsel and compliance experts. Competitor prices marked (est.) are estimates to re-verify.
