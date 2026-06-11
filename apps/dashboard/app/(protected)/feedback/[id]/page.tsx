"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useFeedbackDetail,
  useUpdateFeedbackStatus,
  useAddComment,
  useReprocessFeedback,
} from "@/hooks/useFeedback";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/lib/api";
import { FeedbackStatusBadge } from "@/components/feedback/FeedbackStatusBadge";
import { FeedbackPriorityBadge } from "@/components/feedback/FeedbackPriorityBadge";
import { FeedbackSentimentBadge } from "@/components/feedback/FeedbackSentimentBadge";
import { FeedbackCategoryBadge } from "@/components/feedback/FeedbackCategoryBadge";
import { FeedbackSubmitterBadge } from "@/components/feedback/FeedbackSubmitterBadge";
import { EvidenceGallery } from "@/components/feedback/EvidenceGallery";
import { CommentThread } from "@/components/feedback/CommentThread";
import { StatusTimeline } from "@/components/feedback/StatusTimeline";
import { AddCommentForm } from "@/components/feedback/AddCommentForm";
import { FeedbackStatus, FeedbackType, FeedbackSubmitterType, SUBMISSION_TYPE_LABELS } from "@aaa-feedback/shared";
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  MessageSquare,
  Sparkles,
  Layers,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FeedbackDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Queries & Mutations
  const { data: detailData, isLoading, error, refetch } = useFeedbackDetail(id);
  const updateStatusMutation = useUpdateFeedbackStatus();
  const addCommentMutation = useAddComment();

  // Status updating state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // AI Reprocessing state
  const reprocessMutation = useReprocessFeedback();
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [reprocessError, setReprocessError] = useState<string | null>(null);

  // Tracking & Timeline Update States (Phase 9)
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | "">("");
  const [actionNote, setActionNote] = useState("");

  const feedback = detailData?.data;

  const { admin } = useAuth();
  const isPrincipal = admin?.role === "principal";
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteFeedback = async () => {
    if (!feedback?.id) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      const response = await apiClient.delete(`/feedback/${feedback.id}`);
      if (response.data?.success) {
        router.push("/feedback");
      }
    } catch (err: any) {
      console.error("Delete feedback error:", err);
      alert(err?.response?.data?.error?.message || "Failed to delete feedback.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Sync selectedStatus when feedback changes
  useEffect(() => {
    if (feedback?.status) {
      setSelectedStatus(feedback.status);
    }
  }, [feedback]);



  const handleReprocess = async () => {
    if (!feedback?.id) return;
    setIsReprocessing(true);
    setReprocessError(null);
    try {
      await reprocessMutation.mutateAsync(feedback.id);
    } catch (err: any) {
      setReprocessError(err?.response?.data?.error?.message ?? "Failed to run AI analysis.");
    } finally {
      setIsReprocessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container loading-container">
        <Loader2 className="spinning" size={36} />
        <p>Loading feedback details…</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            gap: 12px;
            color: hsl(var(--text-secondary));
          }
          .spinning {
            animation: spin 0.8s linear infinite;
            color: hsl(var(--accent));
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error || !detailData?.success || !detailData.data) {
    return (
      <div className="page-container">
        <button className="btn btn-secondary back-btn" onClick={() => router.push("/feedback")}>
          <ArrowLeft size={14} /> Back to list
        </button>
        <div className="card error-card">
          <AlertCircle size={32} className="error-icon" />
          <h3>Failed to load feedback</h3>
          <p>
            {error instanceof Error ? error.message : "The feedback item could not be found or retrieved."}
          </p>
        </div>
        <style jsx>{`
          .back-btn {
            margin-bottom: 1.5rem;
          }
          .error-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 3rem;
            border-color: hsl(var(--danger) / 0.2);
            background: hsl(var(--danger) / 0.03);
          }
          .error-icon {
            color: hsl(var(--danger));
            margin-bottom: 12px;
          }
        `}</style>
      </div>
    );
  }


  const handleStatusChangeSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    if (!selectedStatus || !feedback?.id) return;

    setUpdatingStatus(true);
    setUpdateError(null);

    try {
      await updateStatusMutation.mutateAsync({
        id: feedback.id,
        status: selectedStatus,
        last_action_note: actionNote.trim() || undefined,
      });
      setActionNote("");
    } catch (err: any) {
      setUpdateError(err?.response?.data?.error?.message ?? "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (text: string) => {
    await addCommentMutation.mutateAsync({
      feedbackId: feedback.id,
      commentText: text,
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
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

  return (
    <div className="page-container">
      {/* Back link & breadcrumbs */}
      <div className="detail-navigation">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/feedback")}>
          <ArrowLeft size={15} />
          Back to Feedback
        </button>
        <div className="breadcrumbs">
          <span>Feedback</span>
          <ChevronRight size={12} />
          <span className="current-breadcrumb">{feedback.tracking_number || feedback.id.substring(0, 8)}</span>
        </div>
      </div>

      <div className="detail-layout">
        {/* Main Content Column */}
        <div className="detail-main">
          {/* Submitter & Submitting metadata */}
          <div className="card submitter-card">
            <div className="card-header-with-icon">
              <User size={18} className="header-icon" />
              <h2>Submission Information</h2>
            </div>
            <div className="submitter-details-grid">
            <div className="detail-item">
              <span className="label">Tracking Number</span>
              <span className="value tracking-number-block">
                {feedback.tracking_number || "Pending"}
              </span>
            </div>
            <div className="detail-item">
              <span className="label">Type</span>
              <span className="value submission-type-label">
                {SUBMISSION_TYPE_LABELS[feedback.submission_type as FeedbackType]}
              </span>
            </div>
              <div className="detail-item">
                <span className="label">Submitter Role</span>
                <span className="value">
                  <FeedbackSubmitterBadge submitterType={feedback.submitter_type as FeedbackSubmitterType} />
                </span>
              </div>
              {feedback.submitter_relationship && !feedback.is_anonymous && (
                <div className="detail-item">
                  <span className="label">Relationship</span>
                  <span className="value text-muted" style={{ fontSize: "13px" }}>
                    {feedback.submitter_relationship}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Feedback Scope</span>
                <span className="value" style={{ fontWeight: 500 }}>
                  {feedback.feedback_scope === "student_specific"
                    ? "Student Specific"
                    : feedback.feedback_scope === "multiple_students"
                    ? "Multiple Students"
                    : feedback.feedback_scope === "general_school"
                    ? "General School"
                    : "Student Specific"}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Submitter Name</span>
                <span className="value submitter-value">
                  {feedback.is_anonymous ? (
                    <span className="anonymous-tag">Anonymous</span>
                  ) : feedback.submitter_name ? (
                    <span className="name-block">{feedback.submitter_name}</span>
                  ) : (
                    <span className="anonymous-tag">Anonymous</span>
                  )}
                </span>
              </div>
              {feedback.student && !feedback.is_anonymous && (
                <>
                  <div className="detail-item">
                    <span className="label">Associated Student</span>
                    <span className="value student-info-block">
                      {feedback.student.student_name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Admission No</span>
                    <span className="value student-info-block">{feedback.student.admission_no}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Class & Section</span>
                    <span className="value student-info-block">
                      {feedback.student.class} - {feedback.student.section}
                    </span>
                  </div>
                  {(feedback.student.parent_name || feedback.student.parent_phone) && (
                    <div className="detail-item">
                      <span className="label">Registered Parent</span>
                      <span className="value text-muted" style={{ fontSize: "13px" }}>
                        {feedback.student.parent_name || "N/A"}
                        {feedback.student.parent_phone && ` (${feedback.student.parent_phone})`}
                      </span>
                    </div>
                  )}
                  {(feedback.student.guardian_name || feedback.student.guardian_phone) && (
                    <div className="detail-item">
                      <span className="label">Registered Guardian</span>
                      <span className="value text-muted" style={{ fontSize: "13px" }}>
                        {feedback.student.guardian_name || "N/A"}
                        {feedback.student.guardian_phone && ` (${feedback.student.guardian_phone})`}
                      </span>
                    </div>
                  )}
                </>
              )}
              {feedback.verification_status === "verified" && feedback.is_anonymous && (
                <div className="detail-item">
                  <span className="label">Verification</span>
                  <span className="value">
                    <span className="verification-badge verified">Verified Student (Hidden)</span>
                  </span>
                </div>
              )}
              {feedback.submitter_phone && !feedback.is_anonymous && (
                <div className="detail-item">
                  <span className="label">Phone Contact</span>
                  <span className="value phone-block">
                    <Phone size={12} style={{ display: "inline", marginRight: "4px" }} />
                    {feedback.submitter_phone}
                  </span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Date Submitted</span>
                <span className="value date-block">
                  <Calendar size={12} style={{ display: "inline", marginRight: "4px" }} />
                  {formatDate(feedback.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Feedback raw text */}
          <div className="card text-card">
            <div className="card-header-with-icon">
              <MessageSquare size={18} className="header-icon" />
              <h2>Original Message</h2>
            </div>
            <blockquote className="feedback-blockquote">{feedback.raw_text}</blockquote>
          </div>

          {/* AI Analysis Summary */}
          <div className="card ai-card">
            <div className="ai-card-bg-glow" />
            <div className="card-header-with-icon" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={18} className="header-icon ai-sparkle" />
                <h2 className="ai-heading">AI Assistant Classification</h2>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleReprocess}
                disabled={isReprocessing}
                style={{ fontSize: "11px", padding: "4px 10px" }}
              >
                {isReprocessing ? (
                  <>
                    <Loader2 size={12} className="spinning" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Reprocess
                  </>
                )}
              </button>
            </div>

            {reprocessError && (
              <div style={{ padding: "0.5rem 1rem", color: "hsl(var(--danger))", fontSize: "12px" }}>
                {reprocessError}
              </div>
            )}

            <div className="ai-content">
              <div className="ai-summary-box">
                <h3 className="ai-subtitle">Summary</h3>
                <p className="ai-summary-p">
                  {feedback.summary || "Awaiting summary extraction..."}
                </p>
              </div>

              <div className="ai-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Category</span>
                  <div className="metric-badge-wrapper">
                    {feedback.category ? (
                      <FeedbackCategoryBadge category={feedback.category} />
                    ) : (
                      <span className="pending-text">Pending</span>
                    )}
                  </div>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Priority</span>
                  <div className="metric-badge-wrapper">
                    {feedback.priority ? (
                      <FeedbackPriorityBadge priority={feedback.priority} />
                    ) : (
                      <span className="pending-text">Pending</span>
                    )}
                  </div>
                </div>

                <div className="metric-box">
                  <span className="metric-label">Sentiment</span>
                  <div className="metric-badge-wrapper">
                    {feedback.sentiment ? (
                      <FeedbackSentimentBadge sentiment={feedback.sentiment} />
                    ) : (
                      <span className="pending-text">Pending</span>
                    )}
                  </div>
                </div>

                <div className="metric-box">
                  <span className="metric-label">AI Processed At</span>
                  <span className="metric-text-val">
                    {feedback.ai_processed_at
                      ? formatDate(feedback.ai_processed_at)
                      : "Pending processing"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <EvidenceGallery evidence={feedback.feedback_evidence} />

          {/* Comments & Activity Log */}
          <CommentThread comments={feedback.feedback_comments} />

          {/* Comment submission form */}
          <AddCommentForm onSubmit={handleAddComment} />
        </div>

        {/* Sidebar Column */}
        <div className="detail-sidebar">
          {/* Status workflow selector */}
          <div className="card workflow-card">
            <h3>Update Status & Action Note</h3>
            <form onSubmit={handleStatusChangeSubmit} className="workflow-form">
              <div className="select-wrapper" style={{ marginBottom: "0.75rem" }}>
                <select
                  className="input status-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus)}
                  disabled={updatingStatus}
                  required
                >
                  <option value="new">New</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="note-wrapper" style={{ marginBottom: "0.75rem" }}>
                <textarea
                  className="input note-textarea"
                  placeholder="Enter administrative update note (e.g. Transport Department notified)"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  disabled={updatingStatus}
                  rows={2}
                  style={{ resize: "none", fontSize: "12.5px" }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <>
                    <Loader2 size={13} className="spinning" /> Saving...
                  </>
                ) : (
                  "Submit Lifecycle Update"
                )}
              </button>
            </form>
            {updateError && <p className="error-text" style={{ color: "red", fontSize: "11px", marginTop: "4px" }}>{updateError}</p>}
            <p className="workflow-desc" style={{ marginTop: "8px", fontSize: "11px", color: "hsl(var(--text-muted))" }}>
              Updates are logged to the public tracking timeline and internal audit logs.
            </p>
          </div>

          {/* Timeline Tracker */}
          <StatusTimeline currentStatus={feedback.status} timelineEvents={feedback.timeline} />

          {/* Cluster Card */}
          <div className="card cluster-sidebar-card">
            <div className="card-header-with-icon">
              <Layers size={16} className="header-icon" />
              <h3>Issue Grouping</h3>
            </div>
            {feedback.issue_clusters ? (
              <div className="cluster-info-box">
                <h4 className="cluster-title">{feedback.issue_clusters.title}</h4>
                <div className="cluster-meta">
                  <span className="cluster-badge">Clustered</span>
                  <span className="cluster-count">
                    {feedback.issue_clusters.report_count} related items
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-cluster-box">
                <p>This feedback has not been clustered into a duplicate group yet.</p>
              </div>
            )}
          </div>

          {/* Danger Zone (Principal Only) */}
          {isPrincipal && (
            <div className="card workflow-card danger-zone-card" style={{ borderColor: "hsl(var(--danger) / 0.35)", marginTop: "1.25rem" }}>
              <div className="card-header-with-icon" style={{ borderBottomColor: "hsl(var(--danger) / 0.15)", marginBottom: "0.75rem", paddingBottom: "0.5rem" }}>
                <AlertCircle size={16} className="header-icon" style={{ color: "hsl(var(--danger))" }} />
                <h2 style={{ color: "hsl(var(--danger))", fontSize: "13.5px" }}>Danger Zone</h2>
              </div>
              <p style={{ fontSize: "11.5px", color: "hsl(var(--text-muted))", marginBottom: "12px", lineHeight: "1.4" }}>
                Permanently delete this feedback, comments, attachments, and timeline logs. This action is irreversible.
              </p>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={deleting}
                onClick={handleDeleteFeedback}
                onMouseLeave={() => setConfirmDelete(false)}
              >
                {deleting ? (
                  "Deleting..."
                ) : confirmDelete ? (
                  "Click Again to Confirm Delete"
                ) : (
                  "Delete Feedback"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .detail-navigation {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: hsl(var(--text-muted));
        }
        .current-breadcrumb {
          font-weight: 500;
          color: hsl(var(--text-secondary));
        }

        .detail-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (min-width: 1024px) {
          .detail-layout {
            grid-template-columns: 2.2fr 1fr;
          }
        }

        .detail-main {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .detail-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Card Header icon utility */
        .card-header-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1rem;
          border-bottom: 1px solid hsl(var(--border-subtle));
          padding-bottom: 0.75rem;
        }
        .card-header-with-icon h2 {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin: 0;
          letter-spacing: -0.010em;
        }
        .header-icon {
          color: hsl(var(--text-muted));
        }

        /* Submitter info card */
        .submitter-card {
          background: hsl(var(--bg-surface));
        }
        .submitter-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.25rem;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .detail-item .label {
          font-size: 11px;
          font-weight: 550;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .detail-item .value {
          font-size: 13.5px;
          color: hsl(var(--text-primary));
          font-weight: 500;
        }
        .anonymous-tag {
          color: hsl(var(--text-muted));
          font-style: italic;
          font-weight: 400 !important;
        }
        .submission-type-label {
          font-weight: 600 !important;
        }
        .tracking-number-block {
          font-family: monospace;
          font-weight: 700 !important;
          color: hsl(var(--accent)) !important;
          letter-spacing: 0.05em;
        }
        .student-info-block {
          color: hsl(var(--text-primary));
          font-weight: 550;
        }
        .verification-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .verification-badge.verified {
          background: hsl(var(--success) / 0.1);
          color: hsl(var(--success));
          border: 1px solid hsl(var(--success) / 0.2);
        }

        /* Raw message card */
        .text-card {
          background: hsl(var(--bg-surface));
        }
        .feedback-blockquote {
          margin: 0;
          font-size: 14.5px;
          line-height: 1.6;
          color: hsl(var(--text-primary));
          border-left: 2px solid hsl(var(--accent) / 0.5);
          padding-left: 1rem;
          white-space: pre-wrap;
          font-style: italic;
        }

        /* AI Assistant card */
        .ai-card {
          background: hsl(var(--bg-surface));
          border-color: hsl(var(--accent) / 0.25);
          position: relative;
          overflow: hidden;
        }
        .ai-card-bg-glow {
          position: absolute;
          top: -30%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, hsl(var(--accent) / 0.04) 0%, transparent 70%);
          pointer-events: none;
        }
        .ai-sparkle {
          color: hsl(var(--accent));
        }
        .ai-heading {
          color: hsl(var(--text-primary)) !important;
        }
        .ai-content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .ai-subtitle {
          font-size: 12.5px;
          font-weight: 600;
          color: hsl(var(--text-secondary));
          margin-bottom: 6px;
        }
        .ai-summary-p {
          font-size: 13.5px;
          color: hsl(var(--text-primary));
          line-height: 1.5;
          margin: 0;
        }
        .ai-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          background: hsl(var(--bg-elevated) / 0.3);
          border: 1px solid hsl(var(--border-subtle));
          border-radius: var(--radius);
          padding: 1rem;
        }
        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .metric-label {
          font-size: 11px;
          font-weight: 550;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .metric-badge-wrapper {
          display: flex;
        }
        .metric-text-val {
          font-size: 12.5px;
          color: hsl(var(--text-secondary));
          font-weight: 500;
        }
        .pending-text {
          font-size: 12.5px;
          color: hsl(var(--text-muted));
          font-style: italic;
        }

        /* Sidebar Update Status card */
        .workflow-card {
          background: hsl(var(--bg-surface));
          padding: 1.25rem;
        }
        .workflow-card h3 {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--text-muted));
          margin-bottom: 0.75rem;
        }
        .select-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-select {
          flex: 1;
        }
        .inline-spinner {
          color: hsl(var(--text-muted));
        }
        .error-text {
          color: hsl(var(--danger));
          font-size: 12.5px;
          margin-top: 6px;
        }
        .workflow-desc {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          margin-top: 0.75rem;
          line-height: 1.4;
        }

        /* Cluster sidebar card */
        .cluster-sidebar-card {
          background: hsl(var(--bg-surface));
          padding: 1.25rem;
        }
        .cluster-sidebar-card h3 {
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: hsl(var(--text-muted));
          margin: 0;
        }
        .cluster-info-box {
          margin-top: 0.5rem;
        }
        .cluster-title {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 6px;
          line-height: 1.4;
        }
        .cluster-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cluster-badge {
          background: hsl(var(--accent) / 0.1);
          color: hsl(var(--accent));
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid hsl(var(--accent) / 0.15);
        }
        .cluster-count {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
        }
        .empty-cluster-box {
          font-size: 12px;
          color: hsl(var(--text-muted));
          margin-top: 0.5rem;
          line-height: 1.4;
        }

        /* Spinner spinning */
        .spinning {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
