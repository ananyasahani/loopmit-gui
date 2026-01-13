import React, { useEffect, useRef } from 'react';
import { useESP } from '../context/ESPContext'; // Adjust path accordingly

const ECGMonitor = () => {
  const { sensorData } = useESP();
  const canvasRef = useRef(null);
  
  // Internal refs to manage animation state without re-rendering
  const dataPoints = useRef(new Array(600).fill(0)); 
  const pulseQueue = useRef([]);
  const lastHeartbeatCount = useRef(sensorData.heartbeat_count);

  // A realistic PQRST heartbeat waveform
  const PQRST_WAVE = [
    0, 0.02, 0.05, 0.02, 0,             // P Wave
    -0.05, 0.1, 0.8, -0.2, -0.05, 0,    // QRS Complex (The Spike)
    0, 0.05, 0.1, 0.15, 0.1, 0.05, 0,   // T Wave
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0        // Baseline padding
  ];

  // 1. Detect heartbeat_count change to trigger pulse
  useEffect(() => {
    if (sensorData.heartbeat_count !== lastHeartbeatCount.current) {
      // Trigger a new pulse sequence
      pulseQueue.current.push(...PQRST_WAVE);
      lastHeartbeatCount.current = sensorData.heartbeat_count;
    }
  }, [sensorData.heartbeat_count]);

  // 2. Continuous Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Get next value from queue or stay at baseline (0)
      const nextValue = pulseQueue.current.length > 0 
        ? pulseQueue.current.shift() 
        : 0;

      // Scroll the data
      dataPoints.current.push(nextValue);
      if (dataPoints.current.length > canvas.width) {
        dataPoints.current.shift();
      }

      // Draw everything
      draw(ctx, canvas);
      animationFrameId = requestAnimationFrame(render);
    };

    const draw = (ctx, canvas) => {
      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Medical Grid
      ctx.strokeStyle = '#002200';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // ECG Line
      ctx.strokeStyle = '#33ff33';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#33ff33';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      const centerY = canvas.height / 2;
      const amplitude = 80;

      dataPoints.current.forEach((val, i) => {
        const x = i;
        const y = centerY - (val * amplitude);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div style={{ 
      position: 'relative', 
      background: '#000', 
      padding: '10px', 
      borderRadius: '8px', 
      display: 'inline-block',
      overflow: 'hidden' 
    }}>
      {/* Top-Left Stats Overlay */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        color: '#33ff33',
        fontFamily: 'monospace',
        fontSize: '14px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #004400',
        zIndex: 10,
        pointerEvents: 'none' // Allow clicks to pass through to canvas if needed
      }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #004400', marginBottom: '4px' }}>
          HEART RATE MONITOR
        </div>
        <div>COUNT: {sensorData.heartbeat_count}</div>
        <div>LAST: {sensorData.last_heartbeat_ms}ms</div>
        <div style={{ color: sensorData.heartbeat_health === 1 ? '#33ff33' : '#ff3333' }}>
          HEALTH: {sensorData.heartbeat_health === 1 ? 'OPTIMAL' : 'CHECK SENSOR'}
        </div>
      </div>

      {/* The Monitor Canvas */}
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={250} 
        style={{ display: 'block' }}
      />
    </div>
  );
};

export default ECGMonitor;