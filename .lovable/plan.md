

## Important Context on Compliance Certifications

Before the technical plan, it's critical to understand what these certifications actually involve:

**SOC 2, ISO 27001, ISO 42001, and PCI-DSS are organizational certifications**, not code features. They require formal audits, documented policies, physical security controls, employee training, and ongoing governance processes conducted by your organization. No code change can make an app "SOC 2 compliant" — that requires hiring an auditor and building an information security management program.

**PCI-DSS** specifically applies if you process, store, or transmit credit card data. This app does not appear to handle payments, so PCI-DSS is not applicable unless you add payment processing.

**ISO 42001** relates to AI management systems — again an organizational certification, not a code feature.

**What we CAN do in code** is implement security best practices and legal agreements that would support a future compliance effort and make the app professionally legitimate:

---

## Plan: EULA/Terms Acceptance + Security Hardening

### 1. End-User License Agreement (EULA) & Terms of Service

Create a comprehensive EULA dialog that appears during **signup only** (not every login), requiring acceptance before account creation. Modeled after Meta's approach:

- **New page**: `src/pages/TermsOfService.tsx` — full-text Terms of Service & EULA page (publicly accessible)
- **New page**: `src/pages/PrivacyPolicy.tsx` — full-text Privacy Policy page (publicly accessible, required for GDPR)
- **Auth flow change**: Add a checkbox on the signup form: "I agree to the Terms of Service and Privacy Policy" with links. Block signup until checked.
- **Database**: Add a `terms_accepted_at` timestamp column to the existing profiles or a new `user_consents` table to record when the user accepted terms (GDPR requires proof of consent).
- **EULA content**: Comprehensive agreement covering data collection, AI-generated content, user-generated content, intellectual property, limitation of liability, indemnification, dispute resolution, termination, and governing law.

### 2. GDPR Compliance (Code-Level)

- **Cookie consent banner**: Add a cookie consent component that appears on first visit
- **Data export**: Add a "Download My Data" button on the Profile page that exports all user wardrobe data as JSON
- **Account deletion**: Add a "Delete My Account" button on the Profile page that removes all user data (right to erasure)
- **Privacy Policy page**: Cover data collection purposes, retention periods, third-party sharing (AI services), user rights

### 3. Security Headers & Best Practices

- **Content Security Policy**: Add CSP meta tag in `index.html`
- **Input sanitization**: Audit existing forms for proper validation (already partially done)
- **Session management**: Auth is already using secure session handling via the backend

### 4. Routes & Navigation

- Add `/terms` and `/privacy` as public routes in `App.tsx`
- Add links to both in the Auth page footer and Profile page

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/pages/TermsOfService.tsx` | Create — full EULA text |
| `src/pages/PrivacyPolicy.tsx` | Create — full privacy policy |
| `src/components/CookieConsent.tsx` | Create — GDPR cookie banner |
| `src/pages/Auth.tsx` | Edit — add terms checkbox on signup |
| `src/pages/Profile.tsx` | Edit — add data export & account deletion |
| `src/App.tsx` | Edit — add /terms and /privacy routes |
| `index.html` | Edit — add CSP meta tag |
| Migration | Create `user_consents` table with RLS |

