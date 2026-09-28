"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for diagnostics
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <main className="error-page">
      <div className="error-card" role="alert">
        <div className="error-mark">!</div>
        <p className="error-eyebrow">PRAVI · PUBLIC ASSET REGISTRY</p>
        <h1>An unexpected error occurred</h1>
        <p className="error-message">
          The application encountered an error while processing this record or
          workspace request. Your session and data have been preserved.
        </p>
        {error.digest && (
          <p className="error-digest">
            Diagnostic reference: <code>{error.digest}</code>
          </p>
        )}
        <div className="error-actions">
          <button type="button" onClick={() => reset()} className="btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Return to dashboard
          </Link>
        </div>
      </div>
      <style>{`
        .error-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #f7f9f7;
          font-family: "DM Sans", sans-serif;
          color: #15231e;
        }
        .error-card {
          width: min(100%, 520px);
          padding: 38px;
          border: 1px solid #e2e8e4;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 12px 36px rgba(23, 107, 74, 0.06);
        }
        .error-mark {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #fdf2f2;
          color: #b34f45;
          font-weight: 800;
          font-size: 20px;
          margin-bottom: 20px;
          border: 1px solid #f9d8d6;
        }
        .error-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #718079;
          margin-bottom: 8px;
        }
        .error-card h1 {
          margin: 0 0 12px;
          font-family: Manrope, sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #15231e;
        }
        .error-message {
          margin: 0 0 16px;
          color: #637269;
          font-size: 14px;
          line-height: 1.6;
        }
        .error-digest {
          margin: 0 0 24px;
          padding: 8px 12px;
          border-radius: 6px;
          background: #f4f6f4;
          color: #55635b;
          font-size: 12px;
        }
        .error-digest code {
          font-family: monospace;
          color: #1e302b;
        }
        .error-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-primary {
          padding: 10px 18px;
          border: none;
          border-radius: 6px;
          background: #176b4a;
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: #12583d;
        }
        .btn-secondary {
          padding: 10px 18px;
          border: 1px solid #d5ddd6;
          border-radius: 6px;
          background: #ffffff;
          color: #36574a;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }
        .btn-secondary:hover {
          background: #f7f9f7;
        }
      `}</style>
    </main>
  );
}
