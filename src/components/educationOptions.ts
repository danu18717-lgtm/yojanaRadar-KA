import type { EducationValue, Member } from "../types";

// Shared education flow for OnboardingSetup and MemberForm: option labels, selection state and the mapping
// to the stored { passed10th, post10thDomain } pair.

export const STAGE_BELOW_10 = "Below 10th / No Formal Schooling";
export const STAGE_SSLC = "10th Pass (SSLC — Stopped after 10th)";
export const STAGE_ITI = "ITI / Polytechnic Diploma (After 10th)";
export const STAGE_PUC_SCIENCE = "PUC - Science";
export const STAGE_PUC_COMMERCE = "PUC - Commerce / Arts";
export const STAGE_CUSTOM = "Custom / Other Qualification";
export const EDUCATION_STAGE_OPTIONS: string[] = [
  STAGE_BELOW_10,
  STAGE_SSLC,
  STAGE_ITI,
  STAGE_PUC_SCIENCE,
  STAGE_PUC_COMMERCE,
  STAGE_CUSTOM,
];

export const FOLLOW_NONE = "None (PUC is Final Qualification)";
export const FOLLOW_UG = "UG Degree — BA / BSc / BCom / BBA / BCA";
export const FOLLOW_PROFESSIONAL = "Professional Degree — BE / B.Tech / MBBS / Law / B.Arch";
export const FOLLOW_PG = "Postgraduate / Master's & Above";
export const FOLLOW_CUSTOM = "Custom / Other Degree (Enter Manually)";
export const PUC_FOLLOW_UP_OPTIONS: string[] = [FOLLOW_NONE, FOLLOW_UG, FOLLOW_PROFESSIONAL, FOLLOW_PG, FOLLOW_CUSTOM];

/** Stored values for the fixed options (see Member.post10thDomain). */
const VALUE_ITI = "ITI / Polytechnic Diploma";
const VALUE_PUC_SCIENCE = "PUC - Science";
const VALUE_PUC_COMMERCE = "PUC - Commerce/Arts";
const VALUE_UG = "UG Degree - BA/BSc/BCom";
const VALUE_PROFESSIONAL = "Professional - BE/B.Tech/MBBS/Law";
const VALUE_PG = "Postgraduate / Master's & Above";

/** The user's education answers. Custom texts are used only when the matching option is selected. */
export interface EducationSelection {
  stage: string;
  customStage: string;
  puFollowUp: string;
  customFollowUp: string;
}

export function blankEducationSelection(): EducationSelection {
  return { stage: "", customStage: "", puFollowUp: FOLLOW_NONE, customFollowUp: "" };
}

export function isPucStage(stage: string): boolean {
  return stage === STAGE_PUC_SCIENCE || stage === STAGE_PUC_COMMERCE;
}

/** Problems with the education answers, without a member prefix. Empty when the selection is complete. */
export function educationProblems(sel: EducationSelection): string[] {
  const problems: string[] = [];
  if (sel.stage === "") {
    problems.push("Choose an education qualification.");
    return problems;
  }
  if (sel.stage === STAGE_CUSTOM && sel.customStage.trim() === "") {
    problems.push("Enter your custom qualification / domain.");
  }
  if (isPucStage(sel.stage) && sel.puFollowUp === FOLLOW_CUSTOM && sel.customFollowUp.trim() === "") {
    problems.push("Enter your bachelor's / higher degree.");
  }
  return problems;
}

function followUpValue(sel: EducationSelection): EducationValue | null {
  switch (sel.puFollowUp) {
    case FOLLOW_UG:
      return VALUE_UG;
    case FOLLOW_PROFESSIONAL:
      return VALUE_PROFESSIONAL;
    case FOLLOW_PG:
      return VALUE_PG;
    case FOLLOW_CUSTOM:
      return sel.customFollowUp.trim();
    default:
      return null;
  }
}

/** Maps the selection to the stored passed10th flag and post10thDomain value. */
export function educationToFields(sel: EducationSelection): { passed10th: boolean; post10thDomain: EducationValue | null } {
  if (sel.stage === "" || sel.stage === STAGE_BELOW_10) return { passed10th: false, post10thDomain: null };
  if (sel.stage === STAGE_SSLC) return { passed10th: true, post10thDomain: null };
  if (sel.stage === STAGE_ITI) return { passed10th: true, post10thDomain: VALUE_ITI };
  if (sel.stage === STAGE_CUSTOM) return { passed10th: true, post10thDomain: sel.customStage.trim() };
  // PUC streams: a follow-up degree replaces the stream value; "None" keeps the stream.
  const stream = sel.stage === STAGE_PUC_SCIENCE ? VALUE_PUC_SCIENCE : VALUE_PUC_COMMERCE;
  return { passed10th: true, post10thDomain: followUpValue(sel) ?? stream };
}

/** The qualification shown in the "Final Recorded Qualification" badge: the exact custom text when typed. */
export function finalRecordedQualification(sel: EducationSelection): string {
  if (sel.stage === "") return "";
  if (sel.stage === STAGE_CUSTOM) return sel.customStage.trim();
  if (!isPucStage(sel.stage) || sel.puFollowUp === FOLLOW_NONE) return sel.stage;
  if (sel.puFollowUp === FOLLOW_CUSTOM) return sel.customFollowUp.trim();
  return sel.puFollowUp;
}

/**
 * Rebuilds the selection from a saved member so Edit can pre-fill the form.
 * The PUC stream behind a degree is not stored, so PUC - Science is pre-selected; check it on Edit.
 * A stored value that matches no fixed option is shown as a custom qualification.
 */
export function educationFromMember(m: Pick<Member, "passed10th" | "post10thDomain">): EducationSelection {
  const sel = blankEducationSelection();
  const domain = m.post10thDomain;
  if (!m.passed10th) {
    sel.stage = STAGE_BELOW_10;
  } else if (domain === null || domain === "") {
    sel.stage = STAGE_SSLC;
  } else if (domain === VALUE_ITI) {
    sel.stage = STAGE_ITI;
  } else if (domain === VALUE_PUC_COMMERCE) {
    sel.stage = STAGE_PUC_COMMERCE;
  } else if (domain === VALUE_PUC_SCIENCE) {
    sel.stage = STAGE_PUC_SCIENCE;
  } else if (domain === VALUE_UG || domain === VALUE_PROFESSIONAL || domain === VALUE_PG) {
    sel.stage = STAGE_PUC_SCIENCE;
    sel.puFollowUp = domain === VALUE_UG ? FOLLOW_UG : domain === VALUE_PROFESSIONAL ? FOLLOW_PROFESSIONAL : FOLLOW_PG;
  } else {
    sel.stage = STAGE_CUSTOM;
    sel.customStage = domain;
  }
  return sel;
}
