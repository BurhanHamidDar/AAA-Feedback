"use client";

import {
  MessageSquareText,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CircleDot,
  CheckCircle2,
  TrendingUp,
  Clock,
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
  Legend,
} from "recharts";
import { useDashboardStats, useFeedbackTrends, useCategoryBreakdown } from "@/hooks/useDashboardStats";
import { formatNumber } from "@/lib/utils";
import type { DashboardStats } from "@aaa-feedback/shared";

// ── KPI Card ──────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  colorClass: string;
  loading?: boolean;
}

function KPICard({ title, value, icon: Icon, colorClass, loading }: KPICardProps) {
  return (
    <div className={`stat-card kpi-card ${colorClass}`}>
      <div className="kpi-top">
        <span className="kpi-title">{title}</span>
        <Icon size={14} strokeWidth={1.75} className="kpi-icon" aria-hidden="true" />
      </div>
      {loading ? (
        <div className="skeleton" style={{ width: 64, height: 28, marginTop: 8 }} />
      ) : (
        <div className="kpi-value">{formatNumber(value ?? 0)}</div>
      )}

      <style jsx>{`
        .kpi-card { position: relative; }
        .kpi-top {
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
        .kpi-icon { color: hsl(var(--text-muted)); }
        .kpi-value {
          font-size: 1.625rem;
          font-weight: 700;
          color: hsl(var(--text-primary));
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .kpi-card.kpi-critical .kpi-value { color: hsl(var(--danger)); }
        .kpi-card.kpi-open .kpi-value { color: hsl(var(--warning)); }
        .kpi-card.kpi-resolved .kpi-value { color: hsl(var(--success)); }
      `}</style>
    </div>
  );
}

// ── Category colors (institutional palette) ───────────────────

const CATEGORY_CHART_COLORS: Record<string, string> = {
  academics:      "#1e4d7b",
  transport:      "#7a5c1a",
  infrastructure: "#5a6e2f",
  staff:          "#4a2c6e",
  discipline:     "#7a2020",
  administration: "#4a5568",
  facilities:     "#1e6e5a",
  safety:         "#6e2a2a",
  general:        "#364b5f",
  other:          "#525f6b",
};

// ── Custom Tooltip ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <div className="ct-label">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="ct-row">
          <span style={{ color: p.color }}>■</span>
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
      <style jsx>{`
        .chart-tooltip {
          background: hsl(var(--bg-surface));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          padding: 8px 12px;
          font-size: 12px;
          box-shadow: var(--shadow);
        }
        .ct-label {
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 5px;
          font-size: 11px;
        }
        .ct-row {
          display: flex;
          gap: 6px;
          color: hsl(var(--text-secondary));
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

// ── Main Dashboard Page ────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useFeedbackTrends();
  const { data: categories, isLoading: categoriesLoading } = useCategoryBreakdown();

  const kpiCards: Array<{
    title: string;
    key: keyof DashboardStats;
    icon: React.ElementType;
    colorClass: string;
  }> = [
    { title: "Total Feedback",  key: "total_feedback",    icon: MessageSquareText, colorClass: "" },
    { title: "Positive",        key: "positive_feedback", icon: ThumbsUp,          colorClass: "" },
    { title: "Negative",        key: "negative_feedback", icon: ThumbsDown,        colorClass: "" },
    { title: "Critical Issues", key: "critical_issues",   icon: AlertTriangle,     colorClass: "kpi-critical" },
    { title: "Open Issues",     key: "open_issues",       icon: CircleDot,         colorClass: "kpi-open" },
    { title: "Resolved",        key: "resolved_issues",   icon: CheckCircle2,      colorClass: "kpi-resolved" },
  ];

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p>Feedback summary for Ayesha Ali Academy</p>
        </div>
        <div className="header-badges">
          {stats?.pending_ai_processing != null && stats.pending_ai_processing > 0 && (
            <div className="badge pending-badge">
              <Clock size={11} />
              {stats.pending_ai_processing} pending AI processing
            </div>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpiCards.map((card) => (
          <KPICard
            key={card.key}
            title={card.title}
            value={stats?.[card.key]}
            icon={card.icon}
            colorClass={card.colorClass}
            loading={statsLoading}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Trend Chart */}
        <div className="card chart-card chart-wide">
          <div className="chart-header">
            <div>
              <div className="chart-title">Feedback Trend</div>
              <div className="chart-sub">Volume over last 30 days</div>
            </div>
            <TrendingUp size={14} style={{ color: "hsl(var(--text-muted))" }} aria-hidden="true" />
          </div>

          {trendsLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends ?? []} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#102a43" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#102a43" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b1a1a" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#8b1a1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "hsl(var(--text-muted))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--text-muted))" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#102a43"
                  strokeWidth={1.75}
                  fill="url(#totalGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  name="Negative"
                  stroke="#8b1a1a"
                  strokeWidth={1.5}
                  fill="url(#negativeGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="critical"
                  name="Critical"
                  stroke="#c0392b"
                  strokeWidth={1.5}
                  fill="none"
                  dot={false}
                  strokeDasharray="4 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Pie */}
        <div className="card chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Categories</div>
              <div className="chart-sub">Distribution by type</div>
            </div>
          </div>

          {categoriesLoading ? (
            <div className="skeleton chart-skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categories ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="category"
                >
                  {(categories ?? []).map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_CHART_COLORS[entry.category] ?? "#4a5568"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                  contentStyle={{
                    background: "hsl(var(--bg-surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 5,
                    fontSize: 11,
                    color: "hsl(var(--text-primary))",
                    boxShadow: "var(--shadow)",
                  }}
                />
                <Legend
                  formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                  wrapperStyle={{ fontSize: 10.5, color: "hsl(0 0% 55%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!statsLoading && stats?.total_feedback === 0 && (
        <div className="empty-state">
          <MessageSquareText size={32} strokeWidth={1} style={{ color: "hsl(var(--border))" }} />
          <div>
            <div style={{ fontWeight: 500, color: "hsl(var(--text-secondary))", marginBottom: 4, fontSize: 14 }}>
              No feedback submissions yet
            </div>
            <div style={{ fontSize: 12.5, color: "hsl(var(--text-muted))" }}>
              Feedback will appear here once students and parents start submitting.
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .header-badges {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .pending-badge {
          background: hsl(var(--warning-bg));
          color: hsl(var(--warning));
          border: 1px solid hsl(var(--warning) / 0.2);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.875rem;
          margin-bottom: 1.25rem;
        }

        .charts-row {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 0.875rem;
          margin-bottom: 1.25rem;
        }

        .chart-card { padding: 1rem 1.25rem; }
        .chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .chart-title {
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 2px;
        }
        .chart-sub {
          font-size: 11px;
          color: hsl(var(--text-muted));
        }
        .chart-skeleton { height: 200px; }

        @media (max-width: 1200px) {
          .kpi-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .charts-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
