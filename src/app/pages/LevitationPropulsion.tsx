import React from 'react';
export function LevitationPropulsion() {
  return (
    <div className="min-h-screen bg-background p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-foreground mb-2">Levitation & Propulsion Subsystem</h1>
          <p className="text-muted-foreground">
           
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-foreground">Overview</h3>
          <p className="text-muted-foreground leading-relaxed">
            The levitation and propulsion subsystem is the heart of the hyperloop pod's operation. It uses electromagnetic
            principles to levitate the pod above the track, eliminating friction and enabling high-speed travel. The system
            combines passive magnetic levitation with active control to maintain stable hover height and provide propulsion
            force.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Levitation System</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Halbach array permanent magnets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Electromagnetic stabilization coils</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Gap height sensors (4x)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Active feedback control system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Emergency mechanical wheels</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Propulsion System</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Linear induction motor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Variable frequency drive (VFD)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Regenerative braking system</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Speed control algorithms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Emergency friction brakes</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Performance Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Levitation Height</span>
                <span className="text-foreground">8-10 mm</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Max Speed</span>
                <span className="text-foreground">120 m/s</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Acceleration</span>
                <span className="text-foreground">2.5 g</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Power Draw</span>
                <span className="text-foreground">500W</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Efficiency</span>
                <span className="text-foreground">92%</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-foreground mb-3">Control System</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Control Loop Rate</span>
                <span className="text-foreground">1 kHz</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Gap Sensor Resolution</span>
                <span className="text-foreground">0.1 mm</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Response Time</span>
                <span className="text-foreground">&lt;5 ms</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-muted-foreground">Stability Range</span>
                <span className="text-foreground">±2 mm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Controller Type</span>
                <span className="text-foreground">PID</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h4 className="text-foreground mb-3">Innovation Highlights</h4>
          <p className="text-muted-foreground leading-relaxed">
            Our team has developed a novel hybrid levitation approach that combines the efficiency of passive magnetic
            levitation with the precision of active electromagnetic control. This allows for stable levitation with
            minimal power consumption while maintaining the ability to quickly respond to track irregularities. The
            propulsion system utilizes regenerative braking to recover energy during deceleration, improving overall
            system efficiency and extending operational range.
          </p>
        </div>
      </div>
    </div>
  );
}
