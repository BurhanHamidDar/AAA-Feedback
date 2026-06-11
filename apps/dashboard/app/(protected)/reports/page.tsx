"use client";

import { useState, useEffect } from "react";

import {
  Calendar,
  FileText,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Filter,
  Layers,
  HelpCircle,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useDashboardStats";
import { formatNumber } from "@/lib/utils";
import apiClient from "@/lib/api";

type PresetType = "7d" | "30d" | "90d" | "month" | "custom";

export default function ReportsPage() {
  // ── Filters & Range Presets ────────────────────────────
  const [preset, setPreset] = useState<PresetType>("30d");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Optional Advanced filters to customize exports
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [category, setCategory] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [submissionType, setSubmissionType] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentSection, setStudentSection] = useState("");

  // Export progress states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Preset date math
  useEffect(() => {
    if (preset === "custom") return;

    const to = new Date();
    let from = new Date();

    if (preset === "7d") {
      from.setDate(to.getDate() - 7);
    } else if (preset === "30d") {
      from.setDate(to.getDate() - 30);
    } else if (preset === "90d") {
      from.setDate(to.getDate() - 90);
    } else if (preset === "month") {
      from = new Date(to.getFullYear(), to.getMonth(), 1);
    }

    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    setDateFrom(formatLocalDate(from));
    setDateTo(formatLocalDate(to));
  }, [preset]);

  const activeFilters = {
    date_from: dateFrom ? new Date(dateFrom + "T00:00:00").toISOString() : undefined,
    date_to: dateTo ? new Date(dateTo + "T23:59:59").toISOString() : undefined,
    category: category || undefined,
    sentiment: sentiment || undefined,
    priority: priority || undefined,
    status: status || undefined,
    submission_type: submissionType || undefined,
    class: studentClass || undefined,
    section: studentSection || undefined,
  };

  // Live analytics preview query
  const { data: previewData, isLoading, refetch } = useAnalytics(activeFilters);

  const kpis = previewData?.kpis;
  const resolution = previewData?.resolution;
  const categoriesBreakdown = previewData?.categories ?? [];
  const sentiments = previewData?.sentiments ?? [];

  // Reset all filters
  const handleResetFilters = () => {
    setPreset("30d");
    setCategory("");
    setSentiment("");
    setPriority("");
    setStatus("");
    setSubmissionType("");
    setStudentClass("");
    setStudentSection("");
    setExportError(null);
  };

  // Trigger export endpoint and fetch response as blob
  const triggerExport = async (type: "pdf" | "excel") => {
    setExportError(null);
    if (type === "pdf") {
      setIsExportingPdf(true);
    } else {
      setIsExportingExcel(true);
    }

    try {
      // Clean query params to match expected backend structure
      const params = Object.entries(activeFilters).reduce((acc, [key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          acc[key] = String(val);
        }
        return acc;
      }, {} as Record<string, string>);

      const response = await apiClient.get(`/reports/export/${type}`, {
        params,
        responseType: "blob",
      });

      // Construct file download link
      const blob = new Blob(
        [response.data],
        {
          type: type === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );
      
      const fileExtension = type === "pdf" ? "pdf" : "xlsx";
      const timestamp = new Date().toISOString().slice(0, 10);
      const downloadName = `AAA_Feedback_Report_${timestamp}.${fileExtension}`;

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err: any) {
      console.error(`Export ${type} failed:`, err);
      setExportError(
        `Failed to generate the ${type.toUpperCase()} report. Please ensure you have permission and try again.`
      );
    } finally {
      if (type === "pdf") {
        setIsExportingPdf(false);
      } else {
        setIsExportingExcel(false);
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Institutional Reports & Exports</h1>
          <p>Generate certified feedback digests and export data grids for Ayesha Ali Academy's board of directors.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw size={13} className={isLoading ? "spinning" : ""} style={{ marginRight: 4 }} /> Refresh Preview
        </button>
      </div>

      {exportError && (
        <div className="error-banner">
          <AlertTriangle size={15} className="error-icon" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="configs-grid">
        {/* Date presets card */}
        <div className="card config-card">
          <div className="card-header-simple">
            <Calendar size={15} className="header-icon" />
            <h3>Step 1: Select Date Range</h3>
          </div>
          <p className="card-desc">Define the reporting window. Presets dynamically calculate calendar limits.</p>

          <div className="presets-bar">
            {(["7d", "30d", "90d", "month", "custom"] as PresetType[]).map((p) => {
              const label = {
                "7d": "Last 7 Days",
                "30d": "Last 30 Days",
                "90d": "Last 90 Days",
                month: "Current Month",
                custom: "Custom Range",
              }[p];
              return (
                <button
                  key={p}
                  className={`preset-btn ${preset === p ? "active" : ""}`}
                  onClick={() => setPreset(p)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="dates-inputs">
            <div className="date-field">
              <label>Start Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPreset("custom");
                }}
                className="input"
              />
            </div>
            <div className="date-field">
              <label>End Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPreset("custom");
                }}
                className="input"
              />
            </div>
          </div>

          {/* Advanced toggle */}
          <div className="advanced-toggle-wrapper">
            <button className="btn-advanced" onClick={() => setShowAdvanced(!showAdvanced)}>
              <Filter size={12} />
              {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters (Categories, Classes...)"}
            </button>
          </div>

          {showAdvanced && (
            <div className="advanced-filters">
              <div className="advanced-grid">
                  <div className="filter-item">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input select-input">
                      <option value="">All Categories</option>
                      <option value="Academics">Academics</option>
                      <option value="Transport">Transport</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="Staff">Staff</option>
                      <option value="Discipline">Discipline</option>
                      <option value="Administration">Administration</option>
                      <option value="Facilities">Facilities</option>
                      <option value="Safety">Safety</option>
                      <option value="General">General</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Sentiment</label>
                    <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="input select-input">
                      <option value="">All Sentiments</option>
                      <option value="Positive">Positive</option>
                      <option value="Neutral">Neutral</option>
                      <option value="Negative">Negative</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input select-input">
                      <option value="">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="input select-input">
                      <option value="">All Statuses</option>
                      <option value="new">New</option>
                      <option value="under_review">Under Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Submission Type</label>
                    <select value={submissionType} onChange={(e) => setSubmissionType(e.target.value)} className="input select-input">
                      <option value="">All Types</option>
                      <option value="anonymous">Anonymous</option>
                      <option value="principal_only">Principal Only</option>
                      <option value="contact_me">Contact Me</option>
                    </select>
                  </div>
                  <div className="filter-item">
                    <label>Class</label>
                    <input
                      type="text"
                      placeholder="e.g. 10th"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="filter-item">
                    <label>Section</label>
                    <input
                      type="text"
                      placeholder="e.g. A"
                      value={studentSection}
                      onChange={(e) => setStudentSection(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-ghost btn-sm" onClick={handleResetFilters}>
                    Reset Filters
                  </button>
                </div>
            </div>
          )}
        </div>

        {/* Download actions card */}
        <div className="card config-card downloads-card">
          <div className="card-header-simple">
            <Download size={15} className="header-icon" />
            <h3>Step 2: Choose Export Format</h3>
          </div>
          <p className="card-desc">Download compiled records immediately. Reports are generated dynamically using current filters.</p>

          <div className="download-methods-grid">
            {/* PDF Card */}
            <div className="download-option-box">
              <div className="option-info">
                <FileText size={28} className="doc-icon text-pdf" />
                <div>
                  <h4>Executive Board Summary</h4>
                  <p>Formatted A4 PDF document containing official school headers, key metrics, and filtered feedback summaries. Perfect for print or presentations.</p>
                </div>
              </div>
              <button
                className="btn btn-primary export-action-btn"
                disabled={isExportingPdf || isLoading}
                onClick={() => triggerExport("pdf")}
              >
                {isExportingPdf ? (
                  <>
                    <RefreshCw size={13} className="spinning" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={13} /> Export PDF Document
                  </>
                )}
              </button>
            </div>

            {/* Excel Card */}
            <div className="download-option-box">
              <div className="option-info">
                <FileSpreadsheet size={28} className="doc-icon text-excel" />
                <div>
                  <h4>Raw Data Logs (Spreadsheet)</h4>
                  <p>Excel workbook with formatted grid headers. Contains detailed feedback metadata, submitter logs, registry links, and resolution dates.</p>
                </div>
              </div>
              <button
                className="btn btn-secondary export-action-btn"
                disabled={isExportingExcel || isLoading}
                onClick={() => triggerExport("excel")}
              >
                {isExportingExcel ? (
                  <>
                    <RefreshCw size={13} className="spinning" /> Compiling Sheet...
                  </>
                ) : (
                  <>
                    <Download size={13} /> Export Excel Sheet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section Title */}
      <div className="preview-divider">
        <span>Report Preview (Selected Scope)</span>
      </div>

      {/* Preview KPI Summaries */}
      {isLoading ? (
        <div className="preview-loading-box">
          <RefreshCw size={24} className="spinning text-muted" />
          <p>Analyzing matching records and compiling statistics...</p>
        </div>
      ) : !kpis || kpis.total_feedback === 0 ? (
        <div className="preview-empty-box">
          <Info size={24} className="text-muted" />
          <p>No feedback records match the specified filters.</p>
          <span className="sub">Adjust your date range or filters to broaden the search.</span>
        </div>
      ) : (
        <div className="preview-content-grid">
          {/* KPI Summary Card */}
          <div className="card preview-stat-card">
            <h4>Scope Key Metrics</h4>
            <div className="preview-metrics-grid">
              <div className="metric-row">
                <span className="label">Total Records</span>
                <span className="val">{formatNumber(kpis.total_feedback)}</span>
              </div>
              <div className="metric-row">
                <span className="label">Resolved Cases</span>
                <span className="val text-success">
                  {formatNumber(kpis.resolved_issues)} ({resolution?.resolution_rate}%)
                </span>
              </div>
              <div className="metric-row">
                <span className="label">Average Resolution Time</span>
                <span className="val text-warning">{resolution?.avg_resolution_time_hours} hrs</span>
              </div>
              <div className="metric-row">
                <span className="label">Critical Issues</span>
                <span className="val text-danger">{formatNumber(kpis.critical_issues)}</span>
              </div>
            </div>
          </div>

          {/* Categories preview */}
          <div className="card preview-stat-card">
            <h4>Top Reported Categories</h4>
            <div className="list-wrapper">
              {categoriesBreakdown.length === 0 ? (
                <div className="empty-text">No category data.</div>
              ) : (
                categoriesBreakdown.slice(0, 4).map((cat: any) => (
                  <div key={cat.category} className="list-row">
                    <span className="label">{cat.category}</span>
                    <span className="val">
                      {cat.count} reports ({cat.percentage}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sentiment preview */}
          <div className="card preview-stat-card">
            <h4>Sentiment Breakdown</h4>
            <div className="list-wrapper">
              {sentiments.length === 0 ? (
                <div className="empty-text">No sentiment data.</div>
              ) : (
                sentiments.map((s: any) => {
                  const Icon = {
                    Positive: ThumbsUp,
                    Negative: ThumbsDown,
                    Neutral: HelpCircle,
                    Mixed: AlertTriangle,
                  }[s.sentiment as string] || HelpCircle;

                  const colorClass = {
                    Positive: "text-success",
                    Negative: "text-danger",
                    Neutral: "text-muted",
                    Mixed: "text-warning",
                  }[s.sentiment as string] || "text-muted";

                  return (
                    <div key={s.sentiment} className="list-row">
                      <span className="label-icon">
                        <Icon size={12} className={colorClass} />
                        {s.sentiment}
                      </span>
                      <span className="val">
                        {s.count} logs ({s.percentage}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .page-header h1 {
          font-size: 1.375rem;
          margin-bottom: 2px;
        }
        .page-header p {
          font-size: 13px;
          color: hsl(var(--text-muted));
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: hsl(var(--danger) / 0.08);
          border: 1px solid hsl(var(--danger) / 0.2);
          border-radius: var(--radius);
          padding: 10px 14px;
          margin-bottom: 1.5rem;
          color: hsl(var(--danger));
          font-size: 13px;
        }
        .error-icon {
          flex-shrink: 0;
        }

        .configs-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 1024px) {
          .configs-grid {
            grid-template-columns: 1fr;
          }
        }

        .config-card {
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
          background: hsl(var(--bg-surface));
        }
        .card-header-simple {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .card-header-simple h3 {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .header-icon {
          color: hsl(var(--accent));
        }
        .card-desc {
          font-size: 12.5px;
          color: hsl(var(--text-muted));
          margin-bottom: 1.25rem;
        }

        /* Preset bar */
        .presets-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 1rem;
        }
        .preset-btn {
          font-size: 11.5px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--text-secondary));
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .preset-btn:hover {
          background: hsl(var(--bg-overlay));
          color: hsl(var(--text-primary));
        }
        .preset-btn.active {
          background: hsl(var(--accent));
          color: white;
          border-color: hsl(var(--accent));
        }

        .dates-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .date-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .date-field label {
          font-size: 10.5px;
          font-weight: 550;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }

        /* Advanced Filters */
        .advanced-toggle-wrapper {
          border-top: 1px solid hsl(var(--border-subtle));
          padding-top: 12px;
          margin-top: 4px;
        }
        .btn-advanced {
          background: none;
          border: none;
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0;
          transition: color 0.15s ease;
        }
        .btn-advanced:hover {
          color: hsl(var(--text-primary));
        }
        .advanced-filters {
          margin-top: 12px;
          overflow: hidden;
        }
        .advanced-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 8px;
        }
        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .filter-item label {
          font-size: 10px;
          font-weight: 550;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }
        .select-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 11px;
          padding-right: 24px !important;
        }

        /* Download Options Layout */
        .downloads-card {
          background: hsl(var(--bg-surface));
        }
        .download-methods-grid {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
        }
        .download-option-box {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          background: hsl(var(--bg-elevated) / 0.15);
          gap: 1rem;
        }
        .option-info {
          display: flex;
          gap: 1rem;
        }
        .doc-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .text-pdf {
          color: hsl(var(--danger));
        }
        .text-excel {
          color: hsl(var(--success));
        }
        .option-info h4 {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 2px;
        }
        .option-info p {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          line-height: 1.4;
        }
        .export-action-btn {
          width: 100%;
          justify-content: center;
        }

        /* Preview Area */
        .preview-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.5rem;
        }
        .preview-divider::after {
          content: "";
          flex-grow: 1;
          height: 1px;
          background: hsl(var(--border));
        }
        .preview-divider span {
          font-size: 11.5px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .preview-loading-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          border: 1px dashed hsl(var(--border));
          border-radius: var(--radius-lg);
          background: hsl(var(--bg-surface));
          gap: 12px;
          color: hsl(var(--text-secondary));
          font-size: 13px;
        }
        .preview-empty-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          border: 1px dashed hsl(var(--border));
          border-radius: var(--radius-lg);
          background: hsl(var(--bg-surface));
          gap: 8px;
          text-align: center;
        }
        .preview-empty-box p {
          font-size: 13.5px;
          font-weight: 550;
          color: hsl(var(--text-primary));
        }
        .preview-empty-box .sub {
          font-size: 12px;
          color: hsl(var(--text-muted));
        }

        .preview-content-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1024px) {
          .preview-content-grid {
            grid-template-columns: 1fr;
          }
        }

        .preview-stat-card {
          padding: 1.25rem;
          background: hsl(var(--bg-surface));
        }
        .preview-stat-card h4 {
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 1rem;
          border-bottom: 1px solid hsl(var(--border-subtle));
          padding-bottom: 6px;
        }

        .preview-metrics-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
        }
        .metric-row .label {
          color: hsl(var(--text-secondary));
        }
        .metric-row .val {
          font-weight: 600;
          color: hsl(var(--text-primary));
        }

        .list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .list-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          padding: 6px 8px;
          background: hsl(var(--bg-elevated) / 0.4);
          border-radius: var(--radius-sm);
        }
        .list-row .label {
          font-weight: 500;
          color: hsl(var(--text-primary));
        }
        .list-row .label-icon {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
          color: hsl(var(--text-primary));
        }
        .list-row .val {
          font-weight: 600;
          color: hsl(var(--accent));
        }
        .text-success {
          color: hsl(var(--success));
        }
        .text-danger {
          color: hsl(var(--danger));
        }
        .text-muted {
          color: hsl(var(--text-muted));
        }
        .text-warning {
          color: hsl(var(--warning));
        }
        .empty-text {
          font-size: 12px;
          color: hsl(var(--text-muted));
          text-align: center;
          padding: 1rem;
        }

        .spinning {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 600px) {
          .dates-inputs {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .option-info {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
