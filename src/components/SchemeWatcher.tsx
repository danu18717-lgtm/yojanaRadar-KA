import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { ApplicationMode, Category, Occupation, Scheme, SchemeType } from "../types";
import { useSchemes } from "../state/schemeStore";
import { useHousehold } from "../state/householdStore";
import { useNotifications } from "../state/notificationStore";
import { matchHousehold } from "../engine/match";
import { parseCircular } from "../engine/parseCircular";

const TODAY = "2026-11-21";

interface Option<T extends string> {
  value: T;
  label: string;
}

const CATEGORY_OPTIONS: Category[] = ["General", "OBC-2A", "OBC-2B", "OBC-3A", "OBC-3B", "SC", "ST", "Minority"];
const OCCUPATION_OPTIONS: Occupation[] = ["Student", "Farmer", "Homemaker", "Unemployed", "Daily Wage Worker"];
const MODE_OPTIONS: Option<ApplicationMode>[] = [
  { value: "ONLINE_ONLY", label: "Online only" },
  { value: "CENTER_ONLY", label: "Centre only" },
  { value: "BOTH", label: "Online or centre" },
];
const TYPE_OPTIONS: Option<SchemeType>[] = [
  { value: "SCHEME", label: "Welfare Scheme" },
  { value: "GOVT_JOB", label: "Govt Job" },
  { value: "EXAM", label: "Exam" },
];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const SAMPLE_CIRCULAR = `Government of Karnataka, Department of Skill Development and Employment
Karnataka Samarthya Yuva Kaushalya Yojana: Notification for 2026-27
The scheme provides a one-time skill training grant to eligible youth.
Eligible persons must be aged 18 to 30 years on the date of application.
The annual family income should be less than Rs. 3,00,000.
The scheme is open to OBC-2A and SC/ST candidates. Applicant must be Unemployed.
Applications must be submitted through authorised Grama One or Karnataka One centre.
Apply and track status at https://sevasindhu.karnataka.gov.in/
Documents required:
- Ration card copy
- Caste certificate
- Bank passbook copy`;

/** Splits a comma-separated list, trims items, and keeps only known values. */
function parseKnownList<T extends string>(raw: string, known: readonly T[]): T[] {
  const items = raw.split(",").map((s) => s.trim());
  const result: T[] = [];
  for (const item of items) {
    const match = known.find((k) => k.toLowerCase() === item.toLowerCase());
    if (match !== undefined && !result.includes(match)) result.push(match);
  }
  return result;
}

function parseOptionalNumber(raw: string): number | undefined | null {
  // undefined = blank (clear the rule); null = invalid (ignore edit).
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = Number(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function labelFor<T extends string>(options: Option<T>[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

interface EditableFieldProps {
  id: string;
  label: string;
  editorValue: string;
  /** Return false to reject the edit; the field then shows the stored value again. */
  onCommit: (raw: string) => boolean | void;
  type?: "text" | "number";
  options?: Option<string>[];
  hint?: string;
  error?: string | null;
}

/** Stacked form field. Commits on blur or Enter; Escape discards the draft. */
function EditableField({ id, label, editorValue, onCommit, type = "text", options, hint, error }: EditableFieldProps) {
  const [draft, setDraft] = useState(editorValue);

  // Keep the draft in step with the stored value (after a save, or when it changes elsewhere).
  useEffect(() => {
    setDraft(editorValue);
  }, [editorValue]);

  function commit() {
    if (draft === editorValue) return;
    if (onCommit(draft) === false) setDraft(editorValue);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setDraft(editorValue);
    }
  }

  const fieldStyle = { minHeight: "44px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label className="yr-label" htmlFor={id}>
        {label}
      </label>
      {options ? (
        <select
          id={id}
          className="yr-select"
          style={fieldStyle}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          className="yr-input"
          style={fieldStyle}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      )}
      {hint && <span className="yr-hint">{hint}</span>}
      {error && (
        <div role="alert" style={{ color: "#b00020", fontSize: "0.8rem" }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default function SchemeWatcher() {
  const { schemes, updateScheme, addScheme } = useSchemes();
  const { members, profile } = useHousehold();
  const { addNotification } = useNotifications();

  const [text, setText] = useState(SAMPLE_CIRCULAR);
  const [notes, setNotes] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [dateError, setDateError] = useState<{ id: string; msg: string } | null>(null);

  const circularRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  function focusCircular() {
    circularRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    textRef.current?.focus({ preventScroll: true });
  }

  function handleScan() {
    const { scheme, notes: parseNotes } = parseCircular(text, TODAY);
    addScheme(scheme);
    setNotes(parseNotes);

    const hits = matchHousehold(members, [scheme], profile).filter((x) => x.result.eligible);
    for (const { member } of hits) {
      addNotification(
        `${member.name} (${member.relationship}) is Likely Eligible for ${scheme.name}`,
        scheme.id,
        member.id,
      );
    }
    setStatus(
      hits.length > 0
        ? `${hits.length} household member(s) matched`
        : "No current household member matched.",
    );
  }

  return (
    <section className="yr-page">
      <h1 className="yr-section-title">Scheme Watcher</h1>
      <p className="yr-hint">
        Scheme rules are editable data. Do not enter Aadhaar or other government ID numbers.
      </p>

      <div className="yr-cta-wrap">
        <button type="button" className="yr-btn-primary yr-btn-full" onClick={focusCircular}>
          Scan New Govt Circular
        </button>
      </div>

      <div ref={circularRef} className="yr-card" style={{ marginBottom: "1rem" }}>
        <label className="yr-label" htmlFor="circular-text">
          Monitor / Parse New Govt Circular
        </label>
        <textarea
          id="circular-text"
          ref={textRef}
          className="yr-textarea"
          aria-label="Government circular text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          style={{ width: "100%", fontFamily: "monospace", marginTop: "0.4rem" }}
        />
        <div style={{ marginTop: "0.75rem" }}>
          <button
            type="button"
            className="yr-btn-primary yr-btn-full"
            onClick={handleScan}
            disabled={text.trim() === ""}
          >
            Scan &amp; Extract Rules
          </button>
        </div>

        {(status !== null || notes.length > 0) && (
          <div className="yr-card" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
            <h4 style={{ margin: "0 0 0.5rem" }}>Scan status</h4>
            {status !== null && (
              <p aria-live="polite" style={{ margin: "0 0 0.5rem" }}>
                {status}
              </p>
            )}
            {notes.length > 0 && (
              <>
                <strong>Fields not extracted:</strong>
                <ul>
                  {notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <h2 className="yr-section-title">Schemes</h2>
      {schemes.map((s: Scheme) => {
        const r = s.rules;
        const categories = (r.allowedCategories ?? []).join(", ");
        const occupations = (r.allowedOccupations ?? []).join(", ");
        const typeValue = s.type ?? "SCHEME";
        return (
          <article key={s.id} className="yr-card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>{s.name}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <span className="yr-badge-type">{labelFor(TYPE_OPTIONS, typeValue)}</span>
              <span className="yr-hint">Last date: {s.last_date ?? "Ongoing"}</span>
            </div>
            <p className="yr-hint" style={{ margin: "0 0 0.25rem" }}>
              Application mode: {labelFor(MODE_OPTIONS, s.applicationMode)}
            </p>
            <p className="yr-hint" style={{ margin: "0 0 0.75rem", wordBreak: "break-all" }}>
              Official URL:{" "}
              {s.officialUrl ? (
                <a href={s.officialUrl} target="_blank" rel="noopener noreferrer">
                  {s.officialUrl}
                </a>
              ) : (
                "—"
              )}
            </p>
            <p className="yr-hint" style={{ margin: "0 0 0.75rem" }}>
              Last verified: {s.lastVerified}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <EditableField
                id={`${s.id}-name`}
                label="Name"
                editorValue={s.name}
                onCommit={(raw) => {
                  const v = raw.trim();
                  if (v === "") return false;
                  updateScheme(s.id, { name: v });
                }}
              />

              <EditableField
                id={`${s.id}-type`}
                label="Type"
                editorValue={typeValue}
                options={TYPE_OPTIONS}
                onCommit={(raw) => {
                  const t = TYPE_OPTIONS.find((o) => o.value === raw);
                  if (t === undefined) return false;
                  updateScheme(s.id, { type: t.value });
                }}
              />

              <EditableField
                id={`${s.id}-last-date`}
                label="Last Date"
                editorValue={s.last_date ?? ""}
                hint="YYYY-MM-DD or Ongoing"
                error={dateError?.id === s.id ? dateError.msg : null}
                onCommit={(raw) => {
                  const v = raw.trim();
                  if (v === "Ongoing" || DATE_PATTERN.test(v)) {
                    setDateError(null);
                    updateScheme(s.id, { last_date: v });
                  } else {
                    setDateError({ id: s.id, msg: "Use YYYY-MM-DD or Ongoing" });
                    return false;
                  }
                }}
              />

              <EditableField
                id={`${s.id}-age-min`}
                type="number"
                label="Min age"
                editorValue={r.ageMin !== undefined ? String(r.ageMin) : ""}
                onCommit={(raw) => {
                  const v = parseOptionalNumber(raw);
                  if (v === null) return false;
                  updateScheme(s.id, { rules: { ...s.rules, ageMin: v } });
                }}
              />

              <EditableField
                id={`${s.id}-age-max`}
                type="number"
                label="Max age"
                editorValue={r.ageMax !== undefined ? String(r.ageMax) : ""}
                onCommit={(raw) => {
                  const v = parseOptionalNumber(raw);
                  if (v === null) return false;
                  updateScheme(s.id, { rules: { ...s.rules, ageMax: v } });
                }}
              />

              <EditableField
                id={`${s.id}-income-max`}
                type="number"
                label="Income max (₹)"
                editorValue={r.incomeMax !== undefined ? String(r.incomeMax) : ""}
                onCommit={(raw) => {
                  const v = parseOptionalNumber(raw);
                  if (v === null) return false;
                  updateScheme(s.id, { rules: { ...s.rules, incomeMax: v } });
                }}
              />

              <EditableField
                id={`${s.id}-categories`}
                label="Allowed categories"
                editorValue={categories}
                hint={`Comma-separated: ${CATEGORY_OPTIONS.join(", ")}`}
                onCommit={(raw) => {
                  const list = parseKnownList(raw, CATEGORY_OPTIONS);
                  if (raw.trim() !== "" && list.length === 0) return false;
                  updateScheme(s.id, {
                    rules: { ...s.rules, allowedCategories: list.length > 0 ? list : undefined },
                  });
                }}
              />

              <EditableField
                id={`${s.id}-occupations`}
                label="Allowed occupations"
                editorValue={occupations}
                hint={`Comma-separated: ${OCCUPATION_OPTIONS.join(", ")}`}
                onCommit={(raw) => {
                  const list = parseKnownList(raw, OCCUPATION_OPTIONS);
                  if (raw.trim() !== "" && list.length === 0) return false;
                  updateScheme(s.id, {
                    rules: { ...s.rules, allowedOccupations: list.length > 0 ? list : undefined },
                  });
                }}
              />

              <EditableField
                id={`${s.id}-mode`}
                label="Application mode"
                editorValue={s.applicationMode}
                options={MODE_OPTIONS}
                onCommit={(raw) => {
                  const mode = MODE_OPTIONS.find((m) => m.value === raw);
                  if (mode === undefined) return false;
                  updateScheme(s.id, { applicationMode: mode.value });
                }}
              />

              <EditableField
                id={`${s.id}-url`}
                label="Official URL"
                editorValue={s.officialUrl}
                onCommit={(raw) => {
                  updateScheme(s.id, { officialUrl: raw.trim() });
                }}
              />
            </div>
          </article>
        );
      })}
    </section>
  );
}
