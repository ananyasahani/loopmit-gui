import React from 'react';
import { useESP } from '../context/ESPContext';

interface SensorData {
  gapHeight: number;
  gapHeight2: number;
  objectTemp: number;
  temperatures: number[];
  voltage: number;
  orientation: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number; magnitude: number };
  calibration: { gyro: number; sys: number; magneto: number };
  bno_health: number;
  icg_health: number;
  voltage_health: number;
  temp4_health: number;
  lidar_health: number;
  lidar2_health: number;
  temp2_health: number;
  slave4_voltage: number;
  slave4_voltage_health: number;
  slave4_pressure: number;
  slave4_pressure_health: number;
  master_voltage: number;
  master_voltage_health: number;
  wiring_health: number;
  heartbeat_health: number;
  safety_heartbeat_health: number;
  heartbeat_count: number;
  last_heartbeat_ms: number;
  emergency_reason_mask: number;
}

const calculateOverallHealth = (data: SensorData | null): number => {
  if (!data) {
    return 0;
  }

  const healthWeights = {
    bno_health: 6,
    icg_health: 6,
    voltage_health: 10,
    temp4_health: 8,
    lidar_health: 7,
    lidar2_health: 7,
    temp2_health: 8,
    slave4_voltage_health: 8,
    slave4_pressure_health: 10,
    master_voltage_health: 8,
    safety_heartbeat_health: 10,
  };

  const criticalSystems = [
    'voltage_health',
    'slave4_pressure_health',
    'safety_heartbeat_health',
  ];

  const hasCriticalFailure = criticalSystems.some(
    key => data[key as keyof SensorData] === 0
  );

  if (hasCriticalFailure) {
    return 0;
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  Object.entries(healthWeights).forEach(([key, weight]) => {
    const healthValue = data[key as keyof SensorData] as number;
    totalWeightedScore += healthValue * weight;
    totalWeight += weight;
  });

  const weightedAverage = totalWeightedScore / totalWeight;
  return (weightedAverage / 2) * 100;
};

const getGradientColor = (percentage: number): string => {
  // Smooth gradient from red to yellow to green
  if (percentage <= 50) {
    // Red to Yellow (0-50%)
    const ratio = percentage / 50;
    const r = 239;
    const g = Math.round(68 + (171 * ratio)); // 68 to 239
    const b = 68;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Yellow to Green (50-100%)
    const ratio = (percentage - 50) / 50;
    const r = Math.round(239 - (205 * ratio)); // 239 to 34
    const g = 239 - Math.round(44 * ratio); // 239 to 197
    const b = 68 + Math.round(26 * ratio); // 68 to 94
    return `rgb(${r}, ${g}, ${b})`;
  }
};

const HealthSlider = () => {
  const SensorData  = useESP();

  const healthPercentage = calculateOverallHealth(SensorData)
  const gradientColor = getGradientColor(healthPercentage);

  const getStatusText = (percentage: number): string => {
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 50) return 'Good';
    if (percentage >= 25) return 'Degraded';
    return 'Critical';
  };

  if (!SensorData) {
    return (
      <div className="w-full p-6 bg-gray-900 rounded-lg shadow-xl">
        <p className="text-white">No sensor data available</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-black rounded-lg shadow-xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-white">System Health</h2>
          <span 
            className="px-3 py-1 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: gradientColor }}
          >
            {getStatusText(healthPercentage)}
          </span>
        </div>
        <p className="text-3xl font-bold text-white mb-4">
          {healthPercentage.toFixed(1)}%
        </p>
      </div>

      {/* Slider Track */}
      <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden shadow-inner">
        {/* Filled portion with gradient */}
        <div
          className="absolute left-0 top-0 h-full transition-all duration-500 ease-out"
          style={{
            width: `${healthPercentage}%`,
            background: `linear-gradient(to right, 
              rgb(239, 68, 68) 0%, 
              rgb(234, 179, 8) 50%, 
              rgb(34, 197, 94) 100%)`,
            backgroundSize: `${100 / (healthPercentage || 1) * 100}% 100%`,
            backgroundPosition: 'left center',
          }}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
        </div>

        {/* Slider thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-3 border-white shadow-lg transition-all duration-500 ease-out"
          style={{
            left: `calc(${healthPercentage}% - 10px)`,
            backgroundColor: gradientColor,
          }}
        ></div>
      </div>

      {/* Percentage markers */}
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span className="text-gray-400">Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500"></div>
          <span className="text-gray-400">Degraded</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span className="text-gray-400">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-gray-400">Excellent</span>
        </div>
      </div>
    </div>
  );
};

export default HealthSlider;