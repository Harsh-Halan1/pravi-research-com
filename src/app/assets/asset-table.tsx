"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./asset-table.module.css";

export interface AssetItem {
  id: string;
  assetCode: string;
  name: string;
  assetType: string;
  status: string;
  lifecycleStage: string;
  currentCondition: string;
  updatedAt: string;
  departmentName: string;
  roadSegment: {
    routeName: string;
    externalRoadId: string | null;
    startMarker: string;
    endMarker: string;
    lengthKm: string;
    surfaceType: string;
    workflowStatus: string;
  } | null;
}

interface AssetTableProps {
  assets: AssetItem[];
  canRegister: boolean;
  departmentName: string;
  initialStatus?: string;
}

function humanize(val: string) {
  return val
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function AssetTable({
  assets,
  canRegister,
  departmentName,
  initialStatus = "ALL",
}: AssetTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [conditionFilter, setConditionFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  // Status counts
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      ALL: assets.length,
      PENDING_VERIFICATION: 0,
      NEEDS_CHANGES: 0,
      VERIFIED: 0,
      DRAFT: 0,
    };
    for (const asset of assets) {
      const status = asset.roadSegment?.workflowStatus ?? asset.status;
      if (status in map) {
        map[status] += 1;
      }
    }
    return map;
  }, [assets]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const status = asset.roadSegment?.workflowStatus ?? asset.status;
      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }
      if (
        conditionFilter !== "ALL" &&
        asset.currentCondition !== conditionFilter
      ) {
        return false;
      }
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      return (
        asset.assetCode.toLowerCase().includes(q) ||
        asset.name.toLowerCase().includes(q) ||
        (asset.roadSegment?.routeName.toLowerCase().includes(q) ?? false) ||
        (asset.roadSegment?.externalRoadId?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [assets, search, statusFilter, conditionFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Asset Code",
      "Asset Name",
      "Route Name",
      "External Road ID",
      "Start Marker",
      "End Marker",
      "Length (KM)",
      "Surface Type",
      "Condition",
      "Workflow Status",
      "Lifecycle Stage",
      "Department",
      "Last Updated",
    ];

    const rows = filteredAssets.map((asset) => [
      `"${asset.assetCode}"`,
      `"${asset.name.replaceAll('"', '""')}"`,
      `"${asset.roadSegment?.routeName ?? ""}"`,
      `"${asset.roadSegment?.externalRoadId ?? ""}"`,
      `"${asset.roadSegment?.startMarker ?? ""}"`,
      `"${asset.roadSegment?.endMarker ?? ""}"`,
      `"${asset.roadSegment?.lengthKm ?? ""}"`,
      `"${asset.roadSegment?.surfaceType ?? ""}"`,
      `"${asset.currentCondition}"`,
      `"${asset.roadSegment?.workflowStatus ?? asset.status}"`,
      `"${asset.lifecycleStage}"`,
      `"${asset.departmentName}"`,
      `"${formatDate(asset.updatedAt)}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `pravi_assets_${departmentName.replaceAll(/\s+/g, "_")}_${dateStr}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "VERIFIED":
      case "ACTIVE":
        return styles.badgeVerified;
      case "PENDING_VERIFICATION":
        return styles.badgePending;
      case "NEEDS_CHANGES":
        return styles.badgeChanges;
      default:
        return styles.badgeDraft;
    }
  };

  const getConditionDotClass = (condition: string) => {
    switch (condition) {
      case "GOOD":
        return styles.condGood;
      case "FAIR":
        return styles.condFair;
      case "POOR":
        return styles.condPoor;
      case "CRITICAL":
        return styles.condCritical;
      default:
        return styles.condUnknown;
    }
  };

  return (
    <div className={styles.container}>
      {/* Status tabs */}
      <div
        className={styles.statusTabs}
        role="tablist"
        aria-label="Filter by status"
      >
        {[
          { key: "ALL", label: "All assets" },
          { key: "PENDING_VERIFICATION", label: "Pending verification" },
          { key: "NEEDS_CHANGES", label: "Needs changes" },
          { key: "VERIFIED", label: "Verified" },
          { key: "DRAFT", label: "Drafts" },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab.key)}
              className={`${styles.statusTab} ${isActive ? styles.statusTabActive : ""}`}
            >
              <span>{tab.label}</span>
              <span className={styles.tabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchGroup}>
          <svg
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search by code, name, route, or road ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
            aria-label="Search assets"
          />
        </div>

        <div className={styles.filterActions}>
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className={styles.select}
            aria-label="Filter by condition"
          >
            <option value="ALL">All conditions</option>
            <option value="GOOD">Good condition</option>
            <option value="FAIR">Fair condition</option>
            <option value="POOR">Poor condition</option>
            <option value="CRITICAL">Critical condition</option>
            <option value="UNKNOWN">Unknown / uninspected</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`${styles.viewButton} ${viewMode === "table" ? styles.viewButtonActive : ""}`}
              aria-pressed={viewMode === "table"}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              className={`${styles.viewButton} ${viewMode === "card" ? styles.viewButtonActive : ""}`}
              aria-pressed={viewMode === "card"}
            >
              Cards
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.exportButton}
            title="Download CSV for official audit and reporting"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Rendering */}
      {filteredAssets.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No matching infrastructure records</h3>
          <p>
            {search || statusFilter !== "ALL" || conditionFilter !== "ALL"
              ? "Try adjusting your search terms or filters."
              : "No assets are registered under this department yet."}
          </p>
          {canRegister && (
            <Link
              href="/assets/new"
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "8px 16px",
                background: "#176b4a",
                color: "#fff",
                borderRadius: 6,
                fontWeight: 700,
                textDecoration: "none",
                fontSize: 12,
              }}
            >
              Register first road segment
            </Link>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Asset Code</th>
                <th scope="col">Road Name & Route</th>
                <th scope="col">Extent & Length</th>
                <th scope="col">Surface</th>
                <th scope="col">Condition</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const status =
                  asset.roadSegment?.workflowStatus ?? asset.status;
                return (
                  <tr key={asset.id}>
                    <td className={styles.codeCell}>{asset.assetCode}</td>
                    <td>
                      <div className={styles.nameCell}>
                        <strong>{asset.name}</strong>
                        <small>
                          {asset.roadSegment?.routeName}
                          {asset.roadSegment?.externalRoadId
                            ? ` · ID: ${asset.roadSegment.externalRoadId}`
                            : ""}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className={styles.extentCell}>
                        <span>
                          {asset.roadSegment?.startMarker} →{" "}
                          {asset.roadSegment?.endMarker}
                        </span>
                        <small>{asset.roadSegment?.lengthKm} km</small>
                      </div>
                    </td>
                    <td>{humanize(asset.roadSegment?.surfaceType ?? "—")}</td>
                    <td>
                      <div className={styles.conditionIndicator}>
                        <span
                          className={`${styles.conditionDot} ${getConditionDotClass(asset.currentCondition)}`}
                        />
                        <span>{humanize(asset.currentCondition)}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${getStatusBadgeClass(status)}`}
                      >
                        {humanize(status)}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/assets/${asset.id}`}
                        className={styles.actionLink}
                      >
                        View details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {filteredAssets.map((asset) => {
            const status = asset.roadSegment?.workflowStatus ?? asset.status;
            return (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className={styles.card}
              >
                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    <span className={styles.codeCell}>{asset.assetCode}</span>
                    <h3 className={styles.cardTitle}>{asset.name}</h3>
                    <span className={styles.cardRoute}>
                      {asset.roadSegment?.routeName}
                    </span>
                  </div>
                  <span
                    className={`${styles.badge} ${getStatusBadgeClass(status)}`}
                  >
                    {humanize(status)}
                  </span>
                </div>
                <div className={styles.extentCell}>
                  <span>
                    Extent: {asset.roadSegment?.startMarker} →{" "}
                    {asset.roadSegment?.endMarker}
                  </span>
                  <span>
                    {asset.roadSegment?.lengthKm} km ·{" "}
                    {humanize(asset.roadSegment?.surfaceType ?? "")}
                  </span>
                </div>
                <div className={styles.cardBottom}>
                  <div className={styles.conditionIndicator}>
                    <span
                      className={`${styles.conditionDot} ${getConditionDotClass(asset.currentCondition)}`}
                    />
                    <span>{humanize(asset.currentCondition)}</span>
                  </div>
                  <span>Updated {formatDate(asset.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
