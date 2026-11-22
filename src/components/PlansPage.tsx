import { useState } from "react";
import type { CSSProperties } from "react";

type Audience = "citizens" | "centers";

const tabs: { id: Audience; label: string }[] = [
  { id: "citizens", label: "For Citizens & Families" },
  { id: "centers", label: "For Grama One / Service Centers" },
];

const freeBullets = [
  "Unlimited scheme, govt job & exam matching",
  "1 household profile (up to 6 members)",
  "Document checklists & official portal links",
  "Nearest Grama One / Karnataka One locator",
  "Ad-supported",
];

const proContent: Record<Audience, { strike: string; price: string; bullets: string[] }> = {
  citizens: {
    strike: "₹49",
    price: "₹29 / month (inclusive of GST)",
    bullets: [
      "Unlimited family members & households",
      "Instant WhatsApp & SMS 5-day deadline alerts",
      "Priority Walk-In Pass for Grama One / Karnataka One",
      "Real-time new circular & exam notifications",
      "Completely ad-free experience",
    ],
  },
  centers: {
    strike: "₹399",
    price: "₹299 / month (inclusive of GST)",
    bullets: [
      "Verified Partner badge & top placement in locator",
      "Unlimited pre-screened citizen Walk-In Passes",
      "Zero-rejection document verification slips",
      "Automated annual renewal reminders for citizens",
      "Dedicated operator dashboard",
    ],
  },
};

const darkCard: CSSProperties = {
  flex: "1 1 280px",
  boxSizing: "border-box",
  position: "relative",
  background: "#111827",
  border: "1px solid #374151",
  borderRadius: "20px",
  padding: "20px",
  color: "#E5E7EB",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const proCard: CSSProperties = {
  ...darkCard,
  border: "1px solid #3B82F6",
  boxShadow: "0 0 24px rgba(59,130,246,0.35)",
};

const cardLabel: CSSProperties = {
  fontSize: "0.85rem",
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const subtitle: CSSProperties = { margin: 0, color: "#9CA3AF" };

const bulletList: CSSProperties = {
  paddingLeft: "1.25rem",
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.4rem",
};

export default function PlansPage() {
  const [audience, setAudience] = useState<Audience>("citizens");
  const [offerNoted, setOfferNoted] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const pro = proContent[audience];

  return (
    <section className="yr-page">
      <h1 className="yr-section-title">Plans &amp; Pricing</h1>

      <div className="yr-card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
          Install Android App (Play Store / PWA)
        </h2>
        <p className="yr-hint" style={{ margin: "0 0 0.75rem" }}>
          Add YojanaRadar KA to your Home Screen for one-tap access. Play Store packaging is in preparation.
        </p>
        <button
          type="button"
          className="yr-btn-mint yr-btn-full"
          aria-expanded={howOpen}
          onClick={() => setHowOpen((open) => !open)}
        >
          How to install
        </button>
        {howOpen && (
          <div
            role="note"
            style={{
              marginTop: "0.75rem",
              background: "#F8F9FB",
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "0.75rem",
              fontSize: "0.9rem",
            }}
          >
            On Chrome for Android: tap the menu (⋮) then 'Add to Home screen' or 'Install app'.
          </div>
        )}
      </div>

      <div role="tablist" aria-label="Audience" className="yr-segmented" style={{ marginBottom: "1rem" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={audience === t.id}
            className={audience === t.id ? "yr-segment yr-segment-active" : "yr-segment"}
            onClick={() => setAudience(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {/* Free card */}
        <div style={darkCard}>
          <div style={cardLabel}>Free</div>
          <h2 style={{ margin: 0, color: "#F9FAFB", fontSize: "1.3rem" }}>Try YojanaRadar</h2>
          <p style={subtitle}>Discover Karnataka schemes, jobs &amp; exams.</p>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#F9FAFB" }}>₹0 / month</div>
          <button
            type="button"
            disabled
            style={{
              minHeight: "44px",
              background: "transparent",
              border: "1px solid #4B5563",
              color: "#9CA3AF",
              borderRadius: "999px",
              padding: "0 1rem",
              font: "inherit",
              fontWeight: 600,
              width: "100%",
              cursor: "not-allowed",
            }}
          >
            Your current plan
          </button>
          <ul style={bulletList}>
            {freeBullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        {/* Pro card */}
        <div style={proCard}>
          <span
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              background: "#3B82F6",
              color: "#FFFFFF",
              borderRadius: "999px",
              padding: "4px 10px",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            ₹100 OFF
          </span>
          <div style={cardLabel}>Pro</div>
          <h2 style={{ margin: 0, color: "#F9FAFB", fontSize: "1.3rem" }}>Expanded access</h2>
          <p style={subtitle}>Automated deadline alerts &amp; priority walk-in passes.</p>
          <div>
            <div style={{ textDecoration: "line-through", color: "#9CA3AF" }}>{pro.strike}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#F9FAFB" }}>{pro.price}</div>
          </div>
          <button
            type="button"
            onClick={() => setOfferNoted(true)}
            style={{
              minHeight: "48px",
              background: "#3B82F6",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "999px",
              padding: "0 1rem",
              font: "inherit",
              fontWeight: 600,
              width: "100%",
              cursor: "pointer",
            }}
          >
            Claim special offer
          </button>
          {offerNoted && (
            <div
              role="status"
              style={{
                background: "#1e3a8a",
                border: "1px solid #3B82F6",
                borderRadius: "12px",
                padding: "0.6rem 0.75rem",
                fontSize: "0.9rem",
                color: "#FFFFFF",
              }}
            >
              Special offer noted. This is a demo: no payment is taken.
            </div>
          )}
          <ul style={bulletList}>
            {pro.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
