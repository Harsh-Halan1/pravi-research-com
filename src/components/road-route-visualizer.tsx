"use client";

import styles from "./road-route-visualizer.module.css";

interface RoadRouteVisualizerProps {
  routeName: string;
  externalRoadId?: string | null;
  startMarker: string;
  endMarker: string;
  lengthKm: string;
  surfaceType: string;
  condition: string;
  startLatitude?: string | null;
  startLongitude?: string | null;
  endLatitude?: string | null;
  endLongitude?: string | null;
  representativeLat?: string | null;
  representativeLng?: string | null;
}

export function RoadRouteVisualizer({
  routeName,
  externalRoadId,
  startMarker,
  endMarker,
  lengthKm,
  surfaceType,
  condition,
  startLatitude,
  startLongitude,
  endLatitude,
  endLongitude,
  representativeLat,
  representativeLng,
}: RoadRouteVisualizerProps) {
  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "GOOD":
        return "#176b4a";
      case "FAIR":
        return "#2b7a78";
      case "POOR":
        return "#b8792e";
      case "CRITICAL":
        return "#b34f45";
      default:
        return "#637269";
    }
  };

  const condColor = getConditionColor(condition);

  return (
    <section
      className={styles.container}
      aria-label="Road segment route diagram"
    >
      <div className={styles.header}>
        <h3 className={styles.title}>
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19V5M4 19h17M7 15l4-4 3 2 6-7" />
          </svg>
          Corridor & Extent Chainage
        </h3>
        <div className={styles.metaTags}>
          <span className={styles.tag}>{routeName}</span>
          {externalRoadId && (
            <span className={styles.tag}>ID: {externalRoadId}</span>
          )}
          <span className={styles.tag}>{surfaceType}</span>
          <span
            className={styles.tag}
            style={{
              color: condColor,
              backgroundColor: `${condColor}15`,
              border: `1px solid ${condColor}40`,
            }}
          >
            {condition} CONDITION
          </span>
        </div>
      </div>

      <div className={styles.diagramArea}>
        <svg
          className={styles.svg}
          viewBox="0 0 700 90"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Route visualization for ${routeName}`}
        >
          {/* Base road corridor track */}
          <line
            x1="50"
            y1="45"
            x2="650"
            y2="45"
            stroke="#e2e8e4"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Active road segment colored by condition */}
          <line
            x1="50"
            y1="45"
            x2="650"
            y2="45"
            stroke={condColor}
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Intermediate chainage dashed center-line */}
          <line
            x1="50"
            y1="45"
            x2="650"
            y2="45"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />

          {/* Start marker pin */}
          <circle
            cx="50"
            cy="45"
            r="9"
            fill="#ffffff"
            stroke="#176b4a"
            strokeWidth="3"
          />
          <circle cx="50" cy="45" r="3.5" fill="#176b4a" />

          {/* 25% milestone */}
          <line
            x1="200"
            y1="36"
            x2="200"
            y2="54"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {/* 50% midpoint marker (Representative Lat/Lng) */}
          <circle
            cx="350"
            cy="45"
            r="7"
            fill="#ffffff"
            stroke="#2b3d34"
            strokeWidth="2"
          />
          <circle cx="350" cy="45" r="2.5" fill="#2b3d34" />
          {/* 75% milestone */}
          <line
            x1="500"
            y1="36"
            x2="500"
            y2="54"
            stroke="#ffffff"
            strokeWidth="2"
          />

          {/* End marker pin */}
          <circle
            cx="650"
            cy="45"
            r="9"
            fill="#ffffff"
            stroke="#176b4a"
            strokeWidth="3"
          />
          <circle cx="650" cy="45" r="3.5" fill="#176b4a" />

          {/* Corridor distance pill in center */}
          <g transform="translate(350, 18)">
            <rect
              x="-48"
              y="-12"
              width="96"
              height="22"
              rx="11"
              fill="#ffffff"
              stroke="#d5ddd6"
              strokeWidth="1"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#15231e"
              fontSize="10"
              fontWeight="800"
              fontFamily="DM Sans, sans-serif"
            >
              {lengthKm} KM SPAN
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.markersRow}>
        <div className={styles.markerBlock}>
          <strong>Start: {startMarker}</strong>
          {startLatitude && startLongitude ? (
            <span>
              {Number(startLatitude).toFixed(4)}° N,{" "}
              {Number(startLongitude).toFixed(4)}° E
            </span>
          ) : (
            <small>Coordinates unrecorded</small>
          )}
          <small>Chainage baseline</small>
        </div>

        <div className={styles.markerBlock} style={{ textAlign: "center" }}>
          <strong>Representative Center</strong>
          {representativeLat && representativeLng ? (
            <span>
              {Number(representativeLat).toFixed(4)}° N,{" "}
              {Number(representativeLng).toFixed(4)}° E
            </span>
          ) : (
            <small>Pending GIS survey</small>
          )}
          <small>Survey centroid</small>
        </div>

        <div className={styles.markerBlock} style={{ textAlign: "right" }}>
          <strong>End: {endMarker}</strong>
          {endLatitude && endLongitude ? (
            <span>
              {Number(endLatitude).toFixed(4)}° N,{" "}
              {Number(endLongitude).toFixed(4)}° E
            </span>
          ) : (
            <small>Coordinates unrecorded</small>
          )}
          <small>Corridor termination</small>
        </div>
      </div>
    </section>
  );
}
