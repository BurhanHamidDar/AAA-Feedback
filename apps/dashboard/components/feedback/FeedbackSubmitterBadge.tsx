import { FeedbackSubmitterType, SUBMITTER_TYPE_LABELS, SUBMITTER_TYPE_COLORS } from "@aaa-feedback/shared";

interface Props {
  submitterType: FeedbackSubmitterType;
}

export function FeedbackSubmitterBadge({ submitterType }: Props) {
  const label = SUBMITTER_TYPE_LABELS[submitterType] || submitterType;
  const colors = SUBMITTER_TYPE_COLORS[submitterType] || SUBMITTER_TYPE_COLORS[FeedbackSubmitterType.UNKNOWN];

  return (
    <span className={`badge ${colors.bg} ${colors.text}`}>
      <span className={`badge-dot ${colors.dot}`} />
      {label}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 500;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
      `}</style>
    </span>
  );
}
