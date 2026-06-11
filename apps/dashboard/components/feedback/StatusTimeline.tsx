import { FeedbackStatus } from "@aaa-feedback/shared";
import { Check, Dot } from "lucide-react";

interface TimelineEvent {
  id: string;
  status: string;
  action_note: string;
  created_at: string;
}

interface Props {
  currentStatus: FeedbackStatus;
  timelineEvents?: TimelineEvent[];
}

export function StatusTimeline({ currentStatus, timelineEvents = [] }: Props) {
  const steps: { key: FeedbackStatus; label: string; desc: string }[] = [
    { key: FeedbackStatus.NEW, label: "New", desc: "Submitted & awaiting review" },
    { key: FeedbackStatus.UNDER_REVIEW, label: "Under Review", desc: "Assigned & action being taken" },
    { key: FeedbackStatus.RESOLVED, label: "Resolved", desc: "Solution implemented" },
    { key: FeedbackStatus.CLOSED, label: "Closed", desc: "Archived & finalized" },
  ];

  const getStatusIndex = (status: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.NEW:
        return 0;
      case FeedbackStatus.UNDER_REVIEW:
        return 1;
      case FeedbackStatus.RESOLVED:
        return 2;
      case FeedbackStatus.CLOSED:
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="status-timeline-card card">
      <h3 className="timeline-title">Feedback Status</h3>

      <div className="stepper-vertical">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isPending = idx > currentIndex;

          let stepClass = "step-pending";
          if (isCompleted) stepClass = "step-completed";
          if (isActive) stepClass = "step-active";

          // Find matching event for this step status
          const matchingEvent = timelineEvents
            .filter((e) => e.status === step.key)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

          const eventTime = matchingEvent
            ? new Date(matchingEvent.created_at).toLocaleString("en-US", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          const descToDisplay = matchingEvent ? matchingEvent.action_note : step.desc;

          return (
            <div key={step.key} className={`step-item ${stepClass}`}>
              <div className="step-connector-wrapper">
                <div className="step-icon">
                  {isCompleted ? (
                    <Check size={12} strokeWidth={3} />
                  ) : isActive ? (
                    <div className="pulse-dot" />
                  ) : (
                    <div className="pending-dot" />
                  )}
                </div>
                {idx < steps.length - 1 && <div className="step-line" />}
              </div>
              <div className="step-content">
                <div className="step-header-row">
                  <div className="step-label">{step.label}</div>
                  {eventTime && <div className="step-date">{eventTime}</div>}
                </div>
                <div className="step-desc">{descToDisplay}</div>
              </div>
            </div>
          );
        })}
      </div>


      <style jsx>{`
        .status-timeline-card {
          padding: 1.25rem 1.5rem;
          background: hsl(var(--bg-surface));
        }
        .timeline-title {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--text-muted));
          margin-bottom: 1.25rem;
        }
        .stepper-vertical {
          display: flex;
          flex-direction: column;
        }
        .step-item {
          display: flex;
          gap: 16px;
          min-height: 52px;
        }
        .step-item:last-child {
          min-height: auto;
        }
        .step-connector-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .step-icon {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 1;
        }
        .step-line {
          width: 2px;
          flex: 1;
          background: hsl(var(--border));
          margin: 4px 0;
        }
        .step-content {
          padding-bottom: 12px;
          flex: 1;
        }
        .step-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }
        .step-label {
          font-size: 13px;
          font-weight: 600;
          line-height: 1;
        }
        .step-date {
          font-size: 10.5px;
          color: hsl(var(--text-muted));
        }

        .step-desc {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          margin-top: 4px;
        }

        /* Active Step styling */
        .step-active .step-icon {
          background: hsl(var(--accent) / 0.15);
          border: 1.5px solid hsl(var(--accent));
          color: hsl(var(--accent));
        }
        .step-active .step-label {
          color: hsl(var(--text-primary));
        }
        .step-active .step-desc {
          color: hsl(var(--text-secondary));
        }
        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: hsl(var(--accent));
          box-shadow: 0 0 0 4px hsl(var(--accent) / 0.3);
          animation: pulse 1.5s infinite;
        }

        /* Completed Step styling */
        .step-completed .step-icon {
          background: hsl(var(--success) / 0.15);
          border: 1.5px solid hsl(var(--success));
          color: hsl(var(--success));
        }
        .step-completed .step-label {
          color: hsl(var(--text-primary));
        }
        .step-completed .step-line {
          background: hsl(var(--success) / 0.3);
        }

        /* Pending Step styling */
        .step-pending .step-icon {
          background: hsl(var(--bg-elevated));
          border: 1.5px solid hsl(var(--border));
          color: hsl(var(--text-muted));
        }
        .step-pending .step-label {
          color: hsl(var(--text-muted));
        }
        .pending-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: hsl(var(--text-muted));
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 2px hsl(var(--accent) / 0.3);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 0 5px hsl(var(--accent) / 0.15);
          }
        }
      `}</style>
    </div>
  );
}
