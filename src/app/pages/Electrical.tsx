import React from 'react';
export function Electrical() {
  return (
    <div className="min-h-screen bg-background p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-foreground mb-2">Electrical Subsystem</h1>
          <p className="text-muted-foreground">
            Power distribution, battery management, and electrical control systems
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-foreground">Overview</h3>
          <p className="text-muted-foreground leading-relaxed">
            The electrical subsystem is responsible for managing the power distribution throughout the hyperloop pod.
            It includes high-voltage battery packs, power converters, and a sophisticated battery management system (BMS)
            that monitors cell temperatures, voltage levels, and current draw in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Key Components</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Lithium-ion battery pack (48V, 20Ah)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Battery Management System (BMS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>DC-DC converters for voltage regulation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Circuit protection and fuses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Power distribution board</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Specifications</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Total Power</span>
                <span className="text-foreground">960W</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Nominal Voltage</span>
                <span className="text-foreground">48V DC</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Max Current</span>
                <span className="text-foreground">20A</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Efficiency</span>
                <span className="text-foreground">95%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Weight</span>
                <span className="text-foreground">12 kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-foreground mb-3">Safety Features</h4>
          <p className="text-muted-foreground leading-relaxed">
            The electrical subsystem incorporates multiple layers of safety protection, including overcurrent protection,
            thermal monitoring, and emergency shutdown capabilities. The BMS constantly monitors individual cell voltages
            to prevent overcharging or deep discharge, ensuring maximum battery lifespan and safe operation.
          </p>
        </div>
      </div>
    </div>
  );
}
