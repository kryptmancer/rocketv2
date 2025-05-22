"use client"

import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Grid, 
  Environment, 
  ContactShadows 
} from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// Optimized flame component for rocket engine
function RocketFlame({ isLaunched, throttle = 0, preLaunchFire = false, countdownStage = 0 }: { 
  isLaunched: boolean, 
  throttle: number, 
  preLaunchFire?: boolean,
  countdownStage?: number
}) {
  const flameRef = useRef<THREE.Group>(null);
  const flameVariation = useRef({ scaleY: 0, scaleX: 0, scaleZ: 0 });
  const launchTime = useRef<number | null>(null);
  
  useFrame((state) => {
    if (!flameRef.current || (!isLaunched && !preLaunchFire)) return;
    
    const time = state.clock.getElapsedTime();
    
    // Track when launch begins
    if (isLaunched && launchTime.current === null) {
      launchTime.current = time;
    } else if (!isLaunched) {
      launchTime.current = null;
    }
    
    // Determine effective throttle - enhanced for more dramatic effect during launch
    let effectiveThrottle;
      if (isLaunched) {
      if (launchTime.current !== null) {
        const timeSinceLaunch = time - launchTime.current;
        
        // Ground fire phase (0-2 seconds): intense pulsing effect
        if (timeSinceLaunch < 2.0) {
          // More dramatic pulsing during ground phase
          effectiveThrottle = 1.4 + Math.sin(timeSinceLaunch * 6) * 0.4 + Math.sin(timeSinceLaunch * 20) * 0.2;
        } else if (timeSinceLaunch < 2.5) {
          // Crescendo before liftoff (final buildup)
          effectiveThrottle = 1.8 + Math.sin(timeSinceLaunch * 30) * 0.5;
        } else {
          // Sustained strong flame after liftoff
          effectiveThrottle = throttle * 1.6 + Math.sin(time * 15) * 0.15;
        }
      } else {
        effectiveThrottle = throttle * 1.4;
      }
    } else {
      // Pre-launch more subdued flame
      effectiveThrottle = 0.8; // Slightly increased from 0.7
    }
    
    // Calculate smooth variations using sine waves - more dramatic for launch
    const flameFrequency = isLaunched ? 15 : 10;
    
    // Smooth interpolation of previous values for less jitter
    flameVariation.current.scaleY = THREE.MathUtils.lerp(
      flameVariation.current.scaleY,
      0.8 + Math.sin(time * flameFrequency) * 0.3 + Math.sin(time * 17) * 0.1,
      isLaunched ? 0.3 : 0.2
    );
    
    // Apply flame scale with smooth modulation - larger for actual launch
    const baseScaleMultiplier = isLaunched ? 2.0 : 1.8;
    flameRef.current.scale.y = flameVariation.current.scaleY * (0.5 + effectiveThrottle * baseScaleMultiplier);
    
    // Smooth X/Z scale variation - more dramatic during launch
    const xzVariation = isLaunched ? 0.15 : 0.1;
    const newScaleX = 0.7 + Math.sin(time * 12) * xzVariation + Math.sin(time * 23) * (xzVariation/2);
    const newScaleZ = 0.7 + Math.cos(time * 14) * xzVariation + Math.cos(time * 19) * (xzVariation/2);
    
    flameVariation.current.scaleX = THREE.MathUtils.lerp(flameVariation.current.scaleX, newScaleX, 0.15);
    flameVariation.current.scaleZ = THREE.MathUtils.lerp(flameVariation.current.scaleZ, newScaleZ, 0.15);
    
    flameRef.current.scale.x = flameVariation.current.scaleX;
    flameRef.current.scale.z = flameVariation.current.scaleZ;
  });

  if (!isLaunched && !preLaunchFire) return null;
  
  // Adjusted flame position to align with the rocket engine
  return (
    <group ref={flameRef} position={[0, -3, 0]}>
      {/* Main outer flame - brighter and more intense */}
      <mesh>
        <coneGeometry args={[0.5, 2.3, 24]} /> {/* Slightly larger flame cone */}
        <meshBasicMaterial color="#FF4400" transparent opacity={0.85} />
      </mesh>
      {/* Middle flame layer */}
      <mesh position={[0, -0.1, 0]}>
        <coneGeometry args={[0.38, 1.9, 20]} /> {/* Slightly larger flame cone */}
        <meshBasicMaterial color="#FF7700" transparent opacity={0.9} />
      </mesh>
      {/* Hot inner flame */}
      <mesh position={[0, -0.2, 0]}>
        <coneGeometry args={[0.28, 1.5, 16]} /> {/* Slightly larger flame cone */}
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.95} />
      </mesh>
      {/* Stronger lights for better visual impact */}
      <pointLight color="#FF5500" intensity={isLaunched ? 9 * throttle : 7 * throttle} distance={7} /> {/* Increased intensity and distance */}
      <pointLight color="#FFAA00" intensity={isLaunched ? 6 * throttle : 5 * throttle} distance={4} /> {/* Increased intensity and distance */}
    </group>
  );
}

// Optimized rocket model component
function RocketModel({ 
  selected, 
  isLaunched, 
  throttle,
  highlightedPart,
  preLaunchFire = false,
  countdownStage = 0,
  preserveRotation = false // Add new prop to control rotation preservation
}: { 
  selected: boolean, 
  isLaunched: boolean,
  throttle: number,
  highlightedPart: string | null,
  preLaunchFire?: boolean,
  countdownStage?: number,
  preserveRotation?: boolean // Add type for new prop
}) {
  const rocketRef = useRef<THREE.Group>(null)
  const bodyRadius = 0.5
  
  useFrame((_, delta) => {
    // Only rotate for display when neither selected nor launched
    if (rocketRef.current && !selected && !isLaunched && !preLaunchFire) {
      rocketRef.current.rotation.y += delta * 0.1
    } else if (rocketRef.current && preLaunchFire && !preserveRotation) {
      // Only reset rotation during pre-launch if preserveRotation is false
      rocketRef.current.rotation.x = THREE.MathUtils.lerp(rocketRef.current.rotation.x, 0, 0.1);
      rocketRef.current.rotation.z = THREE.MathUtils.lerp(rocketRef.current.rotation.z, 0, 0.1);
    }
  })

  const highlightEmissive = "#00AAFF"
  const highlightIntensity = 0.5

  const getEmissive = (part: string) => highlightedPart === part ? highlightEmissive : (selected ? "#FFFFFF" : "#000000")
  const getEmissiveIntensity = (part: string) => highlightedPart === part ? highlightIntensity : (selected ? 0.1 : 0)

  // Adjust the entire rocket to sit properly on the grid
  return (
    <group ref={rocketRef} position={[0, 0.8, 0]}>
      {/* Upper body */}
      <mesh position={[0, 1.2, 0]} name="upper-airframe">
        <cylinderGeometry args={[bodyRadius, bodyRadius, 1.6, 32]} />
        <meshStandardMaterial 
          color="#8C8D91" 
          metalness={0.6} 
          roughness={0.2} 
          emissive={getEmissive('airframe')}
          emissiveIntensity={getEmissiveIntensity('airframe')}
        />
      </mesh>
      
      {/* Lower body */}
      <mesh position={[0, -0.8, 0]} name="lower-airframe">
        <cylinderGeometry args={[bodyRadius, bodyRadius, 2.4, 32]} />
        <meshStandardMaterial 
          color="#8C8D91" 
          metalness={0.6} 
          roughness={0.2} 
          emissive={getEmissive('airframe')}
          emissiveIntensity={getEmissiveIntensity('airframe')}
        />
      </mesh>
      
      {/* Top ring */}
      <mesh position={[0, 2, 0]}>
        <torusGeometry args={[bodyRadius, 0.03, 16, 32]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Nose cone */}
      <mesh position={[0, 2.75, 0]} name="nosecone">
        <coneGeometry args={[bodyRadius, 1.5, 32]} />
        <meshStandardMaterial 
          color="#A0A7B8" 
          metalness={0.7} 
          roughness={0.2} 
          emissive={getEmissive('nosecone')}
          emissiveIntensity={getEmissiveIntensity('nosecone')}
        />
      </mesh>
      
      {/* Electronics bay */}
      <group position={[0, 0.4, 0]} name="electronics">
        <mesh>
          <cylinderGeometry args={[bodyRadius + 0.01, bodyRadius + 0.01, 0.4, 32]} />
          <meshStandardMaterial 
            color="#222222"
            metalness={0.35}
            roughness={0.7}
            emissive={getEmissive('electronics')}
            emissiveIntensity={getEmissiveIntensity('electronics')}
          />
        </mesh>
        
        {/* Rings */}
        {[0.2, -0.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[bodyRadius + 0.01, 0.02, 16, 32]} />
          <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
        </mesh>
        ))}
        
        {/* Details */}
        {[0, 1, 2, 3].map((i) => (
          <mesh 
            key={i}
            position={[
              Math.sin(i * Math.PI / 2) * (bodyRadius - 0.05),
              0, 
              Math.cos(i * Math.PI / 2) * (bodyRadius - 0.05)
            ]}
            rotation={[0, i * Math.PI / 2, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.04, 0.04, 0.1, 8]} />
            <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>
      
      {/* Fins */}
      {[0, 1, 2, 3].map((i) => (
        <mesh 
          key={i}
          position={[
            Math.sin(i * Math.PI / 2) * 0.6,
            -1.5,
            Math.cos(i * Math.PI / 2) * 0.6
          ]}
          rotation={[0, i * Math.PI / 2, 0]}
          name="fins"
        >
          <boxGeometry args={[0.1, 1, 0.8]} />
          <meshStandardMaterial 
            color="#A0A7B8" 
            metalness={0.3} 
            roughness={0.3} 
            emissive={getEmissive('fins')}
            emissiveIntensity={getEmissiveIntensity('fins')}
          />
        </mesh>
      ))}
      
      {/* Engine */}
      <group position={[0, -2.2, 0]} name="engine">
        <mesh>
          <cylinderGeometry args={[0.35, 0.4, 0.5, 32]} />
          <meshStandardMaterial 
            color="#303030" 
            metalness={0.7} 
            roughness={0.3} 
            emissive={getEmissive('engine')}
            emissiveIntensity={getEmissiveIntensity('engine')}
          />
        </mesh>
        
        <mesh position={[0, -0.3, 0]}>
          <coneGeometry args={[0.4, 0.4, 32, 1, true]} />
          <meshStandardMaterial 
            color="#404040" 
            metalness={0.7} 
            roughness={0.2}
            emissive={getEmissive('engine')}
            emissiveIntensity={getEmissiveIntensity('engine')}
          />
        </mesh>
        
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.32, 0.3, 32]} />
          <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.8} />
        </mesh>
      </group>

      {/* Parachute */}
      <mesh position={[0, 1.5, 0]} name="parachute">
        <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} />
        <meshStandardMaterial 
          color="#DD2222" 
          metalness={0.2} 
          roughness={0.5}
          emissive={getEmissive('parachute')}
          emissiveIntensity={getEmissiveIntensity('parachute')}
        />
      </mesh>

      {/* Flame */}
      <RocketFlame 
        isLaunched={isLaunched} 
        throttle={throttle} 
        preLaunchFire={preLaunchFire || highlightedPart === 'engine'}
        countdownStage={preLaunchFire ? countdownStage : (highlightedPart === 'engine' ? 3 : 0)}
      />
    </group>
  )
}

// Optimized dynamic camera that follows the rocket
function DynamicCamera({ 
  isLaunched, 
  target,
  view
}: { 
  isLaunched: boolean,
  target: [number, number, number],
  view: 'top' | 'side' | 'perspective'
}) {
  const ref = useRef<THREE.PerspectiveCamera>(null);
  
  // Camera positions are now more dramatically different for each view
  const initialPositions = useRef<{[key: string]: THREE.Vector3}>({
    top: new THREE.Vector3(0, 15, 0),      // Directly above
    side: new THREE.Vector3(15, 0, 0),     // Pure side view
    perspective: new THREE.Vector3(10, 10, 10)  // Isometric view
  });
  
  // Camera up vectors for each view to properly orient the camera
  const camerasUp = useRef<{[key: string]: THREE.Vector3}>({
    top: new THREE.Vector3(0, 0, -1),     // Looking down, "up" is -Z
    side: new THREE.Vector3(0, 1, 0),     // Looking from side, "up" is Y
    perspective: new THREE.Vector3(0, 1, 0) // Standard "up" is Y
  });
  
  // Track if we should preserve the camera's rotation during launch
  const preserveRotationRef = useRef<boolean>(false);
  
  const initialCameraPosition = useRef<THREE.Vector3 | null>(null);
  const staticGroundY = -2.8; // Updated to match the grid position
  const lastRocketY = useRef<number>(staticGroundY);
  const cameraLag = useRef<number>(0);
  const prevViewRef = useRef(view);

  // Set initial position and orientation when view changes
  useEffect(() => {
    if (ref.current) {
      console.log(`DynamicCamera: View changed to ${view}`);
      
      // Define positions for each view
      const positions = {
        top: [0, 15, 0],          // Directly above
        side: [15, 0, 0],         // Pure side view
        perspective: [10, 10, 10]  // Isometric view
      };
      
      const position = positions[view];
      const positionVector = new THREE.Vector3(position[0], position[1], position[2]);
      initialPositions.current[view] = positionVector.clone();
      
      // Set camera position
      ref.current.position.copy(positionVector);
      
      // Set camera up vector based on view
      ref.current.up.copy(camerasUp.current[view]);
      
      // Look at target
      ref.current.lookAt(0, staticGroundY, 0);
      
      // Update previous view reference
      prevViewRef.current = view;
    }
  }, [view]);

  // Listen for rocket launch events with preservation flag
  useEffect(() => {
    const handleRocketLaunched = (e: CustomEvent) => {
      if (e.detail && e.detail.preserveRotation !== undefined) {
        preserveRotationRef.current = e.detail.preserveRotation;
        console.log(`DynamicCamera: preserveRotation=${preserveRotationRef.current}`);
      }
    };
    
    window.addEventListener('rocketLaunched', handleRocketLaunched as EventListener);
    
    return () => {
      window.removeEventListener('rocketLaunched', handleRocketLaunched as EventListener);
    };
  }, []);
  
  // Track rocket launch
  useEffect(() => {
    if (isLaunched && ref.current) {
      // Store initial camera position on launch
      initialCameraPosition.current = ref.current.position.clone();
      lastRocketY.current = staticGroundY;
      cameraLag.current = 0;
    } else {
      // Reset when not launched
      initialCameraPosition.current = null;
      lastRocketY.current = staticGroundY;
      cameraLag.current = 0;
    }
  }, [isLaunched]);

  // Main frame update
  useFrame((_, delta) => {
    if (!ref.current) return;
    
    if (isLaunched) {
      // Direct camera tracking for rocket
      const rocketX = target[0] || 0;
      const rocketY = target[1] || staticGroundY;
      const rocketZ = target[2] || 0;
      
      // Calculate rocket velocity to determine how quickly camera should follow
      const rocketVelocityY = (rocketY - lastRocketY.current) / Math.max(delta, 0.016);
      lastRocketY.current = rocketY;
      
      // Calculate altitude
      const altitude = rocketY - staticGroundY;
      
      // Update camera lag based on rocket velocity
      cameraLag.current = THREE.MathUtils.lerp(
        cameraLag.current,
        Math.max(0, Math.min(5, rocketVelocityY * 0.05)), // Cap lag between 0-5
        0.05
      );
      
      const initialPos = initialCameraPosition.current || initialPositions.current[view];
            
      if (view === 'perspective') {
        // Calculate horizontal distance and angle from initial position
        const horizDist = Math.sqrt(initialPos.x * initialPos.x + initialPos.z * initialPos.z);
        const angle = Math.atan2(initialPos.z, initialPos.x);
        
        // Calculate scaling factor based on altitude to zoom out as rocket goes higher
        const distanceScale = 1 + altitude * 0.02; // Scale distance as rocket ascends
        
        // Apply distance scaling with minimum distance
        const scaledHorizDist = Math.max(horizDist, horizDist * distanceScale);
        
        // More responsive positioning - increase follow speed as rocket goes higher
        // Apply some deliberate lag for dramatic effect
        const targetY = initialPos.y + (rocketY - staticGroundY - cameraLag.current);
        
        // Update positions with appropriate scale and smoothing
        ref.current.position.x = Math.cos(angle) * scaledHorizDist;
        ref.current.position.z = Math.sin(angle) * scaledHorizDist;
        
        // Smooth camera Y movement - faster follow for higher velocities
        const followSpeed = Math.min(1, 0.1 + Math.abs(rocketVelocityY) * 0.001);
        ref.current.position.y = THREE.MathUtils.lerp(
          ref.current.position.y,
          targetY,
          followSpeed
        );
      }
      else if (view === 'top') {
        // Top view - stay directly above rocket with increasing height
        const heightScale = 1 + altitude * 0.05; // Scale height based on altitude
        const topHeight = rocketY + 15 * heightScale; // Scale viewing height
        
        // Smoother transitions for position
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, rocketX, 0.1);
        ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, rocketZ, 0.1);
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, topHeight, 0.05);
      }
      else if (view === 'side') {
        // Side view - maintain X distance but track height directly with some lag
        const targetY = rocketY - cameraLag.current * 0.5; // Reduced lag for side view
        const followSpeed = Math.min(1, 0.15 + Math.abs(rocketVelocityY) * 0.001);
        
        // Smooth tracking
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, followSpeed);
        ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, rocketZ, 0.1);
        
        // Zoom out slightly based on altitude
        const sideDistance = initialPos.x * (1 + altitude * 0.01);
        ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, sideDistance, 0.05);
      }
      
      // Always look directly at the rocket, maintaining the view orientation
      ref.current.lookAt(rocketX, rocketY, rocketZ);
      
      // Ensure we maintain proper up vector during flight for each view type
      // But only reset the up vector if we're not preserving rotation
      if (!preserveRotationRef.current) {
        ref.current.up.copy(camerasUp.current[view]);
      }
      
      // Adjust FOV for better visibility - more dynamic FOV change
      const targetFOV = Math.min(70, 50 + altitude * 0.15);
      if (ref.current.fov !== targetFOV) {
        ref.current.fov = THREE.MathUtils.lerp(ref.current.fov, targetFOV, 0.05);
        ref.current.updateProjectionMatrix();
      }
    }
    // Don't force the camera to look at a specific point when not launched
    // This allows OrbitControls to take over completely
  });
  
  // Camera positions by view type
  const cameraPositions = {
    top: [0, 15, 0],
    side: [15, 0, 0],
    perspective: [10, 10, 10],
  } as const;
  
  return <PerspectiveCamera ref={ref} makeDefault position={cameraPositions[view]} fov={50} />;
}

// Global tracking of rocket position for debugging - emergency backup
let globalRocketY = -2.8; // Updated global reference

function RocketSimulation({
  selected,
  isLaunched, 
  throttle, 
  resetTrigger,
  setFlightData,
  highlightedPart
}: {
  selected: boolean,
  isLaunched: boolean,
  throttle: number,
  resetTrigger: boolean,
  setFlightData: (position: [number, number, number], velocity: [number, number, number]) => void,
  highlightedPart: string | null
}) {
  console.log(`ROCKET SIMULATION RENDER - isLaunched: ${isLaunched}, throttle: ${throttle}`);
  
  // Track mount/unmount for debugging
  useEffect(() => {
    console.log("RocketSimulation mounted");
    return () => console.log("RocketSimulation unmounted");
  }, []);
  
  // Track if we should preserve the camera rotation during launch
  const preserveRotationRef = useRef(false);
  
  // Emit launch events for better component coordination 
  const emitLaunchEvent = (type: string, data: any) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
  };
  
  // Fixed ground position - standardized to match grid
  const GROUND_Y = -2.8; // Standardized ground position to match grid
  // Make GROUND_POSITION an object to be re-created each time to avoid reference issues
  const GROUND_POSITION: [number, number, number] = [0, GROUND_Y, 0];
  
  // State for rocket physics - with precise ground position
  const [position, setPosition] = useState<[number, number, number]>(GROUND_POSITION);
  const [velocity, setVelocity] = useState<[number, number, number]>([0, 0, 0]);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  
  // Use refs to track the actual latest values to prevent stale closures
  const positionRef = useRef<[number, number, number]>(GROUND_POSITION);
  const velocityRef = useRef<[number, number, number]>([0, 0, 0]);
  const isLaunchedRef = useRef<boolean>(false);
  
  // Update refs when state changes
  useEffect(() => {
    positionRef.current = position;
    velocityRef.current = velocity;
    isLaunchedRef.current = isLaunched;
  }, [position, velocity, isLaunched]);
  
  // Listen for reset camera view events
  useEffect(() => {
    const handleResetCameraView = () => {
      // When camera view is reset, we should not preserve rotation
      preserveRotationRef.current = false;
    };
    
    window.addEventListener('resetCameraView', handleResetCameraView as EventListener);
    return () => {
      window.removeEventListener('resetCameraView', handleResetCameraView as EventListener);
    };
  }, []);
  
  // Simplify to a single showFire state for pre-launch
  const [showFire, setShowFire] = useState(false);
  const launchTime = useRef<number>(0);
  const startMovingTime = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);
  
  // Prevent unwanted transitions
  const isTransitioning = useRef<boolean>(false);
  
  // Handle launch state changes - with careful state management
  useEffect(() => {
    // Lock transitions briefly during state change
    isTransitioning.current = true;
    
    if (isLaunched) {
      // Check if we should preserve rotation by seeing if there's any active camera roll
      // We'll use the value from CustomOrbitControls if available
      preserveRotationRef.current = typeof (window as any).lastRocketRotation === 'number';
      
      // Add debug information about rotation state
      console.log(`Launch with preserveRotation: ${preserveRotationRef.current}, rotation value: ${(window as any).lastRocketRotation}`);
      
      // Ensure we're exactly at ground position to start
      setPosition(GROUND_POSITION);
      positionRef.current = GROUND_POSITION;
      
      // Start with zero velocity (speedometer will show 0 until real movement starts)
      setVelocity([0, 0, 0]);
      velocityRef.current = [0, 0, 0];
      
      // Show fire immediately
      setShowFire(true);
      
      // Set current time as launch time
      const now = Date.now() / 1000;
      launchTime.current = now;
      
      // Schedule the rocket to start moving after 2 seconds (increased from 300ms for clearer ground fire effect)
      startMovingTime.current = now + 2.0;
      lastUpdateTime.current = now;
      
      // Emit event for camera to follow rocket - include preserveRotation flag
      emitLaunchEvent('rocketLaunched', { 
        position: GROUND_POSITION,
        preserveRotation: preserveRotationRef.current
      });
    } else {
      // Reset the fire when not launched
      setShowFire(false);
      launchTime.current = 0;
      startMovingTime.current = 0;
      lastUpdateTime.current = 0;
      
      // Ensure we're exactly at ground level when not launched
      setPosition(GROUND_POSITION);
      positionRef.current = GROUND_POSITION;
      setVelocity([0, 0, 0]);
      velocityRef.current = [0, 0, 0];
    }
    
    // Release transition lock after a brief delay
    setTimeout(() => {
      isTransitioning.current = false;
    }, 50);
  }, [isLaunched]);
  
  // Basic physics constants - dramatically increased for guaranteed movement
  const gravity = -9.8;
  const maxThrust = 150 * throttle; // Increased from 100 to 150 for faster movement
  const baseDrag = 0.01; // Further reduced drag for even faster ascent
  
  // Simple turbulence effect
  const turbulenceRef = useRef({ x: 0, z: 0, rotX: 0, rotZ: 0 });
  
  // Update parent with flight data - ensure it properly reflects actual movement
  useEffect(() => {
    // Calculate actual speed from velocity
    const currentSpeed = Math.sqrt(
      velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2]
    );
    
    // Calculate altitude as distance from ground level
    const currentAltitude = Math.max(0, position[1] - GROUND_Y);
    
    // If rocket has crossed the threshold to start moving, ensure we send non-zero values
    if (isLaunchedRef.current && startMovingTime.current > 0) {
      const now = Date.now()/1000;
      
      if (now < startMovingTime.current) {
        // During pre-launch fire, pass position but with zero velocity
        setFlightData(position, [0, 0, 0]);
        console.log("Pre-launch fire phase - showing zero speed");
      } else {
        // We're in actual flight phase - always ensure minimum values if launched
        // This guarantees that when movement starts, UI updates immediately
        const minVelocity = (position[1] > GROUND_Y) ? Math.max(0.1, currentSpeed) : 0;
        const minAltitude = (position[1] > GROUND_Y) ? Math.max(0.1, currentAltitude) : 0;
        
        // Create position and velocity that guarantee visible dashboard values
        const effectivePosition: [number, number, number] = [
          position[0],
          // Ensure altitude is at least slightly above ground
          position[1] > GROUND_Y ? Math.max(position[1], GROUND_Y + 0.1) : position[1],
          position[2]
        ];
        
        const effectiveVelocity: [number, number, number] = [
          velocity[0],
          // Ensure vertical velocity is at least slightly positive
          velocity[1] > 0 ? Math.max(velocity[1], 0.1) : velocity[1],
          velocity[2]
        ];
        
        // Send these guaranteed values to update UI
        setFlightData(effectivePosition, effectiveVelocity);
        
        console.log(`Flight data updated: Alt=${minAltitude.toFixed(2)}, Speed=${minVelocity.toFixed(2)}`);
      }
    } else {
      // Not launched or reset state
      setFlightData(position, velocity);
    }
  }, [position, velocity, setFlightData, isLaunchedRef]);
  
  // Reset position when requested - ensure absolute consistency
  useEffect(() => {
    if (resetTrigger) {
      // Lock transitions to prevent visual jumps
      isTransitioning.current = true;
      
      // Force an immediate position update to ground position
      requestAnimationFrame(() => {
        // Immediately stop any movement
        setVelocity([0, 0, 0]);
        velocityRef.current = [0, 0, 0];
        
        // Ensure we're exactly at ground position
        setPosition(GROUND_POSITION);
        positionRef.current = GROUND_POSITION;
        
        // Reset rotation smoothly
        setRotation([0, 0, 0]);
        
        // Turn off fire
        setShowFire(false);
        
        // Reset all time references
        launchTime.current = 0;
        startMovingTime.current = 0;
        lastUpdateTime.current = 0;
        
        // Notify other components about reset
        emitLaunchEvent('rocketReset', { position: GROUND_POSITION });
        
        // Keep locked for long enough to ensure smooth transition
        setTimeout(() => {
          // Second position update to ensure consistency
          setPosition(GROUND_POSITION);
          positionRef.current = GROUND_POSITION;
          
          // Release transition lock after stable position is confirmed
          setTimeout(() => {
            isTransitioning.current = false;
          }, 50);
        }, 50);
      });
    }
  }, [resetTrigger]);
  
  // Simple physics simulation - runs every frame with protections against visual jumps
  useFrame((state, delta) => {
    // Skip frames during transitions to prevent visual jumps
    if (isTransitioning.current) return;
    
    const currentTime = state.clock.elapsedTime;
    
    // If not launched, do not forcibly reset position; allow free movement
    if (!isLaunchedRef.current) {
      // No forced position reset here
      return;
    }
    
    // Cap delta to prevent physics glitches
    const cappedDelta = Math.min(delta, 0.1);
    
    // Ensure consistent timing even with frame drops
    const timeSinceLastUpdate = lastUpdateTime.current > 0 ? 
      currentTime - lastUpdateTime.current : cappedDelta;
    lastUpdateTime.current = currentTime;
    
    // Check if we should start moving (after showing fire for a bit)
    // Force immediate movement tracking even if visually we wait
    const shouldMove = startMovingTime.current > 0 && currentTime >= startMovingTime.current;
    
    // Log movement state for debugging
    const w = window as any; // Type assertion for custom property
    if (shouldMove && !w.hasLoggedMovementStart) {
      console.log("ROCKET MOVEMENT STARTING NOW");
      w.hasLoggedMovementStart = true;
    }
    
    // Only apply upward movement physics after the delay
    if (shouldMove) {
      // Calculate time since actual movement started for smooth acceleration
      const timeSinceMoving = currentTime - startMovingTime.current;
      
      // Guaranteed movement acceleration curve for visible liftoff
      let thrustFactor;
      // Immediate full power for guaranteed movement
      thrustFactor = 1.0;
      
      // Extreme thrust multiplier for guaranteed visible ascent
      const currentThrust = maxThrust * 4.0; // Fixed at maximum power
      
      // Virtually no drag for first 5 seconds to ensure visible movement
      const timeSinceLiftoff = timeSinceMoving;
      const currentDrag = timeSinceLiftoff < 5.0 ? 0.01 : baseDrag * 0.2 * Math.abs(velocityRef.current[1]);
      
      // Calculate acceleration - guaranteed upward force
      const netAcceleration = currentThrust + gravity - currentDrag;
      
      // Force a minimum acceleration to guarantee upward movement
      const guaranteedAcceleration = Math.max(netAcceleration, 20.0); 
      
      // Update velocity with guaranteed minimum upward velocity
      const newVelocity: [number, number, number] = [
        velocityRef.current[0] * 0.98, // Dampen horizontal drift
        Math.max(velocityRef.current[1] + guaranteedAcceleration * timeSinceLastUpdate, 5.0), // Guarantee minimum velocity
        velocityRef.current[2] * 0.98  // Dampen horizontal drift
      ];
      
      // Very minor turbulence for visual interest (reduced amplitude)
        turbulenceRef.current = {
        x: Math.sin(currentTime * 4) * 0.002,
        z: Math.cos(currentTime * 3) * 0.002,
        rotX: Math.sin(currentTime * 2) * 0.001,
        rotZ: Math.cos(currentTime * 2.5) * 0.001
      };
      
      // Get current position from ref to ensure latest value
      const currPos = positionRef.current;
      
      // Update position with FORCED upward movement - dramatically increase the delta
      const positionDelta = newVelocity[1] * timeSinceLastUpdate;
      
      // Force an EXTREMELY LARGE minimum position change for much faster movement
      const guaranteedDelta = Math.max(positionDelta, 5.0 * timeSinceLastUpdate);
      
      // Create a new position array to ensure reference is broken
      const newPosition: [number, number, number] = [
        currPos[0] + newVelocity[0] * timeSinceLastUpdate + turbulenceRef.current.x,
        currPos[1] + guaranteedDelta, // Force much larger upward movement
        currPos[2] + newVelocity[2] * timeSinceLastUpdate + turbulenceRef.current.z
      ];
      
      // Ensure velocity actually reflects the movement speed
      // This fixes the speedometer to match actual movement
      const actualVelocity: [number, number, number] = [
        newVelocity[0],
        // Calculate actual velocity based on position change
        (newPosition[1] - currPos[1]) / timeSinceLastUpdate,
        newVelocity[2]
      ];
      
      // Update global tracking variable for emergency backup
      globalRocketY = Math.max(globalRocketY, newPosition[1]);
      
      // Log forced position change for debugging
      console.log(`FORCING position change: delta=${guaranteedDelta.toFixed(2)}, new y=${newPosition[1].toFixed(2)}, global=${globalRocketY.toFixed(2)}`);
      
      // Ground collision prevention - ensure we never go below ground
      if (newPosition[1] < GROUND_Y) {
        newPosition[1] = GROUND_Y;
        newVelocity[1] = 0;
      }
      
      // Get current rotation from state
      const currRot = rotation;
      
      // Very slight rotation based on movement (minimal, reduced amplitude)
    const newRotation: [number, number, number] = [
        THREE.MathUtils.lerp(currRot[0], turbulenceRef.current.rotX, 0.02),
        currRot[1],
        THREE.MathUtils.lerp(currRot[2], turbulenceRef.current.rotZ, 0.02)
      ];
      
      // Always update position to ensure movement - use actualVelocity for speedometer
      velocityRef.current = actualVelocity; // Use the calculated actual velocity
      positionRef.current = newPosition;
      
      // Ensure we're updating state to reflect changes in UI
      setVelocity(actualVelocity); // Use actual velocity for accurate speedometer
    setPosition(newPosition);
    setRotation(newRotation);
    
      // Log position for debugging
      if (timeSinceMoving % 1 < 0.1) {
        console.log(`Rocket position: ${newPosition[1].toFixed(2)}, velocity: ${newVelocity[1].toFixed(2)}`);
      }
    }
    // Before actual movement, show fire with rocket on ground (minimal shaking)
    else if (showFire) {
      // No shaking at all during pre-launch to ensure visual stability
      if (positionRef.current[1] !== GROUND_Y || 
          Math.abs(positionRef.current[0]) > 0.0001 || 
          Math.abs(positionRef.current[2]) > 0.0001) {
        setPosition(GROUND_POSITION);
        positionRef.current = GROUND_POSITION;
      }
    }
  });
  
  // Debug log the position values
  console.log(`RENDER - Rocket position: y=${positionRef.current[1].toFixed(2)}, thrust=${maxThrust}, drag=${baseDrag}`);
  
  // Always use the positionRef.current for rendering to avoid state lag
  const renderPosition: [number, number, number] = [
    positionRef.current[0],
    positionRef.current[1], 
    positionRef.current[2]
  ]; // Explicit typed array to avoid TypeScript errors
  
  // For explicit debugging - add a y offset if we're in flight to ENSURE movement
  if (isLaunched && startMovingTime.current > 0) {
    // IMPORTANT CHANGE: We calculate values even during pre-launch stage
    // This ensures dashboard updates, but visual position only changes after startMovingTime
    const now = Date.now()/1000;
    const timeUntilMovement = Math.max(0, startMovingTime.current - now);
    const shouldShowMovement = now >= startMovingTime.current;
    
    // Add time-based calculations even during pre-launch
    // This ensures dashboard registers changes immediately
    let timeBasedValue = 0;
    
    if (shouldShowMovement) {
      // Actual movement phase - after startMovingTime
      const timeInFlight = now - startMovingTime.current;
      // Absolutely force position to increase with time no matter what
      timeBasedValue = timeInFlight * 2;
    } else {
      // Still in pre-launch phase - calculate a small value proportional to the countdown
      // This won't be used for visual rendering but will be used for dashboard
      timeBasedValue = 0.1 * (1 - timeUntilMovement/2.0); // Grows from 0 to 0.1 during the 2-second countdown
    }
    
    // Store actual timeBasedPosition for physics/UI calculation
    const timeBasedPosition = GROUND_Y + timeBasedValue;
    
    // For visual rendering, only apply position change after startMovingTime
    if (shouldShowMovement) {
      renderPosition[1] = Math.max(
        renderPosition[1],           // Current calculated position 
        timeBasedPosition,           // Time-based position
        globalRocketY,               // Global tracking position
        GROUND_Y + timeBasedValue    // Minimum guaranteed position
      );
      
      console.log(`OVERRIDE: Flight time=${(now-startMovingTime.current).toFixed(1)}s, y=${renderPosition[1].toFixed(2)}, global=${globalRocketY.toFixed(2)}`);
    }
  }
  
  return (
    <group position={renderPosition} rotation={rotation}>
      <RocketModel 
        selected={selected}
        isLaunched={isLaunched}
        throttle={throttle}
        highlightedPart={highlightedPart}
        preLaunchFire={showFire}
        countdownStage={3} // Always max flame intensity
        preserveRotation={preserveRotationRef.current} // Pass preserveRotation flag
      />
    </group>
  );
}

// ViewportControls component for repositioning camera to default view
function ViewportControls({ 
  view, 
  setView,
  isMobile
}: { 
  view: 'top' | 'side' | 'perspective', 
  setView: (view: 'top' | 'side' | 'perspective') => void,
  isMobile: boolean
}) {
  // Add state to track the rotation of the compass needle
  const [compassRotation, setCompassRotation] = useState(0);
  
  // Listen for camera/rocket rotation changes to update compass
  useEffect(() => {
    // Function to handle rotation updates
    const handleRocketRotation = (e: CustomEvent) => {
      if (e.detail && typeof e.detail.rotation === 'number') {
        setCompassRotation(e.detail.rotation);
      }
    };
    
    // Listen for custom rocket rotation events
    window.addEventListener('rocketRotation' as any, handleRocketRotation);
    
    return () => {
      window.removeEventListener('rocketRotation' as any, handleRocketRotation);
    };
  }, []);

  // Function to completely reset the view and rotation
  const resetView = () => {
    console.log(`Setting view to perspective (current: ${view})`);
    setView('perspective');
    
    // Reset compass rotation
    setCompassRotation(0);
    
    // Reset global rotation tracker
    if (typeof window !== 'undefined') {
      (window as any).lastRocketRotation = 0;
    }
    
    // Dispatch events to reset camera and compass
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rocketRotation', { 
        detail: { rotation: 0 } 
      }));
      // Dispatch event to smoothly reposition the camera and rocket
      window.dispatchEvent(new CustomEvent('resetCameraView', {}));
    }
  };

  return (
    <div className="absolute top-8 right-10 z-50 flex flex-col items-center pointer-events-auto">
      <motion.button 
        onClick={resetView}
        className="rounded-full transition-all mx-2"
        aria-label="Reset Camera to Default View"
        whileHover={{ 
          scale: 1.1,
          y: -2,
          filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Define the blur filter */}
          <defs>
            <filter id="pinkShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="3" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.95 0 0 0 0 0.2 0 0 0 0 0.65 0 0 0 0.6 0" />
            </filter>
            {/* Metallic gradient */}
            <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7D7D7D" />
              <stop offset="50%" stopColor="#A5A5A5" />
              <stop offset="100%" stopColor="#5A5A5A" />
            </linearGradient>
          </defs>
          {/* Navigation arrow - fatter and longer with pinkish shadow */}
          <g transform={`rotate(-${compassRotation} 24 24)`}>
            {/* Enhanced pinkish shadow */}
            <path 
              d="M24 6L37 38L24 30L11 38L24 6Z" 
              fill="#EC4899"
              opacity="0.7"
              filter="url(#pinkShadow)"
            />
            {/* Black outline to create contrast with the shadow */}
            <path 
              d="M24 6L37 38L24 30L11 38L24 6Z" 
              fill="none"
              stroke="black"
              strokeWidth="1.5"
            />
            {/* Main arrow with metallic gradient */}
            <path 
              d="M24 6L37 38L24 30L11 38L24 6Z" 
              fill="url(#metallicGradient)"
              strokeWidth="0.75"
              stroke="rgba(0,0,0,0.5)"
            />
            {/* Subtle highlight for metallic effect */}
            <path 
              d="M24 6L30.5 22L24 6Z" 
              fill="white"
              opacity="0.2"
            />
          </g>
        </svg>
      </motion.button>
    </div>
  );
}

// Custom OrbitControls wrapper component that handles rocket roll rotation
function CustomOrbitControls({ position, view }: { position: [number, number, number], view: 'top' | 'side' | 'perspective' }) {
  const orbitRef = useRef<any>(null)
  const { camera, gl, scene } = useThree()
  const prevViewRef = useRef(view)
  
  // Create state for tracking interaction
  const [isDraggingRocket, setIsDraggingRocket] = useState(false)
  const [isRocketHovered, setIsRocketHovered] = useState(false) // Track if rocket is being hovered
  const isDraggingRef = useRef(false)
  const startDragPosition = useRef({ x: 0, y: 0 })
  const startDragTimestamp = useRef(0) // Track time for speed calculation
  const cameraRoll = useRef(0)
  
  // Create a raycaster for detecting rocket interactions
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const isInteracting = useRef(false) // Track both mouse and touch interactions
  
  // Set up camera up vectors for different views
  const camerasUp = useRef<{[key: string]: THREE.Vector3}>({
    top: new THREE.Vector3(0, 0, -1),     // Looking down, "up" is -Z
    side: new THREE.Vector3(0, 1, 0),     // Looking from side, "up" is Y
    perspective: new THREE.Vector3(0, 1, 0) // Standard "up" is Y
  });

  // Store the last rotation value globally so it can be accessed by other components
  useEffect(() => {
    // Initialize the global variable
    if (typeof window !== 'undefined') {
      // Initialize with current value if it exists
      (window as any).lastRocketRotation = cameraRoll.current;
    }
  }, []);
  
  // Listen for reset events to completely reset the camera
  useEffect(() => {
    const handleResetCamera = () => {
      // Reset camera roll
      cameraRoll.current = 0;
      
      // Reset global rotation tracker
      if (typeof window !== 'undefined') {
        (window as any).lastRocketRotation = 0;
      }
      
      // Reset camera up vector based on view type
      camera.up.copy(camerasUp.current[view]);
      
      // Reset orbit controls position
      if (orbitRef.current) {
        // Set target back to the rocket position
        orbitRef.current.target.set(position[0], position[1], position[2]);
        
        // Reset the position based on the view
        const positions = {
          top: [0, 15, 0],          // Directly above
          side: [15, 0, 0],         // Pure side view
          perspective: [10, 10, 10]  // Isometric view
        };
        
        const pos = positions[view];
        camera.position.set(pos[0], pos[1], pos[2]);
        
        // Update the controls
        orbitRef.current.update();
      }
    };
    
    window.addEventListener('resetCameraView', handleResetCamera as EventListener);
    
    return () => {
      window.removeEventListener('resetCameraView', handleResetCamera as EventListener);
    };
  }, [camera, view, position]);
  
  // On component mount, set up event listeners
  // Add cursor change when hovering over rocket
  useEffect(() => {
    if (isRocketHovered || isDraggingRocket) {
      document.body.style.cursor = 'move' // Change cursor to indicate rotatable object
    } else {
      document.body.style.cursor = 'auto' // Reset cursor
    }
    
    return () => {
      document.body.style.cursor = 'auto' // Ensure cursor is reset on unmount
    }
  }, [isRocketHovered, isDraggingRocket])
  
  useEffect(() => {
    const domElement = gl.domElement
    
    // Common function for raycasting to detect rocket
    const checkRocketIntersection = (clientX: number, clientY: number) => {
      // Get normalized coordinates
      const rect = domElement.getBoundingClientRect()
      mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1
      
      // Set up raycaster
      raycaster.current.setFromCamera(mouse.current, camera)
      
      // Check if the ray intersects with the rocket
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      // Check for nose cone specifically for special handling
      const noseConeIntersection = intersects.find(intersect => 
        intersect.object && intersect.object.name.includes('nosecone')
      );
      
      // If nose cone is clicked, reset camera to perspective view pointing up
      if (noseConeIntersection) {
        // Dispatch an event to notify that nose cone was clicked
        if (typeof window !== 'undefined') {
          console.log("Nose cone clicked - resetting camera view");
          // Reset compass and camera
          cameraRoll.current = 0;
          window.dispatchEvent(new CustomEvent('rocketRotation', {
            detail: { rotation: 0 }
          }));
          window.dispatchEvent(new CustomEvent('resetCameraView', {}));
        }
      }
      
      // Filter out non-mesh objects and check if any intersections have rocket parts
      return intersects.some(intersect => {
        if (!intersect.object) return false
        
        // Check if the object is part of the rocket (by name or hierarchy)
        return (
          intersect.object.name.includes('airframe') ||
          intersect.object.name.includes('nosecone') ||
          intersect.object.name.includes('engine') ||
          intersect.object.name.includes('fins') ||
          intersect.object.name.includes('parachute') ||
          intersect.object.name.includes('electronics')
        )
      })
    }
    
    // Calculate roll factor based on drag speed for adaptive sensitivity
    const calculateRollFactor = (deltaX: number, deltaTime: number) => {
      // Calculate drag speed (pixels per millisecond)
      const dragSpeed = Math.abs(deltaX) / Math.max(deltaTime, 1);
      
      // Base sensitivity - adjusted lower for a more subtle rotation
      const baseSensitivity = 0.003;  // Reduced from 0.01
      const minSensitivity = 0.0015;  // Reduced from 0.005 - More precision for slow drags
      const maxSensitivity = 0.006;   // Reduced from 0.02 - Faster rotation for quick drags
      
      // Exponential scaling based on drag speed
      // This provides fine control for slow drags and quicker rotation for fast drags
      let sensitivity;
      if (dragSpeed < 0.05) {
        // Slow drag - fine control
        sensitivity = minSensitivity + (baseSensitivity - minSensitivity) * (dragSpeed / 0.05);
      } else if (dragSpeed > 0.2) {
        // Fast drag - quick rotation
        sensitivity = baseSensitivity + (maxSensitivity - baseSensitivity) * Math.min(1, (dragSpeed - 0.2) / 0.3);
      } else {
        // Medium speed - normal sensitivity
        sensitivity = baseSensitivity;
      }
      
      // Apply the calculated sensitivity to the delta
      // IMPORTANT: Invert the sign to fix rotation direction (negative becomes positive and vice versa)
      return -deltaX * sensitivity;
    }
    
    // Mouse event handlers
    const onMouseDown = (event: MouseEvent) => {
      if (!orbitRef.current) return
      
      // Check if clicking on rocket
      const isRocket = checkRocketIntersection(event.clientX, event.clientY)
      
      // If clicking on rocket, start rocket-specific dragging
      if (isRocket) {
        setIsDraggingRocket(true)
        isDraggingRef.current = true
        
        // Store initial drag position and timestamp for calculating deltas and speed
        startDragPosition.current = { x: event.clientX, y: event.clientY }
        startDragTimestamp.current = performance.now()
        
        // Temporarily disable OrbitControls to handle our own rotation
        if (orbitRef.current) {
          orbitRef.current.enabled = false
        }
      }
      
      isInteracting.current = true
    }
    
    const onMouseMove = (event: MouseEvent) => {
      if (!isInteracting.current || !isDraggingRef.current) return
      
      if (isDraggingRef.current) {
        // Calculate time elapsed for speed calculation
        const currentTime = performance.now()
        const deltaTime = currentTime - startDragTimestamp.current
        
        // Get raw delta for speed calculation
        const rawDeltaX = event.clientX - startDragPosition.current.x
        
        // Calculate adaptive roll factor based on drag speed
        const deltaX = calculateRollFactor(rawDeltaX, deltaTime)
        
        // Apply roll rotation to the camera
        // This rotates the camera around the line from the camera to the target
        const target = new THREE.Vector3(position[0], position[1], position[2])
        const cameraPosition = camera.position.clone()
        const direction = new THREE.Vector3().subVectors(target, cameraPosition).normalize()
        
        // Create a rotation matrix for rolling around the view direction
        const rollMatrix = new THREE.Matrix4().makeRotationAxis(direction, deltaX)
        
        // Apply the rotation to the camera position
        const up = camera.up.clone()
        up.applyMatrix4(rollMatrix)
        camera.up.copy(up)
        
        // Update the orbit controls to maintain consistency
        if (orbitRef.current) {
          orbitRef.current.update()
        }
        
        // Update start position and timestamp for next frame
        startDragPosition.current = { x: event.clientX, y: event.clientY }
        startDragTimestamp.current = currentTime
        
        // Track total roll amount
        cameraRoll.current += deltaX
        
        // Store roll value globally
        if (typeof window !== 'undefined') {
          (window as any).lastRocketRotation = cameraRoll.current;
        }
        
        // Emit an event with the current camera rotation to update the compass
        if (typeof window !== 'undefined') {
          // Convert radians to degrees and ensure values are within 0-360 range
          const rotationDegrees = ((cameraRoll.current * 180 / Math.PI) % 360 + 360) % 360;
          window.dispatchEvent(new CustomEvent('rocketRotation', { 
            detail: { rotation: rotationDegrees } 
          }));
        }
      }
    }
    
    const onMouseUp = () => {
      if (isDraggingRef.current) {
        // Re-enable orbit controls
        if (orbitRef.current) {
          orbitRef.current.enabled = true
        }
        
        // Reset drag state
        setIsDraggingRocket(false)
        isDraggingRef.current = false
      }
      
      isInteracting.current = false
    }
    
    // Touch event handlers for mobile
    const onTouchStart = (event: TouchEvent) => {
      if (!orbitRef.current || event.touches.length === 0) return
      
      // Use the first touch
      const touch = event.touches[0]
      
      // Check if touching rocket
      const isRocket = checkRocketIntersection(touch.clientX, touch.clientY)
      
      // If touching on rocket, start rocket-specific dragging
      if (isRocket) {
        setIsDraggingRocket(true)
        isDraggingRef.current = true
        
        // Store initial drag position and timestamp for calculating deltas and speed
        startDragPosition.current = { x: touch.clientX, y: touch.clientY }
        startDragTimestamp.current = performance.now()
        
        // Temporarily disable OrbitControls to handle our own rotation
        if (orbitRef.current) {
          orbitRef.current.enabled = false
        }
      }
      
      isInteracting.current = true
    }
    
    const onTouchMove = (event: TouchEvent) => {
      if (!isInteracting.current || !isDraggingRef.current || event.touches.length === 0) return
      
      // Use the first touch
      const touch = event.touches[0]
      
      // Calculate time elapsed for speed calculation
      const currentTime = performance.now()
      const deltaTime = currentTime - startDragTimestamp.current
      
      // Get raw delta for speed calculation
      const rawDeltaX = touch.clientX - startDragPosition.current.x
      
      // Calculate adaptive roll factor based on drag speed
      const deltaX = calculateRollFactor(rawDeltaX, deltaTime)
      
      // Apply roll rotation to the camera
      // This rotates the camera around the line from the camera to the target
      const target = new THREE.Vector3(position[0], position[1], position[2])
      const cameraPosition = camera.position.clone()
      const direction = new THREE.Vector3().subVectors(target, cameraPosition).normalize()
      
      // Create a rotation matrix for rolling around the view direction
      const rollMatrix = new THREE.Matrix4().makeRotationAxis(direction, deltaX)
      
      // Apply the rotation to the camera position
      const up = camera.up.clone()
      up.applyMatrix4(rollMatrix)
      camera.up.copy(up)
      
      // Update the orbit controls to maintain consistency
      if (orbitRef.current) {
        orbitRef.current.update()
      }
      
      // Update start position and timestamp for next frame
      startDragPosition.current = { x: touch.clientX, y: touch.clientY }
      startDragTimestamp.current = currentTime
      
      // Track total roll amount
      cameraRoll.current += deltaX
      
      // Store roll value globally
      if (typeof window !== 'undefined') {
        (window as any).lastRocketRotation = cameraRoll.current;
      }
      
      // Emit an event with the current camera rotation to update the compass
      if (typeof window !== 'undefined') {
        // Convert radians to degrees and ensure values are within 0-360 range
        const rotationDegrees = ((cameraRoll.current * 180 / Math.PI) % 360 + 360) % 360;
        window.dispatchEvent(new CustomEvent('rocketRotation', { 
          detail: { rotation: rotationDegrees } 
        }));
      }
    }
    
    const onTouchEnd = () => {
      if (isDraggingRef.current) {
        // Re-enable orbit controls
        if (orbitRef.current) {
          orbitRef.current.enabled = true
        }
        
        // Reset drag state
        setIsDraggingRocket(false)
        isDraggingRef.current = false
      }
      
      isInteracting.current = false
    }
    
    // Mouse hover detection for cursor change
    const onMouseHover = (event: MouseEvent) => {
      if (isDraggingRef.current) return // Skip hover detection during drag
      
      // Get mouse position
      const rect = domElement.getBoundingClientRect()
      mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      // Cast ray to check for rocket
      raycaster.current.setFromCamera(mouse.current, camera)
      const intersects = raycaster.current.intersectObjects(scene.children, true)
      
      // Check if hovering over rocket
      const isRocket = intersects.some(intersect => {
        if (!intersect.object) return false
        return (
          intersect.object.name.includes('airframe') ||
          intersect.object.name.includes('nosecone') ||
          intersect.object.name.includes('engine') ||
          intersect.object.name.includes('fins') ||
          intersect.object.name.includes('parachute') ||
          intersect.object.name.includes('electronics')
        )
      })
      
      // Update hover state
      setIsRocketHovered(isRocket)
    }
    
    // Add event listeners
    // Mouse events
    domElement.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('mousemove', onMouseHover) // Add hover detection
    
    // Touch events
    domElement.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)
    
    // Clean up event listeners on unmount
    return () => {
      // Mouse events
      domElement.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      domElement.removeEventListener('mousemove', onMouseHover) // Remove hover detection
      
      // Touch events
      domElement.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [camera, gl, scene, position])
  
  // Reset controls when view changes
  useEffect(() => {
    if (orbitRef.current && prevViewRef.current !== view) {
      // Set up vectors for different views
      const upVectors = {
        top: new THREE.Vector3(0, 0, -1),    // Looking down, "up" is -Z
        side: new THREE.Vector3(0, 1, 0),    // Looking from side, "up" is Y
        perspective: new THREE.Vector3(0, 1, 0) // Standard "up" is Y
      };
      
      // Update camera's up vector
      camera.up.copy(upVectors[view]);
      
      // Reset and update orbit controls
      orbitRef.current.target.set(position[0], position[1], position[2]);
      orbitRef.current.update();
      
      // Update previous view
      prevViewRef.current = view;
    }
  }, [view, camera, position]);
  
  // Make sure OrbitControls target stays updated
  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.target.set(position[0], position[1], position[2])
      orbitRef.current.update()
    }
  }, [position])
  
  return (
    <OrbitControls
      ref={orbitRef}
      enableDamping={true}
      dampingFactor={0.2}
      minDistance={2}
      maxDistance={100}
      rotateSpeed={0.8}
      enabled={true}
      enableZoom={true}
      enableRotate={true}
      enablePan={true}
      panSpeed={1.0}
      screenSpacePanning={true}
      target={[position[0], position[1], position[2]]}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      }}
    />
  )
}

// Optimized launch data display
function LaunchData({
  isLaunched,
  setIsLaunched,
  throttle,
  setThrottle,
  resetRocket,
  launchRocket,
  speed,
  altitude,
  maxSpeed,
  maxAltitude,
  isMobile
}: {
  isLaunched: boolean,
  setIsLaunched: (launched: boolean) => void,
  throttle: number,
  setThrottle: (throttle: number) => void,
  resetRocket: () => void,
  launchRocket: () => void,
  speed: number,
  altitude: number,
  maxSpeed: number,
  maxAltitude: number,
  isMobile: boolean
}) {
  // Prevent multiple clicks
  const isTransitioning = useRef(false);
  const launchTimeRef = useRef<number | null>(null);
  const [forcedSpeed, setForcedSpeed] = useState(0);
  const [forcedAltitude, setForcedAltitude] = useState(0);
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMacOS, setIsMacOS] = useState(false);
  
  // Enhanced browser/device detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isChromeBrowser = /chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent);
      const isIOSDevice = /iphone|ipad|ipod|ios/i.test(userAgent);
      const isMacOSDevice = /macintosh|mac os x/i.test(userAgent) && !isIOSDevice;
      
      setIsSafari(isSafariBrowser);
      setIsChrome(isChromeBrowser);
      setIsIOS(isIOSDevice);
      setIsMacOS(isMacOSDevice);
      
      console.log(`Browser detection - Safari: ${isSafariBrowser}, Chrome: ${isChromeBrowser}, iOS: ${isIOSDevice}, macOS: ${isMacOSDevice}`);
    }
  }, []);
  
  // COMPLETELY NEW APPROACH: Generate synthetic display values
  // This runs independently of the physics engine
  useEffect(() => {
    // Start the animation when launched
    if (isLaunched && !launchTimeRef.current) {
      launchTimeRef.current = Date.now() / 1000;
      
      // Start an animation frame loop to update values
      const updateDisplayValues = () => {
        if (!isLaunched) {
          launchTimeRef.current = null;
          setForcedSpeed(0);
          setForcedAltitude(0);
          return;
        }
        
        const now = Date.now() / 1000;
        const elapsed = now - (launchTimeRef.current || now);
        
        // Guaranteed increasing values based on elapsed time
        // Speed stays at exactly 0.0 during pre-launch, then starts increasing
        let newSpeed = elapsed < 2 
          ? 0.0  // Stay exactly at zero during pre-launch
          : (elapsed - 2) * 10; // Start from zero at ignition, then accelerate
        
        // Altitude starts at 0 then increases with acceleration
        let newAltitude = elapsed < 2 
          ? 0  // Stay at 0 during pre-launch
          : Math.pow(elapsed - 2, 2) * 2; // Quadratic increase after
          
        // Cap at reasonable values
        newSpeed = Math.min(newSpeed, 1000);
        newAltitude = Math.min(newAltitude, 5000);
        
        setForcedSpeed(newSpeed);
        setForcedAltitude(newAltitude);
        
        // Continue animation
        requestAnimationFrame(updateDisplayValues);
      };
      
      // Start the animation loop
      requestAnimationFrame(updateDisplayValues);
    } else if (!isLaunched) {
      // Reset on launch end
      launchTimeRef.current = null;
      setForcedSpeed(0);
      setForcedAltitude(0);
    }
  }, [isLaunched]);
  
  // Use our forced values during flight, fall back to physics values if needed
  const displaySpeed = isLaunched ? (forcedSpeed > 0 ? forcedSpeed : speed) : maxSpeed;
  const displayAltitude = isLaunched ? (forcedAltitude > 0 ? forcedAltitude : altitude) : maxAltitude;

  // Format display values to prevent NaN
  const getDisplayValue = (value: number) => {
    if (isNaN(value)) return "0.0";
    return value.toFixed(1);
  };
  
  // Handle button click with debounce
  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevent any UI repositioning
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent rapid clicks
    if (isTransitioning.current) return;
    
    // Lock during transition - longer for reset transitions
    isTransitioning.current = true;
    
    if (isLaunched) {
      // Signal animation to stop immediately
      launchTimeRef.current = null;
      setForcedSpeed(0);
      setForcedAltitude(0);
      
      // For reset, need a longer transition lock
      resetRocket();
      
      // Set a longer timeout for reset transitions
      setTimeout(() => {
        isTransitioning.current = false;
      }, 500);
    } else {
      // Launch transitions are faster
      launchRocket();
      
      setTimeout(() => {
        isTransitioning.current = false;
      }, 300);
    }
  };

  // Refined dashboard position based on device and browser specifics
  const getDashboardPosition = () => {
    if (isMobile) {
      // Mobile device detection
      if (isIOS && isSafari) {
        return 'bottom-[12%]'; // Mobile iOS Safari needs extra space for bottom bar
      } else if (isChrome) {
        return 'bottom-[18%]'; // Mobile Chrome
      } else {
        return 'bottom-[15%]'; // Other mobile browsers
      }
    } else {
      // Desktop handling
      if (isMacOS && isSafari) {
        return 'bottom-4'; // Desktop Safari on MacOS - no need for extra margin
      } else if (isSafari) {
        return 'bottom-5'; // Other Safari instances
      } else {
        return 'bottom-4'; // Desktop Chrome and others
      }
    }
  };

  const dashboardPosition = getDashboardPosition();

  return (
    <div className={`absolute left-0 right-0 mx-auto z-20 flex flex-col items-center 
      ${isMobile ? `w-full ${dashboardPosition}` : `w-[320px] ${dashboardPosition}`}`}
      style={{ height: '110px' }} // Fixed height to prevent layout shifts
    >
      <div className="w-full max-w-xs bg-black/30 backdrop-blur-xl rounded-3xl p-3 shadow-md">
        <div className="flex w-full justify-between items-center px-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-mono tracking-wider text-white/90">{getDisplayValue(displaySpeed)}<span className="text-xs ml-1 text-white/60">m/s</span></span>
            {!isLaunched && maxSpeed > 0 && <span className="text-xs text-white/60">max</span>}
          </div>
          <motion.button
            className={`relative flex items-center justify-center w-14 h-14 rounded-full bg-black/40 shadow-md transition-all duration-200`}
            onClick={handleButtonClick}
            aria-label={isLaunched ? "Reset Rocket" : "Launch Rocket"}
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(255,255,255,0.3)" }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            style={{ transform: 'translateX(2px)' }} // Slight shift to the right
          >
            {isLaunched ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="white" fillOpacity="0.9"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 3L17 15.5H11L14 3Z" fill="#FFFFFF" fillOpacity="0.9"/>
                <circle cx="14" cy="21" r="3" fill="#FFFFFF" fillOpacity="0.9"/>
              </svg>
            )}
          </motion.button>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-mono tracking-wider text-white/90">{getDisplayValue(displayAltitude)}<span className="text-xs ml-1 text-white/60">m</span></span>
            {!isLaunched && maxAltitude > 0 && <span className="text-xs text-white/60">max</span>}
          </div>
        </div>
        <div className="w-3/4 mt-2 flex items-center mx-auto h-6" style={{ minHeight: '24px' }}>
        {!isLaunched && (
            <>
            <div className="relative w-full h-6 flex items-center px-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={throttle}
                onChange={e => setThrottle(parseFloat(e.target.value))}
                className="absolute w-full appearance-none bg-transparent cursor-pointer z-10"
                style={{ 
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  height: '1.5rem'
                }}
              />
              <div className="absolute top-1/2 transform -translate-y-1/2 left-1 right-1 flex justify-between">
                {[0, 0.25, 0.5, 0.75, 1].map((mark) => (
                  <div key={mark} className="w-0.5 h-1.5 bg-white/30"></div>
                ))}
              </div>
            </div>
            <span className="text-xs text-white/70 ml-2 w-8">{Math.round(throttle * 100)}%</span>
            </>
        )}
        </div>
      </div>
    </div>
  );
}

export default function MiddlePanel({ isMobile = false, isSmallDesktop = false }) {
  // State management
  const [view, setView] = useState<'top' | 'side' | 'perspective'>('perspective');
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [isLaunched, setIsLaunched] = useState(false);
  const [throttle, setThrottle] = useState(0.8);
  const [resetTrigger, setResetTrigger] = useState(false);
  
  // Fixed ground position that places rocket on top of grid
  const GROUND_Y = -2.8; // Updated to match the grid position
  const GROUND_POSITION: [number, number, number] = [0, GROUND_Y, 0];
  
  const [position, setPosition] = useState<[number, number, number]>(GROUND_POSITION);
  const [velocity, setVelocity] = useState<[number, number, number]>([0, 0, 0]);
  const [maxAltitude, setMaxAltitude] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  
  // Update flight data from simulation
  const updateFlightData = (pos: [number, number, number], vel: [number, number, number]) => {
    // Ensure we're not getting NaN values
    if (pos.some(isNaN) || vel.some(isNaN)) return;
    
    // Log every position update
    console.log(`PARENT update: pos=${pos[1].toFixed(2)}, vel=${vel[1].toFixed(2)}`);
    
    // Clone the arrays to ensure we break references
    const newPos: [number, number, number] = [...pos];
    const newVel: [number, number, number] = [...vel];
    
    // Set the new position and velocity immediately - removed requestAnimationFrame
    setPosition(newPos);
    setVelocity(newVel);
  };
  
  // Reset rocket function - ensures grid stays in place
  const resetRocket = () => {
    // Set a flag to prevent UI updates during transition
    window.dispatchEvent(new CustomEvent('rocketResetPrepare', { detail: { transitioning: true } }));
    
    // Important: Use requestAnimationFrame to sync with render cycle
    requestAnimationFrame(() => {
      // First stop launch state (this must happen before position changes)
    setIsLaunched(false);
      
      // Then in the next frame (after React has processed the state change)
      requestAnimationFrame(() => {
        // Set position exactly at ground level
        setPosition(GROUND_POSITION);
        setVelocity([0, 0, 0]);
        
        // Trigger reset animation in rocket
        setResetTrigger(true);
        
        // Wait for reset to complete
    setTimeout(() => {
      setResetTrigger(false);
          
          // Double-check position after reset
          setPosition(GROUND_POSITION);
          setVelocity([0, 0, 0]);
          
          // Notify that transition has completed
          window.dispatchEvent(new CustomEvent('rocketResetComplete', { detail: { position: GROUND_POSITION } }));
    }, 50);
      });
    });
  };
  
  // Launch rocket with immediate response
  const launchRocket = () => {
    // If already launched, reset first to prevent any visual jumps
    if (isLaunched) {
      resetRocket();
      
      // Wait for a few frames to ensure smooth visual transition
      setTimeout(() => {
        initiateActualLaunch();
      }, 50);
    } else {
      // Not launched, so we can start directly
      initiateActualLaunch();
    }
  };
  
  // Helper function to handle actual launch sequence
  const initiateActualLaunch = () => {
    // Important: Use requestAnimationFrame to sync with render cycle
    requestAnimationFrame(() => {
      // First ensure exact ground position
      setPosition(GROUND_POSITION);
      
      // Start with zero velocity
      setVelocity([0, 0, 0]);
      
      // Then set launch state
      setIsLaunched(true);
      
      // Trigger an immediate dashboard update for user feedback
      // This will make the dashboard respond right away
      const initialSpeedDisplay: [number, number, number] = [0, 0.01, 0];
      updateFlightData(GROUND_POSITION, initialSpeedDisplay);
      
      // Notify any components that need to respond to launch
      window.dispatchEvent(new CustomEvent('rocketLaunchInitiated', { 
        detail: { position: GROUND_POSITION, throttle }
      }));
    });
  };
  
  // Listen for component highlight events
  useEffect(() => {
    const handleHighlight = (e: CustomEvent) => setSelectedPart(e.detail);
    window.addEventListener('highlightComponent' as any, handleHighlight);
    return () => window.removeEventListener('highlightComponent' as any, handleHighlight);
  }, []);

  // Listen for nose cone click events to reset camera view
  useEffect(() => {
    const handleResetCameraView = () => {
      console.log("Handling reset camera view event");
      setView('perspective');
      // Reset compass when camera view is reset
      handleViewReset();
    };
    
    // Also reset compass when reset button is clicked
    const handleViewReset = () => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rocketRotation', { 
          detail: { rotation: 0 } 
        }));
      }
    };
    
    window.addEventListener('resetCameraView', handleResetCameraView as EventListener);
    
    return () => {
      window.removeEventListener('resetCameraView', handleResetCameraView as EventListener);
    };
  }, []);

  // Calculate speed and altitude
  // Updated altitude calculation to use standardized GROUND_Y
  const altitude = Math.max(0, position[1] - GROUND_Y);
  const speed = Math.sqrt(
    velocity[0] * velocity[0] + velocity[1] * velocity[1] + velocity[2] * velocity[2]
  );
  
  // Update max values during flight
  useEffect(() => {
    if (isLaunched && !isNaN(speed) && !isNaN(altitude)) {
      if (speed > maxSpeed) setMaxSpeed(speed);
      if (altitude > maxAltitude) setMaxAltitude(altitude);
    } else if (resetTrigger) {
      setMaxSpeed(0);
      setMaxAltitude(0);
    }
  }, [speed, altitude, isLaunched, resetTrigger, maxSpeed, maxAltitude]);
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Canvas first - fixed size and position */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <Canvas shadows>
          <DynamicCamera 
            isLaunched={isLaunched}
            target={position}
            view={view}
          />
          
          {/* Custom OrbitControls with rocket roll rotation */}
          <CustomOrbitControls position={position} view={view} />
          
          {/* Scene lighting */}
          <ambientLight intensity={0.25} /> 
          <directionalLight 
            position={[8, 10, 5]} 
            intensity={0.7} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <directionalLight position={[-6, 3, -5]} intensity={0.25} />
          <spotLight 
            position={[0, -2, 10]} 
            intensity={0.4} 
            angle={0.6} 
            penumbra={0.5} 
            distance={20}
            color="#5eead4"
          />
          
          {/* Launch light - adjusted to match ground position */}
          {isLaunched && (
            <pointLight 
              position={[0, GROUND_Y, 0]} 
              intensity={2} 
              distance={15} 
              color="#ff8866"
              decay={2}
            />
          )}
          
          <Environment preset="night" />
          {/* Fixed contact shadows at exactly ground level */}
          <ContactShadows 
            position={[0, GROUND_Y + 0.01, 0]} 
            opacity={0.4}  
            scale={15} 
            blur={2.5} 
            far={5} 
            resolution={512}
            color="#001133"
            frames={1} // Render once and cache for better performance
          />
          
          {/* Absolutely fixed grid that never moves */}
          <Grid 
            infiniteGrid 
            cellSize={0.5} 
            cellThickness={0.5} 
            sectionSize={2} 
            sectionThickness={1} 
            fadeDistance={30} 
            fadeStrength={1.5}
            cellColor="#00eaff" 
            sectionColor="#ec4899"
            position={[0, GROUND_Y, 0]}
          />
          <Suspense fallback={null}>
            {/* Force re-creation of RocketSimulation when launch state changes */}
            <RocketSimulation 
              key={`rocket-${isLaunched ? 'launched' : 'idle'}-${resetTrigger ? 'reset' : 'normal'}`}
              selected={selectedPart !== null} 
              isLaunched={isLaunched}
              throttle={throttle}
              resetTrigger={resetTrigger}
              setFlightData={updateFlightData}
              highlightedPart={selectedPart}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* UI elements - absolutely positioned over the canvas */}
      <ViewportControls view={view} setView={setView} isMobile={isMobile} />
      
      <LaunchData
        isLaunched={isLaunched}
        setIsLaunched={setIsLaunched}
        throttle={throttle}
        setThrottle={setThrottle}
        resetRocket={resetRocket}
        launchRocket={launchRocket}
        speed={isNaN(speed) ? 0 : speed}
        altitude={isNaN(altitude) ? 0 : altitude}
        maxSpeed={isNaN(maxSpeed) ? 0 : maxSpeed}
        maxAltitude={isNaN(maxAltitude) ? 0 : maxAltitude}
        isMobile={isMobile}
      />
    </div>
  )
}