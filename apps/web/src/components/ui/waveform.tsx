'use client';

import type { CSSProperties } from 'react';
import styles from './waveform.module.css';

type ScrollingWaveformProps = {
  height?: number;
  barWidth?: number;
  barGap?: number;
  speed?: number;
  fadeEdges?: boolean;
  barColor?: string;
  active?: boolean;
  className?: string;
};

const pattern = [24, 46, 62, 38, 70, 30, 52, 82, 44, 66, 34, 58, 76, 42, 64, 28, 50, 72, 36, 60, 48, 78, 32, 56];

export function ScrollingWaveform({
  height = 80,
  barWidth = 3,
  barGap = 2,
  speed = 30,
  fadeEdges = true,
  barColor = 'gray',
  active = true,
  className,
}: ScrollingWaveformProps) {
  const bars = [...pattern, ...pattern, ...pattern, ...pattern];
  const rootStyle = {
    height,
    '--waveform-speed': `${Math.max(8, speed)}s`,
    '--waveform-bg': 'white',
  } as CSSProperties;
  const rootClassName = [styles.waveform, active ? styles.active : '', fadeEdges ? '' : styles.noFade, className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} style={rootStyle} aria-hidden="true">
      <div className={styles.track}>
        {bars.map((barHeight, index) => (
          <span
            className={styles.bar}
            key={`${barHeight}-${index}`}
            style={{
              '--bar-width': `${barWidth}px`,
              '--bar-gap': `${barGap}px`,
              '--bar-color': barColor,
              '--bar-height': `${Math.max(8, Math.round((height * barHeight) / 100))}px`,
              '--bar-delay': `${(index % pattern.length) * 0.035}s`,
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
