"use client";

import { useState } from "react";
import { useFeedbackList } from "@/hooks/useFeedback";
import { FeedbackFilters } from "@/components/feedback/FeedbackFilters";
import { FeedbackTable } from "@/components/feedback/FeedbackTable";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export default function FeedbackPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    sentiment: "",
    priority: "",
    submission_type: "",
    submitter_type: "",
  });

  const { data, isLoading, isFetching, refetch } = useFeedbackList({
    page,
    limit: 15,
    ...filters,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      category: "",
      sentiment: "",
      priority: "",
      submission_type: "",
      submitter_type: "",
    });
    setPage(1);
  };

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Feedback Management</h1>
          <p>Review, classify, and track actions taken on Ayesha Ali Academy feedback submissions.</p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
        >
          <RefreshCw size={14} className={isFetching ? "spinning" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <FeedbackFilters
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Table & Data */}
      <FeedbackTable items={items} isLoading={isLoading} />

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing <span>{items.length}</span> of <span>{pagination.total}</span> entries
          </div>
          <div className="pagination-buttons">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className="pagination-current">
              Page {page} of {pagination.total_pages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!pagination.has_next || isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: justify;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }
        .page-header h1 {
          font-size: 1.375rem;
          margin-bottom: 4px;
        }
        .page-header p {
          font-size: 13px;
          color: hsl(var(--text-muted));
        }
        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          font-size: 13px;
          color: hsl(var(--text-secondary));
        }
        @media (max-width: 600px) {
          .pagination-bar {
            flex-direction: column;
            gap: 12px;
            align-items: center;
            text-align: center;
          }
        }
        .pagination-info span {
          font-weight: 500;
          color: hsl(var(--text-primary));
        }
        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pagination-current {
          color: hsl(var(--text-secondary));
          font-weight: 500;
        }
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
