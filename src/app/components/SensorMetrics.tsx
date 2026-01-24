import { Battery, Gauge, Move, Compass, Thermometer, ThermometerIcon } from 'lucide-react';
import { useESP } from '../context/ESPContext';
import React from 'react';

export function SensorMetrics() {
  const { sensorData, isConnected } = useESP();

  const metrics = [
    {
      //slave3
      label: 'Voltage (5V) slave 4',
      value: sensorData.voltage3,
      displayValue: `${sensorData.voltage3.toFixed(2)}V`,
      icon: <Battery className="size-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      sliderColor: 'bg-blue-500',
      min: 0,
      max: 6,
    },
    {
      //safety
      label: 'Master Voltage (5V) slave 2',
      value: sensorData.voltage1,
      displayValue: `${sensorData.voltage1.toFixed(2)}V`,
      icon: <Battery className="size-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      sliderColor: 'bg-blue-500',
      min: 0,
      max: 6,
    },
    {
      // slave2
      label: 'LV Battery (24V) slave 3',
      value: sensorData.voltage2,
      displayValue: `${sensorData.voltage2.toFixed(2)}V`,
      icon: <Battery className="size-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      sliderColor: 'bg-blue-500',
      min: 0,
      max: 30,
    },
  
    
    {
      label: 'LV Battery (15V)',
      value: sensorData.voltage3,
      displayValue: `${sensorData.voltage3.toFixed(2)}V`,
      icon: <Battery className="size-6" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      sliderColor: 'bg-blue-500',
      min: 0,
      max: 20,
    },
    {
      label: 'Gap Height (#slave 2)',
      value: sensorData.gap_height,
      displayValue: `${sensorData.gap_height.toFixed(1)}mm`,
      icon: <Gauge className="size-6" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      sliderColor: 'bg-green-500',
      min: 3,
      max: 7,
    },
    {
      label: 'Gap Height (#slave 3)',
      value: sensorData.gap_height2,
      displayValue: `${sensorData.gap_height2.toFixed(1)}mm`,
      icon: <Gauge className="size-6" />,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      sliderColor: 'bg-green-500',
      min: 3,
      max: 7,
    },
    {
      label: 'Acceleration',
      value: sensorData.acceleration.x,
      displayValue: `${sensorData.acceleration.x.toFixed(3)}m/s²`,
      icon: <Move className="size-6" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      sliderColor: 'bg-yellow-500',
      min: 0,
      max: 5,
    },
    {
      label: 'Orientation',
      value: Math.max(Math.abs(sensorData.orientation.x), Math.abs(sensorData.orientation.y), Math.abs(sensorData.orientation.z)),
      displayValue: `X:${sensorData.orientation.x.toFixed(0)}° Y:${sensorData.orientation.y.toFixed(0)}° Z:${sensorData.orientation.z.toFixed(0)}°`,
      icon: <Compass className="size-6" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      sliderColor: 'bg-purple-500',
      min: 0,
      max: 7,
    },
    {
      label: 'Temperature (#slave2)',
      value: sensorData.temperatures[0],
      displayValue: `${sensorData.temperatures[0].toFixed(3)}`,
      icon: <Thermometer className="size-6" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      sliderColor: 'bg-yellow-500',
      min: 0,
      max: 120,
    },
    {
      label: 'Temperature (#slave3)',
      value: sensorData.temperatures[1],
      displayValue: `${sensorData.temperatures[1].toFixed(3)}`,
      icon: <Thermometer className="size-6" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      sliderColor: 'bg-yellow-500',
      min: 0,
      max: 120,
    },
    {
      label: 'Temperature (#slave4)',
      value: sensorData.temperatures[2],
      displayValue: `${sensorData.temperatures[2].toFixed(3)}`,
      icon: <Thermometer className="size-6" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      sliderColor: 'bg-yellow-500',
      min: 0,
      max: 120,
    },
    
    {
      label: 'Pressure sensor from slave 4',
      value: sensorData.pressure,
      displayValue: `${sensorData.pressure.toFixed(1)}bar`,
      icon: <Gauge className="size-6" />,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      sliderColor: 'bg-orange-500',
      min: 0,
      max: 8,
    },
  ];

  const calculatePercentage = (value: number, min: number, max: number) => {
    const clamped = Math.max(min, Math.min(max, value));
    return ((clamped - min) / (max - min)) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const percentage = calculatePercentage(metric.value, metric.min, metric.max);
        
        return (
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
            <div className="space-y-3">
              <div className="text-2xl font-semibold text-foreground">{metric.displayValue}</div>
              <div className=" text-md text-muted-foreground">{metric.label}</div>
              
              {/* Slider */}
              <div className="space-y-1">
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full ${metric.sliderColor} transition-all duration-300 ease-out`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{metric.min}</span>
                  <span>{metric.max}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}