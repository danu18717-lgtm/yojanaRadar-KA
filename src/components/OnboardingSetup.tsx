import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { readSavedHousehold, useHousehold } from "../state/householdStore";
import type { SavedHousehold } from "../state/householdStore";
import type {
  Category,
  Gender,
  Member,
  Occupation,
  Relationship,
  RationCardType,
} from "../types";
import {
  EDUCATION_STAGE_OPTIONS,
  FOLLOW_CUSTOM,
  PUC_FOLLOW_UP_OPTIONS,
  STAGE_CUSTOM,
  blankEducationSelection,
  educationFromMember,
  educationProblems,
  educationToFields,
  finalRecordedQualification,
  isPucStage,
} from "./educationOptions";
import type { EducationSelection } from "./educationOptions";

const DISTRICT_OPTIONS: string[] = [
  "Bagalkote",
  "Ballari",
  "Belagavi",
  "Bengaluru Rural",
  "Bengaluru Urban",
  "Bidar",
  "Chamarajanagar",
  "Chikkaballapura",
  "Chikkamagaluru",
  "Chitradurga",
  "Dakshina Kannada",
  "Davanagere",
  "Dharwad",
  "Gadag",
  "Hassan",
  "Haveri",
  "Kalaburagi",
  "Kodagu",
  "Kolar",
  "Koppal",
  "Mandya",
  "Mysuru",
  "Raichur",
  "Ramanagara",
  "Shivamogga",
  "Tumakuru",
  "Udupi",
  "Uttara Kannada",
  "Vijayanagara",
  "Vijayapura",
  "Yadgir",
];

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Other"];

const CATEGORY_OPTIONS: Category[] = ["General", "OBC-2A", "OBC-2B", "OBC-3A", "OBC-3B", "SC", "ST"];

// Relation choices for every member (Member 1 included). "Head" and "Self" both count as the primary person.
const RELATION_OPTIONS: string[] = ["Self", "Son", "Daughter", "Brother", "Sister", "Head", "Spouse", "Father", "Mother", "Other"];

// Salaried and Self-Employed have no matching Occupation value, so both map to "Daily Wage Worker" (see OCCUPATION_MAP).
const OCCUPATION_OPTIONS: string[] = ["Farmer", "Student", "Unemployed", "Homemaker", "Salaried", "Self-Employed"];
const OCCUPATION_MAP: Record<string, Occupation> = {
  Farmer: "Farmer",
  Student: "Student",
  Unemployed: "Unemployed",
  Homemaker: "Homemaker",
  Salaried: "Daily Wage Worker",
  "Self-Employed": "Daily Wage Worker",
};


const RATION_OPTIONS: { value: RationCardType; label: string }[] = [
  { value: "BPL", label: "BPL" },
  { value: "APL", label: "APL" },
  { value: "Antyodaya AAY", label: "Antyodaya AAY" },
  { value: "None", label: "None" },
];

const FREE_TIER_MEMBERS = 6;

const CAUTION_STYLE = {
  background: "#FFF4E5",
  border: "1px solid #F5A524",
  color: "#7A4B00",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  marginTop: 8,
} as const;

const BANNER_STYLE = {
  background: "#E7F6EE",
  border: "1px solid #0F7A43",
  color: "#0F7A43",
  borderRadius: 12,
  padding: "10px 12px",
  fontSize: 14,
  marginTop: 8,
} as const;

const BADGE_STYLE = {
  display: "inline-block",
  background: "#F3F4F6",
  color: "var(--muted)",
  borderRadius: 999,
  padding: "4px 10px",
  fontSize: 12,
  marginTop: 6,
} as const;

const PINCODE_PATTERN = /^\d{6}$/;

/** Quick-tap family sizes; "7" is shown as "7+" and sets the same value as typing 7. */
const QUICK_MEMBER_COUNTS: string[] = ["1", "2", "3", "4", "5", "6", "7"];

// Presentational styles (the app does not use Tailwind, so these reproduce the design spec inline).
const CARD_STACK_STYLE: CSSProperties = {
  background: "#fff",
  border: "1px solid rgba(226,232,240,0.8)",
  borderRadius: 16,
  boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const HERO_STYLE: CSSProperties = {
  background: "linear-gradient(135deg, #230833 0%, #4B1D6B 60%, #2B1B5C 100%)",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 8px 24px rgba(35,8,51,0.35)",
  padding: 18,
  marginBottom: 20,
};

const HERO_BADGE_STYLE: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  background: "#00A859",
  color: "#fff",
  fontWeight: 700,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const HERO_PILL_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  background: "rgba(255,255,255,0.14)",
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: 999,
  fontSize: 11,
  color: "#fff",
  whiteSpace: "nowrap",
};

const MOBILE_BOX_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  border: "1px solid #CBD5E1",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fff",
};

const MOBILE_PREFIX_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  alignSelf: "stretch",
  padding: "0 12px",
  background: "#F8FAFC",
  borderRight: "1px solid #E2E8F0",
  fontWeight: 600,
  color: "#230833",
};

const MOBILE_INPUT_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  width: "auto",
  margin: 0,
  padding: "12px",
  border: "none",
  borderRadius: 0,
  outline: "none",
  background: "transparent",
};

const CHIP_BASE: CSSProperties = {
  minHeight: 36,
  minWidth: 40,
  padding: "0 12px",
  borderRadius: 999,
  border: "1px solid #CBD5E1",
  background: "#fff",
  color: "#374151",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

function chipStyle(selected: boolean): CSSProperties {
  return selected
    ? { ...CHIP_BASE, background: "#230833", borderColor: "#230833", color: "#fff" }
    : CHIP_BASE;
}

const CTA_STYLE: CSSProperties = {
  width: "100%",
  minHeight: 48,
  borderRadius: 12,
  background: "#230833",
  color: "#fff",
  fontWeight: 700,
  boxShadow: "0 6px 16px rgba(35,8,51,0.25)",
  transition: "transform 0.1s",
};

/** Press effect for the primary CTA: applied directly to the button, so no extra state is needed. */
function setCtaPressed(e: { currentTarget: HTMLElement }, pressed: boolean) {
  e.currentTarget.style.transform = pressed ? "scale(0.98)" : "";
}

const PROGRESS_PILL_BASE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
};

const NUMBER_CIRCLE_BASE: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
  flexShrink: 0,
};

/** Branded hero banner at the top of the wizard (both steps). */
function BrandHero() {
  return (
    <div style={HERO_STYLE}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={HERO_BADGE_STYLE}>YR</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>YojanaRadar KA</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 2 }}>ಕರ್ನಾಟಕ ಯೋಜನಾ ರಾಡಾರ್</div>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#fff", lineHeight: 1.5, margin: "14px 0 12px" }}>
        Check all Karnataka welfare schemes (Gruhalakshmi, SSP, Yuvanidhi) &amp; KEA/KPSC recruitment eligibility for
        your entire family in 60 seconds.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {["✓ All 31 Districts", "✓ No OTP Needed", "✓ WhatsApp Alerts"].map((text) => (
          <span key={text} style={HERO_PILL_STYLE}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Two-step progress indicator. Step 1 is "Household Basics"; step 2 is "Family Members". */
function StepProgress({
  onFamilyStep,
  memberNumber,
  memberTotal,
}: {
  onFamilyStep: boolean;
  memberNumber: number;
  memberTotal: number;
}) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
      {onFamilyStep ? (
        <div style={{ ...PROGRESS_PILL_BASE, background: "#E5E7EB", color: "#374151" }}>
          <span style={{ ...NUMBER_CIRCLE_BASE, background: "#00A859", color: "#fff" }}>✓</span>
          <span>Household Basics</span>
        </div>
      ) : (
        <div style={{ ...PROGRESS_PILL_BASE, background: "#230833", color: "#fff" }}>
          <span style={{ ...NUMBER_CIRCLE_BASE, background: "rgba(255,255,255,0.2)", color: "#fff" }}>1</span>
          <span>Household Basics</span>
        </div>
      )}
      {onFamilyStep ? (
        <div style={{ ...PROGRESS_PILL_BASE, background: "#230833", color: "#fff" }}>
          <span style={{ ...NUMBER_CIRCLE_BASE, background: "rgba(255,255,255,0.2)", color: "#fff" }}>2</span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span>Family Members</span>
            <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>{`Member ${memberNumber} of ${memberTotal}`}</span>
          </span>
        </div>
      ) : (
        <div style={{ ...PROGRESS_PILL_BASE, background: "#E5E7EB", color: "#6B7280" }}>
          <span style={{ ...NUMBER_CIRCLE_BASE, background: "#fff", color: "#6B7280" }}>2</span>
          <span>Family Members</span>
        </div>
      )}
    </div>
  );
}

/** One family member's answers while the wizard is in progress. Selects keep their UI labels until save. */
interface MemberDraft extends EducationSelection {
  name: string;
  relation: string;
  age: string;
  gender: Gender | "";
  category: Category | "";
  occupation: string;
  income: string;
}

function blankDraft(name: string, relation: string): MemberDraft {
  return {
    ...blankEducationSelection(),
    name,
    relation,
    age: "",
    gender: "",
    category: "",
    occupation: "",
    income: "",
  };
}

/** Rebuilds a wizard draft from a saved member so Edit / Re-enter can pre-fill the member forms. */
function draftFromMember(m: Member): MemberDraft {
  const draft = blankDraft(m.name, m.relationship);
  draft.age = String(m.age);
  draft.gender = m.gender;
  draft.category = m.category;
  draft.occupation = m.occupation === "Daily Wage Worker" ? "Salaried" : m.occupation;
  draft.income = String(m.annualIncome);
  return { ...draft, ...educationFromMember(m) };
}

function validateDraft(d: MemberDraft, index: number): string[] {
  const problems: string[] = [];
  const ageNum = Number(d.age);
  const incomeNum = Number(d.income);
  if (d.name.trim() === "") problems.push("Full name is required.");
  if (d.relation === "") problems.push("Choose a relation.");
  if (d.age.trim() === "" || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
    problems.push("Age must be a number between 0 and 120.");
  }
  if (d.gender === "") problems.push("Choose a gender.");
  if (d.category === "") problems.push("Choose a social category.");
  if (d.occupation === "") problems.push("Choose an occupation.");
  problems.push(...educationProblems(d));
  if (d.income.trim() === "" || Number.isNaN(incomeNum) || incomeNum < 0) {
    problems.push("Annual income must be 0 or more.");
  }
  return problems.map((msg) => `Member ${index + 1}: ${msg}`);
}

/** Converts a validated draft into the store's Member shape (id is assigned by addMember). */
function toMember(d: MemberDraft): Omit<Member, "id"> {
  const edu = educationToFields(d);
  return {
    name: d.name.trim(),
    relationship: d.relation as Relationship,
    age: Number(d.age),
    gender: d.gender as Gender,
    category: d.category as Category,
    occupation: OCCUPATION_MAP[d.occupation],
    annualIncome: Number(d.income),
    hasLandholding: false,
    passed10th: edu.passed10th,
    post10thDomain: edu.post10thDomain,
    maritalStatus: null,
    pwbd: false,
    ruralKannadaMediumQuota: false,
    educationStatus: null,
  };
}

/**
 * First-time setup wizard: step 1 captures the mobile number (household key), household basics and the family size
 * (any whole number >= 1), then one step per family member. Entries stay in state across steps; nothing is saved
 * until the final member is saved. If a household is already saved under the mobile number, Step 1 offers to load it.
 */
export default function OnboardingSetup() {
  const { addMember, updateProfile, setOnboardingComplete, setPhone, loadSavedHousehold } = useHousehold();

  const [step, setStep] = useState<"basics" | "member">("basics");
  const [mobile, setMobile] = useState("");
  const [savedChoice, setSavedChoice] = useState<"pending" | "edit">("pending");
  const [district, setDistrict] = useState("");
  const [pincode, setPincode] = useState("");
  const [ration, setRation] = useState<RationCardType | "">("");
  const [total, setTotal] = useState("");
  const [drafts, setDrafts] = useState<MemberDraft[]>([blankDraft("", "")]);
  const [memberIndex, setMemberIndex] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const mobileValid = MOBILE_PATTERN.test(mobile);
  const savedHousehold: SavedHousehold | null = mobileValid ? readSavedHousehold(mobile) : null;
  const showBanner = savedHousehold !== null && savedChoice === "pending";

  const totalNum = Number(total);
  const totalValid = total.trim() !== "" && Number.isInteger(totalNum) && totalNum >= 1;
  const planned = totalValid ? totalNum : 0;
  const totalProblem =
    total.trim() === "" || totalValid ? "" : "Enter a whole number of family members, 1 or more.";

  function updateDraft(index: number, patch: Partial<MemberDraft>) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function handleMobileChange(value: string) {
    setMobile(value.replace(/\D/g, "").slice(0, 10));
    setSavedChoice("pending");
  }

  function handleLoadSaved() {
    if (savedHousehold) loadSavedHousehold(savedHousehold);
  }

  function handleEditSaved() {
    if (!savedHousehold) return;
    const members = savedHousehold.members;
    setDistrict(savedHousehold.district);
    setPincode(savedHousehold.pincode);
    setRation(savedHousehold.rationCardType);
    setTotal(members.length > 0 ? String(members.length) : "");
    setDrafts(members.length > 0 ? members.map(draftFromMember) : [blankDraft("", "")]);
    setSavedChoice("edit");
    setErrors([]);
  }

  function handleBasicsContinue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problems: string[] = [];
    if (!mobileValid) problems.push("Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.");
    if (district === "") problems.push("Choose your Karnataka district.");
    if (!PINCODE_PATTERN.test(pincode)) problems.push("Pincode must be exactly 6 digits.");
    if (ration === "") problems.push("Choose a ration card type.");
    if (total.trim() === "") problems.push("Enter the total number of family members.");

    setErrors(problems);
    if (problems.length > 0 || !totalValid) return;

    setPhone(mobile);
    setDrafts((prev) =>
      Array.from({ length: planned }, (_, i) => prev[i] ?? blankDraft("", "")),
    );
    setMemberIndex(0);
    setStep("member");
  }

  function handleMemberNext(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const problems = validateDraft(drafts[memberIndex], memberIndex);
    setErrors(problems);
    if (problems.length > 0) return;

    if (memberIndex < planned - 1) {
      setMemberIndex(memberIndex + 1);
      setErrors([]);
      return;
    }

    if (ration === "") return;
    updateProfile({ district: district.trim(), pincode, rationCardType: ration });
    drafts.slice(0, planned).forEach((d) => addMember(toMember(d)));
    setOnboardingComplete(true);
  }

  function handleBack() {
    setErrors([]);
    if (memberIndex > 0) {
      setMemberIndex(memberIndex - 1);
    } else {
      setStep("basics");
    }
  }

  if (step === "basics") {
    return (
      <section
        className="yr-page"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 32px)",
          paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <BrandHero />
        <StepProgress onFamilyStep={false} memberNumber={0} memberTotal={0} />
        <h1 className="yr-section-title">Household &amp; Self Setup</h1>
        <h2 className="yr-section-title">Household basics</h2>
        <p className="yr-hint">Enter your household details, then add each family member one by one.</p>

        <form onSubmit={handleBasicsContinue} noValidate>
          <div style={CARD_STACK_STYLE}>
          <label className="yr-label">
            Mobile Number (+91) *
            <div style={MOBILE_BOX_STYLE}>
              <span style={MOBILE_PREFIX_STYLE}>+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className="yr-input"
                style={MOBILE_INPUT_STYLE}
                value={mobile}
                placeholder="10-digit mobile number"
                onChange={(e) => handleMobileChange(e.target.value)}
              />
            </div>
          </label>

          {showBanner && savedHousehold && (
            <div role="status" style={BANNER_STYLE}>
              <p style={{ margin: "0 0 8px" }}>
                {`Welcome back! Saved household found for +91 ${mobile} (${savedHousehold.members.length} members).`}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button type="button" className="yr-btn-primary yr-btn-full" onClick={handleLoadSaved}>
                  Load Saved Household &amp; Open Home
                </button>
                <button type="button" className="yr-btn-secondary yr-btn-full" onClick={handleEditSaved}>
                  Edit / Re-enter Details
                </button>
              </div>
            </div>
          )}

          <label className="yr-label">
            Karnataka District *
            <select className="yr-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">-- Select District --</option>
              {DISTRICT_OPTIONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="yr-label">
            Pincode (6 digits) *
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="yr-input"
              value={pincode}
              placeholder="e.g., 570001"
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            />
          </label>

          <label className="yr-label">
            Ration Card Type *
            <select
              className="yr-select"
              value={ration}
              onChange={(e) => setRation(e.target.value as RationCardType | "")}
            >
              <option value="">-- Select --</option>
              {RATION_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="yr-label">
            Total number of members in the family *
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="yr-input"
              value={total}
              placeholder="e.g., 4"
              onChange={(e) => setTotal(e.target.value)}
            />
          </label>
          <div role="group" aria-label="Quick select family size" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_MEMBER_COUNTS.map((n) => {
              const selected = n === "7" ? totalNum >= 7 : total === n;
              return (
                <button key={n} type="button" onClick={() => setTotal(n)} style={chipStyle(selected)}>
                  {n === "7" ? "7+" : n}
                </button>
              );
            })}
          </div>
          {totalProblem && <p className="yr-danger-text">{totalProblem}</p>}
          {totalValid && planned > FREE_TIER_MEMBERS && (
            <div role="status" style={CAUTION_STYLE}>
              Caution: The Free Citizen tier covers up to 6 family members. Adding 7 or more members requires a
              minimal subscription of ₹29/month (Priority Pass) to unlock full multi-member matching &amp; alerts.
            </div>
          )}
          </div>

          {errors.length > 0 && (
            <div role="alert">
              {errors.map((msg) => (
                <p key={msg} className="yr-danger-text">
                  {msg}
                </p>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="yr-btn-primary yr-btn-full"
            style={CTA_STYLE}
            onMouseDown={(e) => setCtaPressed(e, true)}
            onTouchStart={(e) => setCtaPressed(e, true)}
            onMouseUp={(e) => setCtaPressed(e, false)}
            onMouseLeave={(e) => setCtaPressed(e, false)}
            onTouchEnd={(e) => setCtaPressed(e, false)}
          >
            Continue to Member 1 Details →
          </button>
        </form>
      </section>
    );
  }

  const i = memberIndex + 1;
  const d = drafts[memberIndex];
  const isLast = i === planned;
  const heading = `Member ${i} of ${planned}`;

  return (
    <section
      className="yr-page"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 32px)",
        paddingBottom: "calc(40px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <BrandHero />
      <StepProgress onFamilyStep memberNumber={i} memberTotal={planned} />

      <form onSubmit={handleMemberNext} noValidate>
        <div style={CARD_STACK_STYLE}>
          <h1 className="yr-section-title">{heading}</h1>

        <label className="yr-label">
          Full Name *
          <input
            type="text"
            className="yr-input"
            value={d.name}
            onChange={(e) => updateDraft(memberIndex, { name: e.target.value })}
          />
        </label>

        <label className="yr-label">
          Relation *
          <select
            className="yr-select"
            value={d.relation}
            onChange={(e) => updateDraft(memberIndex, { relation: e.target.value })}
          >
            <option value="">-- Select --</option>
            {RELATION_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="yr-label">
          Age *
          <input
            type="number"
            className="yr-input"
            min={0}
            max={120}
            value={d.age}
            onChange={(e) => updateDraft(memberIndex, { age: e.target.value })}
          />
        </label>

        <label className="yr-label">
          Gender *
          <select
            className="yr-select"
            value={d.gender}
            onChange={(e) => updateDraft(memberIndex, { gender: e.target.value as Gender | "" })}
          >
            <option value="">-- Select --</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="yr-label">
          Social Category *
          <select
            className="yr-select"
            value={d.category}
            onChange={(e) => updateDraft(memberIndex, { category: e.target.value as Category | "" })}
          >
            <option value="">-- Select --</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="yr-label">
          Occupation *
          <select
            className="yr-select"
            value={d.occupation}
            onChange={(e) => updateDraft(memberIndex, { occupation: e.target.value })}
          >
            <option value="">-- Select --</option>
            {OCCUPATION_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label className="yr-label">
          Education Qualification *
          <select
            className="yr-select"
            value={d.stage}
            onChange={(e) => updateDraft(memberIndex, { stage: e.target.value })}
          >
            <option value="">-- Select --</option>
            {EDUCATION_STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {d.stage === STAGE_CUSTOM && (
          <label className="yr-label">
            Enter Custom Qualification / Domain *
            <input
              type="text"
              className="yr-input"
              value={d.customStage}
              placeholder="e.g. B.Pharm, D.Ed, Nursing, M.Sc Computer Science, CA"
              onChange={(e) => updateDraft(memberIndex, { customStage: e.target.value })}
            />
          </label>
        )}

        {isPucStage(d.stage) && (
          <label className="yr-label">
            Qualification After PUC (Bachelor&apos;s / Higher Degree) *
            <select
              className="yr-select"
              value={d.puFollowUp}
              onChange={(e) => updateDraft(memberIndex, { puFollowUp: e.target.value })}
            >
              {PUC_FOLLOW_UP_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        )}

        {isPucStage(d.stage) && d.puFollowUp === FOLLOW_CUSTOM && (
          <label className="yr-label">
            Enter Bachelor&apos;s / Higher Degree *
            <input
              type="text"
              className="yr-input"
              value={d.customFollowUp}
              placeholder="e.g. B.Pharm, BCA, B.Ed, M.Com"
              onChange={(e) => updateDraft(memberIndex, { customFollowUp: e.target.value })}
            />
          </label>
        )}

        {d.stage !== "" && <div style={BADGE_STYLE}>Final Recorded Qualification: {finalRecordedQualification(d)}</div>}

        <label className="yr-label">
          Annual Income (₹) (as per Income Certificate) *
          <input
            type="number"
            className="yr-input"
            min={0}
            value={d.income}
            onChange={(e) => updateDraft(memberIndex, { income: e.target.value })}
          />
        </label>

        {errors.length > 0 && (
          <div role="alert">
            {errors.map((msg) => (
              <p key={msg} className="yr-danger-text">
                {msg}
              </p>
            ))}
          </div>
        )}

        </div>

        <button type="submit" className="yr-btn-primary yr-btn-full">
          {isLast ? "Save & Open Home Screen" : `Save & Next Member (Member ${i + 1} of ${planned})`}
        </button>
        <button type="button" className="yr-btn-secondary yr-btn-full" onClick={handleBack}>
          Back
        </button>
      </form>
    </section>
  );
}
