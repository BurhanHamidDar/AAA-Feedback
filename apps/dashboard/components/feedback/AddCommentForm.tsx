import { useState } from "react";
import { Send, Loader2 } from "lucide-react";

interface Props {
  onSubmit: (commentText: string) => Promise<void>;
}

export function AddCommentForm({ onSubmit }: Props) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (trimmed.length > 2000) {
      setError("Comment is too long (maximum 2000 characters).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmed);
      setText("");
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? "Failed to add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remaining = 2000 - text.length;

  return (
    <form onSubmit={handleSubmit} className="add-comment-form card">
      <div className="form-group">
        <label htmlFor="new-comment" className="form-label">
          Add Note / Action Log
        </label>
        <textarea
          id="new-comment"
          className="input comment-textarea"
          rows={3}
          placeholder="Document what action was taken, notes on call with parents, resolution details..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          disabled={isSubmitting}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <span className={`char-counter ${remaining < 100 ? "char-warning" : ""}`}>
          {remaining} characters left
        </span>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !text.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="spinning" />
              Saving…
            </>
          ) : (
            <>
              <Send size={14} />
              Add Note
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .add-comment-form {
          margin-top: 1rem;
          padding: 1.25rem;
          background: hsl(var(--bg-surface));
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 12.5px;
          font-weight: 500;
          color: hsl(var(--text-secondary));
        }
        .comment-textarea {
          resize: vertical;
          min-height: 80px;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .error-message {
          font-size: 12.5px;
          color: hsl(var(--danger));
          margin-top: 8px;
        }
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.75rem;
        }
        .char-counter {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
        }
        .char-warning {
          color: hsl(var(--warning));
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
    </form>
  );
}
