import { Shield, Eye, Lock, UserCheck, Mail } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: January 1, 2025</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section className="bg-card rounded-2xl border p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-serif font-bold">Information We Collect</h2>
            </div>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>When you place an order or create an account with Executive Mochi, we collect:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-foreground">Personal Information:</strong> Name, email address, phone number, and shipping/billing addresses.</li>
                <li><strong className="text-foreground">Payment Information:</strong> We do not store payment card details. Payments are processed securely through JazzCash, EasyPaisa, and Raast.</li>
                <li><strong className="text-foreground">Order History:</strong> Past purchases, preferences, and size memory to improve your experience.</li>
                <li><strong className="text-foreground">Device & Usage Data:</strong> IP address, browser type, pages visited, and general location (city level). Collected via standard web analytics.</li>
              </ul>
            </div>
          </section>

          <section className="bg-card rounded-2xl border p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-serif font-bold">How We Use Your Information</h2>
            </div>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>We use your information to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Process and fulfill your orders, including shipment and delivery notifications.</li>
                <li>Provide customer support and handle returns or exchanges.</li>
                <li>Send transactional emails/SMS (order confirmation, dispatch, delivery).</li>
                <li>Send promotional communications (only with your consent — you may unsubscribe anytime).</li>
                <li>Improve our website, product offerings, and customer experience.</li>
                <li>Prevent fraud and ensure account security.</li>
              </ul>
            </div>
          </section>

          <section className="bg-card rounded-2xl border p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-serif font-bold">Data Security</h2>
            </div>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All data is transmitted over SSL/TLS encrypted connections (HTTPS).</li>
                <li>Passwords are hashed using bcrypt — we never store plain-text passwords.</li>
                <li>Payment processing is handled by PCI-DSS compliant payment gateways.</li>
                <li>Access to customer data is restricted to authorized staff only.</li>
              </ul>
            </div>
          </section>

          <section className="bg-card rounded-2xl border p-8">
            <h2 className="text-xl font-serif font-bold mb-4">Information Sharing</h2>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>We <strong className="text-foreground">do not sell</strong> your personal information to third parties. We only share data with:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-foreground">Courier Partners</strong> (Leopards, Trax, TCS): Name, phone, and address for delivery.</li>
                <li><strong className="text-foreground">Payment Processors</strong>: Transaction data for payment verification.</li>
                <li><strong className="text-foreground">Analytics Providers</strong>: Anonymized usage data to improve our website.</li>
              </ul>
            </div>
          </section>

          <section className="bg-card rounded-2xl border p-8">
            <h2 className="text-xl font-serif font-bold mb-4">Your Rights</h2>
            <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-foreground">Correction:</strong> Update or correct inaccurate information via your account settings.</li>
                <li><strong className="text-foreground">Deletion:</strong> Request deletion of your account and associated data.</li>
                <li><strong className="text-foreground">Opt-out:</strong> Unsubscribe from marketing emails at any time using the link in any email.</li>
              </ul>
              <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:privacy@executivemochi.pk" className="text-primary hover:underline">privacy@executivemochi.pk</a>.</p>
            </div>
          </section>

          <section className="bg-card rounded-2xl border p-8">
            <h2 className="text-xl font-serif font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We use essential cookies to maintain your shopping cart session and login state. We also use optional analytics cookies (Google Analytics) to understand how visitors use our site. You may disable cookies in your browser settings, though some features may not function correctly.
            </p>
          </section>

          <section className="bg-card rounded-2xl border p-8">
            <h2 className="text-xl font-serif font-bold mb-4">Contact</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              For any privacy-related inquiries, please contact our Privacy Officer at{" "}
              <a href="mailto:privacy@executivemochi.pk" className="text-primary hover:underline">privacy@executivemochi.pk</a> or call us at +92 52 6543210.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
