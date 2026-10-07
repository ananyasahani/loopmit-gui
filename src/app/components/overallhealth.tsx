import React from 'react';
import { useESP } from '../context/ESPContext';

interface SensorData {
  // IMU - Orientation
  orientation: { x: number; y: number; z: number };
  object_temp: number;
  calibration: { gyro: number; sys: number; magneto: number };
  
  // IMU - Acceleration
  acceleration: { x: number; y: number; z: number; magnitude: number };
  
  // IMU Health
  bno_health: number;
  icg_health: number;
  
  // LIDAR
  gap_height: number;
  lidar_health: number;
  gap_height2: number;
  lidar2_health: number;
  
  temperatures: number[];
  temp1_health: number;
  temp2_health: number;
  temp3_health: number;
  
  // Voltages
  voltage1: number;
  voltage1_health: number;
  voltage2: number;
  voltage2_health: number;
  voltage3: number;
  voltage3_health: number;
  
  // Pressure
  pressure: number;
  pressure_health: number;
  
  // System State
  emergency_reason_mask: number;
  
  // Safety ESP
  wiring_health: number;
  heartbeat_count: number;
  last_heartbeat_ms: number;
  
  // Safety & Heartbeat
  safety_heartbeat_health: number;
  safety_hb_last_time: number;
  timestamp: number;
  safety_heartbeat_count: number;
}

const calculateOverallHealth = (data: SensorData | null): number => {
  if (!data) {
    return 0;
  }

  // Updated health weights matching the actual SensorData interface
  const healthWeights = {
    bno_health: 6,
    icg_health: 6,
    lidar_health: 7,
    lidar2_health: 7,
    temp1_health: 8,
    temp2_health: 8,
    temp3_health: 8,
    voltage1_health: 10,
    voltage2_health: 8,
    voltage3_health: 8,
    pressure_health: 10,
    wiring_health: 9,
    safety_heartbeat_health: 10,
  };

  // Critical systems that will cause overall health to be 0 if they fail
  const criticalSystems = [
    'voltage1_health',
    'pressure_health',
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
    // Only add to calculation if the value exists and is a valid number
    if (healthValue !== undefined && !isNaN(healthValue)) {
      totalWeightedScore += healthValue * weight;
      totalWeight += weight;
    }
  });

  // Prevent division by zero
  if (totalWeight === 0) {
    return 0;
  }

  const weightedAverage = (totalWeightedScore/2 )/ totalWeight;
  
  // Health values are 0 or 1, so multiply by 100 to get percentage
  return weightedAverage * 100;
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
  // ✅ FIX: Get sensorData from the context
  const { sensorData } = useESP();

  const healthPercentage = calculateOverallHealth(sensorData);
  const gradientColor = getGradientColor(healthPercentage);

  const getStatusText = (percentage: number): string => {
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 50) return 'Good';
    if (percentage >= 25) return 'Degraded';
    return 'Critical';
  };

  if (!sensorData) {
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
      
      {/* Debug info - Remove this after testing */}
      {/* <div className="mt-4 p-2 bg-gray-800 rounded text-xs text-gray-300">
        <div>BNO: {sensorData.bno_health}</div>
        <div>ICG: {sensorData.icg_health}</div>
        <div>LIDAR1: {sensorData.lidar_health}</div>
        <div>LIDAR2: {sensorData.lidar2_health}</div>
        <div>Voltage1: {sensorData.voltage1_health}</div>
        <div>Pressure: {sensorData.pressure_health}</div>
        <div>Wiring: {sensorData.wiring_health}</div>
        <div>Safety HB: {sensorData.safety_heartbeat_health}</div>
      </div> */}
    </div>
  );
};

export default HealthSlider;