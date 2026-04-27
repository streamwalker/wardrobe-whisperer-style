import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";

export default function PrivacyPolicy() {
  return (
    <LcarsStandaloneShell
      title="DIRECTIVE 011 · PRIVACY POLICY"
      subtitle="LEGAL ARCHIVE"
      headerColor="cyan"
      topColor="cyan"
      sideColor="lavender"
      bottomColor="orange"
      maxWidth="lg"
      rightSlot={
        <Link
          to="/auth"
          className="lcars-pill-r bg-lcars-orange text-black px-4 h-9 inline-flex items-center gap-2 lcars-label text-xs hover:brightness-110"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          AUTH
        </Link>
      }
    >
      <div className="space-y-6 py-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-lcars-peach uppercase tracking-widest">
          Privacy Policy
        </h1>

        <p className="text-sm text-muted-foreground">Last updated: March 9, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>Drip Slayer ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our wardrobe management and styling service ("Service"). By using the Service, you consent to the practices described herein.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-foreground">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Data:</strong> Email address, password (hashed), display name</li>
              <li><strong>Profile Data:</strong> Body measurements, skin tone, body type, style preferences, sizing information</li>
              <li><strong>Wardrobe Data:</strong> Clothing item names, categories, colors, photos, patterns, textures, style tags</li>
              <li><strong>Outfit Data:</strong> Saved outfit combinations, AI-generated explanations, mood tags</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-4">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Usage Data:</strong> Pages visited, features used, timestamps</li>
              <li><strong>Device Data:</strong> Browser type, operating system, screen resolution</li>
              <li><strong>Cookies:</strong> Session cookies for authentication; optional analytics cookies (with consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, maintain, and improve the Service</li>
              <li>To generate AI-powered outfit suggestions and styling recommendations</li>
              <li>To process clothing image analysis using AI models</li>
              <li>To personalize your experience based on your style profile</li>
              <li>To enable wardrobe sharing features you activate</li>
              <li>To communicate Service updates and security notices</li>
              <li>To detect, prevent, and address technical or security issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. AI Processing & Third-Party Services</h2>
            <p>When you use AI features (outfit matching, image analysis, occasion suggestions), your wardrobe data and uploaded images may be processed by third-party AI models. This data is transmitted securely, used solely for generating responses, and is not retained by AI providers beyond the processing session. We do not sell your data to any third party.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Data Storage & Security</h2>
            <p>Your data is stored in secure, encrypted databases. We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit (TLS/HTTPS) and at rest</li>
              <li>Row-Level Security (RLS) policies ensuring data isolation between users</li>
              <li>JWT-based authentication for all API requests</li>
              <li>Input validation and sanitization on all endpoints</li>
              <li>Regular security audits and monitoring</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active. Upon account deletion, all associated data (profile, wardrobe items, outfits, photos, consent records) is permanently deleted within 30 days. Anonymized, aggregated data may be retained for analytics purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Your Rights (GDPR & CCPA)</h2>
            <p>Depending on your jurisdiction, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data via your profile settings</li>
              <li><strong>Erasure:</strong> Delete your account and all associated data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format (JSON)</li>
              <li><strong>Restriction:</strong> Request limitation of processing</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time without affecting prior processing</li>
            </ul>
            <p>You can exercise your data export and account deletion rights directly from your Profile page. For other requests, contact us at <span className="text-primary">privacy@dripslayer.com</span>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Cookies & Tracking</h2>
            <p>We use essential cookies for authentication and session management. Analytics cookies are only set with your explicit consent via our cookie consent banner. You can change your cookie preferences at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Children's Privacy</h2>
            <p>The Service is not directed to children under 16. We do not knowingly collect personal information from children. If we discover that a child under 16 has provided us with personal information, we will promptly delete it.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. International Data Transfers</h2>
            <p>Your data may be processed in countries outside your jurisdiction. We ensure appropriate safeguards are in place, including Standard Contractual Clauses where required by GDPR.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. The "Last updated" date at the top reflects the most recent revision.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
            <p>For privacy-related inquiries: <span className="text-primary">privacy@dripslayer.com</span></p>
            <p>Data Protection Officer: <span className="text-primary">dpo@dripslayer.com</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
