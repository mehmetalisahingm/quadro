# Monetization and growth roadmap

## Release gates
- AdSense site approval, certified CMP behavior on actual devices/regions (including refusal and withdrawal), applicable Turkish consent/privacy obligations and tax/accounting approval before paid traffic or live advertising. Keep QUADRO_ADSENSE_ENABLED and QUADRO_ADSENSE_CMP_READY false.
- Home and finished-result display candidates need separate real responsive ad units QUADRO_ADSENSE_HOME_SLOT and QUADRO_ADSENSE_RESULT_SLOT (production only). Never put ads beside game controls, share buttons or account screens; review spacing/mobile and content eligibility before activation. Keep auto ads off initially. Do not use test automation against live advertisements.
- H5: separate Google approval needed. Adapter tests are not SDK integration. After approval add official SDK and adConfig, pause/resume gameplay, show only at natural transitions, explicit optional reward offer; grant only in adViewed once, no rewards for clicking. Start with a noncompetitive practice hint; no extra ranked lives. No ads if unavailable. Validate with official test mode.
- English practice is three original example boards, not a translated daily inventory. Next: localized navigation, privacy/help, independent English editorial calendar and daily engine, native speaker review, persistence, accessibility, SEO hreflang only for equivalents.
- Existing referral links already carry campaign parameters. New English practice shares use separate campaign. Track real D1/D7 cohorts, daily visitors, completed games, shares and revenue per visitor by period. Use consent-appropriate analytics; do not create fake visits or automatic ad impressions.
- Run a 7-day baseline, then test one additional placement at a time and compare revenue per visitor, completion rate and D1/D7 retention. Revert if engagement or policy health materially worsens. No forced ad views.
- Admin revenue panel is manual, ephemeral input, not live reporting. Future server-side AdSense Management API OAuth requires the owner's consent and read-only adsense.readonly scope; keep tokens server-side. Never infer earnings from game events.

## Turkey tax/payment
- Request written guidance for browser-hosted game ad income (AdSense and H5) before monetization; GVK mükerrer 20/B is not automatic. If eligible: obtain exemption certificate, dedicated Turkish bank account, route all eligible proceeds through it, report account details to tax office in time. Otherwise discuss ordinary business income, VAT/service exports, invoices, registration, bookkeeping and social security with SMMM. No filing made.
- Google TRY payment method threshold 20 TL, payout threshold 200 TL; verify identity/address when requested. Never publish identity or IBAN in issues.
