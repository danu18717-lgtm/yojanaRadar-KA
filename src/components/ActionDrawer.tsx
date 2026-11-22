import { useState } from "react";
import type { CSSProperties } from "react";
import { centers } from "../data/seed";
import type { Center, Member, Scheme } from "../types";
import CenterLocator from "./CenterLocator";
import VisitSlip from "./VisitSlip";

interface ActionDrawerProps {
  scheme: Scheme;
  member: Member;
  onClose: () => void;
}

const sectionStyle: CSSProperties = { marginTop: "1.25rem" };

const checkRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  minHeight: 44,
  cursor: "pointer",
};

const checkboxStyle: CSSProperties = {
  width: 22,
  height: 22,
  flexShrink: 0,
  margin: 0,
  accentColor: "#1E6B34",
};

const linkButtonStyle: CSSProperties = {
  textDecoration: "none",
  textAlign: "center",
  boxSizing: "border-box",
};

const alertStyle: CSSProperties = {
  border: "1px solid #B26A00",
  background: "#FFF4E0",
  borderRadius: 12,
  padding: "0.75rem",
  fontSize: "0.95rem",
};

export default function ActionDrawer({ scheme, member, onClose }: ActionDrawerProps) {
  // Indexes into scheme.documents that the applicant has ticked. Per drawer instance.
  const [checked, setChecked] = useState<Set<number>>(() => new Set());
  const [selected, setSelected] = useState<{ center: Center; distanceKm?: number } | null>(null);

  const checkedDocs = scheme.documents.filter((_, i) => checked.has(i));
  const uncheckedDocs = scheme.documents.filter((_, i) => !checked.has(i));

  const toggleDoc = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <>
      <div className="yr-sheet-backdrop" aria-hidden="true" onClick={onClose} />
      <div className="yr-sheet" role="dialog" aria-modal="true" aria-label="Check Documents & Apply">
        <div className="yr-sheet-grab" aria-hidden="true" />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <h2 className="yr-section-title" style={{ margin: 0 }}>
            Check Documents &amp; Apply
          </h2>
          <button type="button" className="yr-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={sectionStyle}>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>Scheme:</strong> {scheme.name}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>Applicant:</strong> {member.name} ({member.relationship})
          </p>
        </div>

        <div style={sectionStyle}>
          <h3 className="yr-section-title">Document checklist</h3>
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
            {scheme.documents.map((doc, index) => (
              <li key={`${index}-${doc}`}>
                <label style={checkRowStyle}>
                  <input
                    type="checkbox"
                    checked={checked.has(index)}
                    onChange={() => toggleDoc(index)}
                    style={checkboxStyle}
                  />
                  <span>{doc}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div style={sectionStyle}>
          <h3 className="yr-section-title">Application mode</h3>
          {scheme.applicationMode === "CENTER_ONLY" ? (
            <div role="alert" style={alertStyle}>
              Citizen self-application is not permitted for this scheme. It must be submitted through an authorised
              Grama One or Karnataka One centre. Select a centre below.
            </div>
          ) : (
            <div>
              <a
                href={scheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="yr-btn-primary yr-btn-full"
                style={linkButtonStyle}
              >
                Apply on Official Portal ↗
              </a>
              <p className="yr-hint" style={{ margin: "0.5rem 0 0.25rem", wordBreak: "break-all" }}>
                {scheme.officialUrl}
              </p>
              <p className="yr-hint" style={{ margin: 0 }}>
                Last Verified: {scheme.lastVerified}
              </p>
            </div>
          )}
        </div>

        <div style={sectionStyle}>
          <CenterLocator
            centers={centers}
            onSelect={(center, distanceKm) => setSelected({ center, distanceKm })}
          />
        </div>

        {selected && (
          <div style={sectionStyle}>
            <VisitSlip
              key={selected.center.id}
              scheme={scheme}
              member={member}
              center={selected.center}
              checked={checkedDocs}
              unchecked={uncheckedDocs}
              onClose={() => setSelected(null)}
            />
            <button
              type="button"
              className="yr-btn-secondary"
              onClick={() => setSelected(null)}
              style={{ marginTop: "0.75rem" }}
            >
              Back to centres
            </button>
          </div>
        )}
      </div>
    </>
  );
}
