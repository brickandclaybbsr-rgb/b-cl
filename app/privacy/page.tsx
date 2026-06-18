export const metadata = {
  title: "Privacy Policy — B&CL Ops",
  description: "Privacy policy for the Brick and Clay Operations internal staff app.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-content-primary">
      <div className="mx-auto max-w-2xl px-5 pb-24 pt-12">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-content-secondary">
            Brick and Clay Operations
          </p>
          <h1 className="font-display text-3xl font-bold text-content-primary">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-content-secondary">
            Last updated: 18 June 2026
          </p>
        </div>

        {/* Notice banner */}
        <div className="mb-8 rounded-2xl border border-warm/30 bg-warm/10 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-warm mb-1">
            Internal use only
          </p>
          <p className="text-sm text-content-primary leading-relaxed">
            This application is built exclusively for the staff and management of Brick and Clay. It is not available to the general public and cannot be downloaded or accessed by anyone outside the organisation.
          </p>
        </div>

        <div className="space-y-6">

          <Section title="1. About this application">
            <P>
              B&CL Ops, short for Brick and Clay Operations, is a private internal operations platform developed and maintained solely for the staff, kitchen team, front desk, and management of Brick and Clay Wood Fire Italian Pizza, a restaurant located in Bhubaneswar, Odisha, India.
            </P>
            <P>
              This is not a consumer product. It does not appear in public app stores for general download. Access to this application is granted manually by the management team and is limited to current, verified employees only. No member of the public can register, sign up, or create an account on their own.
            </P>
            <P>
              The purpose of this app is to streamline daily restaurant operations including sales tracking, cash management, attendance logging, checklist completion, and staff coordination. All data recorded within the app is strictly for internal business use.
            </P>
          </Section>

          <Section title="2. Who can access this app">
            <P>
              Access is restricted to current employees of Brick and Clay. Each staff member is assigned a role that determines what they can see and do within the application. The roles are: Staff, Front Desk, Kitchen, Head Chef, and Owner or Admin.
            </P>
            <P>
              Accounts are created only by the management team. When a staff member leaves the organisation, their account is immediately deactivated and they can no longer log in or access any data.
            </P>
            <P>
              There is no self-registration, password reset via public email, or any mechanism for an outsider to gain access. Authentication is handled through Supabase, a secure cloud platform, with session tokens managed server-side.
            </P>
          </Section>

          <Section title="3. Information we collect">
            <P>
              The application collects and stores the following categories of data, all of which are necessary for the day-to-day operations of the restaurant.
            </P>
            <ul className="mt-3 space-y-3">
              {[
                ["Staff profile data", "Each staff member's full name, assigned role, team (front desk, kitchen, etc.), and whether the account is currently active."],
                ["Attendance records", "The daily attendance status of each staff member, including check-in time, check-out time, leave status, and who recorded the entry."],
                ["Daily sales data", "Sales figures filed at the end of each business day, broken down by payment mode: cash, UPI, card, Zomato Gold dine-in, Zomato delivery, Swiggy, Swiggy Dineout, and EazyDiner. This also includes opening cash balance, closing cash balance, total bill count, discount amounts given, and complimentary meals."],
                ["Cash expense records", "Cash withdrawals and expenses logged during the day, including the person's name, the purpose of the withdrawal, the category (such as salary advance, vendor payment, or petty cash), the amount, the date, and any additional notes."],
                ["Checklist completions", "Records of which staff member completed each item on the daily opening and closing operational checklists, along with the time of completion."],
                ["Stock and inventory data", "Periodic stock snapshots entered by the kitchen or management team, including ingredient quantities and vendor-related information."],
                ["Reimbursement claims", "Expense reimbursement requests submitted by staff, including the amount, reason, supporting details, and approval status."],
                ["Push notification tokens", "If a staff member grants permission on their device, a device token is stored to allow the system to send operational push notifications such as shift alerts or important announcements. This permission is entirely optional and can be revoked at any time from device settings."],
              ].map(([title, desc]) => (
                <li key={title} className="rounded-xl border border-border bg-bg-elevated px-4 py-3">
                  <p className="text-sm font-bold text-content-primary mb-1">{title}</p>
                  <p className="text-sm text-content-secondary leading-relaxed">{desc}</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="4. How we use this information">
            <P>
              Every piece of data collected exists for one purpose only: to help Brick and Clay run its daily restaurant operations efficiently. Specifically, the data is used for:
            </P>
            <ul className="mt-3 space-y-2">
              {[
                "Tracking daily revenue across all payment channels and generating end-of-day reports for management.",
                "Maintaining accurate attendance records and managing staff leave.",
                "Monitoring cash flow, petty cash usage, salary advances, and operational expenses.",
                "Ensuring that all daily opening and closing tasks are completed by the right team members.",
                "Sending operational push notifications to staff when needed.",
                "Providing the owner and management with historical data for payroll, reconciliation, and business decisions.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-content-secondary leading-relaxed">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warm/60" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-success/20 bg-success/8 px-4 py-3">
              <p className="text-sm text-content-secondary leading-relaxed">
                <span className="font-bold text-success">No data is ever sold, shared, or disclosed</span> to any third party outside the organisation. It is never used for advertising, profiling, or any commercial purpose beyond internal restaurant management.
              </p>
            </div>
          </Section>

          <Section title="5. Data storage and security">
            <P>
              All application data is stored in a PostgreSQL database managed by Supabase, a cloud database platform that uses industry-standard TLS encryption for all data in transit and AES-256 encryption for data at rest. Access to the database is controlled through Supabase's role-based access policies, ensuring that each user can only read and write the data their role permits.
            </P>
            <P>
              The web application is hosted on Vercel and is served securely over HTTPS at ops.brickandclay.in. The Android version of the app loads this same domain through a secure WebView using the HTTPS scheme only. No unencrypted connections are permitted.
            </P>
            <P>
              Push notifications are delivered through Google Firebase Cloud Messaging (FCM). Device tokens are stored only for the purpose of sending relevant operational messages and are not used for any other purpose.
            </P>
          </Section>

          <Section title="6. Push notifications">
            <P>
              The app may request permission on your Android device to send push notifications. These notifications are used for operational purposes only, such as shift reminders, alerts from management, or important announcements relevant to your role.
            </P>
            <P>
              Granting notification permission is entirely optional. You may deny or revoke this permission at any time through your device's app settings under Notifications. Revoking permission does not affect your ability to use any other feature of the app.
            </P>
          </Section>

          <Section title="7. Data retention">
            <P>
              Operational records including daily sales, cash expenses, attendance, and checklist data are retained for a minimum of 12 months. This is necessary for payroll reconciliation, accounting, and management review.
            </P>
            <P>
              Staff profile data is retained for the duration of employment. When a staff member leaves, their account is deactivated but the historical records associated with their account (such as sales they submitted or attendance they logged) are retained for operational continuity and accountability.
            </P>
          </Section>

          <Section title="8. Third-party services used">
            <P>
              The following third-party services are used to operate this application. Each of these services processes data only to the extent necessary for the functionality they provide.
            </P>
            <div className="mt-3 space-y-3">
              {[
                {
                  name: "Supabase",
                  role: "Database, authentication, and real-time data sync.",
                  url: "https://supabase.com/privacy",
                },
                {
                  name: "Vercel",
                  role: "Web application hosting and serverless function execution.",
                  url: "https://vercel.com/legal/privacy-policy",
                },
                {
                  name: "Google Firebase (FCM)",
                  role: "Push notification delivery to Android devices.",
                  url: "https://firebase.google.com/support/privacy",
                },
              ].map((s) => (
                <div key={s.name} className="rounded-xl border border-border bg-bg-elevated px-4 py-3">
                  <p className="text-sm font-bold text-content-primary">{s.name}</p>
                  <p className="text-sm text-content-secondary mt-0.5">{s.role}</p>
                  <a
                    href={s.url}
                    className="mt-1 inline-block text-xs text-warm underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View their privacy policy
                  </a>
                </div>
              ))}
            </div>
          </Section>

          <Section title="9. Children's privacy">
            <P>
              This application is intended solely for adults who are currently employed by Brick and Clay. It is not directed at, accessible to, or designed for use by anyone under the age of 18. No data from minors is knowingly collected.
            </P>
          </Section>

          <Section title="10. Changes to this policy">
            <P>
              This privacy policy may be updated from time to time to reflect changes in the application's features, the data it collects, or applicable legal requirements. When updates are made, the "Last updated" date at the top of this page will be revised. Staff will be informed of any significant changes through the app or directly by management.
            </P>
          </Section>

          <Section title="11. Contact us">
            <P>
              If you have any questions about this privacy policy, the data stored about you, or how information is handled within the application, please reach out to the management of Brick and Clay directly.
            </P>
            <div className="mt-4 rounded-2xl border border-border bg-bg-elevated px-5 py-4 space-y-1">
              <p className="text-sm font-bold text-content-primary">Brick and Clay Wood Fire Italian Pizza</p>
              <p className="text-sm text-content-secondary">Bhubaneswar, Odisha, India</p>
              <div className="pt-2 space-y-1">
                <a href="mailto:contact@brickandclay.in" className="block text-sm text-warm underline underline-offset-2">
                  contact@brickandclay.in
                </a>
                <a href="mailto:surya@brickandclay.in" className="block text-sm text-warm underline underline-offset-2">
                  surya@brickandclay.in
                </a>
              </div>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
      <div className="border-b border-border bg-bg-elevated px-5 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-content-secondary">
          {title}
        </h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-content-secondary leading-relaxed mb-3 last:mb-0">{children}</p>
  );
}
