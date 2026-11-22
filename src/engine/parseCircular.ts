import type {
  ApplicationMode,
  Category,
  Occupation,
  Post10thDomain,
  Scheme,
  SchemeRules,
  SchemeType,
} from "../types";

const CATEGORY_LABELS: Category[] = ["SC", "ST", "OBC-2A", "OBC-2B", "OBC-3A", "OBC-3B", "Minority", "General"];
const OCCUPATION_LABELS: Occupation[] = ["Student", "Farmer", "Homemaker", "Unemployed", "Daily Wage Worker"];
const POST_10TH_LABELS: Post10thDomain[] = [
  "PUC - Science",
  "PUC - Commerce/Arts",
  "ITI / Polytechnic Diploma",
  "UG Degree - BA/BSc/BCom",
  "Professional - BE/B.Tech/MBBS/Law",
];

/** Escapes regex metacharacters in a literal label. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a case-insensitive pattern for a literal label that tolerates optional
 * spaces around hyphens and slashes (e.g. "OBC - 2A", "OBC-2A", "OBC 2A").
 */
function labelPattern(label: string): RegExp {
  const parts = label.split(/([-/])/).map((p) => (p === "-" || p === "/" ? "\\s*" + escapeRegex(p) + "\\s*" : escapeRegex(p)));
  // Allow flexible whitespace between words too.
  const body = parts.map((p) => p.replace(/ /g, "\\s+")).join("");
  return new RegExp(`(?:^|[^A-Za-z0-9])${body}(?![A-Za-z0-9])`, "i");
}

/** Splits text into sentences on ., ! ? or newlines. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseAmount(raw: string): number | undefined {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Rule-based, offline extraction of scheme fields from a government circular.
 * Pure: no network, no LLM. Fields that cannot be extracted are listed in `notes`.
 */
export function parseCircular(text: string, today: string): { scheme: Scheme; notes: string[] } {
  const notes: string[] = [];
  const source = (text ?? "").replace(/\r\n?/g, "\n");
  const lines = source.split("\n").map((l) => l.trim());
  const nonEmpty = lines.filter((l) => l.length > 0);

  // --- name ---
  let name = "";
  const namedLine = nonEmpty.find((l) => /Scheme|Yojana|Scholarship|Pension/i.test(l));
  if (namedLine) {
    name = namedLine;
  } else if (nonEmpty.length > 0) {
    name = nonEmpty[0];
  }
  if (!name) {
    notes.push("Scheme name not found; enter manually.");
  }

  // --- rules ---
  const rules: SchemeRules = { appliesTo: "self" };

  // age range
  const rangeMatch = source.match(/aged\s+(\d+)\s+to\s+(\d+)/i) ?? source.match(/between\s+(\d+)\s+and\s+(\d+)\s+years/i);
  if (rangeMatch) {
    rules.ageMin = Number(rangeMatch[1]);
    rules.ageMax = Number(rangeMatch[2]);
  } else {
    const minMatch = source.match(/(?:above|over|minimum age of)\s+(\d+)/i);
    if (minMatch) rules.ageMin = Number(minMatch[1]);
    const maxMatch = source.match(/(?:below|under|not exceed)\s+(\d+)/i);
    if (maxMatch) rules.ageMax = Number(maxMatch[1]);
  }
  if (rules.ageMin === undefined && rules.ageMax === undefined) {
    notes.push("Age range not found; enter manually.");
  }

  // income ceiling
  const incomeMatch = source.match(
    /income[^.\n]*?(?:less than|not exceed|below|up to|upto)\s+(?:Rs\.?|₹)\s?([\d,]+)/i,
  );
  if (incomeMatch) {
    const amount = parseAmount(incomeMatch[1]);
    if (amount !== undefined) rules.incomeMax = amount;
  }
  if (rules.incomeMax === undefined) {
    notes.push("Income ceiling not found; enter manually.");
  }

  // categories
  const categories = CATEGORY_LABELS.filter((c) => labelPattern(c).test(source));
  if (categories.length > 0) {
    rules.allowedCategories = categories;
  } else {
    notes.push("Allowed categories not found; enter manually.");
  }

  // occupations
  const occupations = OCCUPATION_LABELS.filter((o) => labelPattern(o).test(source));
  if (occupations.length > 0) {
    rules.allowedOccupations = occupations;
  } else {
    notes.push("Allowed occupations not found; enter manually.");
  }

  // landholding
  if (/landholding|agricultural land/i.test(source)) {
    rules.requiresLandholding = true;
  }

  // post-10th domains
  const domains = POST_10TH_LABELS.filter((d) => labelPattern(d).test(source));
  if (domains.length > 0) {
    rules.requiresPost10thDomains = domains;
  }
  if (/SSLC/i.test(source) && /passed/i.test(source)) {
    notes.push("SSLC pass requirement mentioned; not modelled as a rule, check manually.");
  }

  // appliesTo
  if (/parent|father/i.test(source)) {
    rules.appliesTo = "parent";
  } else if (/student|\bson\b|daughter|children/i.test(source)) {
    rules.appliesTo = "child";
  } else {
    rules.appliesTo = "self";
  }

  // application mode
  let applicationMode: ApplicationMode = "BOTH";
  const centerOnly =
    /centre only|center only|through (?:an )?authori[sz]ed (?:Grama One|Karnataka One)/i.test(source);
  const onlinePortal = /online/i.test(source) && /portal/i.test(source);
  const mentionsCenter = /centre|center|Grama One|Karnataka One/i.test(source);
  if (centerOnly) {
    applicationMode = "CENTER_ONLY";
  } else if (onlinePortal && !mentionsCenter) {
    applicationMode = "ONLINE_ONLY";
  }

  // official URL
  const urlMatch = source.match(/https:\/\/[^\s)>"']+/i);
  let officialUrl = "";
  if (urlMatch) {
    officialUrl = urlMatch[0].replace(/[.,;]+$/, "");
  } else {
    notes.push("No official URL found in circular; enter manually.");
  }

  // documents: lines after a "Documents required" heading until a blank line
  const documents: string[] = [];
  const docHeadingIdx = lines.findIndex((l) => /documents? required/i.test(l));
  if (docHeadingIdx >= 0) {
    for (let i = docHeadingIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 0) break;
      const bullet = line.match(/^(?:[-•*]|\d+[.)])\s*(.*)$/);
      if (bullet) {
        const item = bullet[1].trim();
        if (item) documents.push(item);
      }
    }
  }
  if (documents.length === 0) {
    notes.push("Documents list not found; enter manually.");
  }

  // benefit summary
  let benefitSummary = "";
  const benefitSentence = sentences(source).find((s) => /benefit|amount|Rs|₹/i.test(s));
  if (benefitSentence) {
    benefitSummary = benefitSentence;
  } else if (nonEmpty.length > 0) {
    benefitSummary = nonEmpty[0];
  }
  if (!benefitSentence) {
    notes.push("Benefit sentence not found; fell back to first line.");
  }

  // --- type ---
  let type: SchemeType = "SCHEME";
  if (/exam|examination|probation/i.test(source)) {
    type = "EXAM";
  } else if (/recruitment|posts?\b|vacanc/i.test(source)) {
    type = "GOVT_JOB";
  }

  // --- last date ---
  let lastDate = "Ongoing";
  const MONTHS: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const isoMatch = source.match(/last date[^\d]*(\d{4}-\d{2}-\d{2})/i);
  const dmyMatch = source.match(/last date[^\d]*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  const dMonYMatch = source.match(/last date[^\d]*(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})/i);
  if (isoMatch) {
    lastDate = isoMatch[1];
  } else if (dmyMatch) {
    lastDate = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  } else if (dMonYMatch && MONTHS[dMonYMatch[2].toLowerCase()]) {
    lastDate = `${dMonYMatch[3]}-${MONTHS[dMonYMatch[2].toLowerCase()]}-${dMonYMatch[1].padStart(2, "0")}`;
  } else {
    notes.push("Last date not found; set Ongoing or enter manually.");
  }

  const scheme: Scheme = {
    id: "s-ingested-" + Date.now().toString(36),
    name,
    type,
    last_date: lastDate,
    benefitSummary,
    officialUrl,
    lastVerified: today,
    applicationMode,
    documents,
    rules,
    verificationNote: "Ingested from circular text; verify against the official source before go-live.",
  };

  return { scheme, notes };
}
