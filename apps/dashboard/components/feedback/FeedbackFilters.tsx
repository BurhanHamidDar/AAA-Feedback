import { useState, useRef, useEffect } from "react";
import {
  STATUS_LABELS,
  CATEGORY_LABELS,
  SENTIMENT_LABELS,
  PRIORITY_LABELS,
  SUBMISSION_TYPE_LABELS,
  SUBMITTER_TYPE_LABELS,
} from "@aaa-feedback/shared";
import { Search, X, ChevronDown, Check } from "lucide-react";

interface FilterValues {
  search: string;
  status: string;
  category: string;
  sentiment: string;
  priority: string;
  submission_type: string;
  submitter_type: string;
}

interface Props {
  filters: FilterValues;
  onChange: (key: keyof FilterValues, value: string) => void;
  onClear: () => void;
}

interface MultiSelectProps {
  label: string;
  options: Record<string, string>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}

/**
 * Custom styled MultiSelect dropdown matching the academy design system
 */
function MultiSelect({ label, options, selectedValues, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return options[selectedValues[0]] || selectedValues[0];
    return `${selectedValues.length} selected`;
  };

  return (
    <div className="multiselect-container" ref={dropdownRef}>
      <label className="filter-label">{label}</label>
      <div className="multiselect-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span className="multiselect-value">{getDisplayText()}</span>
        <ChevronDown size={14} className="multiselect-arrow" />
      </div>

      {isOpen && (
        <div className="multiselect-options shadow-lg">
          {Object.entries(options).map(([value, labelOption]) => {
            const isSelected = selectedValues.includes(value);
            return (
              <div
                key={value}
                className={`multiselect-option ${isSelected ? "selected" : ""}`}
                onClick={() => handleToggleOption(value)}
              >
                <div className="checkbox-box">
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span className="option-label">{labelOption}</span>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .multiselect-container {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-label {
          font-size: 11px;
          font-weight: 500;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .multiselect-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 11px;
          font-size: 13.5px;
          background: hsl(var(--bg-surface));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          cursor: pointer;
          min-height: 36px;
          user-select: none;
          transition: border-color 0.12s ease, background 0.12s ease;
        }
        .multiselect-trigger:hover {
          border-color: hsl(var(--border-hover));
          background: hsl(var(--bg-elevated));
        }
        .multiselect-value {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: calc(100% - 16px);
          color: hsl(var(--text-primary));
        }
        .multiselect-arrow {
          color: hsl(var(--text-muted));
        }
        .multiselect-options {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 50;
          max-height: 240px;
          overflow-y: auto;
          background: hsl(var(--bg-surface));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: var(--shadow-lg);
        }
        .multiselect-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          font-size: 13.5px;
          cursor: pointer;
          border-radius: var(--radius-sm);
          color: hsl(var(--text-primary));
        }
        .multiselect-option:hover {
          background: hsl(var(--bg-elevated));
        }
        .multiselect-option.selected {
          background: hsl(var(--accent-light));
          color: hsl(var(--accent));
        }
        .checkbox-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-sm);
          background: hsl(var(--bg-surface));
          color: hsl(var(--accent));
          flex-shrink: 0;
        }
        .multiselect-option.selected .checkbox-box {
          border-color: hsl(var(--accent) / 0.5);
          background: hsl(var(--accent) / 0.08);
        }
        .option-label {
          font-weight: 400;
        }
        .multiselect-option.selected .option-label {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export function FeedbackFilters({ filters, onChange, onClear }: Props) {
  const hasActiveFilters = Object.entries(filters).some(([key, val]) => {
    if (key === "search") return val.trim().length > 0;
    return val !== "";
  });

  const selectedCategories = filters.category
    ? filters.category.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const selectedPriorities = filters.priority
    ? filters.priority.split(",").map((p) => p.trim()).filter(Boolean)
    : [];

  const selectedSentiments = filters.sentiment
    ? filters.sentiment.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="filters-container card">
      <div className="filters-grid">
        {/* Search Input */}
        <div className="filter-group search-group">
          <label className="filter-label">Search Feedback</label>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input search-input"
              placeholder="Search in feedback raw text..."
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <label className="filter-label">Status</label>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => onChange("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Multi-Filter */}
        <MultiSelect
          label="Category"
          options={CATEGORY_LABELS}
          selectedValues={selectedCategories}
          onChange={(values) => onChange("category", values.join(","))}
          placeholder="All Categories"
        />

        {/* Priority Multi-Filter */}
        <MultiSelect
          label="Priority"
          options={PRIORITY_LABELS}
          selectedValues={selectedPriorities}
          onChange={(values) => onChange("priority", values.join(","))}
          placeholder="All Priorities"
        />

        {/* Sentiment Multi-Filter */}
        <MultiSelect
          label="Sentiment"
          options={SENTIMENT_LABELS}
          selectedValues={selectedSentiments}
          onChange={(values) => onChange("sentiment", values.join(","))}
          placeholder="All Sentiments"
        />

        {/* Submission Type Filter */}
        <div className="filter-group">
          <label className="filter-label">Submission Type</label>
          <select
            className="input"
            value={filters.submission_type}
            onChange={(e) => onChange("submission_type", e.target.value)}
          >
            <option value="">All Types</option>
            {Object.entries(SUBMISSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Submitter Type Filter */}
        <div className="filter-group">
          <label className="filter-label">Submitted By</label>
          <select
            className="input"
            value={filters.submitter_type}
            onChange={(e) => onChange("submitter_type", e.target.value)}
          >
            <option value="">All Submitters</option>
            {Object.entries(SUBMITTER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="filters-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClear}>
            <X size={14} />
            Clear Filters
          </button>
        </div>
      )}

      <style jsx>{`
        .filters-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1.25rem;
        }
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }
        @media (min-width: 1024px) {
          .filters-grid {
            grid-template-columns: 2fr repeat(6, 1fr);
          }
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-label {
          font-size: 11px;
          font-weight: 500;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .search-input-wrapper {
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
        }
        .filters-footer {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid hsl(var(--border-subtle));
          padding-top: 0.75rem;
        }
      `}</style>
    </div>
  );
}
