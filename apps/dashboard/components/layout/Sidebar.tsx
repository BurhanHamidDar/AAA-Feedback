"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  SearchCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Feedback",
    href: "/feedback",
    icon: MessageSquareText,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    label: "Tracking",
    href: "/tracking",
    icon: SearchCheck,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Logo / Brand */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Ayesha Ali Academy"
            className="brand-logo-img"
          />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="brand-text">
            <span className="brand-name">AAA Feedback</span>
            <span className="brand-sub">Ayesha Ali Academy</span>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <div className="nav-section-label">{(!collapsed || mobileOpen) && "NAVIGATION"}</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${active ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              onClick={() => {
                if (mobileOpen) onClose();
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2 : 1.75}
                className="nav-icon"
              />
              {(!collapsed || mobileOpen) && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <div className="sidebar-divider" />

        {/* Admin info */}
        {admin && (!collapsed || mobileOpen) && (
          <div className="admin-row">
            <div className="admin-avatar" aria-hidden="true">
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <div className="admin-info">
              <div className="admin-name">{admin.name}</div>
              <div className="admin-role">{admin.role}</div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={14} />
          ) : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>

        {/* Logout */}
        <button
          className="nav-item logout-btn"
          onClick={() => {
            if (mobileOpen) onClose();
            logout();
          }}
          title={collapsed ? "Sign out" : undefined}
          aria-label="Sign out"
        >
          <LogOut size={15} strokeWidth={1.75} className="nav-icon" />
          {(!collapsed || mobileOpen) && <span className="nav-label">Sign out</span>}
        </button>
      </div>

      <style jsx>{`
        /* Sidebar shell */
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          width: var(--sidebar-width);
          background: hsl(var(--bg-surface));
          border-right: 1px solid hsl(var(--border));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: width 0.18s ease-in-out, transform 0.2s ease-in-out;
        }
        .sidebar.collapsed {
          width: var(--sidebar-collapsed);
        }

        /* Brand */
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 12px;
          min-height: var(--topbar-height);
          overflow: hidden;
          flex-shrink: 0;
        }
        .brand-logo {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: white;
          border: 1px solid hsl(var(--border));
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .brand-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .brand-text {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          white-space: nowrap;
        }
        .brand-name {
          font-size: 13px;
          font-weight: 700;
          color: hsl(var(--text-primary));
          letter-spacing: -0.01em;
        }
        .brand-sub {
          font-size: 9.5px;
          font-weight: 500;
          color: hsl(var(--text-muted));
          letter-spacing: 0.01em;
        }

        /* Divider */
        .sidebar-divider {
          height: 1px;
          background: hsl(var(--border));
          margin: 0 10px;
          flex-shrink: 0;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .nav-section-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: hsl(var(--text-muted));
          padding: 8px 10px 4px;
          white-space: nowrap;
          overflow: hidden;
          min-height: 28px;
        }
        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Bottom */
        .sidebar-bottom {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }
        .sidebar-bottom .sidebar-divider {
          margin: 4px 2px;
        }

        /* Admin info */
        .admin-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          overflow: hidden;
        }
        .admin-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: hsl(var(--accent) / 0.12);
          color: hsl(var(--accent));
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid hsl(var(--accent) / 0.2);
        }
        .admin-info { overflow: hidden; }
        .admin-name {
          font-size: 12.5px;
          font-weight: 500;
          color: hsl(var(--text-primary));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .admin-role {
          font-size: 10.5px;
          color: hsl(var(--text-muted));
          text-transform: capitalize;
          white-space: nowrap;
        }

        /* Collapse button */
        .collapse-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: var(--radius);
          color: hsl(var(--text-muted));
          font-size: 12px;
          font-weight: 450;
          cursor: pointer;
          background: none;
          border: none;
          width: 100%;
          transition: background 0.1s ease, color 0.1s ease;
          font-family: inherit;
          white-space: nowrap;
        }
        .collapse-btn:hover {
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-secondary));
        }

        /* Logout button */
        .logout-btn { color: hsl(var(--text-muted)); }
        .logout-btn:hover {
          color: hsl(var(--danger)) !important;
          background: hsl(var(--danger-bg)) !important;
        }

        @media (max-width: 767px) {
          .sidebar {
            width: var(--sidebar-width) !important;
            transform: translateX(-100%);
            z-index: 100;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          .collapse-btn {
            display: none !important;
          }
        }
      `}</style>
    </aside>
  );
}
