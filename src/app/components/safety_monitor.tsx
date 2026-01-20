import React from 'react';
import { useESP } from '../context/ESPContext';
import { AlertTriangle, Heart, Zap } from 'lucide-react';

interface SafetyData {
  wiring_health: number;
  heartbeat_health: number;
  safety_heartbeat_health: number;
  heartbeat_count: number;
  last_heartbeat_ms: number;
}

const getHealthColor = (health: number): string => {
  if (health >= 75) return 'text-green-500';
  if (health >= 50) return 'text-yellow-500';
  if (health >= 25) return 'text-orange-500';
  return 'text-red-500';
};

const getHealthBgColor = (health: number): string => {
  if (health >= 75) return 'bg-green-500/10';
  if (health >= 50) return 'bg-yellow-500/10';
  if (health >= 25) return 'bg-orange-500/10';
  return 'bg-red-500/10';
};

const SafetyMonitor: React.FC = () => {
  const { sensorData } = useESP();

  if (!sensorData) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground">No safety data available</p>
      </div>
    );
  }

  const safetyData: SafetyData = {
    wiring_health: sensorData.wiring_health || 0,
    heartbeat_health: sensorData.safety_heartbeat_health || 0,
    safety_heartbeat_health: sensorData.safety_heartbeat_health || 0,
    heartbeat_count: sensorData.heartbeat_count || 0,
    last_heartbeat_ms: sensorData.last_heartbeat_ms || 0,
  };

  const isCritical = safetyData.safety_heartbeat_health === 0 || safetyData.wiring_health === 0;

  return (
    <div className={`bg-card border border-border rounded-lg p-6 min-h-[400px] ${isCritical ? 'border-red-500' : ''}`}>
      <div className="flex items-center gap-2 mb-6">
        {isCritical && <AlertTriangle className="size-5 text-red-500 animate-pulse" />}
        <h3 className="text-lg font-semibold text-foreground">Safety Monitor</h3>
      </div>

      <div className="space-y-4">
        {/* Wiring Health */}
        <div className={`p-4 rounded-lg ${getHealthBgColor(safetyData.wiring_health)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className={`size-4 ${getHealthColor(safetyData.wiring_health)}`} />
              <span className="text-sm font-medium text-muted-foreground">Wiring Health</span>
            </div>
            <span className={`text-lg font-bold ${getHealthColor(safetyData.wiring_health)}`}>
              {safetyData.wiring_health.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${safetyData.wiring_health >= 75 ? 'bg-green-500' : safetyData.wiring_health >= 50 ? 'bg-yellow-500' : safetyData.wiring_health >= 25 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${safetyData.wiring_health}%` }}
            />
          </div>
        </div>

        {/* Safety Heartbeat Health */}
        <div className={`p-4 rounded-lg ${getHealthBgColor(safetyData.safety_heartbeat_health)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className={`size-4 ${getHealthColor(safetyData.safety_heartbeat_health)}`} />
              <span className="text-sm font-medium text-muted-foreground">Safety Heartbeat</span>
            </div>
            <span className={`text-lg font-bold ${getHealthColor(safetyData.safety_heartbeat_health)}`}>
              {safetyData.safety_heartbeat_health.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${safetyData.safety_heartbeat_health >= 75 ? 'bg-green-500' : safetyData.safety_heartbeat_health >= 50 ? 'bg-yellow-500' : safetyData.safety_heartbeat_health >= 25 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${safetyData.safety_heartbeat_health}%` }}
            />
          </div>
        </div>

        {/* Heartbeat Health */}
        <div className={`p-4 rounded-lg ${getHealthBgColor(safetyData.heartbeat_health)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className={`size-4 ${getHealthColor(safetyData.heartbeat_health)}`} />
              <span className="text-sm font-medium text-muted-foreground">Heartbeat</span>
            </div>
            <span className={`text-lg font-bold ${getHealthColor(safetyData.heartbeat_health)}`}>
              {safetyData.heartbeat_health.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${safetyData.heartbeat_health >= 75 ? 'bg-green-500' : safetyData.heartbeat_health >= 50 ? 'bg-yellow-500' : safetyData.heartbeat_health >= 25 ? 'bg-orange-500' : 'bg-red-500'}`}
              style={{ width: `${safetyData.heartbeat_health}%` }}
            />
          </div>
        </div>

        {/* Heartbeat Count */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Heartbeat Count</span>
            <span className="text-lg font-bold text-foreground">{safetyData.heartbeat_count}</span>
          </div>
        </div>

        {/* Last Heartbeat */}
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Last Heartbeat</span>
            <span className="text-lg font-bold text-foreground">{safetyData.last_heartbeat_ms}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyMonitor;