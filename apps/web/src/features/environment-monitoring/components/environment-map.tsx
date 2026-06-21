'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
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

const fallbackHeatWeight = {
  low: 0.18,
  medium: 0.42,
  high: 0.72,
  critical: 1,
} satisfies Record<EnvironmentalPoint['risk'], number>;

export function EnvironmentMap({ points }: EnvironmentMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return undefined;
    let disposed = false;
    let initTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const desktopView: L.LatLngExpression = [-2.2, 122.5];
    const mobileView: L.LatLngExpression = [-1.25, 131.05];

    const map = L.map(mapRef.current, {
      center: mapRef.current.clientWidth < 560 ? mobileView : desktopView,
      zoom: 5,
      maxBounds: [[-11, 94], [7, 142]],
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
    }).addTo(map);

    const canUseMap = () => !disposed && Boolean(mapRef.current?.isConnected && map.getPane('mapPane'));
    const syncResponsiveView = () => {
      const container = mapRef.current;
      if (!container || !canUseMap()) return;
      if (container.clientWidth < 560) {
        map.setView(mobileView, 6, { animate: false });
      } else {
        map.setView(desktopView, 5, { animate: false });
      }
    };

    const heatPoints = points.map((point) => [point.position[0], point.position[1], point.heatIntensity ?? fallbackHeatWeight[point.risk]] as [number, number, number]);
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 34,
      blur: 28,
      maxZoom: 9,
      minOpacity: 0.28,
      gradient: {
        0.12: '#d3e4ff',
        0.42: '#1a73e8',
        0.68: '#ffd60a',
        0.84: '#ef4444',
        1: '#ba1a1a',
      },
    }).addTo(map);

    const scheduleMapSync = () => {
      window.requestAnimationFrame(() => {
        if (!canUseMap()) return;
        map.invalidateSize();
        syncResponsiveView();
        heatLayer.redraw();
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleMapSync();
    });
    resizeObserver.observe(mapRef.current);

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
        .bindPopup(`<strong>${point.name}</strong><br />${point.metric}<br />Max daily ${point.maxDailyPrecipitationMm ?? '-'}mm<br />Source ${point.source ?? 'OPEN_METEO'}`)
        .addTo(map);
    });

    initTimeoutId = setTimeout(() => {
      scheduleMapSync();
    }, 0);

    return () => {
      disposed = true;
      if (initTimeoutId) clearTimeout(initTimeoutId);
      resizeObserver.disconnect();
      heatLayer.remove();
      map.remove();
    };
  }, [points]);

  return <div ref={mapRef} className={styles.environmentMap} aria-label="Peta Leaflet intensitas hujan dan risiko geospasial" />;
}
