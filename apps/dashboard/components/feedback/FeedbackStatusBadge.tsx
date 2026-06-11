import { FeedbackStatus, STATUS_LABELS } from "@aaa-feedback/shared";

const STATUS_STYLE: Record<FeedbackStatus, { background: string; color: string; borderColor: string }> = {
  [FeedbackStatus.NEW]: {
    background: "hsl(207 80% 95%)",
    color: "hsl(207 80% 32%)",
    borderColor: "hsl(207 80% 82%)",
  },
  [FeedbackStatus.UNDER_REVIEW]: {
    background: "hsl(35 80% 95%)",
    color: "hsl(35 80% 35%)",
    borderColor: "hsl(35 80% 78%)",
  },
  [FeedbackStatus.RESOLVED]: {
    background: "hsl(142 50% 93%)",
    color: "hsl(142 50% 28%)",
    borderColor: "hsl(142 50% 78%)",
  },
  [FeedbackStatus.CLOSED]: {
    background: "hsl(215 16% 94%)",
    color: "hsl(215 16% 42%)",
    borderColor: "hsl(215 16% 82%)",
  },
};

interface Props {
  status: FeedbackStatus;
}

export function FeedbackStatusBadge({ status }: Props) {
  const label = STATUS_LABELS[status] || status;
  const style = STATUS_STYLE[status] ?? STATUS_STYLE[FeedbackStatus.CLOSED];

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
