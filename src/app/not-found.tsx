import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-mark">404</div>
        <p className="not-found-eyebrow">PRAVI · PUBLIC ASSET REGISTRY</p>
        <h1>Record or Page Not Found</h1>
        <p className="not-found-message">
          The requested infrastructure asset, department record, or workflow
          view could not be located. It may have been archived, transferred to
          another jurisdiction, or the identifier may be mistyped.
        </p>
        <div className="not-found-actions">
          <Link href="/dashboard" className="btn-primary">
            Return to dashboard
          </Link>
          <Link href="/assets" className="btn-secondary">
            View asset register
          </Link>
        </div>
      </div>
      <style>{`
        .not-found-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #f7f9f7;
          font-family: "DM Sans", sans-serif;
          color: #15231e;
        }
        .not-found-card {
          width: min(100%, 520px);
          padding: 38px;
          border: 1px solid #e2e8e4;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 12px 36px rgba(23, 107, 74, 0.06);
        }
        .not-found-mark {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          background: #eaf3ed;
          color: #176b4a;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 20px;
          letter-spacing: 0.05em;
        }
        .not-found-eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #718079;
          margin-bottom: 8px;
        }
        .not-found-card h1 {
          margin: 0 0 12px;
          font-family: Manrope, sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #15231e;
        }
        .not-found-message {
          margin: 0 0 24px;
          color: #637269;
          font-size: 14px;
          line-height: 1.6;
        }
        .not-found-actions {
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
          text-decoration: none;
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
