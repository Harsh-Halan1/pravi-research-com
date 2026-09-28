"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./workspace-shell.module.css";

type NavKey = "overview" | "assets" | "queue" | "new";

type IconName =
  | "grid"
  | "layers"
  | "scan"
  | "plus"
  | "chevron"
  | "alert"
  | "wrench";

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
    scan: (
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    alert: (
      <>
        <path d="M12 3 2.8 19h18.4L12 3Z" />
        <path d="M12 9v4m0 3h.01" />
      </>
    ),
    wrench: (
      <path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7Z" />
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

interface WorkspaceShellProps {
  departmentName?: string;
  displayName?: string;
  roleLabel?: string;
  activeNav?: NavKey;
  pendingVerificationCount?: number;
  canRegister?: boolean;
  breadcrumbs: Array<{ label: string; href?: string }>;
  topActions?: ReactNode;
  children: ReactNode;
}

export function WorkspaceShell({
  departmentName = "Public Works Department",
  displayName = "Demo Official",
  roleLabel = "Asset Officer",
  activeNav = "assets",
  pendingVerificationCount,
  canRegister = false,
  breadcrumbs,
  topActions,
  children,
}: WorkspaceShellProps) {
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

  const navItems = [
    {
      key: "overview" as NavKey,
      label: "Overview",
      icon: "grid" as IconName,
      href: "/dashboard",
    },
    {
      key: "assets" as NavKey,
      label: "Asset register",
      icon: "layers" as IconName,
      href: "/assets",
    },
    {
      key: "queue" as NavKey,
      label: "Verification queue",
      icon: "scan" as IconName,
      href: "/assets?status=PENDING_VERIFICATION",
      badge:
        pendingVerificationCount && pendingVerificationCount > 0
          ? `${pendingVerificationCount}`
          : undefined,
    },
    ...(canRegister
      ? [
          {
            key: "new" as NavKey,
            label: "Register road",
            icon: "plus" as IconName,
            href: "/assets/new",
          },
        ]
      : []),
  ];

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Workspace navigation">
        <Link className={styles.brand} href="/dashboard">
          <span className={styles.brandMark}>
            <span />
            <span />
            <span />
          </span>
          <span className={styles.brandText}>
            PRAVI
            <small>PUBLIC INFRASTRUCTURE</small>
          </span>
        </Link>

        <div className={styles.workspaceLabel}>JURISDICTION</div>
        <div className={styles.department}>
          <span className={styles.departmentIcon}>{departmentInitials}</span>
          <span className={styles.departmentCopy}>
            <strong>{departmentName}</strong>
            <small>State operations</small>
          </span>
        </div>

        <div className={styles.navLabel}>OPERATIONS</div>
        <nav className={styles.nav} aria-label="Main operations">
          {navItems.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navActive : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
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
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span
                  key={crumb.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href}>{crumb.label}</Link>
                  ) : (
                    <strong>{crumb.label}</strong>
                  )}
                  {!isLast && <Icon name="chevron" size={13} />}
                </span>
              );
            })}
          </nav>

          <div className={styles.topActions}>{topActions}</div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
