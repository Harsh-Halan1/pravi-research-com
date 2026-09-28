export default function GlobalLoading() {
  return (
    <div className="skeleton-shell" aria-busy="true">
      <aside className="skeleton-sidebar">
        <div className="skeleton-brand" />
        <div className="skeleton-bar short" />
        <div className="skeleton-card" />
        <div className="skeleton-bar short" style={{ marginTop: 24 }} />
        <div className="skeleton-nav-item" />
        <div className="skeleton-nav-item" />
        <div className="skeleton-nav-item" />
      </aside>
      <main className="skeleton-main">
        <header className="skeleton-topbar">
          <div className="skeleton-bar medium" />
          <div className="skeleton-circle" />
        </header>
        <div className="skeleton-content">
          <div className="skeleton-hero">
            <div className="skeleton-bar short" />
            <div className="skeleton-bar long" />
          </div>
          <div className="skeleton-grid">
            <div className="skeleton-metric-card" />
            <div className="skeleton-metric-card" />
            <div className="skeleton-metric-card" />
            <div className="skeleton-metric-card" />
          </div>
          <div className="skeleton-table-panel">
            <div className="skeleton-bar medium" style={{ marginBottom: 16 }} />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        </div>
      </main>
      <style>{`
        .skeleton-shell {
          min-height: 100vh;
          display: flex;
          background: #f7f9f7;
        }
        .skeleton-sidebar {
          width: 248px;
          flex: 0 0 248px;
          min-height: 100vh;
          background: #ffffff;
          border-right: 1px solid #e8ede9;
          padding: 27px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .skeleton-main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .skeleton-topbar {
          height: 60px;
          border-bottom: 1px solid #e8ede9;
          background: #ffffff;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .skeleton-content {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .skeleton-brand {
          height: 32px;
          width: 140px;
          border-radius: 6px;
          background: #e9eeeb;
        }
        .skeleton-bar {
          height: 14px;
          border-radius: 4px;
          background: #edf2ee;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-bar.short { width: 80px; }
        .skeleton-bar.medium { width: 160px; }
        .skeleton-bar.long { width: 320px; height: 28px; }
        .skeleton-card {
          height: 52px;
          border-radius: 8px;
          background: #f0f4f1;
        }
        .skeleton-nav-item {
          height: 38px;
          border-radius: 6px;
          background: #f0f4f1;
        }
        .skeleton-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e9eeeb;
        }
        .skeleton-hero {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .skeleton-metric-card {
          height: 104px;
          border-radius: 10px;
          border: 1px solid #e9eeeb;
          background: #ffffff;
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-table-panel {
          height: 340px;
          border-radius: 12px;
          border: 1px solid #e8ede9;
          background: #ffffff;
          padding: 24px;
        }
        .skeleton-row {
          height: 48px;
          border-bottom: 1px solid #f0f4f1;
          margin-bottom: 12px;
          background: #f9fbf9;
          border-radius: 4px;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
