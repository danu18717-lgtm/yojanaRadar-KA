import { useState } from 'react';
import type { FormEvent } from 'react';
import type {
  Category,
  EducationStatus,
  Gender,
  MaritalStatus,
  Member,
  Occupation,
  Relationship,
} from '../types';
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
} from './educationOptions';
import type { EducationSelection } from './educationOptions';

export interface MemberFormProps {
  initial?: Member;
  onSave: (data: Omit<Member, 'id'>) => void;
  onCancel: () => void;
}

const RELATIONSHIPS: Relationship[] = ['Self', 'Son', 'Daughter', 'Brother', 'Sister', 'Head', 'Spouse', 'Father', 'Mother', 'Other'];
const GENDERS: Gender[] = ['Male', 'Female', 'Other'];

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'General', label: 'General' },
  { value: 'OBC-2A', label: 'OBC - 2A' },
  { value: 'OBC-2B', label: 'OBC - 2B' },
  { value: 'OBC-3A', label: 'OBC - 3A' },
  { value: 'OBC-3B', label: 'OBC - 3B' },
  { value: 'SC', label: 'SC' },
  { value: 'ST', label: 'ST' },
  { value: 'Minority', label: 'Minority' },
];

const OCCUPATIONS: Occupation[] = ['Student', 'Farmer', 'Homemaker', 'Unemployed', 'Daily Wage Worker'];

const OCCUPATION_LABELS: Record<Occupation, string> = {
  Student: 'Student',
  Farmer: 'Farmer',
  Homemaker: 'Homemaker',
  Unemployed: 'Unemployed / Job Seeker',
  'Daily Wage Worker': 'Daily Wage Worker',
};

const MARITAL_STATUSES: MaritalStatus[] = ['Unmarried', 'Married', 'Widowed', 'Divorced'];
const EDUCATION_STATUSES: EducationStatus[] = ['Currently Studying', 'Completed'];


const touchTarget = { minHeight: '44px' };

const BADGE_STYLE = {
  display: 'inline-block',
  background: '#F3F4F6',
  color: 'var(--muted)',
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  marginTop: 6,
} as const;

interface YesNoProps {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}

/** Two-button Yes/No choice using the segmented control classes. */
function YesNo({ label, value, onChange }: YesNoProps) {
  return (
    <div className="yr-label">
      <span>{label}</span>
      <div role="radiogroup" aria-label={label} className="yr-segmented">
        <button
          type="button"
          role="radio"
          aria-checked={value === true}
          className={value === true ? 'yr-segment-active' : 'yr-segment'}
          style={touchTarget}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          className={value === false ? 'yr-segment-active' : 'yr-segment'}
          style={touchTarget}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

export default function MemberForm({ initial, onSave, onCancel }: MemberFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [relationship, setRelationship] = useState<Relationship | ''>(initial?.relationship ?? '');
  const [age, setAge] = useState<string>(initial ? String(initial.age) : '');
  const [gender, setGender] = useState<Gender>(initial?.gender ?? 'Male');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'General');
  const [occupation, setOccupation] = useState<Occupation>(initial?.occupation ?? 'Unemployed');
  const [income, setIncome] = useState<string>(initial ? String(initial.annualIncome) : '');
  const [hasLandholding, setHasLandholding] = useState<boolean>(initial?.hasLandholding ?? false);
  const [edu, setEdu] = useState<EducationSelection>(
    initial ? educationFromMember(initial) : blankEducationSelection(),
  );
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>(initial?.maritalStatus ?? '');
  const [pwbd, setPwbd] = useState<boolean>(initial?.pwbd ?? false);
  const [ruralKannadaMediumQuota, setRuralKannadaMediumQuota] = useState<boolean>(
    initial?.ruralKannadaMediumQuota ?? false,
  );
  const [educationStatus, setEducationStatus] = useState<EducationStatus | ''>(initial?.educationStatus ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  const showEducation = occupation === 'Student' || occupation === 'Unemployed';

  function updateEdu(patch: Partial<EducationSelection>) {
    setEdu((prev) => ({ ...prev, ...patch }));
  }

  function handleOccupationChange(next: Occupation) {
    setOccupation(next);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const problems: string[] = [];
    const ageNum = Number(age);
    const incomeNum = Number(income);

    if (name.trim() === '') {
      problems.push('Name is required.');
    }
    if (age.trim() === '' || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      problems.push('Age must be a number between 0 and 120.');
    }
    if (income.trim() === '' || Number.isNaN(incomeNum) || incomeNum < 0) {
      problems.push('Annual family income must be 0 or more.');
    }
    if (relationship === '') {
      problems.push('Choose a relation.');
    }
    problems.push(...educationProblems(edu));

    setErrors(problems);
    if (problems.length > 0) {
      return;
    }

    const education = educationToFields(edu);
    onSave({
      name: name.trim(),
      relationship: relationship as Relationship,
      age: ageNum,
      gender,
      category,
      occupation,
      annualIncome: incomeNum,
      hasLandholding,
      passed10th: education.passed10th,
      post10thDomain: education.post10thDomain,
      maritalStatus: maritalStatus === '' ? null : maritalStatus,
      pwbd,
      ruralKannadaMediumQuota,
      educationStatus: showEducation && educationStatus !== '' ? educationStatus : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="yr-label">
        Name *
        <input
          type="text"
          className="yr-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className="yr-label">
        Relationship
        <select
          className="yr-select"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as Relationship | '')}
        >
          <option value="">-- Select --</option>
          {RELATIONSHIPS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <p className="yr-hint">Who is this person in your family?</p>

      <label className="yr-label">
        Age *
        <input
          type="number"
          className="yr-input"
          min={0}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
      </label>

      <label className="yr-label">
        Gender
        <select className="yr-select" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
          {GENDERS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="yr-label">
        Caste / Category
        <select
          className="yr-select"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <p className="yr-hint">Used only to check scheme eligibility.</p>

      <label className="yr-label">
        Occupation
        <select
          className="yr-select"
          value={occupation}
          onChange={(e) => handleOccupationChange(e.target.value as Occupation)}
        >
          {OCCUPATIONS.map((o) => (
            <option key={o} value={o}>
              {OCCUPATION_LABELS[o]}
            </option>
          ))}
        </select>
      </label>

      <label className="yr-label">
        Annual Income (₹) (as per Income Certificate) *
        <input
          type="number"
          className="yr-input"
          min={0}
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          required
        />
      </label>

      <YesNo label="Agricultural Landholding" value={hasLandholding} onChange={setHasLandholding} />

      <label className="yr-label">
        Education Qualification *
        <select className="yr-select" value={edu.stage} onChange={(e) => updateEdu({ stage: e.target.value })}>
          <option value="">-- Select --</option>
          {EDUCATION_STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {edu.stage === STAGE_CUSTOM && (
        <label className="yr-label">
          Enter Custom Qualification / Domain *
          <input
            type="text"
            className="yr-input"
            value={edu.customStage}
            placeholder="e.g. B.Pharm, D.Ed, Nursing, M.Sc Computer Science, CA"
            onChange={(e) => updateEdu({ customStage: e.target.value })}
          />
        </label>
      )}

      {isPucStage(edu.stage) && (
        <label className="yr-label">
          Qualification After PUC (Bachelor&apos;s / Higher Degree) *
          <select className="yr-select" value={edu.puFollowUp} onChange={(e) => updateEdu({ puFollowUp: e.target.value })}>
            {PUC_FOLLOW_UP_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      )}

      {isPucStage(edu.stage) && edu.puFollowUp === FOLLOW_CUSTOM && (
        <label className="yr-label">
          Enter Bachelor&apos;s / Higher Degree *
          <input
            type="text"
            className="yr-input"
            value={edu.customFollowUp}
            placeholder="e.g. B.Pharm, BCA, B.Ed, M.Com"
            onChange={(e) => updateEdu({ customFollowUp: e.target.value })}
          />
        </label>
      )}

      {edu.stage !== '' && <div style={BADGE_STYLE}>Final Recorded Qualification: {finalRecordedQualification(edu)}</div>}

      <label className="yr-label">
        Marital Status
        <select
          className="yr-select"
          value={maritalStatus}
          onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus | '')}
        >
          <option value="">-- Not set --</option>
          {MARITAL_STATUSES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      <YesNo label="Disability Status (PwBD)" value={pwbd} onChange={setPwbd} />

      <YesNo label="Rural / Kannada Medium Quota" value={ruralKannadaMediumQuota} onChange={setRuralKannadaMediumQuota} />

      {showEducation && (
        <label className="yr-label">
          Education Status
          <select
            className="yr-select"
            value={educationStatus}
            onChange={(e) => setEducationStatus(e.target.value as EducationStatus | '')}
          >
            <option value="">-- Not set --</option>
            {EDUCATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}

      {errors.length > 0 && (
        <div role="alert">
          {errors.map((msg) => (
            <p key={msg} className="yr-danger-text">
              {msg}
            </p>
          ))}
        </div>
      )}

      <button type="submit" className="yr-btn-primary yr-btn-full" style={touchTarget}>
        Save Member
      </button>
      <button type="button" className="yr-btn-secondary yr-btn-full" style={{ ...touchTarget, marginTop: '0.5rem' }} onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
