import { MessageSquareText } from "lucide-react";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  admins: {
    id: string;
    name: string;
    role: "principal" | "admin";
  };
}

interface Props {
  comments: Comment[];
}

export function CommentThread({ comments }: Props) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
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
    <div className="comments-container card">
      <div className="comments-header">
        <MessageSquareText size={18} className="comments-header-icon" />
        <h3>Internal Activity & Notes ({comments.length})</h3>
      </div>

      {comments.length === 0 ? (
        <div className="empty-comments">
          <p>No internal notes yet. Use the form below to document actions taken or log discussions.</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const isPrincipal = comment.admins.role === "principal";

            return (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  {comment.admins.name.charAt(0).toUpperCase()}
                </div>
                <div className="comment-bubble">
                  <div className="comment-meta">
                    <span className="commenter-name">{comment.admins.name}</span>
                    <span className={`role-tag ${isPrincipal ? "principal-tag" : "admin-tag"}`}>
                      {isPrincipal ? "Principal" : "Staff Admin"}
                    </span>
                    <span className="comment-time">{formatDate(comment.created_at)}</span>
                  </div>
                  <div className="comment-text">{comment.comment_text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .comments-container {
          padding: 1.5rem;
          background: hsl(var(--bg-surface));
          margin-top: 1.5rem;
        }
        .comments-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid hsl(var(--border-subtle));
          padding-bottom: 0.75rem;
        }
        .comments-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin: 0;
        }
        .comments-header-icon {
          color: hsl(var(--accent));
        }
        .empty-comments {
          padding: 1.5rem 0;
          text-align: center;
          color: hsl(var(--text-muted));
          font-size: 13px;
        }
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .comment-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .comment-avatar {
          width: 32px;
          height: 32px;
          background: hsl(var(--bg-overlay));
          border: 1px solid hsl(var(--border));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          flex-shrink: 0;
        }
        .comment-bubble {
          flex: 1;
          background: hsl(var(--bg-elevated) / 0.4);
          border: 1px solid hsl(var(--border-subtle));
          border-radius: var(--radius-lg);
          padding: 0.75rem 1rem;
        }
        .comment-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .commenter-name {
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .role-tag {
          font-size: 10px;
          font-weight: 500;
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.02em;
        }
        .principal-tag {
          background: rgba(147, 51, 234, 0.1);
          color: rgb(192, 132, 252);
          border: 1px solid rgba(147, 51, 234, 0.2);
        }
        .admin-tag {
          background: hsl(var(--bg-overlay));
          color: hsl(var(--text-secondary));
          border: 1px solid hsl(var(--border));
        }
        .comment-time {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          margin-left: auto;
        }
        .comment-text {
          font-size: 13px;
          color: hsl(var(--text-secondary));
          line-height: 1.5;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
