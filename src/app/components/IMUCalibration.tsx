import { Check } from 'lucide-react';
import { useESP } from '../context/ESPContext';
import React from 'react';

export function IMUCalibration() {
  const { sensorData, isConnected } = useESP();

  // Calibration levels: 0 = not calibrated, 1-2 = partially, 3 = fully calibrated
  const isCalibrated = (level: number) => level === 3;

  const calibrationData = [
    {
      name: 'System',
      x: isCalibrated(sensorData.calibration.sys),
      y: isCalibrated(sensorData.calibration.sys),
      z: isCalibrated(sensorData.calibration.sys),
      level: sensorData.calibration.sys,
    },
    {
      name: 'Gyro',
      x: isCalibrated(sensorData.calibration.gyro),
      y: isCalibrated(sensorData.calibration.gyro),
      z: isCalibrated(sensorData.calibration.gyro),
      level: sensorData.calibration.gyro,
    },
    {
      name: 'Magneto',
      x: isCalibrated(sensorData.calibration.magneto),
      y: isCalibrated(sensorData.calibration.magneto),
      z: isCalibrated(sensorData.calibration.magneto),
      level: sensorData.calibration.magneto,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground">IMU Calibration Status</h3>
        {!isConnected && (
          <div className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
            Offline
          </div>
        )}
      </div>
      <div className="space-y-4">
        {calibrationData.map((axis) => (
          <div key={axis.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{axis.name}</span>
              <span className="text-xs text-muted-foreground">Level: {axis.level}/3</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['X', 'Y', 'Z'].map((label, idx) => {
                const isAxisCalibrated = idx === 0 ? axis.x : idx === 1 ? axis.y : axis.z;
                return (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-3 py-2 rounded border ${
                      isAxisCalibrated
                        ? 'bg-green-500/10 border-green-500/50 text-green-500'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    <span className="text-sm">{label}-axis</span>
                    {isAxisCalibrated && <Check className="size-4" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {!isConnected && (
        <div className="mt-4 p-3 bg-muted/50 rounded text-center text-xs text-muted-foreground">
          Connect to ESP8266 to see calibration status
        </div>
      )}
    </div>
  );
}