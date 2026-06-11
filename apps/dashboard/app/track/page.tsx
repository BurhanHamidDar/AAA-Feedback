"use client";

import { useState } from "react";

import {
  Search,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Layers,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import apiClient from "@/lib/api";

interface TimelineEvent {
  id: string;
  status: string;
  action_note: string;
  created_at: string;
}

interface TrackingData {
  tracking_number: string;
  status: string;
  category: string;
  last_action_note: string | null;
  status_updated_at: string;
  created_at: string;
  timeline: TimelineEvent[];
}

export default function PublicTrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [data, setData] = useState<TrackingData | null>(null);
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
      const response = await apiClient.get(`/tracking/${formattedNumber}`);
      setData(response.data.data as TrackingData);
    } catch (err: any) {
      console.error("Tracking lookup error:", err);
      if (err.response?.status === 404) {
        setError("Feedback reference number not found. Please double check the format (e.g. AAA-2026-000001) and try again.");
      } else {
        setError("An error occurred while retrieving tracking information. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return { bg: "hsl(var(--info) / 0.1)", text: "hsl(var(--info))", border: "hsl(var(--info) / 0.2)" };
      case "under_review":
        return { bg: "hsl(var(--warning) / 0.1)", text: "hsl(var(--warning))", border: "hsl(var(--warning) / 0.2)" };
      case "resolved":
        return { bg: "hsl(var(--success) / 0.1)", text: "hsl(var(--success))", border: "hsl(var(--success) / 0.2)" };
      case "closed":
        return { bg: "hsl(var(--text-muted) / 0.1)", text: "hsl(var(--text-secondary))", border: "hsl(var(--text-muted) / 0.2)" };
      default:
        return { bg: "hsl(var(--bg-elevated))", text: "hsl(var(--text-muted))", border: "hsl(var(--border))" };
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
    <div className="track-container">
      {/* Academy Branding Header */}
      <header className="track-header">
        <div className="logo-section">
          <div className="academy-badge">AAA</div>
          <div>
            <h1>Ayesha Ali Academy</h1>
            <p className="motto">Above & Ahead</p>
          </div>
        </div>
        <a href="/login" className="btn btn-ghost btn-sm">
          <ArrowLeft size={13} /> Admin Portal
        </a>
      </header>

      <main className="track-main">
        <div className="track-card-wrapper">
          {/* Lookup Card */}
          <div className="card lookup-card">
            <h2>Feedback Status Inquiry</h2>
            <p className="card-desc">Enter your unique reference number to check the live status of your feedback submission.</p>

            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="e.g. AAA-2026-000001"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="input search-input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary search-btn" disabled={loading}>
                {loading ? <RefreshCw className="spinning" size={15} /> : "Inquire"}
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
            <div className="results-container">
                {/* Status overview */}
                <div className="card status-overview-card">
                  <div className="overview-header">
                    <div>
                      <span className="ref-label">Reference Number</span>
                      <h3>{data.tracking_number}</h3>
                    </div>
                    <div
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(data.status).bg,
                        color: getStatusColor(data.status).text,
                        borderColor: getStatusColor(data.status).border,
                      }}
                    >
                      {getStatusLabel(data.status)}
                    </div>
                  </div>

                  <div className="divider" />

                  <div className="meta-grid">
                    <div className="meta-box">
                      <Layers size={14} className="meta-icon" />
                      <div>
                        <span className="label">Category</span>
                        <span className="value">{data.category || "General"}</span>
                      </div>
                    </div>
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
                        <span className="label">Last Action Taken</span>
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
                </div>

                {/* Progress timeline */}
                <div className="card timeline-card">
                  <h3>Resolution Progress Timeline</h3>
                  <p className="timeline-desc">Chronological history of administrative actions on your submission.</p>

                  <div className="timeline-stepper">
                    {data.timeline.map((event, idx) => {
                      const isLast = idx === data.timeline.length - 1;
                      const statusStyles = getStatusColor(event.status);

                      return (
                        <div key={event.id} className="timeline-step">
                          <div className="step-left">
                            <div className="step-dot-wrapper">
                              <div
                                className="step-dot"
                                style={{
                                  backgroundColor: isLast ? statusStyles.text : "hsl(var(--bg-overlay))",
                                  boxShadow: isLast ? `0 0 0 4px ${statusStyles.bg}` : "none",
                                }}
                              />
                              {!isLast && <div className="step-connector" />}
                            </div>
                          </div>
                          <div className="step-right">
                            <div className="step-header">
                              <span className="step-status" style={{ color: statusStyles.text }}>
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
                    })}
                  </div>
                </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .track-container {
          min-height: 100vh;
          background: hsl(var(--bg-base));
          display: flex;
          flex-direction: column;
        }

        .track-header {
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
          padding: 1.5rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .academy-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: hsl(var(--accent));
          color: white;
          font-weight: 700;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid hsl(var(--academy-gold));
        }

        .logo-section h1 {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          line-height: 1.2;
        }

        .motto {
          font-size: 10px;
          font-weight: 600;
          color: hsl(var(--academy-gold));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1;
        }

        .track-main {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 1rem 1rem 3rem 1rem;
        }

        .track-card-wrapper {
          max-width: 600px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .lookup-card {
          padding: 1.75rem;
          background: hsl(var(--bg-surface));
        }

        .lookup-card h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .card-desc {
          font-size: 12.5px;
          color: hsl(var(--text-muted));
          margin-bottom: 1.5rem;
        }

        .search-form {
          display: flex;
          gap: 0.75rem;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: hsl(var(--text-muted));
        }

        .search-input {
          padding-left: 36px !important;
          background: hsl(var(--bg-base));
        }

        .search-btn {
          min-width: 90px;
          justify-content: center;
        }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: hsl(var(--danger) / 0.06);
          border: 1px solid hsl(var(--danger) / 0.15);
          color: hsl(var(--danger));
          font-size: 12.5px;
          padding: 10px 12px;
          border-radius: var(--radius);
          margin-top: 1rem;
        }

        .error-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        /* Results presentation */
        .results-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .status-overview-card {
          padding: 1.5rem;
          background: hsl(var(--bg-surface));
        }

        .overview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ref-label {
          font-size: 10.5px;
          font-weight: 550;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .overview-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--text-primary));
        }

        .status-badge {
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid transparent;
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
          font-size: 10.5px;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          font-weight: 550;
        }

        .meta-box .value {
          font-size: 12.5px;
          font-weight: 550;
          color: hsl(var(--text-secondary));
        }

        .latest-note-box {
          margin-top: 1.25rem;
          background: hsl(var(--bg-elevated) / 0.5);
          border: 1px solid hsl(var(--border-subtle));
          padding: 10px 14px;
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
          font-size: 10.5px;
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

        /* Timeline Card */
        .timeline-card {
          padding: 1.5rem;
          background: hsl(var(--bg-surface));
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
          padding-left: 4px;
        }

        .timeline-step {
          display: flex;
          gap: 14px;
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
          width: 8px;
          height: 8px;
          border-radius: 50%;
          z-index: 1;
        }

        .step-connector {
          width: 2px;
          flex: 1;
          background: hsl(var(--border));
          margin: 4px 0;
        }

        .step-right {
          padding-bottom: 1.5rem;
          flex: 1;
        }

        .timeline-step:last-child .step-right {
          padding-bottom: 0;
        }

        .step-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          gap: 12px;
        }

        .step-status {
          font-size: 12.5px;
          font-weight: 600;
        }

        .step-time {
          font-size: 10.5px;
          color: hsl(var(--text-muted));
        }

        .step-note {
          font-size: 12px;
          color: hsl(var(--text-secondary));
          line-height: 1.4;
        }

        .spinning {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 600px) {
          .meta-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .search-form {
            flex-direction: column;
          }
          .search-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
