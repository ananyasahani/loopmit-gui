import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useLoader, useFrame } from '@react-three/fiber';
import { useESP } from '../context/ESPContext';
import { useControls } from 'leva';

// Sensor node positions (adjust these to match your pod geometry)
const SENSOR_POSITIONS = {
  temperature: { x: -4, y: 0.5, z: 1.5, label: 'Temperature Sensors' },
  gapHeight: { x: -3, y: -0.5, z: 1.5, label: 'Gap Height Sensor' },
  voltage: { x: -5, y: 0, z: 0.5, label: 'Voltage Monitor' },
  imu: { x: -4.5, y: 0, z: 2, label: 'IMU Sensor' }
};

function SensorNode({ position, isActive, data, label, description, onHover, showPanel }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const hoverTimeoutRef = useRef(null);

  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.08);
    }
  });

  const handlePointerOver = (e) => {
    e.stopPropagation();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHovered(true);
    onHover({ label, description, data, isActive });
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false);
      onHover(null);
      document.body.style.cursor = 'auto';
    }, 50);
  };

  // Only show hover card when panel is closed AND node is hovered
  const shouldShowCard = hovered && !showPanel;

  return (
    <group>
      {/* Outer border ring - visible */}
      <mesh position={[position.x, position.y, position.z]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={isActive ? '#22c55e' : '#ef4444'}
          transparent
          opacity={0.4}
          wireframe={false}
        />
      </mesh>
      
      {/* Main sensor sphere - visible and solid */}
      <mesh
        ref={meshRef}
        position={[position.x, position.y, position.z]}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={isActive ? '#22c55e' : '#ef4444'}
          emissive={isActive ? '#22c55e' : '#ef4444'}
          emissiveIntensity={0.6}
          transparent={false}
        />
      </mesh>

      {/* Invisible larger hover sphere */}
      <mesh
        position={[position.x, position.y, position.z]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          transparent
          opacity={0}
        />
      </mesh>
      
      {/* Show floating card ONLY when panel is closed AND hovered */}
      {shouldShowCard && (
        <Html 
          distanceFactor={8} 
          position={[position.x, position.y + 0.5, position.z]} 
          style={{ pointerEvents: 'none' }}
        >
          <div 
            className={`bg-card/95 backdrop-blur-sm border-2 rounded-lg p-4 shadow-lg w-[280px] ${
              isActive ? 'border-green-500' : 'border-red-500'
            }`}
            style={{ 
              pointerEvents: 'none',
              animation: 'float 3s ease-in-out infinite',
            }}
          >
            <style>{`
              @keyframes float {
                0%, 100% {
                  transform: translateY(0px);
                }
                50% {
                  transform: translateY(-10px);
                }
              }
            `}</style>
            <div className="text-sm font-semibold text-foreground mb-2">{label}</div>
            <div className="text-xs text-muted-foreground mb-3">{description}</div>
            <div className="space-y-1">
              {data}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
function STLModel({ url, scale,}) {
  const geom = useLoader(STLLoader, url);
  
  return (
    <mesh position={[-5.8, 0, 1.5]} rotation={[-1.6, 0, 0]} scale={scale}>
      <primitive object={geom} attach="geometry" />
      <meshStandardMaterial color="0xFFFFFF" metalness={0.6} roughness={0.4} wireframe={true}/>
    </mesh>
  );
}

function Lights() {
  return (
    <>
      <spotLight
        position={[0, 5, 5]}
        intensity={10}
        angle={0.4}
        penumbra={0.5}
        castShadow
      />
      <pointLight position={[-3, 2, -3]} intensity={50} color="0xFFFFFF" />
      <ambientLight intensity={0.3} />
    </>
  );
}

function Scene({ sensorData, onSensorHover}) {
  const hasTemperatureData = sensorData.temperatures && sensorData.temperatures.length > 0;
  const hasGapHeight = sensorData.gapHeight > 0;
  const hasVoltage = sensorData.voltage > 0;
  const hasIMU = sensorData.orientation && (sensorData.orientation.x !== 0 || sensorData.orientation.y !== 0 || sensorData.orientation.z !== 0);
  const [iscontrols,setControls]=useState(true);
  const controls=useControls({
    posx:{value: 1, min: 0, max: 5, step: 0.1},
    posy:{value: 1, min: 0, max: 5, step: 0.1},
    posz:{value: 1, min: 0, max: 5, step: 0.1},

  })
  return (
    <>
    <button onClick={()=>setControls(!iscontrols)}></button>
      <SensorNode
        position={ iscontrols?[controls.posx,controls.posy,controls.posz]:SENSOR_POSITIONS.temperature}
        isActive={hasTemperatureData}
        label={SENSOR_POSITIONS.temperature.label}
        description="Monitors thermal conditions across 4 sensor points"
        onHover={onSensorHover}
        data={
          <div className="text-xs">
            {hasTemperatureData ? (
              sensorData.temperatures.map((temp, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">Sensor {i + 1}:</span>
                  <span className="text-foreground font-mono">{temp.toFixed(1)}°C</span>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No data</div>
            )}
          </div>
        }
      />

      <SensorNode
        position={SENSOR_POSITIONS.gapHeight}
        isActive={hasGapHeight}
        label={SENSOR_POSITIONS.gapHeight.label}
        description="Measures distance from track surface"
        onHover={onSensorHover}
        data={
          <div className="text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Height:</span>
              <span className="text-foreground font-mono">
                {hasGapHeight ? `${sensorData.gapHeight.toFixed(2)} mm` : 'N/A'}
              </span>
            </div>
          </div>
        }
      />

      <SensorNode
        position={SENSOR_POSITIONS.voltage}
        isActive={hasVoltage}
        label={SENSOR_POSITIONS.voltage.label}
        description="Battery and power system status"
        onHover={onSensorHover}
        data={
          <div className="text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Voltage:</span>
              <span className="text-foreground font-mono">
                {hasVoltage ? `${sensorData.voltage.toFixed(2)} V` : 'N/A'}
              </span>
            </div>
          </div>
        }
      />

      <SensorNode
        position={SENSOR_POSITIONS.imu}
        isActive={hasIMU}
        label={SENSOR_POSITIONS.imu.label}
        description="Inertial measurement unit - orientation and acceleration"
        onHover={onSensorHover}
        data={
          <div className="text-xs space-y-2">
            {hasIMU ? (
              <>
                <div>
                  <div className="text-muted-foreground mb-1">Orientation:</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">X:</span>
                    <span className="text-foreground font-mono">{sensorData.orientation.x.toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Y:</span>
                    <span className="text-foreground font-mono">{sensorData.orientation.y.toFixed(2)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Z:</span>
                    <span className="text-foreground font-mono">{sensorData.orientation.z.toFixed(2)}°</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Acceleration:</div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Magnitude:</span>
                    <span className="text-foreground font-mono">{sensorData.acceleration.magnitude.toFixed(2)} m/s²</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No data</div>
            )}
          </div>
        }
      />

      <Lights />
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      <axesHelper args={[10]} />
      <gridHelper args={[20, 20]} />
    </>
  );
}

function CustomLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-foreground font-medium">Connecting to ESP...</div>
          <div className="text-sm text-muted-foreground">Establishing telemetry link</div>
        </div>
      </div>
    </div>
  );
}

function DisconnectedView() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-md">
      <div className="bg-card border border-border rounded-lg p-8 shadow-xl max-w-md">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-500"></div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Pod Disconnected
            </h3>
            <p className="text-muted-foreground">
              Connect to ESP to visualize the hyperloop pod and view real-time sensor data
            </p>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
            Use the Connection Control above to establish a link
          </div>
        </div>
      </div>
    </div>
  );
}

const Pod2 = () => {
  const { isConnected, isConnecting, sensorData } = useESP();
  const [showDataPanel, setShowDataPanel] = useState(false);
  const [hoveredSensor, setHoveredSensor] = useState(null);

  const handleSensorHover = (sensorInfo) => {
    setHoveredSensor(sensorInfo);
  };

  const allSensorsActive = 
    sensorData.temperatures?.length > 0 &&
    sensorData.gapHeight > 0 &&
    sensorData.voltage > 0 &&
    sensorData.orientation && 
    (sensorData.orientation.x !== 0 || sensorData.orientation.y !== 0 || sensorData.orientation.z !== 0);

  return (
    <div className={`relative w-full h-[600px] rounded-lg border-2 overflow-hidden transition-colors ${
      isConnected 
        ? (allSensorsActive ? 'border-green-500 bg-background' : 'border-yellow-500 bg-background')
        : 'border-red-500 bg-background'
    }`}>
      {/* Navbar */}
      {isConnected && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-foreground">Pod Visualization</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${allSensorsActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-xs text-muted-foreground">
                {allSensorsActive ? 'All Systems Nominal' : 'Partial Data'}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowDataPanel(!showDataPanel)}
            className="px-3 py-1.5 text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded border border-primary/30 transition-colors"
          ><button></button>
            {showDataPanel ? 'Hide Panel' : 'Show Panel'}
          </button>
        </div>
      )}

      {/* Side Data Panel */}
      {isConnected && showDataPanel && (
        <div className="absolute top-14 right-4 z-10 w-80 max-h-[calc(100%-5rem)] overflow-y-auto">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl">
            <div className="p-4 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">Sensor Data Monitor</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Hover over sensors for details
              </p>
            </div>
            
            <div className="p-4">
              {hoveredSensor? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${hoveredSensor.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-foreground">{hoveredSensor.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{hoveredSensor.description}</p>
                  <div className="pt-2 border-t border-border">
                    {hoveredSensor.data}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm mb-2">No sensor selected</div>
                  <div className="text-xs">Hover over a sensor node to view data</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isConnecting ? (
        <CustomLoader />
      ) : !isConnected ? (
        <DisconnectedView />
      ) : (
        <Canvas camera={{ position: [8, 5, 8], fov: 50 }}>
          <Scene sensorData={sensorData} onSensorHover={handleSensorHover} />
          <Suspense fallback={null}>
        <STLModel url="./POD.stl" scale={0.005} istransparent={true} />
      </Suspense>
        </Canvas>
      )}
    </div>
  );
};

export default Pod2;