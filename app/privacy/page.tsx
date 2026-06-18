export const metadata = {
  title: "Privacy Policy — B&CL Ops",
  description: "Privacy policy for the Brick and Clay Operations internal staff app.",
};

export default function PrivacyPage() {
  const lastUpdated = "18 June 2026";

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px 80px",
        fontFamily: "system-ui, sans-serif",
        color: "#111",
        lineHeight: 1.7,
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
        Privacy Policy
      </h1>
      <p style={{ color: "#666", fontSize: 14, marginBottom: 40 }}>
        Last updated: {lastUpdated}
      </p>

      <Section title="1. About this app">
        <p>
          <strong>B&CL Ops</strong> (Brick and Clay Operations) is a
          proprietary internal operations platform developed exclusively for
          use by the staff and management of{" "}
          <strong>Brick and Clay — Wood Fire Italian Pizza</strong>, located
          in Bhubaneswar, Odisha, India.
        </p>
        <p>
          This application is <strong>not a public-facing product</strong>. It
          is restricted to verified employees and authorised personnel only.
          Access is granted solely by the management of Brick and Clay. Members
          of the public cannot register or create accounts.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p>The app collects and stores the following data for operational purposes:</p>
        <ul>
          <li>
            <strong>Staff profile data</strong> — name, role, team designation,
            and employment status
          </li>
          <li>
            <strong>Attendance records</strong> — daily check-in and check-out
            times, leave records
          </li>
          <li>
            <strong>Sales data</strong> — daily sales figures across payment
            modes (cash, UPI, card, delivery platforms)
          </li>
          <li>
            <strong>Cash expense records</strong> — cash withdrawals, salary
            advances, and operational expenses
          </li>
          <li>
            <strong>Checklist completions</strong> — opening and closing
            operational checklists
          </li>
          <li>
            <strong>Stock and inventory data</strong> — stock snapshots and
            vendor information
          </li>
          <li>
            <strong>Reimbursement claims</strong> — expense claims submitted
            by staff
          </li>
          <li>
            <strong>Device token</strong> — for sending push notifications to
            staff devices (optional, only if permission is granted)
          </li>
        </ul>
      </Section>

      <Section title="3. How we use this information">
        <p>All data collected is used solely for internal business operations:</p>
        <ul>
          <li>Tracking daily sales and closing balances</li>
          <li>Managing staff attendance and leave records</li>
          <li>Monitoring cash flow and operational expenses</li>
          <li>Ensuring daily operational checklists are completed</li>
          <li>Sending operational push notifications to staff</li>
          <li>Generating reports for management review</li>
        </ul>
        <p>
          Data is <strong>never used for advertising</strong>, sold to third
          parties, or shared outside the organisation.
        </p>
      </Section>

      <Section title="4. Data storage and security">
        <p>
          All data is stored securely using{" "}
          <strong>Supabase</strong> (PostgreSQL), a cloud database platform
          with industry-standard encryption in transit (TLS) and at rest.
          Access to the database is restricted by role-based authentication.
        </p>
        <p>
          The web application is hosted on <strong>Vercel</strong> and served
          at <strong>ops.brickandclay.in</strong>. The Android application
          loads this domain via a secure WebView.
        </p>
      </Section>

      <Section title="5. Who can access this app">
        <p>
          Access is strictly limited to current employees of Brick and Clay.
          Each user is assigned a role (staff, front desk, kitchen, head chef,
          or owner/admin) with permissions appropriate to their position.
          Accounts are created and managed exclusively by the management team.
        </p>
        <p>
          Former employees have their accounts deactivated upon leaving the
          organisation.
        </p>
      </Section>

      <Section title="6. Push notifications">
        <p>
          The app may request permission to send push notifications to your
          device for operational alerts (e.g. shift reminders, attendance
          alerts). This permission is optional. You may disable notifications
          at any time through your device settings.
        </p>
        <p>
          Push notification tokens are stored only to deliver relevant
          messages and are not shared with any third party.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          Operational data (sales, attendance, expenses) is retained for a
          minimum of 12 months for business and accounting purposes. Staff
          profile data is retained for the duration of employment and
          deactivated thereafter.
        </p>
      </Section>

      <Section title="8. Third-party services">
        <p>The app uses the following third-party services:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — database and authentication (
            <a href="https://supabase.com/privacy" style={{ color: "#1a73e8" }}>
              Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Vercel</strong> — web hosting and deployment (
            <a href="https://vercel.com/legal/privacy-policy" style={{ color: "#1a73e8" }}>
              Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Google Firebase</strong> — push notifications via FCM (
            <a href="https://firebase.google.com/support/privacy" style={{ color: "#1a73e8" }}>
              Privacy Policy
            </a>
            )
          </li>
        </ul>
        <p>
          These services process data only as necessary to provide the
          functionality described in this policy.
        </p>
      </Section>

      <Section title="9. Children's privacy">
        <p>
          This application is intended for use by adults employed by Brick and
          Clay. It is not directed at or accessible by individuals under the
          age of 18.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          This privacy policy may be updated from time to time to reflect
          changes in the app or legal requirements. Any updates will be
          reflected on this page with a revised date.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          For any questions regarding this privacy policy or the handling of
          data within the app, contact the management of Brick and Clay:
        </p>
        <p>
          <strong>Brick and Clay — Wood Fire Italian Pizza</strong>
          <br />
          Bhubaneswar, Odisha, India
          <br />
          Email:{" "}
          <a href="mailto:contact@brickandclay.in" style={{ color: "#1a73e8" }}>
            contact@brickandclay.in
          </a>{" "}
          /{" "}
          <a href="mailto:surya@brickandclay.in" style={{ color: "#1a73e8" }}>
            surya@brickandclay.in
          </a>
        </p>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 10,
          borderBottom: "1px solid #e5e5e5",
          paddingBottom: 6,
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, color: "#333" }}>{children}</div>
    </section>
  );
}
