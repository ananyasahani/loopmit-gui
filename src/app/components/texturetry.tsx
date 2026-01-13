import React, { Suspense, useLayoutEffect, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import * as THREE from 'three';

function OBJModel({ scale = 0.5 }: { scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useThree();
  
  // 1. Load the Geometry (OBJ)
  const obj = useLoader(OBJLoader, '/Aeroshell_.obj');

  // 2. Load Standard Textures (PNG)
  const [colorMap, displacementMap] = useLoader(THREE.TextureLoader, [
    '/textures/rusty_metal_05_diff_4k.png',
    '/textures/rusty_metal_05_disp_4k.png'
  ]);

  // 3. Load HDR Textures (EXR)
  const [normalMap, roughnessMap] = useLoader(EXRLoader, [
    '/textures/rusty_metal_05_nor_gl_4k.exr',
    '/textures/rusty_metal_05_rough_4k.exr'
  ]);

  // 4. Apply textures and add to scene
  useLayoutEffect(() => {
    if (!groupRef.current) return;
    
    // Clear previous children
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    
    // Clone the object
    const clone = obj.clone();
    
    // Set proper color space for normal map
    if (normalMap) {
      normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    }
    
    // Configure texture wrapping for all textures
    [colorMap, displacementMap, normalMap, roughnessMap].forEach(texture => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    });
    
    // Apply materials to all meshes
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: colorMap,
          normalMap: normalMap,
          roughnessMap: roughnessMap,
          displacementMap: displacementMap,
          displacementScale: 0.1,
          roughness: 1,
          metalness: 0.6
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Add to the group
    groupRef.current.add(clone);
    
  }, [obj, colorMap, normalMap, roughnessMap, displacementMap]);

  return <group ref={groupRef} scale={scale} />;
}

function Lights() {
  return (
    <>
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      <directionalLight
        position={[-10, 5, -5]}
        intensity={0.5}
      />
      
      <directionalLight
        position={[0, 5, -10]}
        intensity={0.3}
      />
      
      <ambientLight intensity={0.4} />
      
      <hemisphereLight
        color="#ffffff"
        groundColor="#444444"
        intensity={0.5}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div style={{ 
        color: 'white', 
        fontSize: '18px',
        background: 'rgba(0,0,0,0.7)',
        padding: '20px',
        borderRadius: '8px'
      }}>
        Loading OBJ Model...
      </div>
    </Html>
  );
}

export default function Pod() {
  return (
    <div style={{ width: '100vw', height: '60vh', position: 'relative', background: '#1a1a1a' }}>
      <Canvas shadows camera={{ position: [8, 5, 8], fov: 50 }}>
        <Lights />
        
        <Environment preset="studio" />
        
        <Suspense fallback={<LoadingFallback />}>
          <OBJModel scale={0.005} />
        </Suspense>
        
        <ContactShadows
          position={[0, -1, 0]}
          opacity={0.5}
          scale={20}
          blur={2}
          far={10}
        />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />
        
        <gridHelper args={[20, 20, '#555555', '#333333']} />
      </Canvas>
    </div>
  );
}