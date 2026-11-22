import { useEffect, useState } from "react";
import { Check, Copy, Share, Sparkle } from "./NaviIcons";
import "./ReferPage.css";

const REFERRAL_CODE = "KA-RADAR-562160";
const INVITE_LINK = "https://yojanaradar.app/?ref=KA-RADAR-562160";
const SHARE_MESSAGE =
  "Hi! I found free government scheme eligibility checks for Karnataka families (SSP scholarship, Gruhalakshmi, KEA/KPSC jobs) on YojanaRadar KA. No Aadhaar needed, no middlemen. Check yours: " +
  INVITE_LINK +
  " | ಉಚಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ (Check free)";
const WHATSAPP_HREF = "https://wa.me/?text=" + encodeURIComponent(SHARE_MESSAGE);

const REFERRALS_NEEDED = 3;
const REFERRALS_DONE = 1;

const STEPS = [
  "Share link on WhatsApp",
  "Family checks schemes without Aadhaar",
  "Both unlock free deadline alerts",
];

export default function ReferPage() {
  const [copied, setCopied] = useState(false);

  // Clears the "Copied" state after 2 seconds.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyText(text: string) {
    const clip = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    if (!clip?.writeText) return;
    try {
      await clip.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard blocked or unavailable; leave the button unchanged.
    }
  }

  const progressPct = Math.round((REFERRALS_DONE / REFERRALS_NEEDED) * 100);

  return (
    <section className="yr-refer-page">
      <h1 className="yr-refer-title">Refer</h1>

      {/* Hero */}
      <div className="yr-refer-card yr-refer-hero">
        <span className="yr-refer-hero-icon" aria-hidden="true">
          <Sparkle size={26} active />
        </span>
        <h2 className="yr-refer-hero-title">Help Karnataka Families Claim What's Yours</h2>
        <p className="yr-refer-hero-sub">
          Invite neighbors, classmates &amp; relatives to check their SSP, Gruhalakshmi &amp; KEA/KPSC eligibility in 30
          seconds.
        </p>
      </div>

      {/* Reward */}
      <div className="yr-refer-card yr-refer-reward">
        <h2 className="yr-refer-reward-title">Refer 3 Families -&gt; Unlock 1 Month of YojanaRadar Pro Free</h2>

        <div
          className="yr-refer-progress"
          role="progressbar"
          aria-label="Referral progress"
          aria-valuemin={0}
          aria-valuemax={REFERRALS_NEEDED}
          aria-valuenow={REFERRALS_DONE}
        >
          <div className="yr-refer-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="yr-refer-progress-caption">
          {REFERRALS_DONE} of {REFERRALS_NEEDED} families joined
        </p>

        <div className="yr-refer-code-row">
          <span className="yr-refer-code">{REFERRAL_CODE}</span>
          <button type="button" className="yr-refer-copy-btn" onClick={() => copyText(REFERRAL_CODE)}>
            {copied ? <Check size={16} active /> : <Copy size={16} />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>
      </div>

      {/* Primary actions */}
      <a
        className="yr-refer-whatsapp"
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Share size={18} />
        <span>Share on WhatsApp</span>
      </a>

      <button type="button" className="yr-refer-outline" onClick={() => copyText(INVITE_LINK)}>
        {copied ? <Check size={18} active /> : <Copy size={18} />}
        <span>{copied ? "Copied" : "Copy Invite Link"}</span>
      </button>

      {/* How it works */}
      <div className="yr-refer-card yr-refer-how">
        <h2 className="yr-refer-how-title">How It Works</h2>
        <ol className="yr-refer-steps">
          {STEPS.map((step, index) => (
            <li key={step} className="yr-refer-step">
              <span className="yr-refer-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <span className="yr-refer-step-text">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
