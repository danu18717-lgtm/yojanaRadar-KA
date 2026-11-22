import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHousehold } from "../state/householdStore";
import type { HouseholdProfile, Member } from "../types";
import { normalizeIndianPhone, openWhatsAppAlert } from "../utils/whatsappAlert";

const RATION_OPTIONS: HouseholdProfile["rationCardType"][] = ["Antyodaya AAY", "BPL", "APL", "None"];

/** The primary person is the member recorded as Self or Head. */
const isPrimary = (m: Member) => m.relationship === "Self" || m.relationship === "Head";

const sectionStyle = {
  background: "#fff",
  border: "1px solid #EBECEF",
  borderRadius: 18,
  padding: 14,
  marginTop: 12,
} as const;

const sectionTitleStyle = {
  margin: "0 0 8px",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--plum)",
} as const;

const errorStyle = { color: "var(--red)", fontSize: 12, margin: "4px 0 0" } as const;

const smallButtonStyle = {
  minHeight: 44,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid #D1D5DB",
  background: "#FFFFFF",
  color: "#111827",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 600,
} as const;

/** Household profile overlay: account holder, household attributes and family members. */
export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { members, profile, phone, updateMember, updateProfile, clearHousehold } = useHousehold();
  const navigate = useNavigate();
  const whatsAppNumber = normalizeIndianPhone(phone);

  const anchor = members.find(isPrimary) ?? members[0];
  const initial = anchor?.name.trim().charAt(0).toUpperCase() || "YR";

  // Account holder name
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (!anchor || !trimmed) return;
    const { id, ...fields } = anchor;
    updateMember(id, { ...fields, name: trimmed });
    setEditingName(false);
  };

  // Household attributes
  const [editingHouse, setEditingHouse] = useState(false);
  const [districtDraft, setDistrictDraft] = useState("");
  const [pincodeDraft, setPincodeDraft] = useState("");
  const [rationDraft, setRationDraft] = useState<HouseholdProfile["rationCardType"]>("None");
  const [houseError, setHouseError] = useState("");

  const startHouseEdit = () => {
    setDistrictDraft(profile.district);
    setPincodeDraft(profile.pincode);
    setRationDraft(profile.rationCardType);
    setHouseError("");
    setEditingHouse(true);
  };

  const cancelHouseEdit = () => {
    setHouseError("");
    setEditingHouse(false);
  };

  const saveHouse = () => {
    if (!/^\d{6}$/.test(pincodeDraft)) {
      setHouseError("Pincode must be exactly 6 digits.");
      return;
    }
    updateProfile({ district: districtDraft.trim(), pincode: pincodeDraft, rationCardType: rationDraft });
    setHouseError("");
    setEditingHouse(false);
  };

  const annualIncome = members.reduce((sum, m) => sum + m.annualIncome, 0);
  const membersWithLand = members.filter((m) => m.hasLandholding).length;

  const manageMembers = () => {
    navigate("/members");
    onClose();
  };

  /** Clears the household and onboarding state and closes; the app then returns to onboarding Step 1. */
  const startOver = () => {
    clearHousehold();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Household profile"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#F8F9FB",
          borderRadius: 20,
          maxWidth: 480,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
          padding: 16,
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span className="yr-avatar" style={{ width: 56, height: 56, fontSize: 22 }} aria-hidden="true">
              {initial}
            </span>
            <strong style={{ color: "var(--plum)", fontSize: 17 }}>Household Profile</strong>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ ...smallButtonStyle, minWidth: 44, padding: 0, fontSize: 22 }}>
            ×
          </button>
        </div>

        {/* Section 1: Account holder */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Account holder</h3>
          {editingName ? (
            <div>
              <label className="yr-label" htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                className="yr-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" className="yr-btn-mint" onClick={saveName} style={{ minHeight: 44 }}>
                  Save
                </button>
                <button type="button" onClick={() => setEditingName(false)} style={smallButtonStyle}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontWeight: 700 }}>{anchor?.name ?? "Not added yet"}</span>
              {anchor && (
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(anchor.name);
                    setEditingName(true);
                  }}
                  style={{ ...smallButtonStyle, color: "var(--plum)" }}
                >
                  Edit
                </button>
              )}
            </div>
          )}

          <p style={{ margin: "6px 0 0", fontWeight: 600 }}>{phone ? `+91 ${phone}` : "Not added yet"}</p>


          <div style={{ marginTop: 12 }}>
            <span
              style={{
                display: "inline-block",
                background: "#E7F6EE",
                color: "#0F7A43",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Free Plan (Up to 6 Members)
            </span>
          </div>
        </section>

        {/* WhatsApp deadline alerts: status card only (no stored toggle) */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>WhatsApp Deadline Alerts</h3>
          <p style={{ margin: "6px 0 0", fontWeight: 600 }}>
            {whatsAppNumber ? `+91 ${whatsAppNumber}` : "No number saved"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            {whatsAppNumber ? "Ready to send" : "Add a mobile number to enable alerts"}
          </p>
          <button
            type="button"
            className="yr-btn-secondary yr-btn-full"
            onClick={() =>
              openWhatsAppAlert(phone, "YojanaRadar KA test alert: your WhatsApp deadline alerts are working.")
            }
            style={{ marginTop: 12 }}
          >
            Send Test Alert Now
          </button>
        </section>

        {/* Section 2: Household attributes */}
        <section style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Household</h3>
            {!editingHouse && (
              <button type="button" onClick={startHouseEdit} style={{ ...smallButtonStyle, color: "var(--plum)" }}>
                Edit Household
              </button>
            )}
          </div>

          {editingHouse ? (
            <div>
              <label className="yr-label" htmlFor="profile-district">District</label>
              <input
                id="profile-district"
                className="yr-input"
                value={districtDraft}
                onChange={(e) => setDistrictDraft(e.target.value)}
              />
              <label className="yr-label" htmlFor="profile-pincode">Pincode</label>
              <input
                id="profile-pincode"
                className="yr-input"
                inputMode="numeric"
                maxLength={6}
                value={pincodeDraft}
                onChange={(e) => setPincodeDraft(e.target.value.replace(/\D/g, ""))}
              />
              <label className="yr-label" htmlFor="profile-ration">Ration card</label>
              <select
                id="profile-ration"
                className="yr-select"
                value={rationDraft}
                onChange={(e) => setRationDraft(e.target.value as HouseholdProfile["rationCardType"])}
              >
                {RATION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {houseError && <p role="alert" style={errorStyle}>{houseError}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button type="button" className="yr-btn-mint" onClick={saveHouse} style={{ minHeight: 44 }}>
                  Save
                </button>
                <button type="button" onClick={cancelHouseEdit} style={smallButtonStyle}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="yr-chip-grid" style={{ marginTop: 8 }}>
              <div className="yr-chip"><strong>{profile.district || "Not added yet"}</strong>District</div>
              <div className="yr-chip"><strong>{profile.pincode || "Not added yet"}</strong>Pincode</div>
              <div className="yr-chip"><strong>{profile.rationCardType}</strong>Ration card</div>
              <div className="yr-chip">
                <strong>₹{annualIncome.toLocaleString("en-IN")}</strong>Annual household income (sum)
              </div>
              <div className="yr-chip"><strong>{membersWithLand}</strong>Members with land</div>
            </div>
          )}

          <p className="yr-hint" style={{ marginTop: 10 }}>
            Privacy Protected: Zero Aadhaar or sensitive IDs stored.
          </p>
        </section>

        {/* Section 3: Family members */}
        <section style={sectionStyle}>
          <h3 style={sectionTitleStyle}>Family members</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {members.map((m) => (
              <li
                key={m.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "#F9FAFB", borderRadius: 12, padding: "8px 10px" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Age {m.age} · {m.occupation}
                  </div>
                </div>
                <span className="yr-badge-type">{m.relationship}</span>
              </li>
            ))}
          </ul>
          {members.length === 0 && <p className="yr-hint" style={{ marginTop: 8 }}>Not added yet</p>}
          <button type="button" className="yr-btn-secondary yr-btn-full" onClick={manageMembers} style={{ marginTop: 12 }}>
            + Manage Family Members
          </button>
        </section>

        {/* Reset / Start Over */}
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            className="yr-btn-secondary yr-btn-full"
            onClick={startOver}
            style={{ color: "#B00020" }}
          >
            Reset / Switch Phone Number
          </button>
        </div>
      </div>
    </div>
  );
}
