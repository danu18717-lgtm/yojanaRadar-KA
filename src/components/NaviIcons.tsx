import type { ComponentType, ReactNode } from "react";

/* Unified Navi icon set. 22x22 viewBox, line style (1.75 stroke) with mint accent fills. */

export type NaviIconProps = {
  size?: number;
  active?: boolean;
  tone?: "dark" | "muted";
  className?: string;
};

export type IconName =
  | "Home"
  | "Matches"
  | "GramaOne"
  | "Watcher"
  | "Members"
  | "Schemes"
  | "JobsExams"
  | "Applied"
  | "Copy"
  | "Share"
  | "ChevronRight"
  | "ChevronDown"
  | "Plus"
  | "Close"
  | "Shield"
  | "Bell"
  | "Sparkle"
  | "Check"
  | "Pin"
  | "Scholarship"
  | "Heart"
  | "Edit"
  | "Info"
  | "Refer";

const MINT = "#00A859";
const FOREST = "#064E3B";
const INK = "#230833";
const MUTED = "#71717A";
const DUO_BG = "#E6F7EF";

/** c = base stroke colour, a = accent fill colour (null = no accent fill). */
type Glyph = { c: string; a: string | null };

const fillA = (g: Glyph) => g.a ?? "none";

const GLYPHS: Record<IconName, (g: Glyph) => ReactNode> = {
  Home: (g) => (
    <>
      <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
      <path d="M9 20v-5h4v5" fill={fillA(g)} />
    </>
  ),
  Matches: (g) => (
    <>
      <rect x="4" y="3" width="14" height="16" rx="2" />
      <path d="M7.5 8h7M7.5 11.5h7M7.5 15h3.5" />
      <circle cx="16" cy="16" r="1.5" fill={fillA(g)} />
    </>
  ),
  GramaOne: (g) => (
    <>
      <path d="M11 20s-6-5.6-6-10.5a6 6 0 0 1 12 0C17 14.4 11 20 11 20z" />
      <circle cx="11" cy="9.5" r="2.2" fill={fillA(g)} />
    </>
  ),
  Watcher: (g) => (
    <>
      <circle cx="11" cy="11" r="2" fill={fillA(g)} />
      <path d="M7.5 14.5a5 5 0 0 1 0-7" />
      <path d="M14.5 7.5a5 5 0 0 1 0 7" />
      <path d="M4.8 17.2a9 9 0 0 1 0-12.4" />
      <path d="M17.2 4.8a9 9 0 0 1 0 12.4" />
    </>
  ),
  Members: (g) => (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5z" fill={fillA(g)} />
      <circle cx="15.5" cy="8.5" r="2.5" />
      <path d="M14.5 13.6c2.7.2 5 2.4 5 5.4" />
    </>
  ),
  Schemes: (g) => (
    <>
      <circle cx="11" cy="9" r="5.5" fill={fillA(g)} />
      <path d="M8 13.5L6.8 19.5 11 17.6l4.2 1.9-1.2-6" />
    </>
  ),
  JobsExams: (g) => (
    <>
      <rect x="3" y="7" width="16" height="12" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h3A1.5 1.5 0 0 1 14 5.5V7" />
      <path d="M3 12.5h16" />
      <rect x="9.5" y="10.5" width="3" height="3" rx="0.6" fill={fillA(g)} />
    </>
  ),
  Applied: (g) => (
    <>
      <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M13 3v5h5" />
      <path d="M8 13.5l2 2 3.5-3.5" />
      <circle cx="16.5" cy="17.5" r="2" fill={fillA(g)} />
    </>
  ),
  Copy: (g) => (
    <>
      <rect x="3" y="3" width="11" height="11" rx="2" />
      <rect x="8" y="8" width="11" height="11" rx="2" fill={fillA(g)} />
    </>
  ),
  Share: (g) => (
    <>
      <path d="M7.8 9.9l6-3M7.8 12.1l6 3" />
      <circle cx="5.5" cy="11" r="2.5" fill={fillA(g)} />
      <circle cx="16.5" cy="5.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>
  ),
  ChevronRight: () => <path d="M8.5 5l6 6-6 6" />,
  ChevronDown: () => <path d="M5 8.5l6 6 6-6" />,
  Plus: () => <path d="M11 4.5v13M4.5 11h13" />,
  Close: () => <path d="M5.5 5.5l11 11M16.5 5.5l-11 11" />,
  Shield: (g) => (
    <>
      <path d="M11 3l7 2.8V11c0 4.3-3 7.8-7 9-4-1.2-7-4.7-7-9V5.8z" />
      <circle cx="11" cy="11" r="2" fill={fillA(g)} />
    </>
  ),
  Bell: (g) => (
    <>
      <path d="M5.5 15.5V10a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z" />
      <path d="M9.5 19.5a1.8 1.8 0 0 0 3 0" />
      <circle cx="16.5" cy="5.5" r="1.8" fill={fillA(g)} />
    </>
  ),
  Sparkle: (g) => (
    <path
      d="M11 2.5c.5 4.5 2.5 6.5 8.5 8.5-6 2-8 4-8.5 8.5-.5-4.5-2.5-6.5-8.5-8.5 6-2 8-4 8.5-8.5z"
      fill={fillA(g)}
    />
  ),
  Check: () => <path d="M4.5 11.5l4 4 9-9" />,
  Pin: (g) => (
    <>
      <path d="M11 13v6.5" />
      <path d="M8.5 3.5h5l-.7 5.5 2.7 2.7v1.3H6.5v-1.3L9.2 9z" fill={fillA(g)} />
    </>
  ),
  Scholarship: (g) => (
    <>
      <path d="M11 4L2 8.5l9 4.5 9-4.5z" fill={fillA(g)} />
      <path d="M6 10.5V15c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5" />
      <path d="M18.5 9.5V15" />
    </>
  ),
  Heart: (g) => (
    <path
      d="M11 18.5s-7.5-4.4-7.5-9.7A4 4 0 0 1 11 6.5a4 4 0 0 1 7.5 2.3c0 5.3-7.5 9.7-7.5 9.7z"
      fill={fillA(g)}
    />
  ),
  Edit: (g) => (
    <>
      <path d="M4 18h3.5L18 7.5 14.5 4 4 14.5z" />
      <path d="M12.5 6l3.5 3.5" />
      <path d="M4 14.5V18h3.5z" fill={fillA(g)} />
    </>
  ),
  Info: (g) => (
    <>
      <circle cx="11" cy="11" r="8" />
      <circle cx="11" cy="7.5" r="1.2" fill={g.a ?? g.c} stroke="none" />
      <path d="M11 10.5v5" />
    </>
  ),
  Refer: (g) => (
    <>
      <rect x="3" y="8" width="16" height="4" rx="1" />
      <path d="M5 12v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6" />
      <path d="M9.5 8h3v11h-3z" fill={fillA(g)} />
      <path d="M11 8C9.5 5.2 6.8 4.6 6.6 6.4c-.2 1.5 2.4 1.7 4.4 1.6z" fill={fillA(g)} />
      <path d="M11 8c1.5-2.8 4.2-3.4 4.4-1.6-.2 1.5-2.8 1.7-4.4 1.6z" fill={fillA(g)} />
    </>
  ),
};

type SvgProps = {
  size: number;
  className?: string;
  color: string;
  children: ReactNode;
};

function Svg({ size, className, color, children }: SvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

function renderLine(name: IconName, { size = 22, active = false, tone = "dark", className }: NaviIconProps) {
  const color = tone === "muted" ? MUTED : INK;
  return (
    <Svg size={size} className={className} color={color}>
      {GLYPHS[name]({ c: color, a: active ? MINT : null })}
    </Svg>
  );
}

/* Line icons (bottom bar, cards). */
export const Home = (props: NaviIconProps) => renderLine("Home", props);
export const Matches = (props: NaviIconProps) => renderLine("Matches", props);
export const GramaOne = (props: NaviIconProps) => renderLine("GramaOne", props);
export const Watcher = (props: NaviIconProps) => renderLine("Watcher", props);
export const Members = (props: NaviIconProps) => renderLine("Members", props);
export const Schemes = (props: NaviIconProps) => renderLine("Schemes", props);
export const JobsExams = (props: NaviIconProps) => renderLine("JobsExams", props);
export const Applied = (props: NaviIconProps) => renderLine("Applied", props);
export const Copy = (props: NaviIconProps) => renderLine("Copy", props);
export const Share = (props: NaviIconProps) => renderLine("Share", props);
export const ChevronRight = (props: NaviIconProps) => renderLine("ChevronRight", props);
export const ChevronDown = (props: NaviIconProps) => renderLine("ChevronDown", props);
export const Plus = (props: NaviIconProps) => renderLine("Plus", props);
export const Close = (props: NaviIconProps) => renderLine("Close", props);
export const Shield = (props: NaviIconProps) => renderLine("Shield", props);
export const Bell = (props: NaviIconProps) => renderLine("Bell", props);
export const Sparkle = (props: NaviIconProps) => renderLine("Sparkle", props);
export const Check = (props: NaviIconProps) => renderLine("Check", props);
export const Pin = (props: NaviIconProps) => renderLine("Pin", props);
export const Scholarship = (props: NaviIconProps) => renderLine("Scholarship", props);
export const Heart = (props: NaviIconProps) => renderLine("Heart", props);
export const Edit = (props: NaviIconProps) => renderLine("Edit", props);
export const Info = (props: NaviIconProps) => renderLine("Info", props);
export const ReferIcon = (props: NaviIconProps) => renderLine("Refer", props);

/** Name -> line icon component. */
export const ICON_MAP: Record<IconName, ComponentType<NaviIconProps>> = {
  Home,
  Matches,
  GramaOne,
  Watcher,
  Members,
  Schemes,
  JobsExams,
  Applied,
  Copy,
  Share,
  ChevronRight,
  ChevronDown,
  Plus,
  Close,
  Shield,
  Bell,
  Sparkle,
  Check,
  Pin,
  Scholarship,
  Heart,
  Edit,
  Info,
  Refer: ReferIcon,
};

/** Duotone quick-action glyph inside a 56x56 mint circle. */
export function QuickIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <span
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: DUO_BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg size={size} color={FOREST}>
        {GLYPHS[name]({ c: FOREST, a: MINT })}
      </Svg>
    </span>
  );
}
