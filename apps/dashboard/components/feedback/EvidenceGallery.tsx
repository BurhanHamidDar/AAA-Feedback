import { Image, FileText, ExternalLink } from "lucide-react";

interface EvidenceFile {
  id: string;
  file_url: string;
  file_type: "image" | "document" | string;
}

interface Props {
  evidence: EvidenceFile[];
}

export function EvidenceGallery({ evidence }: Props) {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  return (
    <div className="evidence-section">
      <h3 className="section-title">Attached Evidence ({evidence.length})</h3>
      <div className="evidence-grid">
        {evidence.map((file) => {
          const isImage = file.file_type === "image" || file.file_url.match(/\.(jpeg|jpg|gif|png|webp)/i);

          return (
            <div key={file.id} className="evidence-card card">
              {isImage ? (
                <div className="image-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.file_url}
                    alt="Evidence submission attachment"
                    className="attachment-img"
                  />
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lightbox-overlay"
                  >
                    <ExternalLink size={20} />
                    <span>View Full Image</span>
                  </a>
                </div>
              ) : (
                <div className="document-preview">
                  <FileText size={32} className="doc-icon" />
                  <span className="doc-label">Attachment File</span>
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <ExternalLink size={14} />
                    Open Document
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .evidence-section {
          margin-top: 2rem;
        }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }
        .evidence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }
        .evidence-card {
          padding: 0;
          overflow: hidden;
          background: hsl(var(--bg-surface));
          border-color: hsl(var(--border-subtle));
          height: 150px;
        }
        .image-preview {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }
        .attachment-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }
        .image-preview:hover .attachment-img {
          transform: scale(1.05);
        }
        .lightbox-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          opacity: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: opacity 0.25s ease;
          z-index: 2;
        }
        .image-preview:hover .lightbox-overlay {
          opacity: 1;
        }
        .document-preview {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 1rem;
          text-align: center;
        }
        .doc-icon {
          color: hsl(var(--text-muted));
        }
        .doc-label {
          font-size: 12px;
          color: hsl(var(--text-secondary));
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
