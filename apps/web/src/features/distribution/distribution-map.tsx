'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import styles from './distribution.module.css';

type DistributionMapLocation = {
  id: string;
  name: string;
  status: string;
  latitude: number;
  longitude: number;
};

const defaultCenter: [number, number] = [-7.744, 110.374];

function averageCenter(locations: DistributionMapLocation[]): [number, number] {
  if (!locations.length) return defaultCenter;
  const total = locations.reduce(
    (sum, item) => ({ latitude: sum.latitude + item.latitude, longitude: sum.longitude + item.longitude }),
    { latitude: 0, longitude: 0 },
  );
  return [total.latitude / locations.length, total.longitude / locations.length];
}

export function DistributionMap({ locations = [] }: { locations?: DistributionMapLocation[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return undefined;
    const center = averageCenter(locations);

    const map = L.map(mapRef.current, {
      center,
      zoom: locations.length > 1 ? 11 : 12,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    locations.forEach((location) => {
      const tone = location.status === 'Received' ? '#34a853' : location.status === 'Rejected' ? '#ba1a1a' : '#005bbf';
      const popup = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = location.name;
      const detail = document.createElement('div');
      detail.textContent = `${location.status} - ${location.id}`;
      popup.append(name, detail);
      L.circleMarker([location.latitude, location.longitude], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: tone,
        fillOpacity: 1,
      })
        .bindTooltip(location.name, { permanent: locations.length === 1, direction: 'top', offset: [0, -12] })
        .bindPopup(popup)
        .addTo(map);
    });

    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
    };
  }, [locations]);

  return <div ref={mapRef} className={styles.leafletMap} aria-label="Active shipping locations map" />;
}
