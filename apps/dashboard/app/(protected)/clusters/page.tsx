import type { Metadata } from "next";
export const metadata: Metadata = { title: "Issue Clusters" };
export default function ClustersPage() {
  return (
    <div className="page-container">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.375rem", marginBottom: 4 }}>Issue Clusters</h1>
        <p style={{ fontSize: 13, color: "hsl(var(--text-muted))" }}>Recurring issues detected by AI</p>
      </div>
      <div style={{
        background: "hsl(var(--bg-surface))",
        border: "1px dashed hsl(var(--border))",
        borderRadius: "var(--radius-lg)",
        padding: "3rem",
        textAlign: "center",
        color: "hsl(var(--text-muted))",
        fontSize: 13,
      }}>
        Cluster detection coming in Phase 6.
      </div>
    </div>
  );
}
