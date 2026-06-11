import { FeedbackPriority, PRIORITY_LABELS } from "@aaa-feedback/shared";

const PRIORITY_STYLE: Record<FeedbackPriority, { background: string; color: string; borderColor: string }> = {
  [FeedbackPriority.LOW]: {
    background: "hsl(215 16% 94%)",
    color: "hsl(215 16% 40%)",
    borderColor: "hsl(215 16% 80%)",
  },
  [FeedbackPriority.MEDIUM]: {
    background: "hsl(207 60% 93%)",
    color: "hsl(215 75% 28%)",
    borderColor: "hsl(207 60% 78%)",
  },
  [FeedbackPriority.HIGH]: {
    background: "hsl(35 80% 94%)",
    color: "hsl(35 80% 32%)",
    borderColor: "hsl(35 80% 76%)",
  },
  [FeedbackPriority.CRITICAL]: {
    background: "hsl(0 72% 95%)",
    color: "hsl(0 72% 36%)",
    borderColor: "hsl(0 72% 80%)",
  },
};

interface Props {
  priority: FeedbackPriority;
}

export function FeedbackPriorityBadge({ priority }: Props) {
  const label = PRIORITY_LABELS[priority] || priority;
  const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE[FeedbackPriority.LOW];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
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
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: style.color,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}
