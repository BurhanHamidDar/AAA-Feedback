"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Calendar,
  Layers,
  Info,
  Clock,
  ExternalLink,
  AlertCircle,
  FileText,
} from "lucide-react";
import apiClient from "@/lib/api";
import { FeedbackCategoryBadge } from "@/components/feedback/FeedbackCategoryBadge";
import { FeedbackPriorityBadge } from "@/components/feedback/FeedbackPriorityBadge";
import { FeedbackSentimentBadge } from "@/components/feedback/FeedbackSentimentBadge";
import { FeedbackSubmitterBadge } from "@/components/feedback/FeedbackSubmitterBadge";

interface TimelineEvent {
  id: string;
  status: string;
  action_note: string;
  created_at: string;
}

interface TrackingData {
  id: string;
  tracking_number: string;
  status: string;
  category: string;
  last_action_note: string | null;
  status_updated_at: string;
  created_at: string;
  timeline: TimelineEvent[];
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const formattedNumber = trackingNumber.trim().toUpperCase();
      // Admins can query the public tracking endpoint to verify existence, then fetch details
      const response = await apiClient.get(`/tracking/${formattedNumber}`);
      
      // Let's query the specific feedback list with search query to retrieve the internal ID
      const listResponse = await apiClient.get("/feedback", {
        params: { search: formattedNumber, limit: 1 },
      });
      
      const internalItem = listResponse.data?.data?.[0];
      if (internalItem) {
        setData({
          ...response.data.data,
          ...internalItem,
          id: internalItem.id, // Ensure we have the correct id
        });
      } else {
        setData(response.data.data);
      }
    } catch (err: any) {
      console.error("Tracking lookup error:", err);
      if (err.response?.status === 404) {
        setError("Feedback reference number not found. Please double check the reference code (e.g. AAA-2026-000001).");
      } else {
        setError("An error occurred while retrieving tracking details. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };
      case "under_review":
        return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" };
      case "resolved":
        return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" };
      case "closed":
        return { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };
      default:
        return { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "New / Received";
      case "under_review": return "Under Review";
      case "resolved": return "Resolved";
      case "closed": return "Closed / Archived";
      default: return status;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Feedback Ticket Tracking</h1>
          <p>Quickly search, inspect, and redirect to any verified submission reference code.</p>
        </div>
      </div>

      <div className="track-layout">
        {/* Lookup Card */}
        <div className="card lookup-card">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Enter Reference Code (e.g., AAA-2026-000001)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="input search-input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary search-btn" disabled={loading}>
              {loading ? <RefreshCw className="spinning" size={15} /> : "Search Reference"}
            </button>
          </form>

          {error && (
            <div className="error-box">
              <AlertCircle size={15} className="error-icon" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Presentation */}
        {data && (
          <div className="results-grid">
            {/* Overview Panel */}
            <div className="card results-card">
              <div className="card-header">
                <div>
                  <span className="ref-label">Reference Code</span>
                  <h2>{data.tracking_number}</h2>
                </div>
                <span className={`status-badge ${getStatusColor(data.status).bg} ${getStatusColor(data.status).text} ${getStatusColor(data.status).border}`}>
                  {getStatusLabel(data.status)}
                </span>
              </div>

              <div className="divider" />

              {data.raw_text && (
                <div className="raw-text-preview">
                  <h4>Original Message Preview</h4>
                  <p>{data.raw_text}</p>
                </div>
              )}

              {/* Category, Priority, Sentiment Badges */}
              <div className="badges-row">
                <div className="badge-item">
                  <span className="label">Category</span>
                  {data.category ? (
                    <FeedbackCategoryBadge category={data.category} />
                  ) : (
                    <span className="pending-badge">Pending</span>
                  )}
                </div>
                <div className="badge-item">
                  <span className="label">Priority</span>
                  {data.priority ? (
                    <FeedbackPriorityBadge priority={data.priority} />
                  ) : (
                    <span className="pending-badge">Pending</span>
                  )}
                </div>
                <div className="badge-item">
                  <span className="label">Sentiment</span>
                  {data.sentiment ? (
                    <FeedbackSentimentBadge sentiment={data.sentiment} />
                  ) : (
                    <span className="pending-badge">Pending</span>
                  )}
                </div>
              </div>

              <div className="divider" />

              {/* Submitter details section */}
              <div className="submitter-details-section">
                <h3>Submitter Profile</h3>
                {data.submission_type === "anonymous" || data.is_anonymous ? (
                  <div className="anon-alert">
                    <span className="anon-title">Anonymous Submission</span>
                    <p className="anon-text">This feedback was submitted anonymously. Student and parent details are hidden for privacy.</p>
                  </div>
                ) : (
                  <div className="submitter-info-grid">
                    <div className="info-item">
                      <span className="label">Name / Submitter</span>
                      <span className="value">{data.student?.student_name || data.submitter_name || "Unknown"}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Role / Submitter Type</span>
                      <span className="value">
                        <FeedbackSubmitterBadge submitterType={data.submitter_type || "student"} />
                      </span>
                    </div>
                    {data.student ? (
                      <div className="info-item">
                        <span className="label">Class & Section</span>
                        <span className="value">Class {data.student.class} - {data.student.section}</span>
                      </div>
                    ) : (
                      <div className="info-item">
                        <span className="label">Contact Phone</span>
                        <span className="value">{data.submitter_phone || "Not Provided"}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <span className="label">Admission Number</span>
                      <span className="value">{data.student?.admission_no || "N/A"}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="divider" />

              <div className="meta-grid">
                <div className="meta-box">
                  <Calendar size={14} className="meta-icon" />
                  <div>
                    <span className="label">Submitted</span>
                    <span className="value">
                      {new Date(data.created_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="meta-box">
                  <Clock size={14} className="meta-icon" />
                  <div>
                    <span className="label">Last Updated</span>
                    <span className="value">
                      {new Date(data.status_updated_at).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {data.last_action_note && (
                <div className="latest-note-box">
                  <Info size={14} className="note-icon" />
                  <div>
                    <span className="note-title">Latest Update Note</span>
                    <p className="note-text">"{data.last_action_note}"</p>
                  </div>
                </div>
              )}

              {data.id && (
                <div className="details-link-box">
                  <Link href={`/feedback/${data.id}`} className="btn btn-primary btn-sm full-width">
                    <ExternalLink size={14} /> Open Full Details & Manage Ticket
                  </Link>
                </div>
              )}
            </div>

            {/* Timeline History Panel */}
            <div className="card timeline-card">
              <h3>Resolution Progress Timeline</h3>
              <p className="timeline-desc">Chronological history of actions taken on this feedback.</p>

              <div className="timeline-stepper">
                {data.timeline && data.timeline.length > 0 ? (
                  data.timeline.map((event: any, idx: number) => {
                    const isLast = idx === data.timeline.length - 1;
                    const statusStyles = getStatusColor(event.status);

                    return (
                      <div key={event.id} className="timeline-step">
                        <div className="step-left">
                          <div className="step-dot-wrapper">
                            <div
                              className={`step-dot ${isLast ? statusStyles.text : "text-zinc-600"}`}
                              style={{
                                backgroundColor: isLast ? "currentColor" : "hsl(var(--bg-elevated))",
                                boxShadow: isLast ? "0 0 0 4px rgba(251, 191, 36, 0.1)" : "none",
                              }}
                            />
                            {!isLast && <div className="step-connector" />}
                          </div>
                        </div>
                        <div className="step-right">
                          <div className="step-header">
                            <span className={`step-status ${statusStyles.text}`}>
                              {getStatusLabel(event.status)}
                            </span>
                            <span className="step-time">
                              {new Date(event.created_at).toLocaleString("en-US", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="step-note">{event.action_note}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-timeline">No history recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .page-header {
          margin-bottom: 2rem;
        }
        .page-header h1 {
          font-size: 1.375rem;
          margin-bottom: 4px;
        }
        .page-header p {
          font-size: 13px;
          color: hsl(var(--text-muted));
        }
        .track-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 900px;
        }
        .lookup-card {
          padding: 1.5rem;
        }
        .search-form {
          display: flex;
          gap: 12px;
        }
        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          color: hsl(var(--text-muted));
          pointer-events: none;
        }
        .search-input {
          padding-left: 36px !important;
          background: hsl(var(--bg-base));
        }
        .search-btn {
          min-width: 150px;
          justify-content: center;
        }
        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #f87171;
          font-size: 12.5px;
          padding: 10px 12px;
          border-radius: var(--radius);
          margin-top: 1rem;
        }
        .error-icon {
          flex-shrink: 0;
        }
        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .results-grid {
            grid-template-columns: 1fr;
          }
          .search-form {
            flex-direction: column;
          }
          .search-btn {
            width: 100%;
          }
        }
        .results-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .ref-label {
          font-size: 10px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--text-primary));
        }
        .status-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 9999px;
          border: 1px solid transparent;
        }
        .divider {
          height: 1px;
          background: hsl(var(--border));
        }
        .raw-text-preview {
          background: hsl(var(--bg-elevated) / 0.3);
          border: 1px solid hsl(var(--border-subtle));
          padding: 12px;
          border-radius: var(--radius);
        }
        .raw-text-preview h4 {
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 6px;
        }
        .raw-text-preview p {
          font-size: 12.5px;
          color: hsl(var(--text-secondary));
          line-height: 1.4;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .meta-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .meta-icon {
          color: hsl(var(--text-muted));
          margin-top: 2px;
        }
        .meta-box .label {
          display: block;
          font-size: 10px;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          font-weight: 600;
        }
        .meta-box .value {
          font-size: 12.5px;
          font-weight: 500;
          color: hsl(var(--text-secondary));
        }
        .latest-note-box {
          background: hsl(var(--bg-elevated) / 0.5);
          border: 1px solid hsl(var(--border-subtle));
          padding: 10px 12px;
          border-radius: var(--radius);
          display: flex;
          gap: 8px;
        }
        .note-icon {
          color: hsl(var(--accent));
          margin-top: 2px;
          flex-shrink: 0;
        }
        .note-title {
          font-size: 10px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          display: block;
          margin-bottom: 2px;
        }
        .note-text {
          font-size: 12px;
          color: hsl(var(--text-secondary));
          line-height: 1.4;
          font-style: italic;
        }
        .details-link-box {
          margin-top: 0.5rem;
        }
        .full-width {
          width: 100%;
          justify-content: center;
        }
        .timeline-card {
          padding: 1.5rem;
        }
        .timeline-card h3 {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 2px;
        }
        .timeline-desc {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          margin-bottom: 1.5rem;
        }
        .timeline-stepper {
          display: flex;
          flex-direction: column;
        }
        .timeline-step {
          display: flex;
          gap: 12px;
        }
        .step-left {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .step-dot-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .step-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          z-index: 1;
          margin-top: 6px;
        }
        .step-connector {
          width: 2px;
          flex: 1;
          background: hsl(var(--border));
          margin: 6px 0;
        }
        .step-right {
          padding-bottom: 1.25rem;
          flex: 1;
        }
        .timeline-step:last-child .step-right {
          padding-bottom: 0;
        }
        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
          gap: 10px;
        }
        .step-status {
          font-size: 12px;
          font-weight: 600;
        }
        .step-time {
          font-size: 10px;
          color: hsl(var(--text-muted));
        }
        .step-note {
          font-size: 11.5px;
          color: hsl(var(--text-secondary));
          line-height: 1.35;
        }
        .empty-timeline {
          font-size: 12px;
          color: hsl(var(--text-muted));
          text-align: center;
          padding: 2rem 0;
        }
        .spinning {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .badges-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .badge-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .badge-item .label {
          font-size: 10px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pending-badge {
          font-size: 11px;
          color: hsl(var(--text-muted));
          background: hsl(var(--bg-elevated));
          padding: 2px 6px;
          border-radius: 4px;
          width: fit-content;
        }
        .submitter-details-section h3 {
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .anon-alert {
          background: hsl(var(--bg-elevated) / 0.5);
          border: 1px dashed hsl(var(--border-subtle));
          padding: 12px;
          border-radius: var(--radius);
        }
        .anon-title {
          font-size: 12px;
          font-weight: 600;
          color: hsl(var(--text-secondary));
          display: block;
          margin-bottom: 2px;
        }
        .anon-text {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          line-height: 1.35;
        }
        .submitter-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 16px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .info-item .label {
          font-size: 10px;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .info-item .value {
          font-size: 12.5px;
          font-weight: 500;
          color: hsl(var(--text-secondary));
        }

        @media (max-width: 600px) {
          .meta-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }

        @media (max-width: 480px) {
          .badges-row {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .submitter-info-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
