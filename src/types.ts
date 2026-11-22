export type Relationship = 'Self' | 'Head' | 'Spouse' | 'Father' | 'Mother' | 'Son' | 'Daughter' | 'Brother' | 'Sister' | 'Other';
export type Gender = 'Male' | 'Female' | 'Other';
export type Category = 'General' | 'OBC-2A' | 'OBC-2B' | 'OBC-3A' | 'OBC-3B' | 'SC' | 'ST' | 'Minority';
export type Occupation = 'Student' | 'Farmer' | 'Homemaker' | 'Unemployed' | 'Daily Wage Worker';
export type Post10thDomain = 'PUC - Science' | 'PUC - Commerce/Arts' | 'ITI / Polytechnic Diploma' | 'UG Degree - BA/BSc/BCom' | 'Professional - BE/B.Tech/MBBS/Law';
/** Stored education value: a known Post10thDomain, "Postgraduate / Master's & Above", or any custom qualification text. */
export type EducationValue = Post10thDomain | "Postgraduate / Master's & Above" | (string & {});
export type SchemeType = 'SCHEME' | 'GOVT_JOB' | 'EXAM';
export type MaritalStatus = 'Unmarried' | 'Married' | 'Widowed' | 'Divorced';
export type EducationStatus = 'Currently Studying' | 'Completed';
export type RationCardType = 'Antyodaya AAY' | 'BPL' | 'APL' | 'None';

export interface Member {
  id: string;
  name: string;
  relationship: Relationship;
  age: number;
  gender: Gender;
  category: Category;
  occupation: Occupation;
  annualIncome: number;
  hasLandholding: boolean;
  passed10th: boolean;
  post10thDomain: EducationValue | null;
  maritalStatus: MaritalStatus | null;
  pwbd: boolean;
  ruralKannadaMediumQuota: boolean;
  educationStatus: EducationStatus | null;
}

export interface HouseholdProfile {
  district: string;
  pincode: string;
  rationCardType: RationCardType;
  anyMemberPaysIncomeTaxOrGst: boolean;
  ownsPuccaHouse: boolean;
}

export type ApplicationMode = 'ONLINE_ONLY' | 'CENTER_ONLY' | 'BOTH';

export interface SchemeRules {
  ageMin?: number;
  ageMax?: number;
  incomeMax?: number;
  allowedCategories?: Category[];
  allowedOccupations?: Occupation[];
  requiresLandholding?: boolean;
  requiresPost10thDomains?: Post10thDomain[];
  requiresRationCardNotNone?: boolean;
  requiresNotPayingTax?: boolean;
  requiresPassed10th?: boolean;
  ageMaxByCategory?: { OBC?: number; SC_ST?: number };
  mentionReservations?: boolean;
  appliesTo: 'self' | 'parent' | 'child';
}

export interface Scheme {
  id: string;
  name: string;
  type: SchemeType;
  last_date: string;
  benefitSummary: string;
  officialUrl: string;
  lastVerified: string;
  applicationMode: ApplicationMode;
  documents: string[];
  rules: SchemeRules;
  verificationNote: string;
}

export type CenterType = 'Grama One' | 'Karnataka One';

export interface Center {
  id: string;
  type: CenterType;
  name: string;
  address: string;
  pincode: string;
  district: string;
  lat: number;
  lng: number;
  timings: string;
  phone: string;
  mapsUrl: string;
}

export interface CriterionResult {
  criterion: string;
  expected: string;
  actual: string;
  passed: boolean;
}

export interface MatchResult {
  eligible: boolean;
  reasons: CriterionResult[];
}
