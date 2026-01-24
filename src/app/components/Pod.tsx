import React, { useState, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls, Html, Environment, Center } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useControls, folder } from 'leva';
import * as THREE from 'three';
import { useESP } from '../context/ESPContext';

// --- 1. Helper for Health Colors ---
const getHealthColor = (health: number) => {
  switch (health) {
    case 0: return '#ff0000'; // Red
    case 1: return '#ffa500'; // Orange
    case 2: return '#00ff00'; // Green
    default: return '#cccccc'; // Grey (Unknown)
  }
};

// --- 2. The Sensor Node Component ---
// This handles the glowing sphere, the positioning controls, and the hover UI
interface SensorNodeProps {
  id: string;
  label: string;
  health: number;
  dataValues: Record<string, string | number>; // Key-value pairs to show in tooltip
}

const SensorNode = ({ id, label, health, dataValues }: SensorNodeProps) => {
  const [hovered, setHover] = useState(false);

  // Leva controls for this specific sensor
  const { position } = useControls('Sensor Positions', {
    [label]: folder({
      position: { value: [0, 0, 0], step: 0.1 },
    })
  });

  const color = getHealthColor(health);

  return (
    <group position={position as [number, number, number]}>
      {/* The Glowing Node */}
      <mesh
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onClick={() => console.log(`Clicked ${label}`)}
      >
        <sphereGeometry args={[0.15, 32, 32]}  wireframe={true}/>
        {/* Emissive material + ToneMapped=false allows the Bloom effect to pick this up */}
        <meshStandardMaterial 
          color={color} 
          // emissive={color}
          // emissiveIntensity={hovered ? 4 : 2} 
          // toneMapped={false}
         
        />
      </mesh>

      {/* The Hover Card (HTML Overlay) */}
      {hovered && (
        <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: `2px solid ${color}`,
            minWidth: '200px',
            backdropFilter: 'blur(4px)',
            fontFamily: 'monospace'
          }}>
            <h3 style={{ margin: '0 0 8px 0', borderBottom: '1px solid #555' }}>{label}</h3>
            <div style={{ fontSize: '0.9em' }}>
              <div><strong>Health:</strong> {health}</div>
              <hr style={{ borderColor: '#444', margin: '5px 0' }}/>
              {Object.entries(dataValues).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#aaa' }}>{key}:</span>
                  <span>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- 3. The Pod Model ---
const PodModel = () => {
  // Replace with your actual STL path
  const geometry = useLoader(STLLoader, '/POD.stl'); 

  return (
    <mesh geometry={geometry} scale={0.005} castShadow receiveShadow>
      {/* Metallic Material Setup */}
      <meshStandardMaterial 
        color="#404040" 
        roughness={0.2} 
        metalness={0.8} 
      />
    </mesh>
  );
};

// --- 4. Main Scene Component ---
export default function PodMonitor() {
  const { sensorData } = useESP();

  // Create an array to map sensor data to nodes dynamically
  // We use useMemo to prevent flickering when data updates rapidly
  const sensors = useMemo(() => [
    {
      id: 'imu',
      label: 'IMU (Center)',
      health: sensorData?.bno_health ?? 0,
      dataValues: {
        'Accel X': sensorData?.acceleration?.x?.toFixed(2) ?? 0,
        'Accel Y': sensorData?.acceleration?.y?.toFixed(2) ?? 0,
        'Accel Z': sensorData?.acceleration?.z?.toFixed(2) ?? 0,
      }
    },
    {
      id: 'orientation',
      label: 'orientation',
      health: sensorData?.icg_health ?? 0,
      dataValues: {
        'orient X': sensorData?.orientation?.x?.toFixed(2) ?? 0,
        'orient Y': sensorData?.orientation?.y?.toFixed(2) ?? 0,
        'orient Z': sensorData?.orientation?.z?.toFixed(2) ?? 0,
      }
    },
    {
      id: 'lidar1',
      label: 'LIDAR Front',
      health: sensorData?.lidar_health ?? 0,
      dataValues: {
        'Gap Height': `${sensorData?.gap_height} mm`,
      }
    },
    {
      id: 'lidar2',
      label: 'LIDAR 2',
      health: sensorData?.lidar2_health?? 0,
      dataValues: {
        'Gap Height 2': `${sensorData?.gap_height2} mm`,
      }
    },
    {
      id: 'voltage1',
      label: 'Battery Unit 1',
      health: sensorData?.voltage1_health ?? 0,
      dataValues: {
        'Voltage1': `${sensorData?.voltage1} V`,
      }
    },
    {
      id: 'voltage2',
      label: 'Battery Unit 2',
      health: sensorData?.voltage2_health ?? 0,
      dataValues: {
        'Voltage2': `${sensorData?.voltage2} V`,
      }
    },
    {
      id: 'voltage3',
      label: 'Battery Unit 3',
      health: sensorData?.voltage3_health ?? 0,
      dataValues: {
        'Voltage3': `${sensorData?.voltage3} V`,
      }
    },
    {
      id: 'temperature1',
      label: 'temperature',
      health: sensorData?.temp1_health ?? 0,
      dataValues: {
        'temperature 1': `${sensorData?.temperatures[0]} V`,
      }
    },
    {
      id: 'temperature2',
      label: 'temperature2',
      health: sensorData?.temp2_health ?? 0,
      dataValues: {
        'temperature 2': `${sensorData?.temperatures[1]} V`,
      }
    },
    {
      id: 'temperature3',
      label: 'temperature3',
      health: sensorData?.temp3_health ?? 0,
      dataValues: {
        'temperature 3': `${sensorData?.temperatures[2]} V`,
      }
    },
     {
      id: 'pressure',
      label: 'Pressure Sys',
      health: sensorData?.pressure_health ?? 0,
      dataValues: {
        'Pressure': `${sensorData?.pressure} bar`,
      }
    },
  ], [sensorData]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
        {/* Lighting & Environment */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        {/* "City" environment gives great metallic reflections */}
        <Environment preset="city" /> 

        <Center>
            <PodModel />
            
            {/* Render all sensor nodes */}
            {sensors.map((sensor) => (
                <SensorNode 
                key={sensor.id}
                id={sensor.id}
                label={sensor.label}
                health={sensor.health}
                dataValues={sensor.dataValues}
                />
            ))}
        </Center>

        <OrbitControls makeDefault />

        {/* Post Processing for the "Halo" Glow Effect */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={1} // Only very bright things (emissive > 1) will glow
            mipmapBlur 
            intensity={1.5} 
            radius={0.6}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}