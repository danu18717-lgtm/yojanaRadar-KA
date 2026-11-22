import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Category, HouseholdProfile, Member, RationCardType } from '../types';
import { useHousehold } from '../state/householdStore';
import MemberForm from './MemberForm';
import { ChevronRight, Plus } from './NaviIcons';
import './MembersPage.css';

const CATEGORY_LABELS: Record<Category, string> = {
  General: 'General',
  'OBC-2A': 'OBC - 2A',
  'OBC-2B': 'OBC - 2B',
  'OBC-3A': 'OBC - 3A',
  'OBC-3B': 'OBC - 3B',
  SC: 'SC',
  ST: 'ST',
  Minority: 'Minority',
};

const RATION_CARD_OPTIONS: RationCardType[] = ['Antyodaya AAY', 'BPL', 'APL', 'None'];
const PINCODE_PATTERN = /^\d{6}$/;
const currency = new Intl.NumberFormat('en-IN');

/** Sheet target: a member being edited, or 'new' for the add form. */
type SheetTarget = Member | 'new' | null;

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

interface ProfileRowProps {
  label: string;
  value: string;
}

function ProfileRow({ label, value }: ProfileRowProps) {
  return (
    <div className="yr-members-kv">
      <span className="yr-members-kv-label">{label}</span>
      <strong className="yr-members-kv-value">{value}</strong>
    </div>
  );
}

interface DetailProps {
  label: string;
  value: string;
}

function Detail({ label, value }: DetailProps) {
  return (
    <div className="yr-members-detail">
      <dt className="yr-members-detail-label">{label}</dt>
      <dd className="yr-members-detail-value">{value}</dd>
    </div>
  );
}

export default function MembersPage() {
  const { members, addMember, updateMember, profile, updateProfile } = useHousehold();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetTarget>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [draft, setDraft] = useState<HouseholdProfile>(profile);
  const [profileError, setProfileError] = useState<string | null>(null);

  function startProfileEdit() {
    setDraft(profile);
    setProfileError(null);
    setEditingProfile(true);
  }

  function handleProfileSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pincode = draft.pincode.trim();
    if (!PINCODE_PATTERN.test(pincode)) {
      setProfileError('Pincode must be exactly 6 digits.');
      return;
    }
    updateProfile({
      district: draft.district.trim(),
      pincode,
      rationCardType: draft.rationCardType,
      anyMemberPaysIncomeTaxOrGst: draft.anyMemberPaysIncomeTaxOrGst,
      ownsPuccaHouse: draft.ownsPuccaHouse,
    });
    setProfileError(null);
    setEditingProfile(false);
  }

  function closeSheet() {
    setSheet(null);
  }

  return (
    <section className="yr-members-page">
      <h1 className="yr-members-title">Members</h1>

      {/* Household summary card */}
      <div className="yr-members-card yr-members-household">
        <div className="yr-members-card-head">
          <h2 className="yr-members-card-title">Household</h2>
          {!editingProfile && (
            <button type="button" className="yr-members-text-btn" onClick={startProfileEdit}>
              Edit
            </button>
          )}
        </div>

        {editingProfile ? (
          <form onSubmit={handleProfileSave} noValidate>
            <label className="yr-label">
              District
              <input
                type="text"
                className="yr-input"
                value={draft.district}
                onChange={(e) => setDraft({ ...draft, district: e.target.value })}
              />
            </label>

            <label className="yr-label">
              Pincode (6 digits)
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="yr-input"
                value={draft.pincode}
                onChange={(e) => setDraft({ ...draft, pincode: e.target.value })}
              />
            </label>

            <label className="yr-label">
              Ration Card Type
              <select
                className="yr-select"
                value={draft.rationCardType}
                onChange={(e) => setDraft({ ...draft, rationCardType: e.target.value as RationCardType })}
              >
                {RATION_CARD_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="yr-label">
              Income Tax / GST paid by a member?
              <select
                className="yr-select"
                value={draft.anyMemberPaysIncomeTaxOrGst ? 'yes' : 'no'}
                onChange={(e) => setDraft({ ...draft, anyMemberPaysIncomeTaxOrGst: e.target.value === 'yes' })}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label className="yr-label">
              Owns a pucca house?
              <select
                className="yr-select"
                value={draft.ownsPuccaHouse ? 'yes' : 'no'}
                onChange={(e) => setDraft({ ...draft, ownsPuccaHouse: e.target.value === 'yes' })}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            {profileError && (
              <p role="alert" className="yr-danger-text">
                {profileError}
              </p>
            )}

            <div className="yr-members-inline-actions">
              <button type="submit" className="yr-btn-primary yr-members-save-btn">
                Save
              </button>
              <button
                type="button"
                className="yr-btn-secondary yr-members-save-btn"
                onClick={() => {
                  setProfileError(null);
                  setEditingProfile(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="yr-members-kv-list">
            <ProfileRow label="District" value={profile.district} />
            <ProfileRow label="Pincode" value={profile.pincode} />
            <ProfileRow label="Ration Card Type" value={profile.rationCardType} />
            <ProfileRow label="Income Tax / GST" value={yesNo(profile.anyMemberPaysIncomeTaxOrGst)} />
            <ProfileRow label="Pucca House" value={yesNo(profile.ownsPuccaHouse)} />
          </div>
        )}
      </div>

      {/* Member accordion */}
      {members.length === 0 && <p className="yr-members-empty">No family members added yet — tap + Add Member to begin</p>}

      {members.length > 0 && (
        <div className="yr-members-card yr-members-list">
          {members.map((member, index) => {
            const isOpen = expandedId === member.id;
            const panelId = `yr-members-panel-${member.id}`;
            return (
              <div key={member.id} className="yr-members-item">
                <button
                  type="button"
                  className="yr-members-row"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setExpandedId(isOpen ? null : member.id)}
                >
                  <span
                    className="yr-members-avatar"
                    style={{ background: index % 2 === 0 ? '#00A859' : '#230833' }}
                    aria-hidden="true"
                  >
                    {initialOf(member.name)}
                  </span>
                  <span className="yr-members-row-text">
                    <span className="yr-members-name">{member.name}</span>
                    <span className="yr-members-rel">{member.relationship}</span>
                  </span>
                  <span
                    className={isOpen ? 'yr-members-chevron yr-members-chevron-open' : 'yr-members-chevron'}
                    aria-hidden="true"
                  >
                    <ChevronRight size={20} tone="muted" />
                  </span>
                </button>

                {isOpen && (
                  <div id={panelId} className="yr-members-panel">
                    <dl className="yr-members-detail-grid">
                      <Detail label="Age" value={String(member.age)} />
                      <Detail label="Occupation" value={member.occupation} />
                      <Detail label="Category" value={CATEGORY_LABELS[member.category]} />
                      <Detail label="Annual Income" value={`₹${currency.format(member.annualIncome)}`} />
                      <Detail label="Landholding" value={yesNo(member.hasLandholding)} />
                      <Detail label="Marital Status" value={member.maritalStatus ?? 'Not set'} />
                      <Detail label="PwBD" value={yesNo(member.pwbd)} />
                    </dl>

                    {member.passed10th && (
                      <span className="yr-members-pill">Post-10th: {member.post10thDomain ?? 'Not set'}</span>
                    )}

                    <button type="button" className="yr-members-edit-btn" onClick={() => setSheet(member)}>
                      Edit Details
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className="yr-members-add-btn"
        onClick={() => setSheet('new')}
      >
        <Plus size={18} />
        <span>Add New Member</span>
      </button>

      {/* Bottom sheet */}
      {sheet !== null && (
        <>
          <div className="yr-members-backdrop" onClick={closeSheet} aria-hidden="true" />
          <div
            className="yr-members-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={sheet === 'new' ? 'Add family member' : `Edit ${sheet.name}`}
          >
            <div className="yr-members-grab" aria-hidden="true" />
            <h3 className="yr-members-sheet-title">{sheet === 'new' ? 'Add family member' : `Edit ${sheet.name}`}</h3>
            {sheet === 'new' ? (
              <MemberForm
                key="new"
                onSave={(data) => {
                  addMember(data);
                  closeSheet();
                }}
                onCancel={closeSheet}
              />
            ) : (
              <MemberForm
                key={sheet.id}
                initial={sheet}
                onSave={(data) => {
                  updateMember(sheet.id, data);
                  closeSheet();
                }}
                onCancel={closeSheet}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}
