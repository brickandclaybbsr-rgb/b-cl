export const metadata = {
  title: "Data Deletion Request — B&CL Ops",
  description: "How to request deletion of your data from the Brick and Clay Operations app.",
};

export default function DeleteDataPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-content-primary">
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-12">

        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-content-secondary">
            Brick and Clay Operations
          </p>
          <h1 className="font-display text-3xl font-bold text-content-primary">
            Data Deletion Request
          </h1>
          <p className="mt-2 text-sm text-content-secondary">
            Last updated: 18 June 2026
          </p>
        </div>

        <div className="space-y-6">

          {/* Current employee notice */}
          <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
            <div className="border-b border-border bg-bg-elevated px-5 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-content-secondary">
                Important — current employees
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-content-secondary leading-relaxed">
                If you are currently employed at Brick and Clay, we are <span className="font-semibold text-content-primary">unable to delete your data</span> while your employment is active. This is not a discretionary decision — it is a legal requirement.
              </p>
              <p className="text-sm text-content-secondary leading-relaxed">
                Under Indian labour law, including the Shops and Commercial Establishments Act (Odisha) and applicable wage and payroll regulations, employers are required to maintain accurate records of attendance, wages, and staff information for a minimum period during and after employment. Deleting this data while you are an active employee would put the organisation in violation of these obligations.
              </p>
              <div className="rounded-xl border border-border bg-bg-elevated px-4 py-3">
                <p className="text-sm font-bold text-content-primary mb-1">When can you request deletion?</p>
                <p className="text-sm text-content-secondary leading-relaxed">
                  Once you have formally left Brick and Clay and your employment has ended, you may submit a deletion request. We will process it within 7 business days. Operational records such as attendance logs and sales entries will be retained for up to 12 months after your departure for accounting and compliance purposes, after which they will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
            <div className="border-b border-border bg-bg-elevated px-5 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-content-secondary">
                How to request deletion
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-content-secondary leading-relaxed">
                B&CL Ops is an internal operations tool for Brick and Clay restaurant staff. If you are a current or former staff member and would like to request deletion of your personal data, please contact us directly by email.
              </p>
              <div className="rounded-xl border border-warm/30 bg-warm/10 px-4 py-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-warm">Send your request to</p>
                <a
                  href="mailto:contact@brickandclay.in?subject=Data Deletion Request — B%26CL Ops"
                  className="block text-base font-bold text-content-primary underline underline-offset-2"
                >
                  contact@brickandclay.in
                </a>
                <a
                  href="mailto:surya@brickandclay.in?subject=Data Deletion Request — B%26CL Ops"
                  className="block text-sm text-warm underline underline-offset-2"
                >
                  surya@brickandclay.in
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
            <div className="border-b border-border bg-bg-elevated px-5 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-content-secondary">
                What to include in your email
              </h2>
            </div>
            <div className="px-5 py-4">
              <ul className="space-y-3">
                {[
                  "Your full name as registered in the app",
                  "The email address associated with your account",
                  "Whether you want your account fully deleted or just specific data removed",
                  "Any additional details to help us identify your records",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-content-secondary leading-relaxed">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warm/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
            <div className="border-b border-border bg-bg-elevated px-5 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-content-secondary">
                What data is deleted
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-content-secondary leading-relaxed">
                Upon a valid deletion request, we will remove the following personal data associated with your account:
              </p>
              <ul className="space-y-3">
                {[
                  ["Deleted immediately", "Your login credentials, profile information (name, email, phone number, address, date of birth, Aadhaar, PAN), and push notification token."],
                  ["Retained for 12 months", "Operational records such as attendance logs, sales submissions, cash expense entries, and checklist completions. These are retained for accounting and business continuity purposes, then permanently deleted."],
                ].map(([title, desc]) => (
                  <li key={title} className="rounded-xl border border-border bg-bg-elevated px-4 py-3">
                    <p className="text-sm font-bold text-content-primary mb-1">{title}</p>
                    <p className="text-sm text-content-secondary leading-relaxed">{desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
            <div className="border-b border-border bg-bg-elevated px-5 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wider text-content-secondary">
                Response time
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-content-secondary leading-relaxed">
                We will process your request within 7 business days and send a confirmation to your email once the deletion is complete.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
