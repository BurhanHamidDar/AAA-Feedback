"use client";

import { useState, useEffect } from "react";

import {
  MessageSquareText,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CircleDot,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  Clock,
  Layers,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useAnalytics } from "@/hooks/useDashboardStats";
import { useFeedbackList } from "@/hooks/useFeedback";
import { formatNumber } from "@/lib/utils";
import { FeedbackStatusBadge } from "@/components/feedback/FeedbackStatusBadge";
import { FeedbackPriorityBadge } from "@/components/feedback/FeedbackPriorityBadge";
import { FeedbackSentimentBadge } from "@/components/feedback/FeedbackSentimentBadge";
import { FeedbackCategoryBadge } from "@/components/feedback/FeedbackCategoryBadge";
import { FeedbackSubmitterBadge } from "@/components/feedback/FeedbackSubmitterBadge";


// ── KPI Card Component ──
interface KPICardProps {
  title: string;
  value: number | string | undefined;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
  index?: number;
  active?: boolean;
  onClick?: () => void;
}

function KPICard({ title, value, icon: Icon, color, loading, active, onClick }: KPICardProps) {
  return (
    <div className={`stat-card ${onClick ? "clickable" : ""} ${active ? "active" : ""}`} onClick={onClick}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        <div className="kpi-icon" style={{ color }}>
          <Icon size={15} strokeWidth={1.75} />
        </div>
      </div>
      {loading ? (
        <div className="skeleton" style={{ width: 70, height: 28, marginTop: 8 }} />
      ) : (
        <div className="kpi-value">{value}</div>
      )}

      <style jsx>{`
        .stat-card.clickable {
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card.clickable:hover {
          transform: translateY(-2px);
          border-color: hsl(var(--accent) / 0.4);
          box-shadow: var(--shadow-md);
          background: hsl(var(--bg-elevated) / 0.2);
        }
        .stat-card.active {
          border-color: ${color};
          box-shadow: 0 0 0 1px ${color}30, var(--shadow-sm);
          background: ${color}08;
        }
        .kpi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .kpi-title {
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .kpi-icon {
          width: 26px;
          height: 26px;
          border-radius: var(--radius);
          background: currentColor;
          opacity: 0.12;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .kpi-icon :global(svg) {
          position: absolute;
          color: inherit;
        }
        .kpi-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(var(--text-primary));
          letter-spacing: -0.02em;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}

// ── Chart Colors ──
const CATEGORY_COLORS: Record<string, string> = {
  Academics: "#6366f1",
  Transport: "#f59e0b",
  Infrastructure: "#f97316",
  Staff: "#a855f7",
  Discipline: "#ef4444",
  Administration: "#71717a",
  Facilities: "#14b8a6",
  Safety: "#f43f5e",
  General: "#818cf8",
  Other: "#52525b",
};

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: "#10b981",
  Neutral: "#6b7280",
  Negative: "#ef4444",
  Mixed: "#f59e0b",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#3b82f6",
  High: "#f59e0b",
  Critical: "#ef4444",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  under_review: "#f59e0b",
  resolved: "#10b981",
  closed: "#6b7280",
};

const SUBMITTER_COLORS: Record<string, string> = {
  Student: "#3b82f6",
  Parent: "#a855f7",
  Guardian: "#14b8a6",
  Unknown: "#71717a",
};

const SCOPE_COLORS: Record<string, string> = {
  student_specific: "#3b82f6",
  multiple_students: "#ec4899",
  general_school: "#f59e0b",
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  Father: "#3b82f6",
  Mother: "#ec4899",
  Guardian: "#14b8a6",
  Other: "#71717a",
};

// ── Custom Tooltip ──
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="chart-tooltip-item">
          <span style={{ color: p.color || p.payload?.fill }}>●</span>
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
      <style jsx>{`
        .chart-tooltip {
          background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          padding: 8px 10px;
          font-size: 11.5px;
          box-shadow: var(--shadow-sm);
        }
        .chart-tooltip-label {
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 4px;
        }
        .chart-tooltip-item {
          display: flex;
          gap: 6px;
          color: hsl(var(--text-secondary));
        }
      `}</style>
    </div>
  );
}

export default function AnalyticsPage() {
  // Filter States
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [category, setCategory] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [submissionType, setSubmissionType] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentSection, setStudentSection] = useState("");

  const filters = {
    date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
    category: category || undefined,
    sentiment: sentiment || undefined,
    priority: priority || undefined,
    status: status || undefined,
    submission_type: submissionType || undefined,
    class: studentClass || undefined,
    section: studentSection || undefined,
  };

  const { data, isLoading, refetch } = useAnalytics(filters);

  // Drilldown feedback list states & hook
  const [feedbackPage, setFeedbackPage] = useState(1);
  const { data: feedbackListData, isLoading: isFeedbackListLoading } = useFeedbackList({
    page: feedbackPage,
    limit: 10,
    category: category || undefined,
    sentiment: sentiment || undefined,
    priority: priority || undefined,
    status: status || undefined,
    submission_type: submissionType || undefined,
  });

  // Reset page when any filter changes
  useEffect(() => {
    setFeedbackPage(1);
  }, [category, sentiment, priority, status, submissionType, studentClass, studentSection, dateFrom, dateTo]);

  const kpis = data?.kpis;
  const trends = data?.trends ?? [];
  const categories = data?.categories ?? [];
  const sentiments = data?.sentiments ?? [];
  const priorities = data?.priorities ?? [];
  const statuses = data?.statuses ?? [];
  const submitterTypes = data?.submitterTypes ?? [];
  const feedbackScopes = data?.feedbackScopes ?? [];
  const relationships = data?.relationships ?? [];
  const resolution = data?.resolution;
  const mostReported = data?.mostReported ?? [];

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategory("");
    setSentiment("");
    setPriority("");
    setStatus("");
    setSubmissionType("");
    setStudentClass("");
    setStudentSection("");
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Analytics & Insights</h1>
          <p>Institutional decision support breakdowns for Ayesha Ali Academy</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
          <RefreshCw size={13} style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {/* Filter panel */}
      <div className="card filter-panel">
        <div className="filter-header">
          <Filter size={14} className="filter-icon" />
          <h3>Advanced Analytics Filters</h3>
        </div>
        <div className="filter-grid">
          <div className="filter-item">
            <label>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
          </div>
          <div className="filter-item">
            <label>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
          </div>
          <div className="filter-item">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input select-input">
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
            <select value={sentiment} onChange={e => setSentiment(e.target.value)} className="input select-input">
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Priority</label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className="input select-input">
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input select-input">
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Type</label>
            <select value={submissionType} onChange={e => setSubmissionType(e.target.value)} className="input select-input">
              <option value="">All Types</option>
              <option value="anonymous">Anonymous</option>
              <option value="principal_only">Principal Only</option>
              <option value="contact_me">Contact Me</option>
            </select>
          </div>
          <div className="filter-item">
            <label>Class</label>
            <input type="text" placeholder="e.g. 10th" value={studentClass} onChange={e => setStudentClass(e.target.value)} className="input" />
          </div>
          <div className="filter-item">
            <label>Section</label>
            <input type="text" placeholder="e.g. A" value={studentSection} onChange={e => setStudentSection(e.target.value)} className="input" />
          </div>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={handleResetFilters}>Reset Filters</button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KPICard
          title="Total Feedback"
          value={formatNumber(kpis?.total_feedback)}
          icon={MessageSquareText}
          color="#6366f1"
          loading={isLoading}
          index={0}
          active={!sentiment && !priority && !status}
          onClick={handleResetFilters}
        />
        <KPICard
          title="Positive"
          value={formatNumber(kpis?.positive_feedback)}
          icon={ThumbsUp}
          color="#10b981"
          loading={isLoading}
          index={1}
          active={sentiment === "Positive"}
          onClick={() => {
            setSentiment("Positive");
            setPriority("");
            setStatus("");
          }}
        />
        <KPICard
          title="Negative"
          value={formatNumber(kpis?.negative_feedback)}
          icon={ThumbsDown}
          color="#ef4444"
          loading={isLoading}
          index={2}
          active={sentiment === "Negative"}
          onClick={() => {
            setSentiment("Negative");
            setPriority("");
            setStatus("");
          }}
        />
        <KPICard
          title="Mixed"
          value={formatNumber(kpis?.mixed_feedback)}
          icon={HelpCircle}
          color="#f59e0b"
          loading={isLoading}
          index={3}
          active={sentiment === "Mixed"}
          onClick={() => {
            setSentiment("Mixed");
            setPriority("");
            setStatus("");
          }}
        />
        <KPICard
          title="Critical"
          value={formatNumber(kpis?.critical_issues)}
          icon={AlertTriangle}
          color="#f43f5e"
          loading={isLoading}
          index={4}
          active={priority === "Critical"}
          onClick={() => {
            setPriority("Critical");
            setSentiment("");
            setStatus("");
          }}
        />
        <KPICard
          title="Open"
          value={formatNumber(kpis?.open_issues)}
          icon={CircleDot}
          color="#3b82f6"
          loading={isLoading}
          index={5}
          active={status === "new"}
          onClick={() => {
            setStatus("new");
            setSentiment("");
            setPriority("");
          }}
        />
        <KPICard
          title="Resolved"
          value={formatNumber(kpis?.resolved_issues)}
          icon={CheckCircle2}
          color="#10b981"
          loading={isLoading}
          index={6}
          active={status === "resolved"}
          onClick={() => {
            setStatus("resolved");
            setSentiment("");
            setPriority("");
          }}
        />
        <KPICard
          title="Under Review"
          value={formatNumber(kpis?.under_review_issues)}
          icon={Clock}
          color="#f59e0b"
          loading={isLoading}
          index={7}
          active={status === "under_review"}
          onClick={() => {
            setStatus("under_review");
            setSentiment("");
            setPriority("");
          }}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="charts-grid">
        {/* Trend Area Chart */}
        <div className="card chart-card span-all">
          <div className="chart-header">
            <h3>Feedback Activity Trend</h3>
            <p>Submission volume over time</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : trends.length === 0 ? (
            <div className="empty-chart">No trend data matches the current filters.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--text-muted))" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--text-muted))" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="total" name="Total Submissions" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#totalGrad)" />
                <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" strokeWidth={1.5} fill="none" dot={false} />
                <Area type="monotone" dataKey="critical" name="Critical" stroke="#f43f5e" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Categories breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Category Distribution</h3>
            <p>Breakdown of academy feedback by domain</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : categories.length === 0 ? (
            <div className="empty-chart">No data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categories} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]}>
                  {categories.map((entry: any) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sentiment breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Sentiment Summary</h3>
            <p>Overall school atmosphere indication</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : sentiments.length === 0 ? (
            <div className="empty-chart">No data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sentiments} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="sentiment">
                  {sentiments.map((entry: any) => (
                    <Cell key={entry.sentiment} fill={SENTIMENT_COLORS[entry.sentiment] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={v => v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Priority Breakdown</h3>
            <p>Severity of issues submitted</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : priorities.length === 0 ? (
            <div className="empty-chart">No data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorities} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="priority" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Issues" radius={[4, 4, 0, 0]}>
                  {priorities.map((entry: any) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Status Breakdown</h3>
            <p>Status of feedback cases</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : statuses.length === 0 ? (
            <div className="empty-chart">No data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statuses} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="status">
                  {statuses.map((entry: any) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={v => v === "new" ? "New" : v === "under_review" ? "Under Review" : v === "resolved" ? "Resolved" : "Closed"} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Submitter Type Breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Submitter Role Distribution</h3>
            <p>Relationship of submitters to students</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : submitterTypes.length === 0 ? (
            <div className="empty-chart">No data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={submitterTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="submitter_type">
                  {submitterTypes.map((entry: any) => (
                    <Cell key={entry.submitter_type} fill={SUBMITTER_COLORS[entry.submitter_type] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={v => v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Feedback Scope Breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Feedback Scope Distribution</h3>
            <p>Scope of submitted feedback</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : feedbackScopes.length === 0 ? (
            <div className="empty-chart">No data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={feedbackScopes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="feedback_scope">
                  {feedbackScopes.map((entry: any) => (
                    <Cell key={entry.feedback_scope} fill={SCOPE_COLORS[entry.feedback_scope] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: 10 }} 
                  formatter={v => v === "student_specific" ? "Student Specific" : v === "multiple_students" ? "Multiple Students" : "General School"} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Parent Relationship Breakdown */}
        <div className="card chart-card">
          <div className="chart-header">
            <h3>Parent Relationship Distribution</h3>
            <p>Submitting parent relationship statistics</p>
          </div>
          {isLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : relationships.length === 0 ? (
            <div className="empty-chart">No data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={relationships} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count" nameKey="relationship">
                  {relationships.map((entry: any) => (
                    <Cell key={entry.relationship} fill={RELATIONSHIP_COLORS[entry.relationship] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} formatter={v => v} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Lower Row: Resolution Metrics & Frequency list */}
      <div className="analytics-details-row">
        {/* Resolution Metrics Panel */}
        <div className="card details-panel">
          <div className="chart-header">
            <h3>Resolution Efficiency Metrics</h3>
            <p>Admin resolution rates and timings</p>
          </div>
          {isLoading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : !resolution ? (
            <div className="empty-chart">No metrics available.</div>
          ) : (
            <div className="metrics-box-grid">
              <div className="metric-box">
                <span className="label">Total Resolved</span>
                <span className="value text-success">{resolution.total_resolved} issues</span>
              </div>
              <div className="metric-box">
                <span className="label">Resolution Rate</span>
                <span className="value text-accent">{resolution.resolution_rate}%</span>
              </div>
              <div className="metric-box">
                <span className="label">Avg Resolution Time</span>
                <span className="value text-warning">{resolution.avg_resolution_time_hours} hours</span>
              </div>
              <div className="metric-box">
                <span className="label">Remaining Open</span>
                <span className="value text-danger">{resolution.open_issues} issues</span>
              </div>
            </div>
          )}
        </div>

        {/* Most Reported Issues List */}
        <div className="card details-panel">
          <div className="chart-header">
            <h3>Top Categories (Frequency)</h3>
            <p>Most common reported domains</p>
          </div>
          {isLoading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : mostReported.length === 0 ? (
            <div className="empty-chart">No categories recorded.</div>
          ) : (
            <div className="issue-frequency-list">
              {mostReported.map((item: any, i: number) => (
                <div key={item.category} className="frequency-row">
                  <div className="freq-left">
                    <span className="freq-index">{i + 1}</span>
                    <span className="freq-category">{item.category}</span>
                  </div>
                  <span className="freq-count">{item.count} Reports</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Drill-Down List */}
      <div className="card feedback-list-panel" style={{ marginTop: "1.5rem" }}>
        <div className="drilldown-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "hsl(var(--text-primary))", margin: 0 }}>
              Detailed Feedback Viewer
            </h3>
            <p style={{ fontSize: "11.5px", color: "hsl(var(--text-muted))", margin: "2px 0 0 0" }}>
              Showing actual feedback items matching active filters:{" "}
              <strong style={{ color: "hsl(var(--accent))" }}>
                {[
                  sentiment && `Sentiment: ${sentiment}`,
                  category && `Category: ${category}`,
                  priority && `Priority: ${priority}`,
                  status && `Status: ${status}`,
                  submissionType && `Type: ${submissionType}`,
                ]
                  .filter(Boolean)
                  .join(", ") || "All Feedbacks"}
              </strong>
            </p>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              background: "hsl(var(--accent) / 0.12)",
              color: "hsl(var(--accent))",
              padding: "3px 8px",
              borderRadius: "4px",
            }}
          >
            {feedbackListData?.pagination?.total ?? 0} Records Found
          </span>
        </div>

        {/* Feedback List Container */}
        {isFeedbackListLoading ? (
          <div className="skeleton" style={{ height: 120, width: "100%" }} />
        ) : !feedbackListData?.data || feedbackListData.data.length === 0 ? (
          <div className="empty-chart" style={{ height: 120 }}>
            No matching feedback items found for the current filters.
          </div>
        ) : (
          <div className="feedback-drilldown-list">
            {feedbackListData.data.map((item: any) => (
              <div key={item.id} className="feedback-drilldown-item">
                <div className="feedback-item-header">
                  <div className="item-meta-left">
                    <span className="tracking-badge">{item.tracking_number ?? "No Reference"}</span>
                    <span className="submitter-badge">
                      {item.is_anonymous
                        ? "Anonymous"
                        : `${item.submitter_name || "Unknown Name"}`}
                    </span>
                    {item.submitter_type && (
                      <FeedbackSubmitterBadge submitterType={item.submitter_type} />
                    )}
                    <span className="date-badge">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="item-meta-right">
                    {item.category && <FeedbackCategoryBadge category={item.category} />}
                    {item.sentiment && <FeedbackSentimentBadge sentiment={item.sentiment} />}
                    {item.priority && <FeedbackPriorityBadge priority={item.priority} />}
                    {item.status && <FeedbackStatusBadge status={item.status} />}
                  </div>
                </div>
                <div className="feedback-item-body">
                  <p>{item.raw_text}</p>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {feedbackListData.pagination.total_pages > 1 && (
              <div className="pagination-bar">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setFeedbackPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!feedbackListData.pagination.has_prev}
                  style={{ minWidth: "80px" }}
                >
                  Previous
                </button>
                <span className="page-indicator">
                  Page {feedbackPage} of {feedbackListData.pagination.total_pages}
                </span>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() =>
                    setFeedbackPage((prev) => Math.min(prev + 1, feedbackListData.pagination.total_pages))
                  }
                  disabled={!feedbackListData.pagination.has_next}
                  style={{ minWidth: "80px" }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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

        /* Filter Panel */
        .filter-panel {
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          background: hsl(var(--bg-surface));
        }
        .filter-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 1rem;
          border-bottom: 1px solid hsl(var(--border-subtle));
          padding-bottom: 0.5rem;
        }
        .filter-header h3 {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .filter-icon {
          color: hsl(var(--text-muted));
        }
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }
        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .filter-item label {
          font-size: 11px;
          font-weight: 550;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }
        .select-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 12px;
          padding-right: 28px !important;
        }

        /* KPI Cards */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .chart-card {
          padding: 1.25rem;
        }
        .span-all {
          grid-column: span 2;
        }
        .chart-header {
          margin-bottom: 1rem;
        }
        .chart-header h3 {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 2px;
        }
        .chart-header p {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
        }
        .chart-skeleton {
          height: 220px;
        }
        .empty-chart {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          font-size: 12.5px;
          color: hsl(var(--text-muted));
          border: 1px dashed var(--border);
          border-radius: var(--radius);
        }

        /* Lower Details Row */
        .analytics-details-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .details-panel {
          padding: 1.25rem;
        }
        .metrics-box-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .metric-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: hsl(var(--bg-elevated) / 0.3);
          border: 1px solid hsl(var(--border-subtle));
          padding: 1rem;
          border-radius: var(--radius);
        }
        .metric-box .label {
          font-size: 11px;
          font-weight: 550;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
        }
        .metric-box .value {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .text-success { color: hsl(var(--success)); }
        .text-accent { color: hsl(var(--accent)); }
        .text-warning { color: #f59e0b; }
        .text-danger { color: hsl(var(--danger)); }

        .issue-frequency-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .frequency-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: hsl(var(--bg-elevated) / 0.3);
          border: 1px solid hsl(var(--border-subtle));
          border-radius: var(--radius);
        }
        .freq-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .freq-index {
          font-size: 11px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          background: hsl(var(--border));
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .freq-category {
          font-size: 12.5px;
          font-weight: 550;
          color: hsl(var(--text-primary));
        }
        .freq-count {
          font-size: 11.5px;
          font-weight: 600;
          color: hsl(var(--accent));
        }

        /* Feedback Drilldown List styling */
        .feedback-list-panel {
          padding: 1.25rem 1.5rem;
          margin-top: 1.5rem;
          background: hsl(var(--bg-surface));
        }
        .feedback-drilldown-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .feedback-drilldown-item {
          padding: 1rem 1.25rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-lg);
          background: hsl(var(--bg-elevated) / 0.15);
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .feedback-drilldown-item:hover {
          border-color: hsl(var(--border-hover, var(--border)));
          background: hsl(var(--bg-elevated) / 0.25);
        }
        .feedback-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.625rem;
          border-bottom: 1px dashed hsl(var(--border) / 0.4);
          padding-bottom: 0.5rem;
        }
        .item-meta-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          flex-wrap: wrap;
        }
        .item-meta-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .tracking-badge {
          font-weight: 700;
          color: hsl(var(--text-primary));
          font-family: monospace;
          background: hsl(var(--border));
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 11.5px;
        }
        .submitter-badge {
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .date-badge {
          color: hsl(var(--text-muted));
          font-size: 11px;
        }
        .feedback-item-body p {
          font-size: 13px;
          color: hsl(var(--text-secondary));
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
        }
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid hsl(var(--border) / 0.4);
        }
        .page-indicator {
          font-size: 12px;
          color: hsl(var(--text-muted));
          font-weight: 550;
        }

        @media (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          .span-all {
            grid-column: span 1;
          }
          .analytics-details-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 500px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          .metrics-box-grid {
            grid-template-columns: 1fr;
          }
          .filter-panel {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
