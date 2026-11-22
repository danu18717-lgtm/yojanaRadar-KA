import { describe, it, expect } from "vitest";
import { parseCircular } from "./parseCircular";

const SAMPLE = `Government of Karnataka - Department of Skill Development
Karnataka Samarthya Yuva Kaushalya Yojana - Notification
This scheme provides a one-time benefit of Rs. 10,000 for skill training.
Eligible persons must be aged 18 to 35 years.
Annual family income should be less than Rs. 2,50,000.
Open to SC, ST and OBC-2A category candidates.
Applicants must be Unemployed.
Applications must be submitted through authorized Grama One center.
Documents required:
- Ration card copy
- Caste certificate
- Bank passbook copy
`;

describe("parseCircular", () => {
  it("extracts rules from a sample Karnataka circular", () => {
    const { scheme, notes } = parseCircular(SAMPLE, "2026-11-21");

    expect(scheme.rules.ageMin).toBe(18);
    expect(scheme.rules.ageMax).toBe(35);
    expect(scheme.rules.incomeMax).toBe(250000);
    expect(scheme.rules.allowedCategories).toEqual(expect.arrayContaining(["SC", "OBC-2A"]));
    expect(scheme.rules.allowedOccupations).toContain("Unemployed");
    expect(scheme.applicationMode).toBe("CENTER_ONLY");
    expect(scheme.lastVerified).toBe("2026-11-21");
    expect(scheme.officialUrl).toBe("");
    expect(notes).toContain("No official URL found in circular; enter manually.");
  });

  it("classifies an exam circular and extracts an ISO last date", () => {
    const text = `KPSC Recruitment Examination 2026 - Notification
Applications are invited for the post of Assistant Engineer.
Last date: 2026-12-01
`;
    const { scheme } = parseCircular(text, "2026-11-21");
    expect(scheme.type).toBe("EXAM");
    expect(scheme.last_date).toBe("2026-12-01");
  });
});
