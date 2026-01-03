import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useESP } from '../context/ESPContext';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import React from 'react';

// Colors for each sensor
const SENSOR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b']; // Blue, Red, Green, Orange

export function TemperatureChart() {
  const { temperatureHistories, isConnected, sensorData } = useESP();
  const [visibleSensors, setVisibleSensors] = useState<boolean[]>([true, true, true, true]);

  // Merge all histories into chart data format, aligned by index (assuming synchronized updates)
  const chartData = useMemo(() => {
    const maxLength = Math.max(...temperatureHistories.map(h => h.length), 0);
    if (maxLength === 0) return [];

    const data: Array<{ time: string; [key: string]: string | number }> = [];

    for (let i = 0; i < maxLength; i++) {
      const point: { time: string; [key: string]: string | number } = {
        time: `${i}s`,
      };

      temperatureHistories.forEach((history, sensorIndex) => {
        if (history[i] !== undefined) {
          point[`temp${sensorIndex + 1}`] = history[i].value;
        }
      });

      // Only add point if at least one sensor has data
      if (Object.keys(point).length > 1) {
        data.push(point);
      }
    }

    return data;
  }, [temperatureHistories]);

  const toggleSensor = (index: number) => {
    setVisibleSensors(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  // Get current temperature values
  const currentTemps = sensorData.temperatures || [0, 0, 0, 0];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground">Temperature Monitoring</h3>
        {!isConnected && (
          <div className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
            Offline
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
            }}
          />
          {temperatureHistories.map((history, index) => {
            if (!visibleSensors[index]) return null;
            return (
              <Line
                key={`sensor-${index}`}
                type="monotone"
                dataKey={`temp${index + 1}`}
                stroke={SENSOR_COLORS[index]}
                strokeWidth={2}
                dot={false}
                name={`Sensor ${index + 1}`}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Sensor Selection Checkboxes */}
      <div className="mt-4 border-t border-border pt-4">
        <Label className="text-sm text-muted-foreground mb-3 block">Select Sensors to Display:</Label>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="flex items-center space-x-2">
              <Checkbox
                id={`sensor-${index}`}
                checked={visibleSensors[index]}
                onCheckedChange={() => toggleSensor(index)}
              />
              <Label
                htmlFor={`sensor-${index}`}
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: SENSOR_COLORS[index] }}
                />
                <span>Sensor {index + 1}</span>
                <span className="text-muted-foreground">
                  ({currentTemps[index]?.toFixed(1) ?? '0.0'}°C)
                </span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 bg-muted/50 rounded text-center text-xs text-muted-foreground">
          Connect to ESP8266 to see live temperature data
        </div>
      )}
    </div>
  );
}