import { Activity, Cpu, Battery, Thermometer, Radio } from 'lucide-react';
import { useESP } from '../context/ESPContext';
import React from 'react';

export function HealthScore() {
  const { sensorData, isConnected } = useESP();

  const getHealthStatus = (healthValue: number) => {
    if (healthValue === 0) {
      return {
        status: 'Failed',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/50',
        dotColor: 'bg-destructive',
      };
    } else if (healthValue === 1) {
      return {
        status: 'Degraded',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/50',
        dotColor: 'bg-orange-500',
      };
    } else {
      return {
        status: 'Health OK',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/50',
        dotColor: 'bg-green-500',
      };
    }
  };

  const healthMetrics = [
    {
      label: 'BNO Health',
      value: sensorData.bno_health,
      icon: <Activity className="size-5" />,
      description: 'BNO055 Sensor Health',
    },
    {
      label: 'ICG Health',
      value: sensorData.icg_health,
      icon: <Cpu className="size-5" />,
      description: 'ICG IMU Sensor Health',
    },
    {
      label: 'Voltage Health',
      value: sensorData.voltage_health,
      icon: <Battery className="size-5" />,
      description: 'Power System Health',
    },
    {
      label: 'Temperature Health',
      value: sensorData.temp_health,
      icon: <Thermometer className="size-5" />,
      description: 'Temperature Sensor Health',
    },
    {
      label: 'LiDAR Health',
      value: sensorData.lidar_health,
      icon: <Radio className="size-5" />,
      description: 'LiDAR Sensor Health',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">System Health Status</h3>
        {!isConnected && (
          <div className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
            Offline
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthMetrics.map((metric) => {
          const healthStatus = getHealthStatus(metric.value);

          return (
            <div
              key={metric.label}
              className={`border rounded-lg p-4 transition-all ${healthStatus.borderColor} ${healthStatus.bgColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${healthStatus.bgColor}`}>
                    <div className={healthStatus.color}>{metric.icon}</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{metric.label}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {metric.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2.5 rounded-full ${healthStatus.dotColor} ${
                      isConnected ? 'animate-pulse' : ''
                    }`}
                  />
                  <span className={`text-sm font-semibold ${healthStatus.color}`}>
                    {healthStatus.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  Code: {metric.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 bg-muted/50 rounded text-center text-xs text-muted-foreground">
          Connect to ESP8266 to see live health status
        </div>
      )}
    </div>
  );
}
