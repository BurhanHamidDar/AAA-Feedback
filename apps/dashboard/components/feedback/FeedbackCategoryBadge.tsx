import { FeedbackCategory, CATEGORY_LABELS } from "@aaa-feedback/shared";

const CATEGORY_STYLE: Record<string, { background: string; color: string; borderColor: string }> = {
  academics:      { background: "hsl(215 40% 93%)", color: "hsl(215 60% 28%)", borderColor: "hsl(215 40% 78%)" },
  transport:      { background: "hsl(38 50% 93%)",  color: "hsl(38  60% 30%)", borderColor: "hsl(38  50% 78%)" },
  infrastructure: { background: "hsl(90 30% 92%)",  color: "hsl(90  40% 28%)", borderColor: "hsl(90  30% 78%)" },
  staff:          { background: "hsl(270 30% 93%)", color: "hsl(270 40% 32%)", borderColor: "hsl(270 30% 78%)" },
  discipline:     { background: "hsl(0 40% 94%)",   color: "hsl(0   50% 34%)", borderColor: "hsl(0   40% 80%)" },
  administration: { background: "hsl(215 16% 93%)", color: "hsl(215 16% 36%)", borderColor: "hsl(215 16% 78%)" },
  facilities:     { background: "hsl(180 40% 92%)", color: "hsl(180 50% 28%)", borderColor: "hsl(180 40% 76%)" },
  safety:         { background: "hsl(0 50% 94%)",   color: "hsl(0   60% 34%)", borderColor: "hsl(0   50% 80%)" },
  general:        { background: "hsl(215 16% 93%)", color: "hsl(215 20% 38%)", borderColor: "hsl(215 16% 78%)" },
  other:          { background: "hsl(215 10% 94%)", color: "hsl(215 10% 42%)", borderColor: "hsl(215 10% 80%)" },
};

const DEFAULT_STYLE = { background: "hsl(215 16% 93%)", color: "hsl(215 16% 38%)", borderColor: "hsl(215 16% 78%)" };

interface Props {
  category: FeedbackCategory;
}

export function FeedbackCategoryBadge({ category }: Props) {
  const label = CATEGORY_LABELS[category] || String(category);
  const style = CATEGORY_STYLE[category] ?? DEFAULT_STYLE;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        borderRadius: 3,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.02em",
        lineHeight: 1.6,
        whiteSpace: "nowrap",
        border: `1px solid ${style.borderColor}`,
        background: style.background,
        color: style.color,
      }}
    >
      {label}
    </span>
  );
}
