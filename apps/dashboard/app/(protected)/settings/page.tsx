"use client";

import { useState, useEffect } from "react";
import { Info, Settings2, Save, ToggleLeft, ToggleRight, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import apiClient from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { admin } = useAuth();
  const isPrincipal = admin?.role === "principal";
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const handleDeleteAllFeedback = async () => {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      return;
    }

    try {
      setDeletingAll(true);
      const response = await apiClient.delete("/feedback");
      if (response.data?.success) {
        alert(`Successfully deleted ${response.data.count || 0} feedback items.`);
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Failed to delete all feedback:", err);
      alert(err.response?.data?.error?.message || "An error occurred while deleting all feedback.");
    } finally {
      setDeletingAll(false);
      setConfirmDeleteAll(false);
    }
  };

  const [collectionEnabled, setCollectionEnabled] = useState(true);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [requireVerification, setRequireVerification] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [aiModelPreference, setAiModelPreference] = useState("standard");
  const [isSettingsMissing, setIsSettingsMissing] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password reset states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await apiClient.get("/settings");
        if (response.data?.success && response.data?.data) {
          const settings = response.data.data;
          setCollectionEnabled(settings.feedback_collection_enabled !== false);
          setAiAnalysisEnabled(settings.ai_analysis_enabled !== false);
          setRequireVerification(settings.require_student_verification !== false);
          setMaintenanceMode(settings.maintenance_mode === true);
          setAiModelPreference(settings.ai_model_preference || "standard");
          setIsSettingsMissing(!!settings.system_settings_missing);
        }
      } catch (err: any) {
        console.error("Failed to load settings:", err);
        setError("Unable to retrieve system configurations from the server.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Save settings
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);

      const response = await apiClient.post("/settings", {
        feedback_collection_enabled: collectionEnabled,
        ai_analysis_enabled: aiAnalysisEnabled,
        require_student_verification: requireVerification,
        maintenance_mode: maintenanceMode,
        ai_model_preference: aiModelPreference,
      });

      if (response.data?.success) {
        setSuccessMsg("System configurations updated successfully.");
        // Clear message after 3 seconds
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError("Failed to save changes. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError("An error occurred while saving system configurations.");
    } finally {
      setIsSaving(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!password.trim()) {
      setPasswordError("Password cannot be empty.");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await apiClient.post("/auth/change-password", {
        password: password,
      });

      if (response.data?.success) {
        setPasswordSuccess("Password changed successfully!");
        setPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(response.data?.error?.message || "Failed to update password.");
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      setPasswordError(err.response?.data?.error?.message || "An error occurred while changing password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Account and system configuration</p>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="spin-icon" size={24} />
          <span>Loading system configurations…</span>
        </div>
      ) : (
        <div className="settings-grid">
          {/* Main Controls Card */}
          <div className="settings-card">
            <div className="card-header">
              <Settings2 size={16} className="card-icon" />
              <h2 className="card-title">System Configurations</h2>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <AlertTriangle size={15} />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success">
                  <CheckCircle2 size={15} />
                  <span>{successMsg}</span>
                </div>
              )}

              {isSettingsMissing && (
                <div className="alert alert-warning">
                  <AlertTriangle size={16} className="warning-icon" />
                  <div>
                    <span className="warning-title">Database Settings Configuration Missing</span>
                    <p className="warning-text">
                      The <code>system_settings</code> database table does not exist in your Supabase project. Setup is running in simulated demo mode. To persist changes permanently, execute this SQL block in your Supabase SQL Editor:
                    </p>
                    <pre className="sql-code">
{`CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_authenticated_all" ON public.system_settings FOR ALL USING (auth.role() = 'authenticated');
INSERT INTO public.system_settings (key, value) VALUES ('feedback_collection_enabled', 'true'::jsonb) ON CONFLICT (key) DO NOTHING;`}
                    </pre>
                  </div>
                </div>
              )}

              <p className="description-text">
                Manage the operational parameters of the Ayesha Ali Academy Feedback System, including incoming collection pipelines, LLM AI automation, and security requirements.
              </p>

              <div className="settings-controls-list">
                {/* 1. Feedback Collection Toggle */}
                <div className="toggle-section" onClick={() => setCollectionEnabled(!collectionEnabled)}>
                  <div className="toggle-info">
                    <div className="toggle-label">Enable Feedback Collection</div>
                    <div className="toggle-sub">Accept incoming messages from the WhatsApp bot</div>
                  </div>

                  <button
                    type="button"
                    className={`toggle-button ${collectionEnabled ? "active" : "inactive"}`}
                    aria-label={collectionEnabled ? "Disable feedback collection" : "Enable feedback collection"}
                  >
                    {collectionEnabled ? (
                      <ToggleRight size={40} className="toggle-icon active-icon" />
                    ) : (
                      <ToggleLeft size={40} className="toggle-icon inactive-icon" />
                    )}
                  </button>
                </div>

                {/* 2. AI Analysis Toggle */}
                <div className="toggle-section" onClick={() => setAiAnalysisEnabled(!aiAnalysisEnabled)}>
                  <div className="toggle-info">
                    <div className="toggle-label">Enable AI-Powered Analysis</div>
                    <div className="toggle-sub">Automatically categorize, sentiment analyze, and prioritize feedback on receipt</div>
                  </div>

                  <button
                    type="button"
                    className={`toggle-button ${aiAnalysisEnabled ? "active" : "inactive"}`}
                    aria-label={aiAnalysisEnabled ? "Disable AI analysis" : "Enable AI analysis"}
                  >
                    {aiAnalysisEnabled ? (
                      <ToggleRight size={40} className="toggle-icon active-icon" />
                    ) : (
                      <ToggleLeft size={40} className="toggle-icon inactive-icon" />
                    )}
                  </button>
                </div>

                {/* 3. Registry Verification Toggle */}
                <div className="toggle-section" onClick={() => setRequireVerification(!requireVerification)}>
                  <div className="toggle-info">
                    <div className="toggle-label">Enforce Registry Verification</div>
                    <div className="toggle-sub">Require senders to verify student admission numbers prior to submission</div>
                  </div>

                  <button
                    type="button"
                    className={`toggle-button ${requireVerification ? "active" : "inactive"}`}
                    aria-label={requireVerification ? "Disable registry verification" : "Enable registry verification"}
                  >
                    {requireVerification ? (
                      <ToggleRight size={40} className="toggle-icon active-icon" />
                    ) : (
                      <ToggleLeft size={40} className="toggle-icon inactive-icon" />
                    )}
                  </button>
                </div>

                {/* 4. Maintenance Mode Toggle */}
                <div className="toggle-section" onClick={() => setMaintenanceMode(!maintenanceMode)}>
                  <div className="toggle-info">
                    <div className="toggle-label">System Maintenance Mode</div>
                    <div className="toggle-sub">When active, the WhatsApp bot will respond that the system is under maintenance and pause entries</div>
                  </div>

                  <button
                    type="button"
                    className={`toggle-button ${maintenanceMode ? "active" : "inactive"}`}
                    aria-label={maintenanceMode ? "Disable maintenance mode" : "Enable maintenance mode"}
                  >
                    {maintenanceMode ? (
                      <ToggleRight size={40} className="toggle-icon active-icon" />
                    ) : (
                      <ToggleLeft size={40} className="toggle-icon inactive-icon" />
                    )}
                  </button>
                </div>

                {/* 5. AI Model Selector */}
                <div className="select-section">
                  <div className="select-info">
                    <div className="select-label">AI Model Preference Profile</div>
                    <div className="select-sub">Select LLM model tier: Standard (Balanced) vs. Advanced (High Reasoning)</div>
                  </div>
                  <select
                    value={aiModelPreference}
                    onChange={(e) => setAiModelPreference(e.target.value)}
                    className="select-input"
                  >
                    <option value="standard">Standard (Qwen / Liquid - Balanced)</option>
                    <option value="advanced">Advanced (Gemini 2.5 - Deep Reasoning)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-footer">
              <button
                type="button"
                className="btn btn-primary save-btn"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="spin-icon" />
                    Saving Changes…
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column (Info Card & Password Card) */}
          <div className="settings-right-col">
            {/* System Info Card */}
            <div className="settings-card info-card">
              <div className="card-header">
                <Info size={16} className="card-icon" />
                <h2 className="card-title">System Information</h2>
              </div>

              <div className="card-body info-body">
                <div className="info-row">
                  <span className="info-label">Application Name</span>
                  <span className="info-value">Ayesha Ali Academy Feedback Portal</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Version</span>
                  <span className="info-value">1.0.0</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Messaging Client</span>
                  <span className="info-value highlighted-badge">whatsapp-web.js (Pilot Mode)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Session Handler</span>
                  <span className="info-value">In-Memory (Pilot State)</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Developer</span>
                  <span className="info-value">Burhan Hamid</span>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="settings-card password-card">
              <div className="card-header">
                <Settings2 size={16} className="card-icon" />
                <h2 className="card-title">Change Account Password</h2>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="card-body password-body">
                  {passwordError && (
                    <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
                      <AlertTriangle size={15} />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
                      <CheckCircle2 size={15} />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="input-label">New Password</label>
                    <input
                      type="password"
                      className="input password-input"
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "1rem" }}>
                    <label className="input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="input password-input"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    type="submit"
                    className="btn btn-primary save-btn"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 size={14} className="spin-icon" />
                        Updating…
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Danger Zone Card (Principal Only) */}
            {isPrincipal && (
              <div className="settings-card danger-zone-card" style={{ borderColor: "hsl(var(--danger) / 0.3)" }}>
                <div className="card-header" style={{ borderBottomColor: "hsl(var(--danger) / 0.15)" }}>
                  <AlertTriangle size={16} className="card-icon" style={{ color: "hsl(var(--danger))" }} />
                  <h2 className="card-title" style={{ color: "hsl(var(--danger))" }}>Danger Zone</h2>
                </div>
                <div className="card-body">
                  <p className="description-text">
                    Permanently delete all feedback entries, attachments, timeline logs, and comments from the database. This action is irreversible and should be used with extreme caution.
                  </p>
                </div>
                <div className="card-footer" style={{ background: "hsl(var(--danger-bg) / 0.3)", borderTopColor: "hsl(var(--danger) / 0.15)" }}>
                  <button
                    type="button"
                    className="btn btn-danger save-btn"
                    style={{ width: "100%", justifyContent: "center" }}
                    disabled={deletingAll}
                    onClick={handleDeleteAllFeedback}
                    onMouseLeave={() => setConfirmDeleteAll(false)}
                  >
                    {deletingAll ? (
                      "Deleting All..."
                    ) : confirmDeleteAll ? (
                      "Click Again to Confirm Wiping ALL Feedback"
                    ) : (
                      "Delete All Feedback Data"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container {
          padding: 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .page-header-row {
          margin-bottom: 2rem;
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 1rem;
        }
        .page-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: hsl(var(--text-primary));
          margin: 0 0 4px 0;
        }
        .page-subtitle {
          font-size: 13px;
          color: hsl(var(--text-muted));
          margin: 0;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: hsl(var(--text-muted));
          font-size: 13px;
          gap: 12px;
        }
        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 768px) {
          .settings-grid {
            grid-template-columns: 3fr 2fr;
          }
        }

        .settings-card {
          background: hsl(var(--bg-surface));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 1.125rem 1.5rem;
          border-bottom: 1px solid hsl(var(--border-subtle));
        }
        .card-icon {
          color: hsl(var(--accent));
        }
        .card-title {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
          margin: 0;
        }

        .card-body {
          padding: 1.5rem;
          flex: 1;
        }
        .description-text {
          font-size: 13px;
          line-height: 1.5;
          color: hsl(var(--text-secondary));
          margin: 0 0 1.5rem 0;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }
        .alert-danger {
          background: hsl(var(--danger-bg));
          border: 1px solid hsl(var(--danger) / 0.15);
          color: hsl(var(--danger));
        }
        .alert-success {
          background: hsl(var(--success-bg, 142 70% 97%));
          border: 1px solid hsl(var(--success, 142 76% 36%) / 0.15);
          color: hsl(var(--success, 142 76% 36%));
        }

        .settings-controls-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .toggle-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.125rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background 0.1s, border-color 0.1s;
        }
        .toggle-section:hover {
          background: hsl(var(--bg-base) / 0.4);
          border-color: hsl(var(--border-hover, var(--border)));
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-right: 12px;
        }
        .toggle-label {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .toggle-sub {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          line-height: 1.35;
        }

        .toggle-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .toggle-icon {
          transition: color 0.1s;
        }
        .active-icon {
          color: hsl(var(--accent));
        }
        .inactive-icon {
          color: hsl(var(--text-muted) / 0.6);
        }

        .select-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.125rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-md);
        }
        .select-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-right: 12px;
        }
        .select-label {
          font-size: 13.5px;
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .select-sub {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          line-height: 1.35;
        }
        .select-input {
          background: hsl(var(--bg-base));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--text-primary));
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          min-width: 140px;
        }
        .select-input:focus {
          border-color: hsl(var(--accent));
        }

        .card-footer {
          padding: 1rem 1.5rem;
          background: hsl(var(--bg-base) / 0.3);
          border-top: 1px solid hsl(var(--border-subtle));
          display: flex;
          justify-content: flex-end;
        }
        .save-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
        }

        /* Right column stacking */
        .settings-right-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Info Card Specifics */
        .info-card {
          height: fit-content;
        }
        .info-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 1.5rem;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12.5px;
          border-bottom: 1px solid hsl(var(--border-subtle));
          padding-bottom: 10px;
        }
        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .info-label {
          color: hsl(var(--text-muted));
        }
        .info-value {
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .highlighted-badge {
          background: hsl(var(--accent-light, var(--accent) / 0.1));
          color: hsl(var(--accent));
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          font-size: 11px;
        }

        /* Password form inputs */
        .password-body {
          padding: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-label {
          font-size: 12.5px;
          font-weight: 600;
          color: hsl(var(--text-secondary));
        }
        .password-input {
          background: hsl(var(--bg-base));
        }

        .alert-warning {
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          margin-bottom: 1.5rem;
          display: flex;
          gap: 12px;
          line-height: 1.4;
        }
        .warning-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .warning-title {
          font-weight: 700;
          font-size: 13.5px;
          display: block;
          margin-bottom: 4px;
        }
        .warning-text {
          margin: 0 0 10px 0;
          color: hsl(var(--text-secondary));
          font-size: 12.5px;
        }
        .sql-code {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-family: monospace;
          font-size: 11px;
          color: #e2e8f0;
          overflow-x: auto;
          white-space: pre-wrap;
          margin: 0;
          user-select: all;
        }

        @media (max-width: 600px) {
          .toggle-section,
          .select-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .toggle-button {
            align-self: flex-start;
          }
          .select-input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
