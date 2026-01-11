import { Battery, Gauge, Move, Compass } from 'lucide-react';
import { useESP } from '../context/ESPContext';
import React from 'react';

export function SensorMetrics() {
  const { sensorData, isConnected } = useESP();

  const metrics = [
    {
      label: 'Voltage',
      value: `${sensorData.voltage.toFixed(2)}V`,
      icon: <Battery className="size-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Gap Height',
      value: `${sensorData.gapHeight.toFixed(1)}mm`,
      icon: <Gauge className="size-6" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Acceleration',
      value: `${sensorData.acceleration.x.toFixed(0)}m/s²`,
      icon: <Move className="size-6" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Orientation',
      value: `X:${sensorData.orientation.x.toFixed(0)}° Y:${sensorData.orientation.y.toFixed(0)}° Z:${sensorData.orientation.z.toFixed(0)}°`,
      icon: <Compass className="size-6" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg ${metric.bgColor}`}>
              <div className={metric.color}>{metric.icon}</div>
            </div>
            {!isConnected && (
              <div className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
                Offline
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-semibold text-foreground">{metric.value}</div>
            <div className="text-sm text-muted-foreground">{metric.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}