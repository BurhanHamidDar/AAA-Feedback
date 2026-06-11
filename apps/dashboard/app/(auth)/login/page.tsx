"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      let msg = "Invalid email or password";
      if (err.code === "ERR_NETWORK" || !err.response) {
        msg = "Unable to connect to the server. Please check if the backend API is running.";
      } else if (err.response?.data?.error?.message) {
        msg = err.response.data.error.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Panel: Academic Branding */}
      <div className="branding-panel">
        <div className="branding-inner">
          {/* Logo */}
          <div className="logo-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Ayesha Ali Academy Logo"
              className="academy-logo"
            />
          </div>

          <div className="branding-text">
            <h1 className="academy-name">Ayesha Ali Academy</h1>
            <p className="academy-tagline">Feedback Management System</p>
            <div className="motto-row">
              <span className="motto-line" />
              <span className="motto-text">ABOVE &amp; AHEAD</span>
              <span className="motto-line" />
            </div>
            <p className="estd">Established 2014</p>
          </div>

          <div className="feature-list">
            <div className="feature-item">
              <span className="feature-dot" />
              Secure admission-verified submissions
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              AI-powered categorisation &amp; sentiment
            </div>
            <div className="feature-item">
              <span className="feature-dot" />
              Real-time analytics for administration
            </div>
          </div>
        </div>

        <div className="branding-footer">
          Official Institutional Platform — Not for public access
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="form-panel">
        {/* Mobile logo */}
        <div className="mobile-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Ayesha Ali Academy Logo" className="mobile-logo" />
          <div>
            <div className="mobile-name">Ayesha Ali Academy</div>
            <div className="mobile-sub">Feedback System</div>
          </div>
        </div>

        <div className="login-box">
          {/* Header */}
          <div className="login-header">
            <div className="portal-badge">
              <ShieldCheck size={12} />
              <span>Secure Administration Portal</span>
            </div>
            <h2 className="login-title">Sign In</h2>
            <p className="login-sub">Access the feedback administration dashboard</p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-alert" role="alert">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Institutional Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="principal@ayeshaali.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary submit-btn"
              disabled={isLoading || !email || !password}
              id="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  Authenticating…
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>

          <div className="login-footer">
            <span>AAA Feedback v1.0</span>
            <span className="footer-sep">·</span>
            <span>Developed by <strong>Burhan Hamid</strong></span>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Page Layout ───────────────────── */
        .login-page {
          min-height: 100vh;
          display: flex;
          background: hsl(var(--bg-base));
        }

        /* ── Left Branding Panel ───────────── */
        .branding-panel {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          flex: 0 0 420px;
          background: #0a1e38;
          color: white;
          padding: 2.5rem;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        @media (min-width: 1024px) {
          .branding-panel { display: flex; }
        }

        .branding-inner {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .logo-wrapper {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: white;
          padding: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid rgba(197, 168, 128, 0.4);
        }
        .academy-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .branding-text {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .academy-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .academy-tagline {
          font-size: 13px;
          color: rgba(255,255,255,0.55);
          font-weight: 400;
          margin: 0;
        }
        .motto-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        }
        .motto-line {
          flex: 1;
          max-width: 36px;
          height: 1px;
          background: hsl(var(--academy-gold) / 0.6);
        }
        .motto-text {
          font-size: 10px;
          font-weight: 600;
          color: hsl(var(--academy-gold));
          letter-spacing: 0.18em;
          white-space: nowrap;
        }
        .estd {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.04em;
          margin: 0;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 1.5rem;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: rgba(255,255,255,0.55);
          line-height: 1.4;
        }
        .feature-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: hsl(var(--academy-gold));
          flex-shrink: 0;
        }

        .branding-footer {
          font-size: 10.5px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.03em;
        }

        /* ── Right Form Panel ─────────────── */
        .form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: hsl(var(--bg-base));
        }

        /* Mobile header */
        .mobile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 2rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid hsl(var(--border));
          width: 100%;
          max-width: 380px;
        }
        @media (min-width: 1024px) {
          .mobile-header { display: none; }
        }
        .mobile-logo {
          width: 44px;
          height: 44px;
          object-fit: contain;
          border-radius: 50%;
          border: 1px solid hsl(var(--border));
          background: white;
          padding: 2px;
        }
        .mobile-name {
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--text-primary));
        }
        .mobile-sub {
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          margin-top: 1px;
        }

        /* Login card */
        .login-box {
          width: 100%;
          max-width: 380px;
          background: hsl(var(--bg-surface));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: var(--shadow-lg);
        }

        .login-header { margin-bottom: 1.5rem; }
        .portal-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 7px;
          background: hsl(var(--accent-light));
          border: 1px solid hsl(var(--accent) / 0.2);
          border-radius: var(--radius-sm);
          font-size: 10.5px;
          font-weight: 600;
          color: hsl(var(--accent));
          margin-bottom: 1rem;
          letter-spacing: 0.03em;
        }
        .login-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--text-primary));
          margin: 0 0 5px 0;
        }
        .login-sub {
          font-size: 12.5px;
          color: hsl(var(--text-muted));
          margin: 0;
        }

        /* Error */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          background: hsl(var(--danger-bg));
          border: 1px solid hsl(var(--danger) / 0.2);
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          color: hsl(var(--danger));
          margin-bottom: 1.125rem;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: hsl(var(--text-secondary));
          letter-spacing: 0.01em;
        }
        .password-wrapper { position: relative; }
        .password-wrapper .input { padding-right: 38px; }
        .pw-toggle {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: hsl(var(--text-muted));
          cursor: pointer;
          padding: 3px;
          display: flex;
          align-items: center;
          border-radius: var(--radius-sm);
          transition: color 0.12s;
        }
        .pw-toggle:hover { color: hsl(var(--text-secondary)); }

        .submit-btn {
          width: 100%;
          justify-content: center;
          padding: 9px 16px;
          font-size: 13.5px;
          font-weight: 600;
          margin-top: 4px;
        }
        .spin-icon {
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .login-footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid hsl(var(--border-subtle));
          text-align: center;
          font-size: 11.5px;
          color: hsl(var(--text-muted));
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .footer-sep { color: hsl(var(--border)); }
        .login-footer strong { color: hsl(var(--text-secondary)); font-weight: 600; }
      `}</style>
    </div>
  );
}
