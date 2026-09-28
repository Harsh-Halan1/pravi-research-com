"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./dashboard-overview.module.css";

type IconName =
  | "grid"
  | "layers"
  | "clipboard"
  | "scan"
  | "wrench"
  | "chart"
  | "settings"
  | "search"
  | "bell"
  | "chevron"
  | "arrow"
  | "plus"
  | "filter"
  | "more"
  | "map"
  | "clock"
  | "check"
  | "alert";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4.5V3h6v1.5M8 10h8M8 14h8M8 18h5" />
      </>
    ),
    scan: (
      <>
        <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
      </>
    ),
    wrench: (
      <>
        <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7Z" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-4 3 2 6-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path
          d="m19.4 15 .1.1 1.2.9-1.2 2.1-1.4-.6a8 8 0 0 1-1.7 1l-.2 1.5h-2.4l-.3-1.5a8 8 0 0 1-1.8-1l-1.4.6-1.2-2.1 1.2-.9a7 7 0 0 1 0-2l-1.2-.9 1.2-2.1 1.4.6a8 8 0 0 1 1.8-1l.3-1.5h2.4l.2 1.5a8 8 0 0 1 1.7 1l1.4-.6 1.2 2.1-1.2.9a7 7 0 0 1-.1 1.9Z"
          transform="translate(-1 -1) scale(1.08)"
        />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10m-7 6h4" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15m6-12v15" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <path d="M12 3 2.8 19h18.4L12 3Z" />
        <path d="M12 9v4m0 3h.01" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

const navItems: {
  label: string;
  icon: IconName;
  active?: boolean;
  badge?: string;
  href?: string;
}[] = [
  { label: "Overview", icon: "grid", active: true, href: "/dashboard" },
  { label: "Asset register", icon: "layers", href: "/assets" },
];

type DashboardOverviewProps = {
  displayName?: string;
  departmentName?: string;
  roleLabel?: string;
  todayLabel?: string;
  canRegister: boolean;
  metrics: {
    roadSegmentCount: number;
    pendingVerificationCount: number;
    recentInspectionCount: number;
    openWorkOrderCount: number;
  };
  conditionData: { label: string; count: number; percent: number }[];
  verificationQueue: {
    id: string;
    assetCode: string;
    name: string;
    routeName: string;
    submittedAt: string;
  }[];
  recentAssets: {
    id: string;
    assetCode: string;
    name: string;
    departmentName: string;
    condition: string;
    status: string;
    routeName: string | null;
    lengthKm: string | null;
  }[];
};

export default function DashboardOverview({
  displayName = "Demo Official",
  departmentName = "Public Works",
  roleLabel = "Asset officer",
  todayLabel = "",
  canRegister,
  metrics,
  conditionData,
  verificationQueue,
  recentAssets,
}: DashboardOverviewProps) {
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const departmentInitials = departmentName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <a
          className={styles.brand}
          href="/dashboard"
          aria-label="Pravi dashboard"
        >
          <span className={styles.brandMark}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.brandText}>PRAVI</span>
        </a>
        <div className={styles.workspaceLabel}>WORKSPACE</div>
        <div className={styles.department}>
          <span className={styles.departmentIcon}>{departmentInitials}</span>
          <span className={styles.departmentCopy}>
            <strong>{departmentName}</strong>
            <small>State operations</small>
          </span>
          <Icon name="chevron" size={15} />
        </div>
        <div className={styles.navLabel}>OPERATIONS</div>
        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              className={`${styles.navItem} ${item.active ? styles.navActive : ""}`}
              href={item.href ?? "/assets"}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.helpCard}>
            <div className={styles.helpIcon}>
              <Icon name="alert" size={17} />
            </div>
            <strong>Need a hand?</strong>
            <p>Visit the operations guide for help getting started.</p>
            <span>
              Use the asset register to review records assigned to your
              department.
            </span>
          </div>
          <div className={styles.profile}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.profileCopy}>
              <strong>{displayName}</strong>
              <small>{roleLabel}</small>
            </div>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>{departmentName}</span>
            <Icon name="chevron" size={14} />
            <strong>Overview</strong>
          </div>
          <div className={styles.topActions}>
            <span className={styles.today}>{todayLabel}</span>
            <div className={styles.avatarSmall}>{initials}</div>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.welcome}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.liveDot} /> DEPARTMENT OPERATIONS
              </div>
              <h1>
                Good morning, {displayName.split(/\s+/)[0]} <span>✳</span>
              </h1>
              <p>
                Current road-segment records across your assigned departments.
              </p>
            </div>
            <div className={styles.welcomeActions}>
              {canRegister && (
                <Link href="/assets/new" className={styles.primaryButton}>
                  <Icon name="plus" size={17} /> Register asset
                </Link>
              )}
            </div>
          </section>

          <section className={styles.metrics} aria-label="District summary">
            <article className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={styles.metricIcon}>
                  <Icon name="layers" />
                </span>
                <span className={styles.metricTrend}>Assigned scope</span>
              </div>
              <div className={styles.metricValue}>
                {metrics.roadSegmentCount.toLocaleString("en-IN")}
              </div>
              <div className={styles.metricLabel}>Registered road segments</div>
              <div className={styles.metricFoot}>
                <span className={styles.progress}>
                  <i
                    style={{ width: metrics.roadSegmentCount ? "100%" : "0%" }}
                  />
                </span>
                <span>In assigned departments</span>
              </div>
            </article>
            <article className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={`${styles.metricIcon} ${styles.amberIcon}`}>
                  <Icon name="clipboard" />
                </span>
                <span className={styles.metricPill}>Needs attention</span>
              </div>
              <div className={styles.metricValue}>
                {metrics.pendingVerificationCount.toLocaleString("en-IN")}
              </div>
              <div className={styles.metricLabel}>Awaiting verification</div>
              <a className={styles.metricLink} href="/assets">
                View asset register <Icon name="arrow" size={14} />
              </a>
            </article>
            <article className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={`${styles.metricIcon} ${styles.blueIcon}`}>
                  <Icon name="scan" />
                </span>
                <span className={styles.metricTrend}>Past 30 days</span>
              </div>
              <div className={styles.metricValue}>
                {metrics.recentInspectionCount.toLocaleString("en-IN")}
              </div>
              <div className={styles.metricLabel}>Inspections recorded</div>
              <a className={styles.metricLink} href="/assets">
                View assets <Icon name="arrow" size={14} />
              </a>
            </article>
            <article className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={`${styles.metricIcon} ${styles.redIcon}`}>
                  <Icon name="wrench" />
                </span>
                <span
                  className={styles.metricPill}
                  style={{ background: "#fff1ef", color: "#bb5147" }}
                >
                  Current
                </span>
              </div>
              <div className={styles.metricValue}>
                {metrics.openWorkOrderCount.toLocaleString("en-IN")}
              </div>
              <div className={styles.metricLabel}>Open work orders</div>
              <a className={styles.metricLink} href="/assets">
                View assets <Icon name="arrow" size={14} />
              </a>
            </article>
          </section>

          <section className={styles.middleGrid}>
            <article className={`${styles.panel} ${styles.queuePanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.sectionEyebrow}>YOUR NEXT ACTIONS</div>
                  <h2>
                    Verification queue{" "}
                    <span className={styles.count}>
                      {metrics.pendingVerificationCount}
                    </span>
                  </h2>
                </div>
                <Link className={styles.viewAll} href="/assets">
                  View all <Icon name="arrow" size={14} />
                </Link>
              </div>
              <div className={styles.queueList}>
                {verificationQueue.length ? (
                  verificationQueue.map((asset) => (
                    <div className={styles.queueRow} key={asset.id}>
                      <div
                        className={`${styles.queueSymbol} ${styles.symbolBlue}`}
                      >
                        RD
                      </div>
                      <div className={styles.queueDetails}>
                        <strong>Road segment awaiting verification</strong>
                        <span>
                          {asset.assetCode} · {asset.routeName || asset.name}
                        </span>
                      </div>
                      <div className={styles.queueMeta}>
                        <span
                          className={`${styles.priority} ${styles.priorityNormal}`}
                        >
                          Pending
                        </span>
                        <small>
                          {new Date(asset.submittedAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </small>
                      </div>
                      <Link
                        className={styles.rowArrow}
                        href={`/assets/${asset.id}`}
                        aria-label={`Open ${asset.name}`}
                      >
                        <Icon name="chevron" size={17} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className={styles.queueDetails}>
                    No road segments are awaiting verification in your assigned
                    departments.
                  </p>
                )}
              </div>
              <div className={styles.panelFoot}>
                <span>
                  <span className={styles.smallDot} />{" "}
                  {metrics.pendingVerificationCount} pending
                </span>
                <Link href="/assets">
                  Open asset register <Icon name="arrow" size={14} />
                </Link>
              </div>
            </article>

            <article className={`${styles.panel} ${styles.conditionPanel}`}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.sectionEyebrow}>NETWORK HEALTH</div>
                  <h2>Road condition overview</h2>
                </div>
                <span>Current records</span>
              </div>
              <div className={styles.conditionSummary}>
                <div>
                  <span className={styles.conditionTotal}>
                    {metrics.roadSegmentCount.toLocaleString("en-IN")}
                  </span>
                  <small>road segments</small>
                </div>
              </div>
              <div
                className={styles.barChart}
                role="img"
                aria-label={`Current road condition counts: ${conditionData.map((item) => `${item.label} ${item.count}`).join(", ")}`}
              >
                {conditionData.map((item) => (
                  <div className={styles.barGroup} key={item.label}>
                    <div className={styles.barTrack}>
                      <i
                        className={
                          item.label === "Good"
                            ? styles.goodBar
                            : item.label === "Fair"
                              ? styles.fairBar
                              : styles.poorBar
                        }
                        style={{ height: `${item.percent}%` }}
                      />
                    </div>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
              <div className={styles.conditionNote}>
                <span>
                  Counts reflect each road segment’s current condition
                  classification.
                </span>
              </div>
            </article>
          </section>

          <section className={`${styles.panel} ${styles.assetPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.sectionEyebrow}>ASSET REGISTER</div>
                <h2>Recently updated assets</h2>
              </div>
              <div className={styles.tableActions}>
                <Link className={styles.viewAll} href="/assets">
                  View register <Icon name="arrow" size={14} />
                </Link>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.assetTable}>
                <thead>
                  <tr>
                    <th>ASSET</th>
                    <th>DEPARTMENT</th>
                    <th>LENGTH</th>
                    <th>CONDITION</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.map((asset) => {
                    const conditionColor =
                      asset.condition === "GOOD"
                        ? "green"
                        : asset.condition === "FAIR"
                          ? "amber"
                          : asset.condition === "UNKNOWN"
                            ? "blue"
                            : "red";
                    const statusColor =
                      asset.status === "VERIFIED" || asset.status === "ACTIVE"
                        ? "green"
                        : asset.status === "NEEDS_CHANGES"
                          ? "red"
                          : "blue";
                    const statusLabel = asset.status
                      .toLowerCase()
                      .replaceAll("_", " ")
                      .replace(/\b\w/g, (letter) => letter.toUpperCase());
                    return (
                      <tr key={asset.id}>
                        <td>
                          <Link
                            className={styles.assetIdentity}
                            href={`/assets/${asset.id}`}
                          >
                            <span className={styles.assetThumb}>
                              <span>RD</span>
                            </span>
                            <span>
                              <strong>{asset.routeName || asset.name}</strong>
                              <small>{asset.assetCode}</small>
                            </span>
                          </Link>
                        </td>
                        <td>{asset.departmentName}</td>
                        <td>{asset.lengthKm ? `${asset.lengthKm} km` : "—"}</td>
                        <td>
                          <span className={styles.conditionCell}>
                            <i
                              className={`${styles.statusDot} ${styles[conditionColor]}`}
                            />
                            {asset.condition
                              .toLowerCase()
                              .replace(/\b\w/g, (letter) =>
                                letter.toUpperCase(),
                              )}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusTag} ${styles[`tag_${statusColor}`]}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!recentAssets.length && (
                    <tr>
                      <td colSpan={5}>
                        No road segments are registered in your assigned
                        departments yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles.tableFooter}>
              <span>
                Showing <strong>{recentAssets.length}</strong> of{" "}
                <strong>
                  {metrics.roadSegmentCount.toLocaleString("en-IN")}
                </strong>{" "}
                road segments
              </span>
              <Link href="/assets">
                Open register <Icon name="arrow" size={14} />
              </Link>
            </div>
          </section>

          <footer className={styles.footer}>
            <span>
              © 2026 Pravi <i /> {departmentName}
            </span>
            <span>
              <span>Prototype workspace</span>
              <span className={styles.systemStatus}>
                <i /> Demo workspace
              </span>
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
