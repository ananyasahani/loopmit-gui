import { TemperatureChart } from '../components/TemperatureChart';
import { SensorMetrics } from '../components/SensorMetrics';
import { IMUCalibration } from '../components/IMUCalibration';
import { ConnectionControl } from '../components/ConnectionControl';
import { useESP } from '../context/ESPContext';
import React from 'react';
import { StopBtn } from '../components/stopbtn';
import { Error_log } from '../components/error_log';
import DataStream from '../components/datastream';
import { HealthScore } from '../components/health';
import { ControlBoard } from '../components/ControlBoard';
import LottiePlayer from '../components/dial';
import HealthSlider from '../components/overallhealth'


export function Dashboard() {
  const { isConnected } = useESP();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-foreground mb-2">loopMIT Control Center</h1>
            <p className="text-muted-foreground">
              Real-time sensor telemetry and system monitoring for hyperloop pod prototype
            </p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-[#39C3EF] hover:bg-[#39C3EF]/90 text-black transition font-medium duration-200 h-10 rounded-lg px-6 flex items-center justify-center gap-2"
            style={{
              boxShadow:
                "0px -1px 0px 0px #ffffff40 inset, 0px 1px 0px 0px #ffffff40 inset",
            }}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>

        <ConnectionControl />
        <StopBtn />
        <HealthSlider/>
        <Error_log />
        <ControlBoard />
        <SensorMetrics />
        <TemperatureChart />
        <HealthScore/>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IMUCalibration />
        </div>
        {/* <Pod/> */}
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
              <div className="text-foreground">{isConnected ? '10 Hz' : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}