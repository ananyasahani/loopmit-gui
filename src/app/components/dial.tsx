'use client';

import React,{ useEffect, useRef } from 'react';
import { DotLottie} from '@lottiefiles/dotlottie-web';

interface LottiePlayerProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  speed?: number;
  backgroundColor?: string;
  segment?: [number, number];
  className?: string;
  width?: string | number;
  height?: string | number;
}

export default function LottiePlayer({
  src,
  autoplay = true,
  loop = true,
  speed = 1,
  backgroundColor,
  segment,
  className = '',
  width = '100%',
  height = '100%'
}: LottiePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotLottieRef = useRef<DotLottie | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize DotLottie
    dotLottieRef.current = new DotLottie({
      canvas: canvasRef.current,
      autoplay,
      loop,
      src,
      renderConfig: {
        autoResize: true,
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      },
      backgroundColor,
      speed,
      segment,
      layout: {
        fit: 'contain',
        align: [0.5, 0.5]
      }
    });

    // Cleanup on unmount
    return () => {
      if (dotLottieRef.current) {
        dotLottieRef.current.destroy();
      }
    };
  }, [src, autoplay, loop, speed, backgroundColor, segment]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ width, height }}
    />
  );
}