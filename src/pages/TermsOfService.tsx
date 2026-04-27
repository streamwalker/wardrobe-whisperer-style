import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LcarsStandaloneShell from "@/components/lcars/LcarsStandaloneShell";
import { LcarsPill } from "@/components/lcars/LcarsPrimitives";

export default function TermsOfService() {
  return (
    <LcarsStandaloneShell
      title="DIRECTIVE 010 · TERMS OF SERVICE"
      subtitle="LEGAL ARCHIVE"
      headerColor="cyan"
      topColor="cyan"
      sideColor="lavender"
      bottomColor="orange"
      maxWidth="lg"
      rightSlot={
        <Link to="/auth">
          <LcarsPill color="orange" side="r" as any>
            <ArrowLeft className="h-3.5 w-3.5" />
            AUTH
          </LcarsPill>
        </Link>
      }
    >
      <div className="space-y-6 py-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-lcars-peach uppercase tracking-widest">
          Terms of Service &amp; End-User License Agreement
        </h1>

        <p className="text-sm text-muted-foreground">Last updated: March 9, 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By creating an account, accessing, or using Drip Slayer ("the Service," "we," "us," or "our"), you agree to be bound by these Terms of Service and End-User License Agreement (collectively, "Terms"). If you do not agree, do not use the Service. These Terms constitute a legally binding agreement between you and Drip Slayer.</p>
            <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before they take effect. Your continued use after such notice constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Eligibility</h2>
            <p>You must be at least 16 years old to use the Service. If you are under 18, you represent that you have your parent's or guardian's consent. By using the Service, you represent and warrant that you have the legal capacity to enter into a binding agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Account Registration & Security</h2>
            <p>You agree to provide accurate, current, and complete information during registration. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must notify us immediately of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. License Grant</h2>
            <p>Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes. This license does not include the right to: (a) modify, copy, or create derivative works; (b) reverse engineer, decompile, or disassemble any part of the Service; (c) rent, lease, lend, sell, or sublicense the Service; (d) use the Service for any unlawful purpose; or (e) use automated systems to access the Service without written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. User-Generated Content</h2>
            <p>You retain ownership of content you upload (photos, descriptions, wardrobe data). By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, store, process, and display such content solely for the purpose of providing and improving the Service. You represent that you have the right to share any content you upload and that it does not violate any third-party rights.</p>
            <p>We reserve the right to remove content that violates these Terms or applicable law without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. AI-Generated Content</h2>
            <p>The Service uses artificial intelligence to provide outfit suggestions, color matching, and styling recommendations. AI-generated content is provided "as-is" for informational purposes only and does not constitute professional fashion advice. We make no guarantees regarding the accuracy, suitability, or completeness of AI-generated suggestions. You use AI-generated recommendations at your own discretion and risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Privacy & Data Collection</h2>
            <p>Your use of the Service is subject to our <Link to="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link>, which describes how we collect, use, store, and share your personal data. By using the Service, you consent to data practices described in the Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Prohibited Conduct</h2>
            <p>You agree not to: (a) use the Service for any illegal purpose; (b) upload harmful, offensive, or infringing content; (c) attempt to gain unauthorized access to any part of the Service; (d) interfere with the Service's operation or infrastructure; (e) impersonate any person or entity; (f) harvest or collect personal information of other users; (g) use the Service for commercial purposes without authorization; or (h) circumvent any access controls or usage limits.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Intellectual Property</h2>
            <p>The Service, including its design, features, algorithms, user interface, trademarks, logos, and all related intellectual property, is owned by Drip Slayer and protected by copyright, trademark, and other intellectual property laws. Nothing in these Terms grants you any right to use our trademarks, trade names, or branding.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL DRIP SLAYER, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US, IF ANY, IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">12. Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Drip Slayer and its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) content you upload to the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">13. Termination</h2>
            <p>We may suspend or terminate your access at any time, with or without cause, with or without notice. Upon termination, your license to use the Service ceases immediately. You may terminate your account at any time through the profile settings. Sections 9–12 and 14–16 survive termination.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">14. Dispute Resolution & Arbitration</h2>
            <p>Any dispute arising from these Terms or your use of the Service shall be resolved through binding arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules. Arbitration shall take place in the United States. YOU AGREE THAT ANY CLAIMS WILL BE BROUGHT IN YOUR INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. The arbitrator's decision shall be final and binding.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">15. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict-of-law principles.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">16. Severability & Entire Agreement</h2>
            <p>If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall continue in full force. These Terms, together with the Privacy Policy, constitute the entire agreement between you and Drip Slayer regarding the Service and supersede all prior agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">17. Contact</h2>
            <p>For questions about these Terms, contact us at: <span className="text-primary">legal@dripslayer.com</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
