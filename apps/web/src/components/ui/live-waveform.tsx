'use client';

import type { CSSProperties, HTMLAttributes } from 'react';
import { useEffect, useRef } from 'react';
import styles from './live-waveform.module.css';

type LiveWaveformProps = Omit<HTMLAttributes<HTMLDivElement>, 'onError'> & {
  active?: boolean;
  processing?: boolean;
  barWidth?: number;
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  sensitivity?: number;
  smoothingTimeConstant?: number;
  fftSize?: number;
  historySize?: number;
  updateRate?: number;
  mode?: 'scrolling' | 'static';
  onError?: (error: Error) => void;
  onStreamReady?: (stream: MediaStream) => void;
  onStreamEnd?: () => void;
};

export function LiveWaveform({
  active = false,
  processing = false,
  barWidth = 3,
  barHeight = 4,
  barGap = 1,
  barRadius = 1.5,
  barColor = '#2563eb',
  fadeEdges = true,
  fadeWidth = 24,
  height = 64,
  sensitivity = 1,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  historySize = 60,
  updateRate = 30,
  mode = 'static',
  onError,
  onStreamReady,
  onStreamEnd,
  className,
  style,
  ...props
}: LiveWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>([]);
  const callbacksRef = useRef({ onError, onStreamReady, onStreamEnd });

  callbacksRef.current = { onError, onStreamReady, onStreamEnd };

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!active) return;
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone requires HTTPS or localhost.');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = smoothingTimeConstant;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        streamRef.current = stream;
        contextRef.current = audioContext;
        callbacksRef.current.onStreamReady?.(stream);
        draw(analyser);
      } catch (error) {
        callbacksRef.current.onError?.(error instanceof Error ? error : new Error('Microphone unavailable'));
      }
    }

    function stop() {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      animationRef.current = null;
      timerRef.current = null;
      contextRef.current?.close().catch(() => undefined);
      contextRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      callbacksRef.current.onStreamEnd?.();
    }

    function schedule(render: () => void) {
      timerRef.current = window.setTimeout(() => {
        animationRef.current = requestAnimationFrame(render);
      }, updateRate);
    }

    function draw(analyser: AnalyserNode) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      const render = () => {
        analyser.getByteFrequencyData(data);
        renderBars(data, false);
        schedule(render);
      };
      render();
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [active, barColor, barGap, barHeight, barRadius, barWidth, fadeEdges, fadeWidth, fftSize, height, historySize, mode, sensitivity, smoothingTimeConstant, updateRate]);

  useEffect(() => {
    if (active) return;
    let frame = 0;
    let raf = 0;
    const render = () => {
      renderBars(null, processing, frame++);
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [active, processing, barColor, barGap, barHeight, barRadius, barWidth, fadeEdges, fadeWidth, height, historySize, mode, sensitivity]);

  function renderBars(data: Uint8Array | null, isProcessing: boolean, frame = 0) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    context.scale(ratio, ratio);
    context.clearRect(0, 0, rect.width, rect.height);

    const color = barColor || getComputedStyle(canvas).color;
    context.fillStyle = color;
    const step = barWidth + barGap;
    const count = Math.max(1, Math.floor(rect.width / step));
    const centerY = rect.height / 2;

    if (mode === 'scrolling') {
      const value = data ? average(data) : isProcessing ? 42 + Math.sin(frame / 8) * 22 : 0;
      historyRef.current = [...historyRef.current, value].slice(-historySize);
      const bars = [...Array(Math.max(0, count - historyRef.current.length)).fill(0), ...historyRef.current].slice(-count);
      bars.forEach((item, index) => drawBar(context, index * step, centerY, valueToHeight(item, rect.height), barWidth, barRadius));
    } else {
      for (let index = 0; index < count; index += 1) {
        const sourceIndex = data ? Math.floor((index / count) * data.length) : index;
        const value = data ? data[sourceIndex] : isProcessing ? 55 + Math.sin(frame / 9 + index * 0.55) * 42 : 10;
        drawBar(context, index * step, centerY, valueToHeight(value, rect.height), barWidth, barRadius);
      }
    }

    if (fadeEdges) {
      const gradient = context.createLinearGradient(0, 0, rect.width, 0);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(Math.min(0.5, fadeWidth / rect.width), 'rgba(255,255,255,0)');
      gradient.addColorStop(Math.max(0.5, 1 - fadeWidth / rect.width), 'rgba(255,255,255,0)');
      gradient.addColorStop(1, 'rgba(255,255,255,1)');
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);
      context.globalCompositeOperation = 'source-over';
    }
  }

  function valueToHeight(value: number, totalHeight: number) {
    return Math.max(barHeight, Math.min(totalHeight - 8, (value / 255) * totalHeight * sensitivity));
  }

  const rootStyle = { ...style, height: typeof height === 'number' ? `${height}px` : height } as CSSProperties;

  return (
    <div className={[styles.waveform, className ?? ''].filter(Boolean).join(' ')} style={rootStyle} {...props}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

function average(data: Uint8Array) {
  return data.reduce((total, value) => total + value, 0) / Math.max(data.length, 1);
}

function drawBar(context: CanvasRenderingContext2D, x: number, centerY: number, height: number, width: number, radius: number) {
  const y = centerY - height / 2;
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
  context.fill();
}
