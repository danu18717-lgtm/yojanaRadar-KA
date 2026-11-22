import type { Category, Member } from '../types';

export interface MemberCardProps {
  member: Member;
  onEdit: () => void;
}

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

const currency = new Intl.NumberFormat('en-IN');

/** First letter of each of the first two words, uppercase. */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

interface ChipProps {
  label: string;
  value: string;
}

function Chip({ label, value }: ChipProps) {
  return (
    <div className="yr-chip">
      <span className="yr-hint">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function MemberCard({ member, onEdit }: MemberCardProps) {
  const isStudent = member.occupation === 'Student';

  return (
    <div className="yr-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="yr-avatar" aria-hidden="true">
          {initialsOf(member.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{member.name}</div>
          <div className="yr-hint">{member.relationship}</div>
        </div>
      </div>

      <div className="yr-chip-grid" style={{ marginTop: '0.75rem' }}>
        <Chip label="Age" value={String(member.age)} />
        <Chip label="Occupation" value={member.occupation} />
        <Chip label="Category" value={CATEGORY_LABELS[member.category]} />
        <Chip label="Annual Income" value={`₹${currency.format(member.annualIncome)}`} />
        <Chip label="Landholding" value={member.hasLandholding ? 'Yes' : 'No'} />
        <Chip label="Marital status" value={member.maritalStatus ?? 'Not set'} />
        <Chip label="PwBD" value={member.pwbd ? 'Yes' : 'No'} />
      </div>

      {isStudent && (
        <p className="yr-badge-type" style={{ marginTop: '0.75rem' }}>
          {member.passed10th
            ? `Post-10th: ${member.post10thDomain ?? 'Not set'}`
            : 'SSLC not passed yet'}
        </p>
      )}

      {member.educationStatus && (
        <p className="yr-hint" style={{ marginTop: '0.5rem' }}>
          Education: {member.educationStatus}
        </p>
      )}

      <div style={{ marginTop: '0.75rem' }}>
        <button
          type="button"
          className="yr-btn-secondary"
          aria-label={`Edit ${member.name}`}
          style={{ minHeight: '44px' }}
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
