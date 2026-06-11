import { FeedbackStatusBadge } from "./FeedbackStatusBadge";
import { FeedbackPriorityBadge } from "./FeedbackPriorityBadge";
import { FeedbackSentimentBadge } from "./FeedbackSentimentBadge";
import { FeedbackCategoryBadge } from "./FeedbackCategoryBadge";
import { FeedbackSubmitterBadge } from "./FeedbackSubmitterBadge";
import { FeedbackType, FeedbackSubmitterType, SUBMISSION_TYPE_LABELS } from "@aaa-feedback/shared";
import { useRouter } from "next/navigation";
import { MessageSquareOff, Eye } from "lucide-react";
import { FeedbackItem } from "@/hooks/useFeedback";

interface Props {
  items: FeedbackItem[];
  isLoading: boolean;
}

export function FeedbackTable({ items, isLoading }: Props) {
  const router = useRouter();

  const handleRowClick = (id: string) => {
    router.push(`/feedback/${id}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const truncateText = (text: string, maxLen = 60) => {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen) + "…";
  };

  if (isLoading) {
    return (
      <div className="card table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Submitted At</th>
                <th style={{ width: "10%" }}>Ref No</th>
                <th style={{ width: "9%" }}>Type</th>
                <th style={{ width: "12%" }}>Submitter</th>
                <th style={{ width: "11%" }}>Role</th>
                <th>Feedback Text</th>
                <th style={{ width: "10%" }}>Category</th>
                <th style={{ width: "8%" }}>Priority</th>
                <th style={{ width: "8%" }}>Sentiment</th>
                <th style={{ width: "9%" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j}>
                      <div className="skeleton" style={{ height: "18px", width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style jsx>{`
          .table-card { padding: 0; overflow: hidden; }
          .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .data-table { min-width: 1000px; }
        `}</style>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card empty-card">
        <div className="empty-state">
          <MessageSquareOff size={36} strokeWidth={1.5} />
          <h3>No feedback found</h3>
          <p>Try adjusting your filters or search terms to find what you are looking for.</p>
        </div>
        <style jsx>{`
          .empty-card {
            border: 1px dashed hsl(var(--border));
            background: hsl(var(--bg-surface) / 0.5);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Submitted At</th>
              <th style={{ width: "10%" }}>Ref No</th>
              <th style={{ width: "9%" }}>Type</th>
              <th style={{ width: "12%" }}>Submitter</th>
              <th style={{ width: "11%" }}>Role</th>
              <th>Feedback Text</th>
              <th style={{ width: "10%" }}>Category</th>
              <th style={{ width: "8%" }}>Priority</th>
              <th style={{ width: "8%" }}>Sentiment</th>
              <th style={{ width: "9%" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} onClick={() => handleRowClick(item.id)}>
                <td className="date-cell">{formatDate(item.created_at)}</td>
                <td className="tracking-number-cell">{item.tracking_number || "Pending"}</td>
                <td>
                  <span className="type-label">
                    {SUBMISSION_TYPE_LABELS[item.submission_type]}
                  </span>
                </td>
                <td className="submitter-cell">
                  {item.submission_type === FeedbackType.ANONYMOUS || item.is_anonymous ? (
                    <div>
                      <span className="anonymous-text">Anonymous</span>
                      {item.feedback_scope && item.feedback_scope !== "student_specific" && (
                        <div style={{ fontSize: "10.5px", color: "hsl(var(--text-muted))", marginTop: "2px", fontWeight: 500 }}>
                          {item.feedback_scope === "general_school" ? "🏫 General School" : "👨‍👩‍👧 Multiple Children"}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="submitter-name">{item.student?.student_name || item.submitter_name || "Unknown"}</div>
                      {item.student ? (
                        <div className="submitter-class" style={{ fontSize: "11px", color: "hsl(var(--text-muted))", marginTop: "1px" }}>
                          {item.student.class}-{item.student.section}
                          {item.submitter_relationship ? ` (${item.submitter_relationship})` : ""}
                        </div>
                      ) : (
                        <div className="submitter-scope" style={{ fontSize: "11px", color: "hsl(var(--accent))", marginTop: "1px", fontWeight: 500 }}>
                          {item.feedback_scope === "general_school" ? "🏫 General School" : "👨‍👩‍👧 Multiple Children"}
                          {item.submitter_relationship ? ` (${item.submitter_relationship})` : ""}
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <FeedbackSubmitterBadge submitterType={item.submitter_type} />
                </td>
                <td className="text-cell" title={item.raw_text}>
                  <div className="text-preview-container">
                    {item.summary ? (
                      <div>
                        <div className="ai-summary-text">{truncateText(item.summary, 60)}</div>
                        <div className="raw-text-sub">{truncateText(item.raw_text, 65)}</div>
                      </div>
                    ) : (
                      truncateText(item.raw_text, 70)
                    )}
                  </div>
                </td>
                <td>
                  {item.category ? (
                    <FeedbackCategoryBadge category={item.category} />
                  ) : (
                    <span className="pending-badge">Pending</span>
                  )}
                </td>
                <td>
                  {item.priority ? (
                    <FeedbackPriorityBadge priority={item.priority} />
                  ) : (
                    <span className="pending-badge">Pending</span>
                  )}
                </td>
                <td>
                  {item.sentiment ? (
                    <FeedbackSentimentBadge sentiment={item.sentiment} />
                  ) : (
                    <span className="pending-badge">Pending</span>
                  )}
                </td>
                <td>
                  <FeedbackStatusBadge status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .table-card {
          padding: 0;
          overflow: hidden;
        }
        .table-responsive {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .data-table {
          min-width: 1000px;
        }
        .date-cell {
          font-size: 13px;
          color: hsl(var(--text-secondary));
        }
        .tracking-number-cell {
          font-family: monospace;
          font-weight: 600;
          color: hsl(var(--accent));
          font-size: 12.5px;
          letter-spacing: 0.03em;
        }
        .type-label {
          font-size: 12.5px;
          font-weight: 500;
          color: hsl(var(--text-primary));
        }
        .submitter-cell {
          font-size: 13px;
        }
        .anonymous-text {
          color: hsl(var(--text-muted));
          font-style: italic;
        }
        .submitter-name {
          font-weight: 500;
          color: hsl(var(--text-primary));
        }
        .submitter-phone {
          font-size: 11px;
          color: hsl(var(--text-muted));
          margin-top: 1px;
        }
        .text-cell {
          font-size: 13.5px;
          max-width: 320px;
        }
        .text-preview-container {
          display: flex;
          flex-direction: column;
        }
        .ai-summary-text {
          color: hsl(var(--text-primary));
          font-weight: 500;
        }
        .raw-text-sub {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          margin-top: 2px;
        }
        .pending-badge {
          font-size: 11px;
          color: hsl(var(--text-muted));
          background: hsl(var(--bg-elevated));
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
      `}</style>
    </div>
  );
}
