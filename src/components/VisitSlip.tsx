import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Center, Member, Scheme } from "../types";

interface VisitSlipProps {
  scheme: Scheme;
  member: Member;
  center: Center;
  checked: string[];
  unchecked: string[];
  onClose: () => void;
}

type CopyStatus = "idle" | "copied" | "unsupported" | "failed";

const slipStyle: CSSProperties = {
  border: "2px dashed #9AA3B2",
  borderLeft: "none",
  borderRight: "none",
  borderRadius: 12,
  padding: "1rem",
  marginTop: "1rem",
  background: "#FBFCFF",
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginTop: "0.75rem",
};

function buildSlipText(
  token: string,
  scheme: Scheme,
  member: Member,
  center: Center,
  checked: string[],
  unchecked: string[],
): string {
  return [
    "YojanaRadar KA - Centre Visit Slip",
    `Reference Token ID: ${token}`,
    `Scheme: ${scheme.name} (${scheme.id})`,
    `Applicant: ${member.name}`,
    `Centre: ${center.name}`,
    `Address: ${center.address}`,
    "",
    "Documents:",
    ...checked.map((doc) => `☑ ${doc}`),
    ...unchecked.map((doc) => `☐ ${doc}`),
    "",
    "Indicative only. Not a guarantee of benefit.",
  ].join("\n");
}

export default function VisitSlip({ scheme, member, center, checked, unchecked, onClose }: VisitSlipProps) {
  // Generated once per mounted slip.
  const [token] = useState(
    () =>
      "YRKA-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase(),
  );
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (copyStatus !== "copied") return;
    const timer = setTimeout(() => setCopyStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  const slipText = buildSlipText(token, scheme, member, center, checked, unchecked);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyStatus("unsupported");
      return;
    }
    try {
      await navigator.clipboard.writeText(slipText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const handleWhatsApp = () => {
    window.open("https://wa.me/?text=" + encodeURIComponent(slipText), "_blank", "noopener,noreferrer");
  };

  return (
    <section aria-label="Centre visit slip" className="yr-card" style={slipStyle}>
      <h3 style={{ textAlign: "center", margin: "0 0 0.75rem" }}>Walk-In Ready Pass</h3>

      <div style={{ textAlign: "center", margin: "0 0 0.75rem" }}>
        <span className="yr-hint" style={{ display: "block" }}>
          Reference Token ID
        </span>
        <strong style={{ fontFamily: "monospace", fontSize: "1.1rem", letterSpacing: "0.04em" }}>{token}</strong>
      </div>

      <p style={{ margin: "0.25rem 0" }}>
        <strong>Scheme:</strong> {scheme.name} ({scheme.id})
      </p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Applicant:</strong> {member.name}
      </p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Selected Centre:</strong> {center.name}
      </p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Address:</strong> {center.address}
      </p>

      <p style={{ margin: "0.6rem 0 0.25rem" }}>
        <strong>Documents</strong>
      </p>
      <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
        {checked.map((doc) => (
          <li key={`c-${doc}`}>☑ {doc}</li>
        ))}
        {unchecked.map((doc) => (
          <li key={`u-${doc}`}>☐ {doc}</li>
        ))}
      </ul>

      <div style={buttonRowStyle}>
        <button type="button" className="yr-btn-secondary" onClick={handleCopy} style={{ flex: "1 1 140px" }}>
          Copy Slip
        </button>
        <button type="button" className="yr-btn-mint" onClick={handleWhatsApp} style={{ flex: "1 1 140px" }}>
          Share on WhatsApp
        </button>
      </div>
      <div style={{ marginTop: "0.5rem" }}>
        <button type="button" className="yr-btn-secondary yr-btn-full" onClick={onClose}>
          Close Slip
        </button>
      </div>
      <div role="status" className="yr-hint" style={{ marginTop: "0.35rem" }}>
        {copyStatus === "copied" && "Copied"}
        {copyStatus === "unsupported" && "Copy not supported in this browser."}
        {copyStatus === "failed" && "Could not copy the slip. Please copy it manually."}
      </div>
    </section>
  );
}
