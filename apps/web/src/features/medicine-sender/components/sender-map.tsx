'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { TacticalPoint } from '../medicine-sender-data';
import styles from '../medicine-sender.module.css';

const toneColors = {
  critical: '#d93025',
  anticipatory: '#1a73e8',
  regular: '#34a853',
} satisfies Record<TacticalPoint['status'], string>;

type SenderMapProps = {
  points: TacticalPoint[];
  mode: 'map' | 'satellite';
  center?: [number, number];
  zoom?: number;
};

export function SenderMap({ points, mode, center = [-3.6, 123.2], zoom = 5 }: SenderMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return undefined;

    const map = L.map(mapRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    const tile = {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
    };

    L.tileLayer(tile.url, {
      attribution: tile.attribution,
      maxZoom: mode === 'satellite' ? 12 : 14,
    }).addTo(map);

    points.forEach((point) => {
      L.circleMarker(point.position, {
        radius: 11,
        color: '#ffffff',
        weight: 3,
        fillColor: toneColors[point.status],
        fillOpacity: 0.95,
      })
        .bindPopup(`<strong>${point.name}</strong><br />${point.status.toUpperCase()}`)
        .addTo(map);
    });

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
    };
  }, [center, mode, points, zoom]);

  return <div ref={mapRef} className={styles.leafletMap} aria-label="Tactical view jalur pasokan" />;
}
