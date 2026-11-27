# AdSense launch checklist

The site is verified using ads.txt. The publisher ID is public. No ad requests are enabled by default.

Before activation:
- Confirm site status Ready in AdSense.
- Review privacy disclosure with the actual controller, processors, retention, rights and a dedicated private contact channel; do not publish a personal address without permission.
- In Privacy & messaging, configure and publish the Google-certified European regulations CMP (consent, reject and manage options as applicable). Verify it with the production site and evaluate applicable Turkish privacy and consent requirements. This document is not legal certification.
- Keep Auto ads off; do not enable anchor, vignette, gameplay, account or challenge ads. Create a responsive display ad unit for the how-to-play editorial guide.
- Configure production-only Vercel variables QUADRO_ADSENSE_GUIDE_SLOT (real ad unit ID), QUADRO_ADSENSE_CMP_READY=true only after consent setup and review, and QUADRO_ADSENSE_ENABLED=true only after approval. These are operator attestations, not automatic consent validation.
- Redeploy, verify the Google consent flow and ad behavior on mobile and desktop, and check the Policy center. Do not click live ads or generate automated impressions. Use ordinary non-ad gameplay tests while ads remain disabled.
- Disable QUADRO_ADSENSE_ENABLED and redeploy if a problem occurs.
- H5 Game Ads and rewarded placements are separate and are not implemented in this change.
