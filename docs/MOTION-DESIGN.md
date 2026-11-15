# Full-screen motion design

The design uses the referenced Meta Ray-Ban page's edge-to-edge film, sparse navigation, headline overlays, and simple primary actions as visual direction. Meta's media and branding are not included.

The entry route `/` now has three full-height video chapters. Wardrobe, outfits, shop, profile, pricing, authentication, legal, and shared-wardrobe screens use the same cinematic header and video-backed shell. Existing forms, data operations, and native purchase flows remain in place; stronger dark overlays and translucent surfaces keep them readable. The menu includes every primary destination, single/batch upload, and legal links. Mobile has a compact text navigation bar on working screens.

Video is local H.264 MP4 with `playsInline`, `muted`, `loop`, and fast-start metadata. Mobile receives a 540×960 portrait crop. The six videos and three poster images total approximately 7.2 MiB. The posters are available without video decoding; no remote media host is contacted by the app.

Motion pauses globally through the persistent on-screen control. The pause setting lasts for the session and is preserved across routes. Reduced-motion users start on posters with a manual play control. Video loading is deferred until the scene becomes visible; only scenes at least 25% visible play, and all clips pause when the document is hidden. Failed loads and blocked autoplay retain the poster. Native iOS low-power and lifecycle behavior still need device verification.

Stock footage license and source records: `public/motion/CREDITS.txt`.

Browser evidence: `artifacts/motion-checks.json`, desktop/iPhone preview PNGs, and the walkthrough video. Browser routes were checked without signing in. Upload/profile mutations and purchases were not exercised against production. App Store signing/configuration blockers in `IOS-SUBMISSION.md` still apply.

The unused cookie banner is no longer mounted: this source contains no optional analytics that its choices could enable or disable. Production host-injected telemetry must be reviewed separately before release; the local/native build does not include it.
