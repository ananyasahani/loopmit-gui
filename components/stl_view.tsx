'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

interface ComponentInfo {
  name: string;
  description: string;
  specs?: string[];
}

// Define your component information
const componentInfoMap: { [key: string]: ComponentInfo } = {
  'component1': {
    name: 'Main Body',
    description: 'Primary structural component',
    specs: ['Material: ABS', 'Weight: 150g', 'Tolerance: ±0.1mm']
  },
  'component2': {
    name: 'Support Bracket',
    description: 'Load-bearing support structure',
    specs: ['Material: Steel', 'Max Load: 50kg', 'Finish: Powder Coated']
  },
  'component3': {
    name: 'Mounting Plate',
    description: 'Base mounting interface',
    specs: ['Material: Aluminum', 'Dimensions: 100x100mm', 'Holes: M6']
  }
};

export default function STLViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredComponent, setHoveredComponent] = useState<ComponentInfo | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [previousMousePosition, setPreviousMousePosition] = useState({ x: 0, y: 0 });
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    mesh: THREE.Mesh | null;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
  } | null>(null);

  // Determine which component is being hovered based on position
  const getComponentFromPosition = (point: THREE.Vector3): string => {
    if (point.y > 0.5) return 'component1';
    if (point.y < -0.5) return 'component3';
    return 'component2';
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e293b);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    sceneRef.current = {
      scene,
      camera,
      renderer,
      mesh: null,
      raycaster,
      mouse
    };

    // Load STL file function
    const loadSTLFile = (scene: THREE.Scene, filePath: string) => {
      const loader = new STLLoader();
      
      loader.load(
        filePath,
        (geometry: any) => {
          const material = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            metalness: 0.3,
            roughness: 0.4
          });
          
          const mesh = new THREE.Mesh(geometry, material);
          
          // Center the geometry
          geometry.computeBoundingBox();
          const center = new THREE.Vector3();
          if (geometry.boundingBox) {
            geometry.boundingBox.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);
          }
          
          // Scale to fit
          const size = new THREE.Vector3();
          if (geometry.boundingBox) {
            geometry.boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;
            mesh.scale.setScalar(scale);
          }
          
          scene.add(mesh);
          if (sceneRef.current) {
            sceneRef.current.mesh = mesh;
          }
          setIsLoading(false);
        },
        (xhr: any) => {
          console.log('Loading:', (xhr.loaded / xhr.total * 100) + '%');
        },
        (error: any) => {
          console.error('Error loading STL:', error);
          setIsLoading(false);
        }
      );
    };

    // Create demo geometry (for testing without STL file)
    const createDemoGeometry = (scene: THREE.Scene) => {
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      const material = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.3,
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      if (sceneRef.current) {
        sceneRef.current.mesh = mesh;
      }
      setIsLoading(false);
    };

    // Load your STL file (make sure it's in public folder)
    // Uncomment the line below and comment out createDemoGeometry to load your STL
    // loadSTLFile(scene, '/Wall-E_Assembly_NotForPrinting.stl');
    
    // For now, using demo geometry
    createDemoGeometry(scene);

    // DECLARE animationId before animate function
    let animationId: number;

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (sceneRef.current?.mesh) {
        sceneRef.current.mesh.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current || !sceneRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Update mouse position for hover card
      setMousePosition({ x: event.clientX, y: event.clientY });

      // Calculate mouse position in normalized device coordinates
      sceneRef.current.mouse.x = (x / rect.width) * 2 - 1;
      sceneRef.current.mouse.y = -(y / rect.height) * 2 + 1;

      // Update raycaster
      sceneRef.current.raycaster.setFromCamera(sceneRef.current.mouse, sceneRef.current.camera);

      // Check for intersections
      if (sceneRef.current.mesh) {
        const intersects = sceneRef.current.raycaster.intersectObject(sceneRef.current.mesh);

        if (intersects.length > 0) {
          const point = intersects[0].point;
          const componentKey = getComponentFromPosition(point);
          setHoveredComponent(componentInfoMap[componentKey] || null);
        } else {
          setHoveredComponent(null);
        }
      }
    };

    const currentContainer = containerRef.current;
    currentContainer.addEventListener('mousemove', handleMouseMove);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (currentContainer) {
        currentContainer.removeEventListener('mousemove', handleMouseMove);
      }
      renderer.dispose();
      if (currentContainer?.contains(renderer.domElement)) {
        currentContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">3D STL Viewer</h1>
          <p className="text-gray-400">Hover over components to see details</p>
        </div>

        {/* 3D Viewer Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">3D Model</h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                  Reset View
                </button>
                <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
                  Upload STL
                </button>
              </div>
            </div>
          </div>

          {/* 3D Canvas Container */}
          <div className="relative">
            <div
              ref={containerRef}
              className="w-full h-[600px] cursor-pointer"
            />

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <div className="text-white text-lg">Loading 3D model...</div>
              </div>
            )}

            {/* Hover Info Card */}
            {hoveredComponent && (
              <div
                className="fixed z-50 pointer-events-none"
                style={{
                  left: mousePosition.x + 20,
                  top: mousePosition.y + 20,
                }}
              >
                <div className="bg-gray-900 border-2 border-blue-500 rounded-lg p-4 shadow-2xl max-w-xs animate-in fade-in duration-200">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {hoveredComponent.name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    {hoveredComponent.description}
                  </p>
                  {hoveredComponent.specs && (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-blue-400 uppercase">
                        Specifications
                      </div>
                      {hoveredComponent.specs.map((spec, index) => (
                        <div key={index} className="text-xs text-gray-400 flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-400 rounded-full" />
                          {spec}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Controls Info */}
          <div className="p-4 border-t border-gray-700 bg-gray-900/30">
            <div className="flex gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs">
                  ↻
                </div>
                <span>Auto-rotate enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs">
                  🖱️
                </div>
                <span>Hover to view component info</span>
              </div>
            </div>
          </div>
        </div>

        {/* Component Legend */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(componentInfoMap).map(([key, info]) => (
            <div
              key={key}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <h3 className="text-white font-semibold">{info.name}</h3>
              </div>
              <p className="text-gray-400 text-sm">{info.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}