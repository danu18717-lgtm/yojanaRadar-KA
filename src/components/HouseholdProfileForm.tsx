import { useHousehold } from '../state/householdStore';
import type { RationCardType } from '../types';

const RATION_CARD_OPTIONS: RationCardType[] = ['Antyodaya AAY', 'BPL', 'APL', 'None'];

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
          style={{ minHeight: '44px' }}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === false}
          className={value === false ? 'yr-segment-active' : 'yr-segment'}
          style={{ minHeight: '44px' }}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

export default function HouseholdProfileForm() {
  const { profile, updateProfile } = useHousehold();

  return (
    <div className="yr-card">
      <h3 style={{ margin: '0 0 0.25rem' }}>Household details</h3>
      <p className="yr-hint" style={{ marginTop: 0 }}>
        Entered once for the whole family
      </p>

      <label className="yr-label">
        District
        <input
          type="text"
          className="yr-input"
          value={profile.district}
          onChange={(e) => updateProfile({ district: e.target.value })}
        />
      </label>

      <label className="yr-label">
        6-Digit Pincode
        <input
          type="text"
          className="yr-input"
          inputMode="numeric"
          maxLength={6}
          value={profile.pincode}
          onChange={(e) => updateProfile({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
        />
      </label>

      <label className="yr-label">
        Ration Card Type
        <select
          className="yr-select"
          value={profile.rationCardType}
          onChange={(e) => updateProfile({ rationCardType: e.target.value as RationCardType })}
        >
          {RATION_CARD_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <YesNo
        label="Any Family Member Pays Income Tax / GST"
        value={profile.anyMemberPaysIncomeTaxOrGst}
        onChange={(next) => updateProfile({ anyMemberPaysIncomeTaxOrGst: next })}
      />

      <YesNo
        label="Owns a Pucca House"
        value={profile.ownsPuccaHouse}
        onChange={(next) => updateProfile({ ownsPuccaHouse: next })}
      />

      <p className="yr-hint">
        Used for centre locator defaults and eligibility context. Do not enter Aadhaar or other government ID numbers.
      </p>
    </div>
  );
}
