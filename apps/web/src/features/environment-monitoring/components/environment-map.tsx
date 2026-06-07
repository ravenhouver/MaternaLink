'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { EnvironmentalPoint } from '../environment-monitoring-data';
import styles from '../environment-monitoring.module.css';

const riskColors = {
  low: '#d3e4ff',
  medium: '#1a73e8',
  high: '#d88b8b',
  critical: '#ba1a1a',
} satisfies Record<EnvironmentalPoint['risk'], string>;

type EnvironmentMapProps = {
  points: EnvironmentalPoint[];
};

export function EnvironmentMap({ points }: EnvironmentMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return undefined;

    const map = L.map(mapRef.current, {
      center: [-2.15, 130.95],
      zoom: 7,
      maxBounds: [[-11, 94], [7, 142]],
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
    }).addTo(map);

    L.circle([-1.25, 132.15], {
      radius: 95000,
      stroke: false,
      fillColor: '#ba1a1a',
      fillOpacity: 0.22,
    }).addTo(map);

    L.circle([-1.85, 130.6], {
      radius: 130000,
      stroke: false,
      fillColor: '#1a73e8',
      fillOpacity: 0.16,
    }).addTo(map);

    points.forEach((point) => {
      L.circleMarker(point.position, {
        radius: point.risk === 'critical' ? 14 : 11,
        color: '#ffffff',
        weight: 3,
        fillColor: riskColors[point.risk],
        fillOpacity: 0.92,
      })
        .bindTooltip(`${point.name}: ${point.metric}`, {
          permanent: point.id === 'raja-ampat',
          direction: 'top',
          className: styles.mapTooltip,
        })
        .bindPopup(`<strong>${point.name}</strong><br />${point.metric}<br />${point.risk.toUpperCase()}`)
        .addTo(map);
    });

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
    };
  }, [points]);

  return <div ref={mapRef} className={styles.environmentMap} aria-label="Peta Leaflet intensitas hujan dan risiko geospasial" />;
}
