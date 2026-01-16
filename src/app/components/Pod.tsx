// Interactive STL Viewer with Advanced Sensor Visualization
// File: src/components/Pod.tsx

import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useLoader, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Html, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { useControls, folder } from 'leva';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useESP } from '../context/ESPContext';
import { Battery, Gauge, Compass, Thermometer, Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Extend React Three Fiber with Three.js primitives
extend(THREE);

// Type declaration for React Three Fiber JSX elements
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      lineBasicMaterial: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      sphereGeometry: any;
      ringGeometry: any;
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      pointLight: any;
      color: any;
      fog: any;
      axesHelper: any;
      gridHelper: any;
    }
  }
}

// Enhanced sensor marker with glowing effect and connection lines
function SensorMarker({ position, sensorData, type, index, chassisPosition }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.Line<THREE.BufferGeometry>>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Smooth pulsing and glowing animation
  useFrame((state) => {
    if (meshRef.current && glowRef.current) {
      const time = state.clock.elapsedTime;
      
      // Pulsing effect
      const pulseScale = hovered ? 1.3 : 1 + Math.sin(time * 3) * 0.15;
      meshRef.current.scale.setScalar(pulseScale);
      
      // Glow effect
      const glowScale = hovered ? 2.5 : 1.8 + Math.sin(time * 2) * 0.3;
      glowRef.current.scale.setScalar(glowScale);
      
      // Rotate on hover
      if (hovered) {
        meshRef.current.rotation.y += 0.05;
      }
    }

    // Update connection line
    if (lineRef.current && chassisPosition) {
      const geometry = lineRef.current.geometry as THREE.BufferGeometry;
      const positions = geometry.attributes.position.array as Float32Array;
      positions[0] = chassisPosition[0];
      positions[1] = chassisPosition[1];
      positions[2] = chassisPosition[2];
      positions[3] = position[0];
      positions[4] = position[1];
      positions[5] = position[2];
      geometry.attributes.position.needsUpdate = true;
    }
  });

  // Get status and color based on sensor values
  const getSensorStatus = () => {
    switch (type) {
      case 'temperature':
        const temp = sensorData.temperatures[index];
        if (temp > 40) return { status: 'critical', color: '#ef4444', label: 'CRITICAL', icon: AlertTriangle };
        if (temp > 32) return { status: 'warning', color: '#f59e0b', label: 'WARNING', icon: AlertTriangle };
        return { status: 'normal', color: '#10b981', label: 'NORMAL', icon: CheckCircle };
      
      case 'gap':
        const gap = sensorData.gapHeight;
        if (gap < 6 || gap > 12) return { status: 'critical', color: '#ef4444', label: 'OUT OF RANGE', icon: AlertTriangle };
        if (gap < 7 || gap > 11) return { status: 'warning', color: '#f59e0b', label: 'WARNING', icon: AlertTriangle };
        return { status: 'normal', color: '#10b981', label: 'OPTIMAL', icon: CheckCircle };
      
      case 'imu':
        const cal = sensorData.calibration.sys;
        if (cal === 3) return { status: 'normal', color: '#10b981', label: 'CALIBRATED', icon: CheckCircle };
        if (cal > 0) return { status: 'warning', color: '#f59e0b', label: 'CALIBRATING', icon: Activity };
        return { status: 'critical', color: '#ef4444', label: 'NOT CALIBRATED', icon: AlertTriangle };
      
      case 'voltage':
        const voltage = sensorData.voltage;
        if (voltage < 42) return { status: 'critical', color: '#ef4444', label: 'LOW VOLTAGE', icon: AlertTriangle };
        if (voltage < 45) return { status: 'warning', color: '#f59e0b', label: 'MEDIUM', icon: Info };
        return { status: 'normal', color: '#10b981', label: 'OPTIMAL', icon: CheckCircle };
      
      default:
        return { status: 'normal', color: '#3b82f6', label: 'UNKNOWN', icon: Info };
    }
  };

  const sensorStatus = getSensorStatus();
  const StatusIcon = sensorStatus.icon;

  // Enhanced hover card with beautiful styling
  const renderHoverCard = () => {
    const getIcon = () => {
      switch (type) {
        case 'temperature': return <Thermometer className="w-5 h-5" />;
        case 'gap': return <Gauge className="w-5 h-5" />;
        case 'imu': return <Compass className="w-5 h-5" />;
        case 'voltage': return <Battery className="w-5 h-5" />;
        default: return <Activity className="w-5 h-5" />;
      }
    };

    const getTitle = () => {
      switch (type) {
        case 'temperature': return `Temperature Sensor ${index + 1}`;
        case 'gap': return 'Levitation Gap Sensor';
        case 'imu': return 'Inertial Measurement Unit';
        case 'voltage': return 'Power Monitoring';
        default: return 'Sensor';
      }
    };

    return (
      <div 
        className="bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-2 rounded-xl shadow-2xl"
        style={{ 
          borderColor: sensorStatus.color,
          minWidth: type === 'imu' ? '280px' : '240px',
          maxWidth: '320px'
        }}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 rounded-t-xl border-b"
          style={{ 
            backgroundColor: `${sensorStatus.color}15`,
            borderColor: `${sensorStatus.color}30`
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${sensorStatus.color}20` }}
              >
                <div style={{ color: sensorStatus.color }}>
                  {getIcon()}
                </div>
              </div>
              <div>
                <h4 className="text-foreground font-semibold text-sm">{getTitle()}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusIcon className="w-3 h-3" style={{ color: sensorStatus.color }} />
                  <span 
                    className="text-xs font-medium"
                    style={{ color: sensorStatus.color }}
                  >
                    {sensorStatus.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {type === 'temperature' && (
            <>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground text-sm">Current Temperature</span>
                <span className="text-foreground font-bold text-lg">
                  {sensorData.temperatures[index].toFixed(1)}°C
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Threshold</div>
                  <div className="text-foreground font-medium mt-1">32°C</div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Max Safe</div>
                  <div className="text-foreground font-medium mt-1">40°C</div>
                </div>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min((sensorData.temperatures[index] / 50) * 100, 100)}%`,
                    backgroundColor: sensorStatus.color
                  }}
                />
              </div>
            </>
          )}

          {type === 'gap' && (
            <>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground text-sm">Levitation Height</span>
                <span className="text-foreground font-bold text-lg">
                  {sensorData.gapHeight.toFixed(2)} mm
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Min Safe</div>
                  <div className="text-foreground font-medium mt-1">7 mm</div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Optimal</div>
                  <div className="text-foreground font-medium mt-1">8-10 mm</div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Max Safe</div>
                  <div className="text-foreground font-medium mt-1">11 mm</div>
                </div>
              </div>
              <div className="relative w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1/3 h-full bg-green-500/20" />
                </div>
                <div 
                  className="absolute h-full w-1 transition-all duration-500"
                  style={{ 
                    left: `${Math.min((sensorData.gapHeight / 15) * 100, 100)}%`,
                    backgroundColor: sensorStatus.color,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </>
          )}

          {type === 'imu' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground text-sm">Orientation</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded border border-red-500/20">
                    <div className="text-xs text-red-400 font-medium">Pitch (X)</div>
                    <div className="text-foreground font-bold mt-1">{sensorData.orientation.x.toFixed(1)}°</div>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded border border-green-500/20">
                    <div className="text-xs text-green-400 font-medium">Roll (Y)</div>
                    <div className="text-foreground font-bold mt-1">{sensorData.orientation.y.toFixed(1)}°</div>
                  </div>
                  <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded border border-blue-500/20">
                    <div className="text-xs text-blue-400 font-medium">Yaw (Z)</div>
                    <div className="text-foreground font-bold mt-1">{sensorData.orientation.z.toFixed(1)}°</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground text-sm">Acceleration</span>
                <span className="text-foreground font-bold">
                  {sensorData.acceleration.magnitude.toFixed(2)} m/s²
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Gyro Cal</div>
                  <div className="text-foreground font-medium mt-1">{sensorData.calibration.gyro}/3</div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Sys Cal</div>
                  <div className="text-foreground font-medium mt-1">{sensorData.calibration.sys}/3</div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Mag Cal</div>
                  <div className="text-foreground font-medium mt-1">{sensorData.calibration.magneto}/3</div>
                </div>
              </div>
            </>
          )}

          {type === 'voltage' && (
            <>
              <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground text-sm">System Voltage</span>
                <span className="text-foreground font-bold text-lg">
                  {sensorData.voltage.toFixed(2)} V
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Nominal</div>
                  <div className="text-foreground font-medium mt-1">48V DC</div>
                </div>
                <div className="p-2 bg-muted/20 rounded">
                  <div className="text-muted-foreground">Min Safe</div>
                  <div className="text-foreground font-medium mt-1">42V</div>
                </div>
              </div>
              <div className="relative w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min((sensorData.voltage / 54) * 100, 100)}%`,
                    backgroundColor: sensorStatus.color
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Battery Level: {Math.min(Math.max(((sensorData.voltage - 42) / 12) * 100, 0), 100).toFixed(0)}%
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div 
          className="px-4 py-2 rounded-b-xl border-t text-center"
          style={{ 
            backgroundColor: `${sensorStatus.color}08`,
            borderColor: `${sensorStatus.color}20`
          }}
        >
          <span className="text-xs text-muted-foreground">
            Live Data • Updated {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  };

  // Connection line from chassis to sensor
  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      chassisPosition[0], chassisPosition[1], chassisPosition[2],
      position[0], position[1], position[2]
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [chassisPosition, position]);

  return (
    <group>
      {/* Connection line */}
      {/* @ts-expect-error - React Three Fiber line primitive */}
      <line ref={lineRef as any} geometry={lineGeometry}>
        <lineBasicMaterial
          color={sensorStatus.color}
          transparent
          opacity={hovered ? 0.6 : 0.2}
          linewidth={2}
        />
      </line>

      {/* Glow effect */}
      <mesh
        ref={glowRef}
        position={position}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={sensorStatus.color}
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Main sensor sphere */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          setClicked(!clicked);
        }}
      >
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial
          color={sensorStatus.color}
          emissive={sensorStatus.color}
          emissiveIntensity={hovered ? 1.2 : 0.6}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.95}
        />
        
        {/* Hover card */}
        {(hovered || clicked) && (
          <Html
            distanceFactor={8}
            position={[0, 0.8, 0]}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[100, 0]}
          >
            {renderHoverCard()}
          </Html>
        )}
      </mesh>

      {/* Ring effect */}
      <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color={sensorStatus.color}
          transparent
          opacity={hovered ? 0.4 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Enhanced STL Model with better materials
function STLModel({ url, scale }) {
  const geometry = useLoader(STLLoader, url);
  const { sensorData, isConnected } = useESP();
  const meshRef = useRef<THREE.Mesh>(null);

  const { posX, posY, posZ, rotX, rotY, rotZ, showSensors, chassisColor, metalness, roughness } = useControls({
    'Chassis Transform': folder({
      posX: { value: 0, min: -10, max: 10, step: 0.1, label: 'Position X' },
      posY: { value: 0, min: -5, max: 5, step: 0.1, label: 'Position Y' },
      posZ: { value: 0, min: -10, max: 10, step: 0.1, label: 'Position Z' },
      rotX: { value: -Math.PI / 2, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation X' },
      rotY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Y' },
      rotZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Z' },
    }),
    'Appearance': folder({
      showSensors: { value: true, label: 'Show Sensors' },
      chassisColor: { value: '#e0e0e0', label: 'Chassis Color' },
      metalness: { value: 0.9, min: 0, max: 1, step: 0.01 },
      roughness: { value: 0.3, min: 0, max: 1, step: 0.01 },
    })
  });

  // Calculate sensor positions relative to chassis
  const chassisPosition: [number, number, number] = [posX, posY, posZ];
  
  const sensorPositions = useMemo(() => {
    const offset = 3;
    return {
      temperature: [
        [posX + offset, posY + 0.5, posZ + offset] as [number, number, number],
        [posX + offset, posY + 0.5, posZ - offset] as [number, number, number],
        [posX - offset, posY + 0.5, posZ + offset] as [number, number, number],
        [posX - offset, posY + 0.5, posZ - offset] as [number, number, number],
      ],
      gap: [posX, posY - 1.2, posZ] as [number, number, number],
      imu: [posX, posY + 1.5, posZ] as [number, number, number],
      voltage: [posX - 2, posY + 0.3, posZ + 2] as [number, number, number],
    };
  }, [posX, posY, posZ]);

  return (
    <group>
      {/* Main chassis */}
      <mesh
        ref={meshRef}
        position={chassisPosition}
        rotation={[rotX, rotY, rotZ]}
        scale={scale}
        geometry={geometry}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={chassisColor}
          metalness={metalness}
          roughness={roughness}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Sensor markers */}
      {isConnected && showSensors && (
        <>
          {sensorPositions.temperature.map((pos, index) => (
            <SensorMarker
              key={`temp-${index}`}
              position={pos}
              sensorData={sensorData}
              type="temperature"
              index={index}
              chassisPosition={chassisPosition}
            />
          ))}
          <SensorMarker
            position={sensorPositions.gap}
            sensorData={sensorData}
            type="gap"
            index={0}
            chassisPosition={chassisPosition}
          />
          <SensorMarker
            position={sensorPositions.imu}
            sensorData={sensorData}
            type="imu"
            index={0}
            chassisPosition={chassisPosition}
          />
          <SensorMarker
            position={sensorPositions.voltage}
            sensorData={sensorData}
            type="voltage"
            index={0}
            chassisPosition={chassisPosition}
          />
        </>
      )}
    </group>
  );
}

// Enhanced lighting setup
function Lights() {
  const { 
    ambientIntensity,
    directionalIntensity,
    spotlightIntensity,
    rimLightIntensity,
    enableShadows
  } = useControls('Lighting', {
    ambientIntensity: { value: 0.4, min: 0, max: 2, step: 0.1 },
    directionalIntensity: { value: 1.5, min: 0, max: 5, step: 0.1 },
    spotlightIntensity: { value: 2, min: 0, max: 10, step: 0.1 },
    rimLightIntensity: { value: 0.8, min: 0, max: 5, step: 0.1 },
    enableShadows: { value: true },
  });

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={directionalIntensity}
        castShadow={enableShadows}
        shadow-mapSize={[2048, 2048]}
      />
      <spotLight
        position={[0, 8, 0]}
        angle={0.5}
        penumbra={1}
        intensity={spotlightIntensity}
        castShadow={enableShadows}
      />
      <pointLight
        position={[-5, 3, -5]}
        intensity={rimLightIntensity}
        color="#4488ff"
      />
      <pointLight
        position={[5, 3, 5]}
        intensity={rimLightIntensity}
        color="#ff6644"
      />
    </>
  );
}

// Camera controller
function CameraController() {
  const { camera } = useThree();
  const { autoRotate, autoRotateSpeed } = useControls('Camera', {
    autoRotate: { value: false, label: 'Auto Rotate' },
    autoRotateSpeed: { value: 2, min: 0, max: 10, step: 0.5 },
  });

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.05}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2 + 0.5}
    />
  );
}

// Main Pod component with enhanced UI
const Pod = () => {
  const { isConnected, sensorData } = useESP();
  const [showStats, setShowStats] = useState(true);

  // Calculate overall system health
  const getSystemHealth = () => {
    let healthScore = 100;
    let issues: string[] = [];

    // Temperature check
    sensorData.temperatures.forEach((temp, idx) => {
      if (temp > 40) {
        healthScore -= 25;
        issues.push(`Temp ${idx + 1} critical`);
      } else if (temp > 32) {
        healthScore -= 10;
        issues.push(`Temp ${idx + 1} elevated`);
      }
    });

    // Gap height check
    if (sensorData.gapHeight < 6 || sensorData.gapHeight > 12) {
      healthScore -= 30;
      issues.push('Gap out of range');
    } else if (sensorData.gapHeight < 7 || sensorData.gapHeight > 11) {
      healthScore -= 15;
      issues.push('Gap suboptimal');
    }

    // Voltage check
    if (sensorData.voltage < 42) {
      healthScore -= 25;
      issues.push('Low voltage');
    } else if (sensorData.voltage < 45) {
      healthScore -= 10;
      issues.push('Voltage medium');
    }

    // Calibration check
    if (sensorData.calibration.sys < 3) {
      healthScore -= 20;
      issues.push('IMU not calibrated');
    }

    return { score: Math.max(0, healthScore), issues };
  };

  const systemHealth = getSystemHealth();

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground font-semibold text-lg">3D Pod Visualization</h3>
              <p className="text-muted-foreground text-sm">Real-time sensor telemetry overlay</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* System Health Indicator */}
            {isConnected && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">System Health</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="text-lg font-bold" style={{ 
                      color: systemHealth.score > 80 ? '#10b981' : systemHealth.score > 60 ? '#f59e0b' : '#ef4444' 
                    }}>
                      {systemHealth.score}%
                    </div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 rounded-full"
                        style={{ 
                          width: `${systemHealth.score}%`,
                          backgroundColor: systemHealth.score > 80 ? '#10b981' : systemHealth.score > 60 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
              backgroundColor: isConnected ? '#10b98110' : '#ef444410',
              border: `1px solid ${isConnected ? '#10b98130' : '#ef444430'}`
            }}>
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isConnected ? '#10b981' : '#ef4444' }}
              />
              <span className="text-sm font-medium" style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Toggle Stats */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium"
            >
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div style={{ width: '100%', height: '70vh', minHeight: '500px', position: 'relative' }}>
        <Canvas
          camera={{ position: [8, 6, 8], fov: 50 }}
          shadows
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#0a0a0a']} />
          <fog attach="fog" args={['#0a0a0a', 10, 50]} />
          
          <Suspense fallback={null}>
            <STLModel
              url="/pod_stls/extrudes chassis.stl"
              scale={0.005}
            />
            <Environment preset="city" />
            <ContactShadows
              position={[0, -1, 0]}
              opacity={0.5}
              scale={20}
              blur={2}
              far={4}
            />
          </Suspense>
          
          <Lights />
          <CameraController />
          <axesHelper args={[5]} />
          <gridHelper args={[30, 30, '#333333', '#1a1a1a']} position={[0, -1, 0]} />
        </Canvas>

        {/* Overlay Stats */}
        {showStats && isConnected && (
          <div className="absolute top-4 left-4 space-y-2 pointer-events-none">
            {/* Quick Stats Cards */}
            <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
              <div className="text-xs text-muted-foreground mb-2">Quick Stats</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Avg Temp</div>
                    <div className="text-sm font-bold text-foreground">
                      {(sensorData.temperatures.reduce((a, b) => a + b, 0) / 4).toFixed(1)}°C
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Gap</div>
                    <div className="text-sm font-bold text-foreground">
                      {sensorData.gapHeight.toFixed(1)} mm
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Voltage</div>
                    <div className="text-sm font-bold text-foreground">
                      {sensorData.voltage.toFixed(1)} V
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Accel</div>
                    <div className="text-sm font-bold text-foreground">
                      {sensorData.acceleration.magnitude.toFixed(1)} m/s²
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Issues */}
            {systemHealth.issues.length > 0 && (
              <div className="bg-destructive/10 backdrop-blur-sm border border-destructive/30 rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <div className="text-xs font-semibold text-destructive">Active Issues</div>
                </div>
                <div className="space-y-1">
                  {systemHealth.issues.slice(0, 3).map((issue, idx) => (
                    <div key={idx} className="text-xs text-destructive/80">
                      • {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions Overlay */}
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border-2 border-border rounded-xl p-8 max-w-md text-center shadow-2xl">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-foreground font-semibold text-xl mb-2">Connect to ESP32</h3>
              <p className="text-muted-foreground mb-4">
                Connect your ESP32 device to view real-time sensor markers and telemetry data on the 3D model.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
                <div className="font-medium mb-2">Features when connected:</div>
                <ul className="space-y-1 text-left">
                  <li>• Interactive sensor markers with live data</li>
                  <li>• Color-coded status indicators</li>
                  <li>• Real-time telemetry hover cards</li>
                  <li>• System health monitoring</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gradient-to-r from-card to-card/80 border-t border-border px-6 py-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Critical</span>
            </div>
          </div>
          {isConnected && (
            <div>
              Hover over sensor markers for detailed telemetry • Use mouse to rotate view
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Pod;