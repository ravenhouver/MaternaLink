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

const heatStops = [
  { stop: 0.18, color: 'rgba(211, 228, 255, 0.28)' },
  { stop: 0.38, color: 'rgba(26, 115, 232, 0.28)' },
  { stop: 0.64, color: 'rgba(255, 214, 10, 0.36)' },
  { stop: 0.82, color: 'rgba(239, 68, 68, 0.46)' },
  { stop: 1, color: 'rgba(186, 26, 26, 0.58)' },
];

const heatWeight = {
  low: 0.35,
  medium: 0.55,
  high: 0.78,
  critical: 1,
} satisfies Record<EnvironmentalPoint['risk'], number>;

export function EnvironmentMap({ points }: EnvironmentMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return undefined;
    let disposed = false;
    let frameId: number | null = null;
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

    const canvas = L.DomUtil.create('canvas', styles.heatmapCanvas, map.getPanes().overlayPane);
    const context = canvas.getContext('2d');
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

    const drawHeatmap = () => {
      if (!canUseMap()) return;
      const size = map.getSize();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = size.x * ratio;
      canvas.height = size.y * ratio;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      context?.clearRect(0, 0, size.x, size.y);

      points.forEach((point) => {
        if (!context) return;
        const pixel = map.latLngToContainerPoint(point.position);
        const radius = point.risk === 'critical' ? 118 : point.risk === 'high' ? 100 : 82;
        const gradient = context.createRadialGradient(pixel.x, pixel.y, 0, pixel.x, pixel.y, radius);
        heatStops.forEach((item) => gradient.addColorStop(item.stop, item.color));
        gradient.addColorStop(1, 'rgba(186, 26, 26, 0)');
        context.globalAlpha = heatWeight[point.risk];
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(pixel.x, pixel.y, radius, 0, Math.PI * 2);
        context.fill();
      });
      if (context) context.globalAlpha = 1;
    };

    map.on('move zoom resize', drawHeatmap);
    const scheduleMapSync = () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        if (!canUseMap()) return;
        map.invalidateSize();
        syncResponsiveView();
        drawHeatmap();
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
        .bindPopup(`<strong>${point.name}</strong><br />${point.metric}<br />${point.risk.toUpperCase()}`)
        .addTo(map);
    });

    initTimeoutId = setTimeout(() => {
      scheduleMapSync();
    }, 0);

    return () => {
      disposed = true;
      if (initTimeoutId) clearTimeout(initTimeoutId);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      map.off('move zoom resize', drawHeatmap);
      canvas.remove();
      map.remove();
    };
  }, [points]);

  return <div ref={mapRef} className={styles.environmentMap} aria-label="Peta Leaflet intensitas hujan dan risiko geospasial" />;
}
