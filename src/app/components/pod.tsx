// Interactive STL Viewer with Sensor Hover Cards
// File: src/components/Pod.tsx

import React, { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useESP } from '../context/ESPContext';

// Sensor marker component with hover interaction
function SensorMarker({ position, sensorData, type, index }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Pulsing animation
  useFrame((state) => {
    if (meshRef.current) {
      const scale = hovered ? 1.5 : 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  // Determine color based on sensor type and values
  const getColor = () => {
    switch (type) {
      case 'temperature':
        const temp = sensorData.temperatures[index];
        if (temp > 35) return '#ef4444'; // Red - too hot
        if (temp > 25) return '#f59e0b'; // Orange - warm
        return '#10b981'; // Green - normal
      case 'gap':
        const gap = sensorData.gapHeight;
        if (gap < 5 || gap > 12) return '#ef4444'; // Red - out of range
        return '#10b981'; // Green - normal
      case 'imu':
        const cal = sensorData.calibration.sys;
        if (cal === 3) return '#10b981'; // Green - calibrated
        if (cal > 0) return '#f59e0b'; // Orange - partially calibrated
        return '#ef4444'; // Red - not calibrated
      case 'voltage':
        const voltage = sensorData.voltage;
        if (voltage < 42) return '#ef4444'; // Red - low voltage
        if (voltage < 45) return '#f59e0b'; // Orange - medium
        return '#10b981'; // Green - good
      default:
        return '#3b82f6'; // Blue - default
    }
  };

  // Render hover card content
  const renderHoverCard = () => {
    switch (type) {
      case 'temperature':
        return (
          <div className="bg-card border-2 border-border rounded-lg p-4 shadow-2xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor() }} />
              <h4 className="text-foreground font-semibold">Temperature Sensor {index + 1}</h4>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current:</span>
                <span className="text-foreground font-medium">{sensorData.temperatures[index].toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-foreground">
                  {sensorData.temperatures[index] > 35 ? 'Warning' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        );
      case 'gap':
        return (
          <div className="bg-card border-2 border-border rounded-lg p-4 shadow-2xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor() }} />
              <h4 className="text-foreground font-semibold">Gap Height Sensor</h4>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Height:</span>
                <span className="text-foreground font-medium">{sensorData.gapHeight.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Range:</span>
                <span className="text-foreground">8-10 mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-foreground">
                  {sensorData.gapHeight < 5 || sensorData.gapHeight > 12 ? 'Out of Range' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        );
      case 'imu':
        return (
          <div className="bg-card border-2 border-border rounded-lg p-4 shadow-2xl min-w-[240px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor() }} />
              <h4 className="text-foreground font-semibold">IMU Sensor</h4>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orientation X:</span>
                <span className="text-foreground font-medium">{sensorData.orientation.x.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orientation Y:</span>
                <span className="text-foreground font-medium">{sensorData.orientation.y.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orientation Z:</span>
                <span className="text-foreground font-medium">{sensorData.orientation.z.toFixed(1)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acceleration:</span>
                <span className="text-foreground font-medium">{sensorData.acceleration.magnitude.toFixed(2)} m/s²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Calibration:</span>
                <span className="text-foreground">{sensorData.calibration.sys}/3</span>
              </div>
            </div>
          </div>
        );
      case 'voltage':
        return (
          <div className="bg-card border-2 border-border rounded-lg p-4 shadow-2xl min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor() }} />
              <h4 className="text-foreground font-semibold">Voltage Sensor</h4>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voltage:</span>
                <span className="text-foreground font-medium">{sensorData.voltage.toFixed(2)} V</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nominal:</span>
                <span className="text-foreground">48V DC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-foreground">
                  {sensorData.voltage < 42 ? 'Low' : sensorData.voltage < 45 ? 'Medium' : 'Good'}
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial
        color={getColor()}
        emissive={getColor()}
        emissiveIntensity={hovered ? 0.8 : 0.4}
        transparent
        opacity={0.8}
      />
      {hovered && (
        <Html distanceFactor={10} position={[0, 0.5, 0]}>
          {renderHoverCard()}
        </Html>
      )}
    </mesh>
  );
}

// Main STL Model component
function STLModel({ url, color, scale }) {
  const geometry = useLoader(STLLoader, url);
  const { sensorData, isConnected } = useESP();

  const controls = useControls('Position & Rotation', {
    posX: { value: -5.8, min: -10, max: 5, step: 0.1 },
    posY: { value: 0, min: 0, max: 5, step: 0.1 },
    posZ: { value: 1.5, min: 0, max: 5, step: 0.1 },
    rotX: { value: -1.6, min: -Math.PI, max: Math.PI, step: 0.1 },
    rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.1 },
    rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.1 },
  });

  // Placeholder sensor positions (relative to chassis)
  // Adjust these based on your actual chassis dimensions
  const sensorPositions = useMemo(() => ({
    temperature: [
      [controls.posX + 2, controls.posY + 0.5, controls.posZ + 1], // Front-left
      [controls.posX + 2, controls.posY + 0.5, controls.posZ - 1], // Front-right
      [controls.posX - 2, controls.posY + 0.5, controls.posZ + 1], // Back-left
      [controls.posX - 2, controls.posY + 0.5, controls.posZ - 1], // Back-right
    ],
    gap: [controls.posX, controls.posY - 0.8, controls.posZ], // Bottom center
    imu: [controls.posX, controls.posY + 0.8, controls.posZ], // Top center
    voltage: [controls.posX - 1, controls.posY, controls.posZ], // Side
  }), [controls.posX, controls.posY, controls.posZ]);

  return (
    <group>
      {/* Main chassis */}
      <mesh
        position={[controls.posX, controls.posY, controls.posZ]}
        rotation={[controls.rotX, controls.rotY, controls.rotZ]}
        scale={scale}
        geometry={geometry}
      >
        <meshLambertMaterial color={color} />
      </mesh>

      {/* Sensor markers - only show when connected */}
      {isConnected && (
        <>
          {/* Temperature sensors */}
          {sensorPositions.temperature.map((pos, index) => (
            <SensorMarker
              key={`temp-${index}`}
              position={pos as [number, number, number]}
              sensorData={sensorData}
              type="temperature"
              index={index}
            />
          ))}

          {/* Gap height sensor */}
          <SensorMarker
            position={sensorPositions.gap as [number, number, number]}
            sensorData={sensorData}
            type="gap"
            index={0}
          />

          {/* IMU sensor */}
          <SensorMarker
            position={sensorPositions.imu as [number, number, number]}
            sensorData={sensorData}
            type="imu"
            index={0}
          />

          {/* Voltage sensor */}
          <SensorMarker
            position={sensorPositions.voltage as [number, number, number]}
            sensorData={sensorData}
            type="voltage"
            index={0}
          />
        </>
      )}
    </group>
  );
}

// Lights component
function Lights() {
  const spotlightRef = useRef<THREE.SpotLight>(null!);
  const rimLightRef = useRef<THREE.PointLight>(null!);

  const {
    spotlightPos,
    spotlightIntensity,
    spotlightAngle,
    spotlightPenumbra,
    rimLightPos,
    rimLightIntensity,
    ambientIntensity
  } = useControls('Lights', {
    spotlightPos: { value: [0, 5, 5], step: 0.5 },
    spotlightIntensity: { value: 3, min: 0, max: 10, step: 0.1 },
    spotlightAngle: { value: 0.4, min: 0, max: Math.PI / 2, step: 0.01 },
    spotlightPenumbra: { value: 0.5, min: 0, max: 1, step: 0.05 },
    rimLightPos: { value: [-3, 2, -3], step: 0.5 },
    rimLightIntensity: { value: 1, min: 0, max: 5, step: 0.1 },
    ambientIntensity: { value: 0.1, min: 0, max: 1, step: 0.05 }
  });

  return (
    <>
      <spotLight
        ref={spotlightRef}
        position={spotlightPos as [number, number, number]}
        intensity={spotlightIntensity}
        angle={spotlightAngle}
        penumbra={spotlightPenumbra}
        castShadow
        target-position={[0, 0, 0]}
      />
      <pointLight
        ref={rimLightRef}
        position={rimLightPos as [number, number, number]}
        intensity={rimLightIntensity}
        color="#4488ff"
      />
      <ambientLight intensity={ambientIntensity} />
    </>
  );
}

// Main Pod component
const Pod = () => {
  const { isConnected } = useESP();

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground">3D Pod Visualization</h3>
        {!isConnected && (
          <div className="px-2 py-1 bg-muted/50 rounded text-xs text-muted-foreground">
            Connect to see sensor markers
          </div>
        )}
      </div>
      
      <div style={{ width: '100%', height: '60vh', minHeight: '400px' }}>
        <Canvas
          camera={{ position: [5, 5, 5], fov: 50 }}
          shadows
        >
          <Suspense fallback={null}>
            <STLModel
              url="/pod_stls/extrudes chassis.stl"
              color="#FFFFFF"
              scale={0.005}
            />
          </Suspense>
          <Lights />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <axesHelper args={[10]} />
          <gridHelper args={[20, 20]} />
        </Canvas>
      </div>

      {isConnected && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            Hover over the colored spheres to see real-time sensor data
          </p>
        </div>
      )}
    </div>
  );
};

export default Pod;