import { FeedbackSentiment, SENTIMENT_LABELS } from "@aaa-feedback/shared";

const SENTIMENT_STYLE: Record<FeedbackSentiment, { background: string; color: string; borderColor: string }> = {
  [FeedbackSentiment.POSITIVE]: {
    background: "hsl(142 50% 93%)",
    color: "hsl(142 50% 28%)",
    borderColor: "hsl(142 50% 78%)",
  },
  [FeedbackSentiment.NEUTRAL]: {
    background: "hsl(215 16% 94%)",
    color: "hsl(215 16% 40%)",
    borderColor: "hsl(215 16% 80%)",
  },
  [FeedbackSentiment.NEGATIVE]: {
    background: "hsl(0 72% 95%)",
    color: "hsl(0 72% 36%)",
    borderColor: "hsl(0 72% 80%)",
  },
  [FeedbackSentiment.MIXED]: {
    background: "hsl(35 80% 94%)",
    color: "hsl(35 80% 32%)",
    borderColor: "hsl(35 80% 76%)",
  },
};

interface Props {
  sentiment: FeedbackSentiment;
}

export function FeedbackSentimentBadge({ sentiment }: Props) {
  const label = SENTIMENT_LABELS[sentiment] || sentiment;
  const style = SENTIMENT_STYLE[sentiment] ?? SENTIMENT_STYLE[FeedbackSentiment.NEUTRAL];

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
