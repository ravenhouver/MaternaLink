'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import styles from './distribution.module.css';

const routePoints: [number, number][] = [
  [-7.7169, 110.3556],
  [-7.7358, 110.3658],
  [-7.7556, 110.3819],
  [-7.7714, 110.3955],
];

export function DistributionMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return undefined;

    const map = L.map(mapRef.current, {
      center: [-7.744, 110.374],
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.polyline(routePoints, {
      color: '#005bbf',
      weight: 5,
      opacity: 0.82,
      dashArray: '8 10',
    }).addTo(map);

    L.circleMarker(routePoints[1], {
      radius: 10,
      color: '#ffffff',
      weight: 3,
      fillColor: '#005bbf',
      fillOpacity: 1,
    })
      .bindTooltip('Courier (PKM-TF-001)', { permanent: true, direction: 'top', offset: [0, -12] })
      .addTo(map);

    L.circleMarker(routePoints[routePoints.length - 1], {
      radius: 8,
      color: '#ffffff',
      weight: 3,
      fillColor: '#34a853',
      fillOpacity: 1,
    })
      .bindPopup('<strong>Sleman Health Center</strong><br />ETA Tomorrow, 10:00 WIB')
      .addTo(map);

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
    };
  }, []);

  return <div ref={mapRef} className={styles.leafletMap} aria-label="Active shipping locations map" />;
}
