"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard Overview",
  "/feedback": "Feedback Management",
  "/analytics": "Analytics",
  "/reports": "Reports",
  "/tracking": "Tracking",
  "/settings": "Settings",
};

function getCurrentDate() {
  return new Date().toLocaleDateString("en-PK", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface TopBarProps {
  onToggleMenu: () => void;
}

export function TopBar({ onToggleMenu }: TopBarProps) {
  const pathname = usePathname();
  const { admin } = useAuth();

  const title = Object.entries(ROUTE_TITLES).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? "Dashboard";

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <button
          className="menu-toggle-btn"
          onClick={onToggleMenu}
          aria-label="Toggle sidebar menu"
          title="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <div className="topbar-text-group">
          <div className="topbar-title">{title}</div>
          <div className="topbar-date">{getCurrentDate()}</div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-admin" aria-label="Logged in user">
          <div className="admin-avatar" aria-hidden="true">
            {admin?.name.charAt(0).toUpperCase()}
          </div>
          <div className="admin-info">
            <span className="admin-name">{admin?.name}</span>
            <span className="admin-role">{admin?.role}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .topbar {
          height: var(--topbar-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.375rem;
          background: hsl(var(--bg-surface));
          border-bottom: 1px solid hsl(var(--border));
          position: sticky;
          top: 0;
          z-index: 50;
          gap: 1rem;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .topbar-text-group {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .menu-toggle-btn {
          display: none;
          background: none;
          border: none;
          color: hsl(var(--text-secondary));
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius);
          align-items: center;
          justify-content: center;
          transition: background 0.12s ease, color 0.12s ease;
        }
        .menu-toggle-btn:hover {
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-primary));
        }
        .topbar-title {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .topbar-date {
          font-size: 10.5px;
          color: hsl(var(--text-muted));
          font-weight: 400;
          letter-spacing: 0.01em;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }

        .topbar-admin {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: hsl(var(--accent) / 0.12);
          color: hsl(var(--accent));
          font-size: 11.5px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid hsl(var(--accent) / 0.2);
        }
        .admin-info {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .admin-name {
          font-size: 12.5px;
          font-weight: 500;
          color: hsl(var(--text-primary));
          line-height: 1.2;
          white-space: nowrap;
        }
        .admin-role {
          font-size: 10.5px;
          color: hsl(var(--text-muted));
          text-transform: capitalize;
          white-space: nowrap;
        }

        @media (max-width: 767px) {
          .menu-toggle-btn {
            display: flex;
          }
        }

        @media (max-width: 640px) {
          .admin-info { display: none; }
          .topbar-date { display: none; }
        }
      `}</style>
    </header>
  );
}
