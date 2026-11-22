import type { CriterionResult, HouseholdProfile, Member, MatchResult, Scheme } from "../types";

const NO_PARENT = "No parent in household";
const NO_PROFILE = "Profile not provided";
const OBC_CATEGORIES: readonly string[] = ["OBC-2A", "OBC-2B", "OBC-3A", "OBC-3B"];

/**
 * Pure rules evaluation of one scheme for one member of a household.
 * - appliesTo 'self' / 'child': subject is the member.
 * - appliesTo 'parent': occupation and landholding are checked against the Father;
 *   age and income are checked against the member.
 * - profile (optional): household-level fields (ration card, income tax/GST) used by
 *   the rules that need them. Without a profile those rules fail.
 */
export function evaluateScheme(
  scheme: Scheme,
  member: Member,
  household: Member[],
  profile?: HouseholdProfile,
): MatchResult {
  const rules = scheme.rules;
  const reasons: CriterionResult[] = [];
  const father = household.find((m) => m.relationship === "Father");
  const isParentScheme = rules.appliesTo === "parent";
  const subject: Member | undefined = isParentScheme ? father : member;

  if (rules.ageMin !== undefined) {
    reasons.push({
      criterion: "Minimum age",
      expected: `>= ${rules.ageMin}`,
      actual: String(member.age),
      passed: member.age >= rules.ageMin,
    });
  }

  if (rules.ageMaxByCategory !== undefined) {
    const byCategory = rules.ageMaxByCategory;
    let effectiveMax = rules.ageMax;
    let group: string = member.category;
    if (OBC_CATEGORIES.includes(member.category) && byCategory.OBC !== undefined) {
      effectiveMax = byCategory.OBC;
      group = "OBC";
    } else if ((member.category === "SC" || member.category === "ST") && byCategory.SC_ST !== undefined) {
      effectiveMax = byCategory.SC_ST;
      group = member.category;
    }
    if (effectiveMax !== undefined) {
      reasons.push({
        criterion: "Age (maximum, by category)",
        expected: `${rules.ageMin ?? 0} to ${effectiveMax} (${group})`,
        actual: String(member.age),
        passed: member.age <= effectiveMax,
      });
    }
  } else if (rules.ageMax !== undefined) {
    reasons.push({
      criterion: "Maximum age",
      expected: `<= ${rules.ageMax}`,
      actual: String(member.age),
      passed: member.age <= rules.ageMax,
    });
  }

  if (rules.incomeMax !== undefined) {
    reasons.push({
      criterion: "Maximum annual income",
      expected: `<= ${rules.incomeMax}`,
      actual: String(member.annualIncome),
      passed: member.annualIncome <= rules.incomeMax,
    });
  }

  if (rules.allowedCategories !== undefined) {
    reasons.push({
      criterion: "Allowed category",
      expected: rules.allowedCategories.join(", "),
      actual: member.category,
      passed: rules.allowedCategories.includes(member.category),
    });
  }

  if (rules.allowedOccupations !== undefined) {
    const label = isParentScheme ? "Allowed occupation (Father)" : "Allowed occupation";
    if (!subject) {
      reasons.push({
        criterion: label,
        expected: rules.allowedOccupations.join(", "),
        actual: NO_PARENT,
        passed: false,
      });
    } else {
      reasons.push({
        criterion: label,
        expected: rules.allowedOccupations.join(", "),
        actual: subject.occupation,
        passed: rules.allowedOccupations.includes(subject.occupation),
      });
    }
  }

  if (rules.requiresLandholding !== undefined) {
    const label = isParentScheme ? "Landholding required (Father)" : "Landholding required";
    if (!subject) {
      reasons.push({
        criterion: label,
        expected: String(rules.requiresLandholding),
        actual: NO_PARENT,
        passed: false,
      });
    } else {
      reasons.push({
        criterion: label,
        expected: String(rules.requiresLandholding),
        actual: String(subject.hasLandholding),
        passed: subject.hasLandholding === rules.requiresLandholding,
      });
    }
  }

  if (rules.requiresPost10thDomains !== undefined) {
    const expected = rules.requiresPost10thDomains.join(", ");
    if (!subject) {
      reasons.push({
        criterion: "Post-10th domain",
        expected,
        actual: NO_PARENT,
        passed: false,
      });
    } else if (subject.occupation !== "Student") {
      reasons.push({
        criterion: "Post-10th domain",
        expected,
        actual: "Not a student",
        passed: false,
      });
    } else if (!subject.passed10th) {
      reasons.push({
        criterion: "Post-10th domain",
        expected,
        actual: "Not passed 10th (SSLC)",
        passed: false,
      });
    } else {
      const domain = subject.post10thDomain ?? "None";
      const requiredDomains = rules.requiresPost10thDomains as string[];
      const exactMatch = subject.post10thDomain !== null && requiredDomains.includes(subject.post10thDomain);
      // Postgraduate is at least the UG level, so it also satisfies a UG requirement.
      const postgraduateMeetsUg =
        subject.post10thDomain === "Postgraduate / Master's & Above" && requiredDomains.includes("UG Degree - BA/BSc/BCom");
      reasons.push({
        criterion: "Post-10th domain",
        expected,
        actual: domain,
        passed: exactMatch || postgraduateMeetsUg,
      });
    }
  }

  if (rules.requiresPassed10th) {
    reasons.push({
      criterion: "Passed 10th (SSLC)",
      expected: "Yes",
      actual: member.passed10th ? "Yes" : "No",
      passed: member.passed10th === true,
    });
  }

  if (rules.requiresRationCardNotNone) {
    reasons.push({
      criterion: "Ration card type",
      expected: "Not None",
      actual: profile ? profile.rationCardType : NO_PROFILE,
      passed: profile !== undefined && profile.rationCardType !== "None",
    });
  }

  if (rules.requiresNotPayingTax) {
    reasons.push({
      criterion: "Family pays Income Tax/GST",
      expected: "No",
      actual: profile ? (profile.anyMemberPaysIncomeTaxOrGst ? "Yes" : "No") : NO_PROFILE,
      passed: profile !== undefined && !profile.anyMemberPaysIncomeTaxOrGst,
    });
  }

  if (rules.mentionReservations && (member.pwbd || member.ruralKannadaMediumQuota)) {
    reasons.push({
      criterion: "Reservation quota",
      expected: "PwBD or Rural/Kannada medium",
      actual: `PwBD: ${member.pwbd ? "Yes" : "No"}; Rural/Kannada medium: ${member.ruralKannadaMediumQuota ? "Yes" : "No"}`,
      passed: true,
    });
  }

  return {
    eligible: reasons.every((r) => r.passed),
    reasons,
  };
}

/** Evaluates every scheme against every household member (full cross product). */
export function matchHousehold(
  members: Member[],
  schemes: Scheme[],
  profile?: HouseholdProfile,
): { member: Member; scheme: Scheme; result: MatchResult }[] {
  const pairs: { member: Member; scheme: Scheme; result: MatchResult }[] = [];
  for (const member of members) {
    for (const scheme of schemes) {
      pairs.push({ member, scheme, result: evaluateScheme(scheme, member, members, profile) });
    }
  }
  return pairs;
}
