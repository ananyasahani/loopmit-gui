import { TemperatureChart } from '../components/TemperatureChart';
import { SensorMetrics } from '../components/SensorMetrics';
import { IMUCalibration } from '../components/IMUCalibration';
import { ConnectionControl } from '../components/ConnectionControl';
import { useESP } from '../context/ESPContext';
import React from 'react';
import { Error_log } from '../components/error_log';
import Pod from '../components/pod';
import Pod2 from '../components/pod2';

export function Dashboard() {
  const { isConnected } = useESP();

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Main Content with top padding to account for fixed header */}
      <div className="pt-32 px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <ConnectionControl />
          <Error_log />
          <SensorMetrics />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TemperatureChart />
            <IMUCalibration />
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="mb-4 text-foreground">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Pod Status</div>
                <div className="flex items-center gap-2">
                  <div className={`size-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-foreground">{isConnected ? 'Operational' : 'Disconnected'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Connection</div>
                <div className="flex items-center gap-2">
                  <div className={`size-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-foreground">{isConnected ? 'Connected' : 'Offline'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Data Rate</div>
                <div className="text-foreground">{isConnected ? '100 Hz' : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}