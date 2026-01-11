import React from 'react';
export function Mechanical() {
  return (
    <div className="min-h-screen bg-background p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-foreground mb-2">Mechanical Subsystem</h1>
          <p className="text-muted-foreground">
            
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-foreground">Overview</h3>
          <p className="text-muted-foreground leading-relaxed">
            The mechanical subsystem forms the structural foundation of the hyperloop pod. It includes the chassis,
            mounting systems for all subsystems, and the mechanical interface with the track. The design prioritizes
            lightweight construction while maintaining structural integrity to withstand high-speed operation and
            magnetic levitation forces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Key Components</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Aluminum alloy chassis (6061-T6)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Carbon fiber composite panels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Suspension mounting points</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Sensor mounting brackets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Aerodynamic nose cone</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Specifications</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Overall Length</span>
                <span className="text-foreground">2.4 m</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Width</span>
                <span className="text-foreground">0.8 m</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Height</span>
                <span className="text-foreground">0.6 m</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Total Weight</span>
                <span className="text-foreground">45 kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Material Strength</span>
                <span className="text-foreground">276 MPa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-foreground mb-3">Design Philosophy</h4>
          <p className="text-muted-foreground leading-relaxed">
            The mechanical design follows a modular approach, allowing easy access to all subsystems for maintenance
            and testing. The chassis uses a combination of aluminum extrusions and carbon fiber reinforced panels to
            achieve an optimal strength-to-weight ratio. FEA (Finite Element Analysis) simulations have verified the
            structural integrity under expected operational loads and impact scenarios.
          </p>
        </div>
      </div>
    </div>
  );
}
