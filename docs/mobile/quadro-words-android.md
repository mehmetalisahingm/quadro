# Quadro Words — Android-first plan
Decision: 2026-11-27. Epic #202. Implementation owner: @Utkuuzun14.

## Product scope
- Native Android-first standalone Quadro Words, existing Quadro website continues. iOS deferred. No WebView shell.
- First launch is a playable 7×7 board; no mandatory account, intro, mode selection, or ads.
- Turkish MVP, English independent dictionary and localization next. Offline first, personal high score, share, resume. Existing daily Quadro and Keşif Yolu remain web products. Picture mode retirement tracked separately (#200). Old Rush/Zincir concept superseded by Words; do not implement both in parallel.
- Proposed store name Quadro Words; provisional application ID tr.com.playquadro.words, confirm before first Play registration. Validate branding and package ownership.

## Game specification (initial balance, subject to playtest)
- Board 7×7, three offered pieces with 1–4 letter cells, fixed orientations in MVP. Drag a piece to empty cells, or tap-select and tap-place for accessibility. Invalid placement leaves state unchanged. No countdown, lives, forced energy or artificial loss.
- Valid placement commits atomically. Scan horizontal and vertical contiguous word substrings of at least four letters that contain a newly placed cell. Select longest valid words per direction, deterministic tie-breaking by coordinate when overlapping in the same direction; allow perpendicular crossings, clear union of cells once. No gravity. Remaining cells stay. Show matched words and clear animation, no score duplication. Prototype scoring 10×length² per word plus multiword bonus. Initial screenshot is concept only, not canonical scoring.
- Refill the used tray slot immediately. Game over iff no offered piece can fit anywhere. Free restart always available. No finite level cap; progression via score and increasing piece complexity.
- Smart generator: seeded RNG, bounded search across current board and dictionary, candidates extending partial words and starting new ones. Test 60/30/10 helpful/neutral/challenging mix as hypothesis, not promise. Avoid forced losses, repeated trivial patterns, impossible geometries. Analyze dead board and legal moves after every transition. Long games remain possible, not guaranteed.
- Rewarded continue once per run only after actual game over: offer exact benefit before opt-in, compute a rescue that truly enables at least one legal move (minimal deterministic cell clearing and fallback tray recovery). Grant once on earned callback; never on click/dismissal. Assisted records separate. If no fill/refusal/error, free restart or finish. No real ads before approvals.

## Architecture
- Proposed apps/mobile (Expo + React Native + TypeScript) and packages/words-engine (pure TypeScript, versioned state, deterministic transitions and fixtures). Keep Next.js root CI/build isolated; avoid accidental workspace dependency changes. No shared web server-only imports in mobile.
- React Native Gesture Handler/Reanimated for native gesture and animations, version compatibility verified at implementation. Use development build for native ad SDK, not Expo Go alone.
- Dictionary bundled locally with verified commercial redistribution license, attribution, version, Unicode NFC and Turkish casing; compact trie/prefix index. No unlicensed scraping. Filter offensive entries, proper nouns and unclear inflections; editorial review.
- Versioned local snapshot, seed and high scores; atomic persistence and recovery. Native safe areas, haptics/sound toggle, reduced motion, accessible tap/keyboard alternatives. No account/backend dependency in MVP. Existing backend may be reused only after privacy and architecture review.
- Analytics opt-in as required; measure first meaningful move, sessions, words, completion/game-over, D1/D7, rewarded offer/earned. No synthetic ad events, no tracking ad clicks. Actual revenue from AdMob reports. No automatic collection of sensitive data.

## Work breakdown and dependencies
1. #203 mobile scaffold, CI, development APK; #204 dictionary in parallel.
2. #205 engine depends on #204 contract; #206 generator depends on #205.
3. #207 native UI depends on engine interface; #208 persistence/replay and local records.
4. #209 test ad SDK + consent after core loop works; #210 physical devices and metrics.
5. #211 Play listing, privacy, app-ads.txt and release AAB; #212 internal/closed test, production access and staged rollout.
- Every issue assigned to Utku. PR review + CI and real device evidence before release. No production merge with failing checks. Existing PR #196 has known client bundle audit failure; fix separately, never weaken audit. Existing #197–198 refer to Rush and require scope reconciliation; no duplicate Rush development.

## Monetization
- AdMob mobile (not web AdSense/H5). Test/demo ads and test devices only in development; release ad kill switch default false. UMP consent, privacy options and applicable Turkish/EU/US disclosures; actual age/content classification and SDK data flows. No forced ads before gameplay. MVP rewarded at genuine game over, interstitial/banner disabled until retention/policy review. Later natural-transition interstitial with frequency cap; no ads near interactive grid.
- Owner uses existing Google identity/payment profile as applicable; no duplicate AdSense account. Set up Android app in AdMob as not yet published, get actual App ID and separate rewarded unit ID. Never confuse ca-app-pub app ID (~) and unit ID (/). Keep credentials outside git.
- Publish exact AdMob-provided app-ads.txt at https://playquadro.com.tr/app-ads.txt; set developer website in Play listing. Existing web ads.txt is separate. Store link, ownership verification and app readiness approval before full ad serving.
- Google Play Console personal if truthful: one-time USD 25 registration; identity and Android device verification. New personal account closed test at least 12 opted-in testers continuously 14 days; target 15–20 real testers with feedback, apply for production access. Expo free tier or local build; APK for devices, AAB for Play. Current target SDK/16 KB requirements verify at release.
- Owner handles actual account acceptance, billing, identity and bank details directly. Confirm Turkish tax treatment with SMMM/official authority before live monetization; mobile app income may differ from browser game income. No tax or payment claims without verification.

## Acceptance checklist
- [ ] Fresh Android launch to first move under 5 s on reference device; responsive 360dp and tablet.
- [ ] 1,000+ seeded simulation runs; invariants: bounds, collisions, exact clears, legal-move/game-over equivalence, deterministic replay, Unicode, scoring.
- [ ] Generator evaluation with at least two automated play policies, balance/dead-board metrics and real playtests.
- [ ] Process kill/relaunch, offline play, background/resume, corrupted save, accessible tap alternative and touch cancellation.
- [ ] Test ads only: opt-in, earned once, no-fill, cancellation, offline, privacy options, rescue legal move, free alternative.
- [ ] Internal APK + signed AAB, Play store materials/data safety/content rating, privacy and app-ads.txt verification, closed-test evidence, production access approval, readiness approval and rollback plan.
- [ ] No real ads before owner approval, privacy and tax gates. Observe crash/ANR, first move, retention and revenue per visitor after release.

## Official references (checked 2026-11-27)
- https://support.google.com/googleplay/android-developer/answer/6112435
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/admob/answer/9989980
- https://support.google.com/admob/answer/14538460
- https://support.google.com/admob/answer/9388275
- https://docs.expo.dev/build/setup/
- https://docs.expo.dev/build-reference/apk/
