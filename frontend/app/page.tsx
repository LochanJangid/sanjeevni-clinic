import Link from "next/link";

const careSteps = [
  {
    number: "01",
    title: "Find the right doctor",
    description: "Explore the clinicians currently listed with Sanjeevni Clinic.",
    href: "/doctors",
    action: "Browse doctors",
  },
  {
    number: "02",
    title: "Choose a time that works",
    description: "See bookable 30-minute times for your selected date.",
    href: "/doctors",
    action: "View availability",
  },
  {
    number: "03",
    title: "Keep visits organized",
    description: "Review your appointment details and manage upcoming visits.",
    href: "/appointments",
    action: "My appointments",
  },
];

export default function Home() {
  return (
    <main>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="kicker-dot" />
              PATIENT CARE, MADE CLEAR
            </span>
            <h1>Good care begins with a <em>clear next step.</em></h1>
            <p>
              Find a doctor, choose an appointment time, and keep your visits in one
              calm, simple place.
            </p>
            <div className="hero-actions">
              <Link href="/doctors" className="hero-primary">
                Find a doctor <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/appointments" className="hero-secondary">
                Manage appointments
              </Link>
            </div>
            <div className="hero-trust">
              <span className="trust-icon" aria-hidden="true">✓</span>
              Your care journey, organized in one place
            </div>
          </div>

          <div className="hero-visual" aria-label="Preview of the Sanjeevni patient portal">
            <div className="portal-glow" />
            <div className="portal-window">
              <div className="portal-topbar">
                <span className="portal-mini-brand"><span>+</span> SANJEEVNI</span>
                <span className="portal-top-label">PATIENT SPACE</span>
                <span className="portal-avatar" aria-hidden="true">S</span>
              </div>
              <div className="portal-content">
                <div className="portal-sidebar" aria-hidden="true">
                  <span className="portal-side-icon selected">⌂</span>
                  <span className="portal-side-icon">✚</span>
                  <span className="portal-side-icon">▤</span>
                  <span className="portal-side-icon">○</span>
                  <span className="portal-side-bottom">?</span>
                </div>
                <div className="portal-main">
                  <div className="portal-page-heading">
                    <span>YOUR HEALTHCARE, ORGANIZED</span>
                    <strong>One clear next step.</strong>
                  </div>
                  <div className="portal-feature-card">
                    <span className="portal-card-symbol">✳</span>
                    <span className="portal-card-caption">APPOINTMENTS</span>
                    <strong>Book, reschedule<br />or review a visit.</strong>
                    <span className="portal-card-link">Manage your visits <i>↗</i></span>
                  </div>
                  <div className="portal-bottom-row">
                    <div className="portal-small-card">
                      <span className="portal-small-icon">⌕</span>
                      <strong>Find a doctor</strong>
                      <small>Explore the clinic team</small>
                    </div>
                    <div className="portal-small-card">
                      <span className="portal-small-icon">◷</span>
                      <strong>Available times</strong>
                      <small>Choose a date that works</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="portal-note">
              <span className="portal-note-mark">✓</span>
              <span><strong>Your care, in one place</strong><small>Thoughtfully designed around you</small></span>
            </div>
            <span className="portal-orbit orbit-one" />
            <span className="portal-orbit orbit-two" />
          </div>
        </div>
      </section>

      <section className="home-content">
        <div className="content-heading">
          <div>
            <p className="eyebrow">CARE, WITHOUT THE CLUTTER</p>
            <h2 className="section-heading home-section-title">A simpler way to take care of your next visit.</h2>
          </div>
          <p className="content-side-note">
            Clear steps, useful information, and appointment details you can return to whenever you need them.
          </p>
        </div>

        <div className="care-grid">
          {careSteps.map((step) => (
            <article className="care-card" key={step.number}>
              <span className="care-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              <Link href={step.href}>{step.action}<span aria-hidden="true"> →</span></Link>
            </article>
          ))}
        </div>

        <div className="home-bottom">
          <div className="bottom-symbol" aria-hidden="true">+</div>
          <div>
            <p className="eyebrow">YOUR PATIENT SPACE</p>
            <h2>Everything starts with your account.</h2>
            <p>Sign in to view your appointments or create an account to get started.</p>
          </div>
          <div className="bottom-actions">
            <Link href="/login" className="bottom-login">Sign in</Link>
            <Link href="/registration" className="bottom-register">Create account</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
